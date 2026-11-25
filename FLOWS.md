# AccessBus flows

The prototype is static HTML. Every screen is drawn by `frontend/app/data.js` into one column (`--screen-max: 480px`). The role on the signed-in person chooses the home and which fields of the same trip are open. Nothing in this app calls Cognito or the AWS API. Sign-in is a name and a 4-digit PIN stored in the browser (`aa.session`). Sample PINs are `1234`.

Pages that are part of a trip:

| Page | What it is |
| --- | --- |
| `index.html` | Sign in (`renderSignIn`) |
| `home.html` | Driver home or staff home, from the role (`renderHome`) |
| `sheet.html?trip=<id>` | The shared trip sheet. The mode comes from the role and the trip status (`renderSheet`) |

`members.html`, `drivers.html`, and `maintenance.html` are the staff manage list (members, drivers, repairs). They are not steps in setting up or running a trip. `preview.html` is the builder's screen list. It is not a screen in the app.

A trip the driver can open has `setUp: true`. Status moves `ready` → `started` → `sent` → `reviewed`.

## Driver, on the day

Priya Sandhu is the sample driver. The office has already sent her a trip. She does not choose the destination, the stops, the members, or the rate.

1. **Sign in.** Route: `index.html`, `renderSignIn`. She taps her name and enters the 4-digit PIN. The app saves the session and opens `home.html`. Signing in as a driver also runs `restartDriverTrips`: any trip of hers that is still `ready` or `started` is put back to step 1 (kilometres, times, fuel, and who is aboard are cleared). A trip already sent or checked is kept.

2. **Today's trip.** Route: `home.html`, `renderDriverHome`. The home is the one assigned trip that is not checked yet: an in-progress trip wins, then a not-started trip, then a sent one. She sees the status ("Assigned to you", "On the road", or "Sent to the office"), the trip name, the date, pickup time, drop-off, and pay. The button is the next step (`driverTask`). "Who can board" lists the confirmed members, wheelchair users first, with two tiles: wheelchairs out of 6, seats out of 3. She taps the button. She enters nothing on this screen.

3. **Kilometres at the lot.** Route: `sheet.html?trip=<id>`, mode `lot` (status `ready` and beginning kilometres still empty). Step 1 of 4. She types the beginning kilometres as a whole number. The reading is kept on the phone as she types. **Continue** saves it. The start time is set to the clock time at that moment (`nowClock`). She does not type the start time. Going back into this step later does not change the start time.

4. **Member pickup.** Route: same sheet, mode `board` (status still `ready`, beginning kilometres filled). Step 2 of 4. At the office she taps each person who is there. The row toggles "Sign in" / "Aboard" and saves on each tap. Only people the office confirmed are on the list. **Leave the office** requires at least one person aboard, then sets the status to `started`.

5. **Finish this trip.** Route: same sheet, mode `end` (status `started`, ending kilometres still empty). Step 3 of 4. Back at the parking lot. Each person who boarded is listed with the drop-off the office set (the office, unless staff changed it). She taps a name to change it: Office, Home (their address), Usual spot (only if the member has one), or Another address, which has to end with a city. If she sends someone home and the office had planned the office for everyone, she picks a reason: Late return, Weather conditions, or Other. She types the ending kilometres (a whole number, not below the start) and the end time (after the start; the field opens on the current time). **As she types, the screen calculates** kilometres (`ending − beginning`), hours (`hoursBetween`, rounded to two decimals; a trip that crosses midnight still counts), and pay (`hours × hourly rate`, rounded to the cent; a volunteer trip is $0). **Continue** saves the ending kilometres, the end time, and the hours.

6. **Fuel.** Route: same sheet, mode `fuel` (status `started` and ending kilometres filled). Step 4 of 4. She types fuel litres and total fuel cost, or leaves both blank. One without the other is rejected. **Send to the office** sets the status to `sent` and returns to the home.

7. **After it is sent.** The same home now shows this trip's kilometres, hours, and pay, and "See what you sent" opens the sheet read-only (`mode` `read`). She cannot change the destination or the stops on any step.

Back on steps 2–4 returns to the previous step (`?step=`). A later step stays locked until the one before it is done.

## Staff, set up, then check

Edward Faruzel and Robert Wismer are the sample staff. They plan the run. The driver does not.

1. **Sign in.** Route: `index.html`. Same PIN screen. Staff sign-in does not reset a driver's trip.

2. **Trips home.** Route: `home.html`, `renderStaffHome`. **+ New trip** creates a draft and opens it. The top card is the trip that needs them: a sheet the driver has sent ("Pending approval"), otherwise the next open trip ("On the road", "Sent to the driver", or "Needs setting up"). Under that: open trips, bus totals, past trips, and Manage (members, drivers, repairs). Bus totals are on this home the whole time, not a separate step after checking.

3. **Set up this trip.** Route: `sheet.html?trip=<id>`, mode `preset` (staff, and the trip is still `ready`). This is one form, `setupForm`, not a series of pages. **+ New trip** (`newTrip`) has already created the draft: today's date, no driver when there are two or more, no members, status `ready`, not sent. She fills, in this order:
   - **Trip.** Name, date (today or later), pickup time at the office. The note says members get this time when they confirm by phone. All three are required.
   - **Driver and pay.** A driver, required. Volunteer or Paid, required. If Paid, the hourly rate (a number greater than 0). The rate is stored on the trip, not on the driver. Volunteer pay is $0. The button name follows the driver: "Send to Priya".
   - **Where to.** One destination, required, plus up to 3 stops the whole group visits (lunch before a movie). Stops can be dragged into the order the bus drives them. A member's home is not a stop.
   - **Who is coming.** She ticks the people who confirmed by phone. Wheelchair users are listed first. Two tiles update as she ticks: wheelchairs booked out of 6, seats booked out of 3. The form will not send with nobody ticked, with more than 6 wheelchair users, or with more than 3 people who use a seat. Under each ticked name, the drop-off starts as the office. She taps it to choose Office, Home, Usual spot, or Another address (city required). If anyone is not at the office, an optional reason appears (Late return, Weather conditions, Other). The driver can change a drop-off on the day.
   - **Send to &lt;first name&gt;.** Sets `setUp` so the trip shows on that driver's home. Until the driver starts it, staff can open it again ("Save changes") or delete it. After it has started, delete is refused because the trip is a record.

4. **Check the sheet.** This waits until the driver has sent it (`status` `sent`). The home leads with that trip. **Open** goes to `sheet.html`, mode `review`. The heading is "Check trip sheet". The saved times, kilometres, pay, and fuel are shown as a record, and the members show who boarded and where they got off. **Correct a number** is collapsed. Opening it shows start time, end time, beginning kilometres, ending kilometres, fuel litres, and fuel cost. The same live preview as the driver's finish step recalculates kilometres, hours, and pay while she edits. **Mark as checked** checks the numbers, saves any corrections, sets hours from the (possibly corrected) times, and sets status `reviewed`, plus who checked it, the date, the time, and whether a number changed (`corrected`). She returns to the home. A checked trip leaves the top card and sits under Past trips.

5. **Bus totals.** Still on `home.html`. The six tiles sum every trip with status `sent` or `reviewed`: trips sent, distance (sum of ending − beginning), driver hours, driver pay, fuel (the dollar cost), and repairs (every repair on the bus, including ones with no trip). Repairs are entered on `maintenance.html`, separate from the trip sheet.

6. **Export.** The first-name button at the top of every signed-in screen opens the name, the role, **Export trips**, and Sign out. Export asks for PDF or Excel, a period (this month, last month, or all trips), and what to include (trip details, members, kilometres and hours, pay, fuel, and, for staff, repairs). Date and trip name are always included. The file is built in the browser. It is not sent to AWS.

## What is calculated, and what is typed

| Figure | Who types it | What the app calculates |
| --- | --- | --- |
| Start time | Nobody on the day | The clock when the driver leaves the kilometres step |
| End time | Driver, and staff if they correct it | — |
| Hours | Nobody | End time minus start time |
| Beginning and ending kilometres | Driver, and staff if they correct it | — |
| Distance | Nobody | Ending minus beginning, when the ending is not lower |
| Hourly rate | Staff, per trip | — |
| Pay | Nobody | Hours × rate, to the cent. Volunteer is $0 |
| Fuel litres and cost | Driver, optional. Staff can correct | Both required if either is filled |
| Wheelchair spaces and seats | Staff tick members | Booked out of 6 wheelchair spaces and 3 seats |
| Drop-off line on a trip | Staff, and the driver as an exception | "Office", "Homes", or "Office and homes", plus the reason when there is one |
| Bus totals | Nobody | Sum of sent and checked trips, plus repair costs |
| Checked-by line | Nobody | Staff name, date, and time when they mark the sheet checked |

Capacity is fixed in the prototype: `CHAIR_SPACES = 6`, `SEAT_SPACES = 3`. The bus layout those numbers come from is 6 wheelchair spaces and 3 ambulatory seats.

## Where this differs from the deck outline

The outline was: driver = starting km → members aboard → drop-offs / end km / time → fuel; staff = new trip → who's coming → where to → send to driver → check sheet (correct a number, mark as checked) → bus totals / export.

The driver side matches that outline. Four extra facts sit around it. She signs in before the trip, and that sign-in restarts a trip she had not sent. The start time is saved for her when she leaves the kilometres step. Hours, total kilometres, and pay are calculated, not typed. Drop-off is a change to the office's plan, and the office is the default. The home is a real screen before step 1 and again after she sends, when it shows kilometres, hours, and pay.

The staff side is the same work in a different shape.

- New trip, who's coming, where the group goes, and send are **one page** (`sheet.html`, "Set up this trip"), not four screens and not four routes.
- The order on that page is trip name, date, and pickup time, then **driver and pay**, then where the group goes, then who is coming. Who's coming comes after where to. Driver and pay is not in the outline. The pickup time is required before send, because members are told that time on the phone.
- Each member's drop-off is a line under their name in "Who is coming", not a field on "Where to". "Where to" is only the destination and up to 3 stops the whole group visits.
- Send is the button at the bottom of that same page ("Send to Priya"), not its own step.
- Check the sheet happens **after the driver sends it back**, not right after staff send it to the driver. While the driver still has it, staff see "Sent to the driver" and can still edit.
- "Correct a number" stays collapsed until someone opens it. The button under it says **Mark as checked**. The status then reads Checked.
- Bus totals are always on the staff home. Export is in the name menu on every signed-in screen, as a PDF or an Excel file, not a button on the totals card.
