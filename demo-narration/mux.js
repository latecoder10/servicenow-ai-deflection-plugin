/**
 * Muxes out/narration.mp3 onto the silent capture without re-encoding the video.
 *
 *   npm run mux
 *
 * The audio is padded with silence and cut to the video length, so the output
 * is always exactly as long as the original footage.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const VIDEO_IN = process.env.VIDEO_IN || 'C:/Users/AYPAL/Videos/ICONS-ServiceNowPOC.mp4';
const AUDIO_IN = path.join('out', 'narration.mp3');
const VIDEO_OUT = process.env.VIDEO_OUT || path.join('out', 'ICONS-ServiceNowPOC-narrated.mp4');

for (const f of [VIDEO_IN, AUDIO_IN]) {
    if (!fs.existsSync(f)) {
        console.error(`Missing input: ${f}`);
        if (f === AUDIO_IN) { console.error('Run "npm run voice" first.'); }
        process.exit(1);
    }
}

fs.mkdirSync('out', { recursive: true });

const args = [
    '-y',
    '-i', VIDEO_IN,
    '-i', AUDIO_IN,
    // apad tops the narration up with silence; -shortest then trims to the video
    '-filter_complex', '[1:a]apad[a]',
    '-map', '0:v:0',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    VIDEO_OUT
];

console.log(`Muxing narration onto ${path.basename(VIDEO_IN)} ...`);
execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });

const mb = (fs.statSync(VIDEO_OUT).size / (1024 * 1024)).toFixed(1);
console.log(`\nDone: ${VIDEO_OUT} (${mb} MB)`);
