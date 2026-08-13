/**
 * Generates the demo voiceover with ElevenLabs (Liam) and reports how the
 * result lines up against the video, so you know before muxing whether the
 * script needs trimming.
 *
 *   npm run voice
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

dotenv.config({ path: '.env.local' });

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFdv7VOQHJ'; // Liam
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_v3';
const VIDEO_IN = process.env.VIDEO_IN || 'C:/Users/AYPAL/Videos/ICONS-ServiceNowPOC.mp4';
const SCRIPT_FILE = 'narration.txt';
const OUT_FILE = path.join('out', 'narration.mp3');

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

async function main() {
    if (!process.env.ELEVENLABS_API_KEY) {
        console.error('ELEVENLABS_API_KEY is not set. Copy .env.local.example to .env.local and add your key.');
        process.exit(1);
    }

    const text = fs.readFileSync(SCRIPT_FILE, 'utf8').trim();
    const words = text.split(/\s+/).length;
    console.log(`Script: ${words} words, ${text.length} chars`);

    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

    console.log(`Synthesising with ${MODEL_ID}, voice ${VOICE_ID} ...`);
    const response = await client.textToSpeech.convert(VOICE_ID, {
        modelId: MODEL_ID,
        outputFormat: 'mp3_44100_128',
        text
    });

    const audio = await toBuffer(response);
    fs.mkdirSync('out', { recursive: true });
    fs.writeFileSync(OUT_FILE, audio);
    console.log(`Wrote ${OUT_FILE} (${(audio.length / 1024).toFixed(0)} KB)`);

    const voice = durationOf(OUT_FILE);
    const video = durationOf(VIDEO_IN);
    if (voice === null || video === null) {
        console.log('ffprobe unavailable, skipping the length check.');
        return;
    }

    console.log(`\nnarration : ${voice.toFixed(2)}s`);
    console.log(`video     : ${video.toFixed(2)}s`);

    const slack = video - voice;
    if (slack >= 0) {
        console.log(`Fits with ${slack.toFixed(2)}s to spare. The mux pads the tail with silence.`);
    } else {
        const cut = Math.ceil((-slack / voice) * words);
        console.log(`OVERRUNS by ${(-slack).toFixed(2)}s. Cut roughly ${cut} words from ${SCRIPT_FILE} and rerun,`);
        console.log('otherwise the mux will clip the last line.');
    }
}

main().catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
});
