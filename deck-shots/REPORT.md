# Deck screenshot report

Staff and driver screens are the same 480px column, drawn for a phone. Both were captured at 375px wide and 2x. Nothing was captured at 1280px.

The dev server is a local static server for `frontend/app`. Sign-in is skipped with `?as=priya` or `?as=ed`, which writes the same session the PIN screen writes. Cognito and the AWS API are not called. Address lookup (photon.komoot.io) is blocked.

Sample trip: St. Jacobs Farmers Market, today, driver Priya Sandhu, pickup 9:30 AM, paid at $20.00 an hour. Five members confirmed: Helen Cho and Ruth Abebe (wheelchair), Samir Patel, Mateo Ruiz, and June Berger (seats). That is two wheelchair users, not one: five people with only one wheelchair user would be four seated riders, and the bus has 3 seats. The tiles show 2 of 6 wheelchair spaces and 3 of 3 seats. On the cover, Ruth did not board, so four people are aboard and one of them, Helen Cho, uses a wheelchair. Walter Singh is on the member list and is not on this trip.

Flow differences are in `FLOWS.md`. The short version: the driver steps match the outline, with the start time, hours, kilometres, and pay calculated. Staff set up a trip on one page, in the order trip, driver and pay, where the group goes, who is coming (drop-off under each name), then Send. Check the sheet happens after the driver sends it back.

## What was captured

- 01-cover-driver-home.png (186982 bytes)
- 07-driver-home.png (189515 bytes)
- 07-staff-home.png (207345 bytes)
- 09-old-plan-the-run.png (187006 bytes)
- 10-row-a-boxed-tag.png (7247 bytes)
- 10-row-b-plain-label.png (7097 bytes)
- 10-row-c-icon.png (4874 bytes)
- 11-colour-orange.png (101368 bytes)
- 11-colour-peach.png (104048 bytes)
- 11-colour-white.png (103215 bytes)
- 11-font-atkinson.png (185373 bytes)
- 11-font-public-sans.png (189515 bytes)
- 12-driver-home-final.png (88315 bytes)
- 12-staff-home-final.png (198055 bytes)
- 12-driver-home-wireframe.png (150484 bytes)
- 12-staff-home-wireframe.png (174945 bytes)
- 13-driver-1-start-km.png (117549 bytes)
- 13-driver-2-pickup.png (160473 bytes)
- 13-driver-3-finish-dropoff-open.png (245908 bytes)
- 13-driver-4-fuel.png (126194 bytes)
- 14-staff-1-new-trip.png (94267 bytes)
- 14-staff-2-whos-coming.png (123191 bytes)
- 14-staff-3-where-to.png (245392 bytes)
- 14-staff-4-send.png (113597 bytes)
- 14-staff-5-check-sheet.png (347197 bytes)
- 15-bus-totals.png (110358 bytes)
- 15-export.pdf (38874 bytes)

## Commits

- `1bccc29411fec22622956c6fdcb707c08205a6ac` — Add Night Bus wireframes (2026-11-08). `12-driver-home-wireframe.png` and `12-staff-home-wireframe.png` were captured from a git worktree of this commit, then the worktree was removed. This commit is already past D-066 and D-027: the driver button says Start this trip, and a wheelchair user has the icon.
- `89a7bdaf4fb97ae3816b401a3fbe62c71b062566` — Add AccessBus visual mockups (2026-11-08). Public Sans, the quiet header, and the icon row. The working tree is this commit plus a small uncommitted edit (the "trip is checked" notice was removed). Current shots, including `11-font-public-sans.png` and `10-row-c-icon.png`, are from the working tree.

No other commit contains `frontend/app`. These versions are not in history, so the script changed the source, captured, and restored it:

- `09-old-plan-the-run.png` — `driverTask` returned "Plan the run" for the first step, and the pickup time was cleared so the home is the trip before anyone has planned it. From D-016, removed in D-066. The button text is not in any commit's `data.js`.
- `10-row-a-boxed-tag.png` — Helen Cho's row, wheelchair users only, with a black boxed Wheelchair label. D-018 describes this as the contrasty tag that the plain label replaced. No commit contains it.
- `10-row-b-plain-label.png` — the same row with a plain right-aligned Wheelchair label (D-018). Seat rows get the same kind of label. Not in any commit.
- `11-colour-orange.png` — driver header band `#F2682A` with dark text (D-092). Not in any commit.
- `11-colour-peach.png` — header band `#FBDCCB`, orange status pill (D-094). Not in any commit.
- `11-colour-white.png` — white header, 5px orange line, tinted status pill (D-095). Not in any commit. The working tree is later than this: D-099 drops the orange line and keeps orange in the logo only, which is what `07-driver-home.png` and `12-driver-home-final.png` show.
- `11-font-atkinson.png` — the assigned driver home with Atkinson Hyperlegible Next, the face in D-092. D-095 replaced it with Public Sans. The font is not in any commit.

`10-row-c-icon.png` is the current component, cropped to Helen Cho. The same icon has been in the code since `1bccc29`.

## Run log

Commits that touch frontend/app:
89a7bda Add AccessBus visual mockups (frontend/app)
1bccc29 Add Night Bus wireframes (frontend/app)
No commit contains a Plan the run button in data.js. D-066 is only in DESIGN_DECISIONS.md.
No commit contains the peach header #FBDCCB.
No commit contains the boxed Wheelchair tag. The icon row is in the first frontend commit, 1bccc29.
saved 01-cover-driver-home.png
saved 07-driver-home.png
saved 11-font-public-sans.png
saved 07-staff-home.png
saved 12-driver-home-final.png
saved 12-staff-home-final.png
saved 15-bus-totals.png
saved 13-driver-1-start-km.png
saved 13-driver-2-pickup.png
saved 13-driver-3-finish-dropoff-open.png
saved 13-driver-4-fuel.png
saved 14-staff-1-new-trip.png
saved 14-staff-2-whos-coming.png
saved 14-staff-3-where-to.png
saved 14-staff-4-send.png
saved 14-staff-5-check-sheet.png
saved _export-preview.png
saved 15-export.pdf
saved 10-row-c-icon.png
Plan the run, the boxed tag, the plain label, the orange and peach headers, the quiet-white line, and Atkinson were not found as UI in any commit. Recreating them, then restoring the files.
saved 09-old-plan-the-run.png
saved 10-row-a-boxed-tag.png
saved 10-row-b-plain-label.png
saved 11-colour-orange.png
saved 11-colour-peach.png
saved 11-colour-white.png
Atkinson Hyperlegible Next loaded.
saved 11-font-atkinson.png
Wireframes checked out from 1bccc29411fec22622956c6fdcb707c08205a6ac (Add Night Bus wireframes).
saved 12-driver-home-wireframe.png
saved 12-staff-home-wireframe.png
Removed wireframe worktree.
saved contact-sheet.pdf
saved deck-shots.zip (26 pngs)
