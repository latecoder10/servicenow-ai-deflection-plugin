/**
 * Synthesises the demo voiceover from narration.txt with ElevenLabs (Liam).
 *
 *   npm run voice
 *
 * The script is a list of timed segments, one per beat in the capture. Each is
 * synthesised on its own so the mux can place it at exactly the timestamp it
 * describes. A single continuous take cannot do that: its pacing is set by the
 * voice, so it drifts against the screen and by the midpoint is describing a
 * panel that is no longer showing.
 *
 * Segments carry previousText/nextText, which is what keeps the delivery
 * continuous across separate requests - without it each segment restarts with a
 * fresh cadence and the joins are audible.
 *
 * Every segment is checked against the gap to the one after it, so an overrun is
 * reported here rather than discovered as two voices talking over each other.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

dotenv.config({ path: '.env.local' });

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFdv7VOQHJ'; // Liam
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
const VIDEO_IN = process.env.VIDEO_IN || 'C:/Users/AYPAL/Videos/ICONS_SERVICENOWPOC_V2.mp4';
const SCRIPT_FILE = 'narration.txt';
const SEG_DIR = path.join('out', 'segments');

/**
 * previousText/nextText carry the delivery across separate requests. eleven_v3
 * rejects them with unsupported_model, so they are sent only to models that take
 * them; on v3 the segments are read independently, which is audible only as a
 * slightly cleaner reset between beats.
 */
const SUPPORTS_CONTEXT = !MODEL_ID.includes('v3');

/** The SDK may hand back a Buffer, a web ReadableStream, or an async iterable. */
async function toBuffer(res) {
    if (Buffer.isBuffer(res)) { return res; }
    if (res instanceof Uint8Array || res instanceof ArrayBuffer) { return Buffer.from(res); }

    const chunks = [];
    if (typeof res?.getReader === 'function') {
        const reader = res.getReader();
        for (;;) {
            const { done, value } = await reader.read();
            if (done) { break; }
            chunks.push(Buffer.from(value));
        }
        return Buffer.concat(chunks);
    }
    if (res?.[Symbol.asyncIterator]) {
        for await (const chunk of res) { chunks.push(Buffer.from(chunk)); }
        return Buffer.concat(chunks);
    }
    throw new Error('Unrecognised response type from textToSpeech.convert');
}

/** Fingerprints a segment's text, so only edited lines are re-synthesised. */
function textHash(text) {
    return crypto.createHash('sha1').update(text).digest('hex').slice(0, 16);
}

const MANIFEST = path.join(SEG_DIR, 'manifest.json');

function readManifest() {
    try {
        return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    } catch {
        return {};
    }
}

function writeManifest(manifest) {
    try {
        fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
    } catch { /* a lost manifest costs credits, not correctness */ }
}

function durationOf(file) {
    try {
        const out = execFileSync('ffprobe', [
            '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', file
        ], { encoding: 'utf8' });
        return parseFloat(out.trim());
    } catch {
        return null;
    }
}

/** Parses "[12.5] text" blocks, ignoring blank lines and # comments. */
export function parseSegments(raw) {
    const segments = [];
    let current = null;

    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) { continue; }

        const marker = trimmed.match(/^\[(\d+(?:\.\d+)?)\]\s*(.*)$/);
        if (marker) {
            if (current) { segments.push(current); }
            current = { at: parseFloat(marker[1]), text: marker[2] ? marker[2].trim() : '' };
        } else if (current) {
            current.text = current.text ? `${current.text} ${trimmed}` : trimmed;
        }
    }
    if (current) { segments.push(current); }

    const empty = segments.find((s) => !s.text);
    if (empty) { throw new Error(`Segment at [${empty.at}] has no text`); }

    // Out-of-order timestamps would silently overlap once placed.
    for (let i = 1; i < segments.length; i++) {
        if (segments[i].at <= segments[i - 1].at) {
            throw new Error(`Timestamps must increase: [${segments[i - 1].at}] then [${segments[i].at}]`);
        }
    }
    return segments;
}

async function main() {
    if (!process.env.ELEVENLABS_API_KEY) {
        console.error('ELEVENLABS_API_KEY is not set. Copy .env.local.example to .env.local and add your key.');
        process.exit(1);
    }

    const segments = parseSegments(fs.readFileSync(SCRIPT_FILE, 'utf8'));
    const totalWords = segments.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
    console.log(`Script: ${segments.length} segments, ${totalWords} words`);

    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

    // Never clear the directory up front. Doing so destroyed a good set of segments
    // when a later request failed on an exhausted quota, leaving nothing to mux and
    // no way to recover them without spending credits again.
    fs.mkdirSync(SEG_DIR, { recursive: true });
    const manifest = readManifest();

    console.log(`Synthesising with ${MODEL_ID}, voice ${VOICE_ID} ...\n`);
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        seg.file = path.join(SEG_DIR, `seg${String(i).padStart(2, '0')}.mp3`);

        // Only pay for what changed. Editing one line used to re-synthesise the whole
        // script, which is what exhausted the quota in the first place.
        const hash = textHash(seg.text);
        if (manifest[seg.file] === hash && fs.existsSync(seg.file)) {
            seg.duration = durationOf(seg.file);
            process.stdout.write(`  [${seg.at.toFixed(1)}s] ${seg.duration?.toFixed(1)}s  (cached)\n`);
            continue;
        }
        const request = {
            modelId: MODEL_ID,
            outputFormat: 'mp3_44100_128',
            text: seg.text
        };

        // Continuity across separate requests, so the joins do not sound stitched.
        // eleven_v3 rejects both fields outright, so they are only sent to models
        // that accept them rather than failing the whole run.
        if (SUPPORTS_CONTEXT) {
            if (i > 0) { request.previousText = segments[i - 1].text; }
            if (i + 1 < segments.length) { request.nextText = segments[i + 1].text; }
        }

        let response;
        try {
            response = await client.textToSpeech.convert(VOICE_ID, request);
        } catch (err) {
            // Record what did succeed before giving up, so a rerun after a quota
            // top-up only pays for the segments still missing.
            writeManifest(manifest);
            throw err;
        }

        fs.writeFileSync(seg.file, await toBuffer(response));
        manifest[seg.file] = hash;
        seg.duration = durationOf(seg.file);
        process.stdout.write(`  [${seg.at.toFixed(1)}s] ${seg.duration?.toFixed(1)}s  ${seg.text.slice(0, 52)}...\n`);
    }
    writeManifest(manifest);

    // Report collisions rather than let the mux bury them.
    const videoLength = durationOf(VIDEO_IN);
    console.log('\nFit check:');
    let clash = false;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.duration === null) { continue; }

        const ends = seg.at + seg.duration;
        const nextAt = i + 1 < segments.length ? segments[i + 1].at : videoLength;
        const slack = nextAt - ends;

        if (slack < 0) {
            clash = true;
            const cut = Math.ceil((-slack / seg.duration) * seg.text.split(/\s+/).length);
            console.log(`  [${seg.at.toFixed(1)}] OVERRUNS the next cue by ${(-slack).toFixed(1)}s`
                + ` - cut about ${cut} words`);
        } else if (slack < 0.4) {
            console.log(`  [${seg.at.toFixed(1)}] tight: ${slack.toFixed(1)}s before the next cue`);
        }
    }

    const last = segments[segments.length - 1];
    if (videoLength && last.duration && last.at + last.duration > videoLength) {
        clash = true;
        console.log(`  [${last.at.toFixed(1)}] runs ${(last.at + last.duration - videoLength).toFixed(1)}s`
            + ' past the end of the video');
    }

    if (!clash) {
        console.log('  every segment fits before the cue that follows it.');
    }
    console.log(`\nvideo: ${videoLength?.toFixed(2)}s. Run "npm run mux" to place them.`);
}

// Only synthesise when run directly. mux.js imports parseSegments from here, and
// without this guard that import re-ran the whole generation - clearing the segment
// directory out from under the mux that was about to read it.
const isEntryPoint = process.argv[1]
    && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

if (isEntryPoint) {
    main().catch((err) => {
        console.error(err?.message || err);
        process.exit(1);
    });
}
