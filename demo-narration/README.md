# Demo Narration

Adds an ElevenLabs voiceover (Liam) to the silent ServiceNow POC capture.

Source: `C:/Users/AYPAL/Videos/ICONS-ServiceNowPOC.mp4` — 38.53s, 1366x768, 30fps, no audio track.

---

## Run it

```powershell
cd demo-narration
npm install
copy .env.local.example .env.local     # then paste your ELEVENLABS_API_KEY
npm run build
```

Output: `out/ICONS-ServiceNowPOC-narrated.mp4`

| Command | Does |
|---|---|
| `npm run voice` | Synthesises `narration.txt` to `out/narration.mp3`, then reports narration length against video length |
| `npm run mux` | Muxes the mp3 onto the video, video stream copied not re-encoded |
| `npm run build` | Both |

`npm run voice` tells you whether the script fits **before** you mux. If it overruns it prints roughly how many words to cut.

---

## The script

One continuous read, no pauses, 100 words. Edit [narration.txt](narration.txt) and rerun — nothing else needs touching.

> This is the AI deflection panel, running live inside ServiceNow. We open a new incident the normal way, and nothing about the form itself has changed. The panel on the right is a scoped application: a UI macro, a client-callable script include, and a REST call out to our Spring Boot backend. Now watch. The agent types the problem, just three words. That fires a semantic search across past incidents and knowledge, and Gemini drafts the resolution. Seconds later: sixty-nine percent confidence, a clear title, and three concrete steps, grounded in five knowledge sources. That ticket never needed to be raised.

## How it maps to the footage

Timings are from frames sampled every 2s. Delivery drifts a little, but the beats land in the right places because the sentences are ordered to match the action.

| Video | On screen | Line |
|---|---|---|
| 0.0–5s | ServiceNow home, All menu, filtering "incident" | *This is the AI deflection panel, running live inside ServiceNow.* |
| 6–8s | Incident form opens, panel appears idle | *We open a new incident the normal way, and nothing about the form itself has changed.* |
| 8–19s | Form idle — the dead stretch | *The panel on the right is a scoped application: a UI macro, a client-callable script include, and a REST call out to our Spring Boot backend.* |
| 19–24s | Typing `VPN not working` | *Now watch. The agent types the problem, just three words.* |
| 26–31s | Spinner, "Searching past incidents and knowledge..." | *That fires a semantic search across past incidents and knowledge, and Gemini drafts the resolution.* |
| 32–38s | Result: 69% MEDIUM, title, 3 steps, 5 sources | *Seconds later: sixty-nine percent confidence... That ticket never needed to be raised.* |

The 8–19s stretch is the only real dead air in the capture, so it carries the architecture sentence — the one thing worth saying while nothing is moving.

Every number spoken is read off the recording: **69%**, **three steps**, **five knowledge sources**, **three words** typed. Nothing is invented. If you re-record with different results, update `narration.txt` to match.

---

## Notes

- `apad` + `-shortest` means the output is always exactly the video's length: short narration gets silence on the tail, long narration gets clipped. Watch the length check from `npm run voice`.
- The video stream is copied, not re-encoded, so there is no quality loss and the mux is near-instant.
- To try another voice, set `ELEVENLABS_VOICE_ID` in `.env.local`.
- `.env.local`, `node_modules/` and `out/` are gitignored.
