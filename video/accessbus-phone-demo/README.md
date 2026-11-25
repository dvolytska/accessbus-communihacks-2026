# AccessBus phone demo video

Source for the 2.5-minute vertical (1080×1920) explainer video of AccessBus, made for CommuniHacks 2026. The rendered result is [`AccessBus-demo.mp4`](../../AccessBus-demo.mp4) at the repo root.

| File | What it is |
| --- | --- |
| `brief.json` | The video brief: audience, message, look and brand |
| `plan.json` | The scene-by-scene plan for all 16 scenes (timing, copy, motion, sound) |
| `index.html` | The main composition that sequences the 16 scenes with GSAP |
| `gen_scenes.py` | Generates each scene's HTML from one shared phone layout |
| `capture.mjs` | Playwright script that signs in and captures every app screen used in the video |
| `explore.mjs` | Small Playwright script used to explore the staff screens |
| `hyperframes.json`, `pages.json` | Project and local preview settings |

The app screenshots, fonts, music and GSAP library the scenes load aren't included here, so the scenes won't render from this folder alone. `capture.mjs` recreates the screenshots from the live prototype.
