/**
 * Places each narration segment at its timestamp and muxes onto the capture.
 *
 *   npm run mux
 *
 * Each segment is delayed to its own cue with adelay and the whole set is mixed
 * down, so a line lands on the frame it describes rather than wherever a
 * continuous read happened to reach. The video is copied, not re-encoded.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';
import { parseSegments } from './generate.js';

dotenv.config({ path: '.env.local' });

const VIDEO_IN = process.env.VIDEO_IN || 'C:/Users/AYPAL/Videos/ICONS_SERVICENOWPOC_V2.mp4';
const VIDEO_OUT = process.env.VIDEO_OUT || path.join('out', 'ICONS_SERVICENOWPOC_V2-narrated.mp4');
const SEG_DIR = path.join('out', 'segments');

if (!fs.existsSync(VIDEO_IN)) {
    console.error(`Missing video: ${VIDEO_IN}`);
    process.exit(1);
}

const segments = parseSegments(fs.readFileSync('narration.txt', 'utf8'));
segments.forEach((seg, i) => {
    seg.file = path.join(SEG_DIR, `seg${String(i).padStart(2, '0')}.mp3`);
    if (!fs.existsSync(seg.file)) {
        console.error(`Missing ${seg.file}. Run "npm run voice" first.`);
        process.exit(1);
    }
});

fs.mkdirSync('out', { recursive: true });

const args = ['-y', '-i', VIDEO_IN];
segments.forEach((seg) => args.push('-i', seg.file));

// One delayed stream per segment, then a single mix. amix would rescale the
// volume as inputs drop in and out, so the level is normalised back afterwards
// and the mix is told to run for the longest input rather than the shortest.
const delays = segments
    .map((seg, i) => `[${i + 1}:a]adelay=${Math.round(seg.at * 1000)}:all=1[d${i}]`)
    .join(';');
const mixIn = segments.map((_, i) => `[d${i}]`).join('');
// apad after the mix, then -shortest trims to the video. Without it the mixed
// audio ends with the last segment and -shortest truncated the VIDEO to match,
// silently cutting the closing seconds of footage off the end.
const filter = `${delays};${mixIn}amix=inputs=${segments.length}:duration=longest:normalize=0[mixed];`
    + '[mixed]apad[a]';

args.push(
    '-filter_complex', filter,
    '-map', '0:v:0',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    VIDEO_OUT
);

console.log(`Placing ${segments.length} segments onto ${path.basename(VIDEO_IN)} ...`);
execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });

const mb = (fs.statSync(VIDEO_OUT).size / (1024 * 1024)).toFixed(1);
console.log(`\nDone: ${VIDEO_OUT} (${mb} MB)`);
