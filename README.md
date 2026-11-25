# AccessBus: a digital trip sheet for KW AccessAbility

**Live prototype: [accessbus.netlify.app](https://accessbus.netlify.app)** · Built at CommuniHacks 2026 (Kitchener–Waterloo, 7–8 Nov 2026)

## The problem

KW AccessAbility is a small Kitchener non-profit getting its first accessible bus next spring (a retired GRT Mobility Plus bus). Today every trip is logged on a paper form: odometer readings, who boarded, fuel, hours and pay. The agency has to report the bus's costs separately from everything else it does. The paper form makes that slow and error-prone.

The people involved make this harder than a typical form:

- **Drivers** are part-time and may drive only occasionally, so every trip can feel like the first one.
- **Staff** who plan trips and check the numbers are older adults.
- **Members** who ride the bus mostly have vision loss and some use wheelchairs. They never touch the app, but they shape every decision about seating and drop-offs.

## What it does

The office plans the run. The driver records only what happens on the day. Staff check it and get the bus's costs.

**Driver, on the day (4 steps):** kilometres at the lot → tap each member as they board → back at the lot, confirm each person's drop-off and the ending kilometres → fuel → send to the office. Start time, hours, kilometres and pay are calculated automatically, and every entry saves as it's typed.

**Staff:** set up a trip on one page (driver, volunteer or paid, hourly rate, destination and up to 3 stops, confirmed members with each person's drop-off) and send it to the driver. When the trip comes back, review the sheet, correct a number if needed, log repairs, and see bus totals.

## Try it

Open **[accessbus.netlify.app](https://accessbus.netlify.app)**, pick a name and enter PIN **1234**.

- **Priya Sandhu** (driver) shows the on-the-day flow.
- **Edward Faruzel** (staff) shows trip setup, review and bus totals.

All names, members and PINs are made-up sample data. Everything is stored in your browser. Signing in as a driver resets that driver's open trip so you can run it again.

## Design approach

- **Built for older adults and new drivers:** large type, high-contrast colours, plain-language labels, and one task per screen. Driver buttons are 64px tall.
- **Accessible by default:** brand colours were taken from the agency's logo and checked for contrast (teal buttons at 5.0:1). Errors appear right under the field. Headings follow a strict order for screen readers.
- **Matches the agency's real process:** wheelchair users are listed first, with live counts of wheelchair spaces (out of 6) and seats (out of 3). Each member's drop-off is set individually, and a home drop-off needs a reason.
- **Deliberately small scope:** no live GPS, no fleet dispatch. Member registration stays in the agency's existing Microsoft Access database.

All 90+ design decisions, including the alternatives that were tried, are logged in [`frontend/app/DESIGN_DECISIONS.md`](frontend/app/DESIGN_DECISIONS.md).

## Project docs

| File | What's in it |
| --- | --- |
| [`FLOWS.md`](FLOWS.md) | Every step of the driver and staff flows, screen by screen |
| [`frontend/app/PRODUCT.md`](frontend/app/PRODUCT.md) | Users, purpose, constraints and open product questions |
| [`frontend/app/DESIGN_DECISIONS.md`](frontend/app/DESIGN_DECISIONS.md) | The design decision log |
| [`frontend/app/COMPONENTS.md`](frontend/app/COMPONENTS.md) | Component inventory |
| [`deck-shots/`](deck-shots) | Screenshots used in the pitch deck |
| [`AccessBus-demo.mp4`](AccessBus-demo.mp4) | Demo video |

## How it's built

- **Front end (`frontend/app`):** a static HTML/CSS/JS prototype, mobile-first in a single 480px column, deployed on Netlify. Screens are drawn from `data.js`, with sample data kept in the browser.
- **Back end (`infra`, `services`, `scripts`):** the team's AWS setup in Terraform, with Cognito sign-in, API Lambdas, and a route-planner service. The prototype doesn't call it yet.

## Team

Built by a team at CommuniHacks 2026. This repo is a fork of [MichelleBKelly/night-bus](https://github.com/MichelleBKelly/night-bus).

- **Daryna Volytska:** product and UX design, and the front-end prototype (`frontend/app`)
- **Michelle Kelly:** infrastructure and API
- **James ([biggiemedium](https://github.com/biggiemedium)):** sign-in and AWS setup
- **[Jude Truong](https://github.com/JudeTruong):** route planner
