/**
 * AccessBus deck screenshots.
 *
 * Serves frontend/app on localhost (no Cognito, no AWS). The prototype signs in
 * with a name and a PIN kept in localStorage; this script sets that session
 * with ?as= and never opens the PIN screen. Requests to AWS and to the address
 * lookup API are aborted.
 *
 * Older looks that exist in git are captured from a temporary worktree.
 * Looks that were never committed are recreated by editing the CSS or the
 * component, shot, and restored before the script exits.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(repo, "frontend", "app");
const outDir = path.join(repo, "deck-shots");
const dataFile = path.join(appDir, "data.js");
const cssFile = path.join(appDir, "components.css");
const tokenFile = path.join(appDir, "tokens.css");

const PHONE = { width: 375, height: 812 };
const notes: string[] = [];

const REQUIRED = [
  "01-cover-driver-home.png",
  "07-driver-home.png",
  "07-staff-home.png",
  "09-old-plan-the-run.png",
  "10-row-a-boxed-tag.png",
  "10-row-b-plain-label.png",
  "10-row-c-icon.png",
  "11-colour-orange.png",
  "11-colour-peach.png",
  "11-colour-white.png",
  "11-font-atkinson.png",
  "11-font-public-sans.png",
  "12-driver-home-final.png",
  "12-staff-home-final.png",
  "12-driver-home-wireframe.png",
  "12-staff-home-wireframe.png",
  "13-driver-1-start-km.png",
  "13-driver-2-pickup.png",
  "13-driver-3-finish-dropoff-open.png",
  "13-driver-4-fuel.png",
  "14-staff-1-new-trip.png",
  "14-staff-2-whos-coming.png",
  "14-staff-3-where-to.png",
  "14-staff-4-send.png",
  "14-staff-5-check-sheet.png",
  "15-bus-totals.png",
  "15-export.pdf",
  "contact-sheet.pdf",
  "REPORT.md"
];

const CAPTIONS: Record<string, string> = {
  "01-cover-driver-home.png": "Mid-trip. Priya is on the road; four of the five confirmed members are aboard.",
  "07-driver-home.png": "Driver home before the trip: today's run, and who can board.",
  "07-staff-home.png": "Staff home: a sheet waiting to be checked, and today's trip already sent to the driver.",
  "09-old-plan-the-run.png": "Driver home when the first step was still Plan the run (before D-066).",
  "10-row-a-boxed-tag.png": "Helen Cho, the earlier wheelchair tag: a boxed label, seated members unmarked.",
  "10-row-b-plain-label.png": "Helen Cho with the plain Wheelchair label, the same kind of label a seat would get.",
  "10-row-c-icon.png": "Helen Cho with the wheelchair icon after her name (D-027).",
  "11-colour-orange.png": "Driver home with the full orange header band (D-092).",
  "11-colour-peach.png": "Driver home with the soft peach header (D-094).",
  "11-colour-white.png": "Driver home, quiet white, with a thin orange line under the header (D-095).",
  "11-font-atkinson.png": "The same driver home in Atkinson Hyperlegible Next.",
  "11-font-public-sans.png": "The same driver home in Public Sans.",
  "12-driver-home-final.png": "After the sheet is sent: kilometres, hours, and pay on the driver home.",
  "12-staff-home-final.png": "The returned sheet at the top of the staff home, ready to check.",
  "12-driver-home-wireframe.png": "The same kind of driver home as a wireframe, before the colour pass.",
  "12-staff-home-wireframe.png": "The staff home as a wireframe.",
  "13-driver-1-start-km.png": "Step 1. Beginning kilometres at the parking lot. The start time is saved on Continue.",
  "13-driver-2-pickup.png": "Step 2. Two of the five confirmed members tapped aboard at the office.",
  "13-driver-3-finish-dropoff-open.png": "Step 3. A drop-off is open, and kilometres, hours, and pay update from the readings.",
  "13-driver-4-fuel.png": "Step 4. Fuel litres and cost, then send the sheet to the office.",
  "14-staff-1-new-trip.png": "A new trip: name, date, and the pickup time members are told by phone.",
  "14-staff-2-whos-coming.png": "Who confirmed. Wheelchair spaces out of 6 and seats out of 3 update as names are ticked.",
  "14-staff-3-where-to.png": "Where the group goes, then each member's drop-off. Helen is set to her home.",
  "14-staff-4-send.png": "Send the finished plan to Priya. She cannot see the trip until this is tapped.",
  "14-staff-5-check-sheet.png": "Check the sheet. Ending kilometres corrected from 120478 to 120490; the live total moves to 80 km.",
  "15-bus-totals.png": "Bus totals: every sent or checked trip, plus repairs, kept apart from the rest of the agency.",
  "15-export.pdf": "The PDF from Export trips: all trips, members, kilometres, pay, fuel, and repairs."
};

function note(line: string) {
  notes.push(line);
  console.log(line);
}

function serve(root: string, port: number) {
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg"
  };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const rel = decodeURIComponent(url.pathname);
    let file = path.join(root, rel);
    if (rel.endsWith("/")) file = path.join(file, "index.html");
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(data);
    });
  });
  return new Promise<http.Server>((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function trip(partial: Record<string, unknown>) {
  return JSON.stringify(partial);
}

/** St. Jacobs sheet the office already sent, before Priya starts it. */
function assigned(): Record<string, string> {
  return {};
}

/** Mid-trip: five confirmed, Ruth Abebe did not board, four are aboard. */
function midTrip(): Record<string, string> {
  return {
    "aa.trip.stjacobs": trip({
      status: "started",
      startKm: "120410",
      startTime: "09:05",
      endKm: "",
      endTime: "",
      aboard: ["helen", "samir", "mateo", "june"]
    })
  };
}

/** Sheet sent back. Blue Jays is already checked so today's trip stays on Priya's home. */
function sentHome(): Record<string, string> {
  return {
    "aa.trip.stjacobs": trip({
      status: "sent",
      startKm: "120410",
      startTime: "09:05",
      endKm: "120478",
      endTime: "13:05",
      hours: "4",
      litres: "41.6",
      fuelCost: "64.80",
      aboard: ["helen", "samir", "mateo", "june", "ruth"]
    }),
    "aa.trip.bluejays": trip({ status: "reviewed", reviewedBy: "ed" })
  };
}

function officeDrop(): Record<string, string> {
  return {
    "aa.trip.stjacobs": trip({
      status: "ready",
      dropPlan: "office",
      dropReason: "",
      drops: {},
      startKm: "",
      aboard: []
    })
  };
}

function planTheRun(): Record<string, string> {
  return {
    "aa.trip.stjacobs": trip({
      status: "ready",
      boardAt: "",
      startKm: "",
      startTime: "",
      aboard: []
    })
  };
}

async function blockRemote(page: Page) {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (/amazonaws|cognito-idp|cognito-identity|photon\.komoot/.test(url)) {
      return route.abort();
    }
    return route.continue();
  });
  const client = await page.context().newCDPSession(page);
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
}

async function openAs(page: Page, origin: string, person: "priya" | "ed", target: string, storage: Record<string, string>) {
  await page.goto(origin + "/index.html", { waitUntil: "domcontentloaded" });
  await page.evaluate((entries) => {
    localStorage.clear();
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, storage);
  const join = target.includes("?") ? "&" : "?";
  await page.goto(origin + "/" + target + join + "as=" + person, { waitUntil: "domcontentloaded" });
  await page.locator("#screen-title, h1").first().waitFor({ timeout: 10000 });
  const title = await page.locator("h1").first().innerText();
  if (title === "Sign in") throw new Error("Landed on Sign in for " + target);
  const crashed = await page.locator("body").innerText();
  if (/Expected one primary/.test(crashed) && !page.locator("h1").first()) {
    throw new Error(crashed.slice(0, 300));
  }
  await page.evaluate(() => Promise.race([
    document.fonts.ready,
    new Promise((resolve) => setTimeout(resolve, 4000))
  ]));
}

async function shot(page: Page, name: string, full = true) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: full, animations: "disabled", caret: "hide" });
  note("saved " + name);
}

async function shotBox(page: Page, name: string, selector: string) {
  const file = path.join(outDir, name);
  const box = page.locator(selector).first();
  await box.scrollIntoViewIfNeeded();
  await box.screenshot({ path: file, animations: "disabled", caret: "hide" });
  note("saved " + name);
}

function restoreLater(file: string) {
  const backup = fs.readFileSync(file);
  return () => fs.writeFileSync(file, backup);
}

async function withPatch(file: string, apply: (source: string) => string, run: () => Promise<void>) {
  const restore = restoreLater(file);
  try {
    const next = apply(fs.readFileSync(file, "utf8"));
    if (next === fs.readFileSync(file, "utf8")) throw new Error("Patch did not change " + file);
    fs.writeFileSync(file, next);
    await run();
  } finally {
    restore();
  }
}

async function captureCurrent(page: Page, origin: string) {
  await openAs(page, origin, "priya", "home.html", midTrip());
  await shot(page, "01-cover-driver-home.png");

  await openAs(page, origin, "priya", "home.html", assigned());
  await shot(page, "07-driver-home.png");
  await shot(page, "11-font-public-sans.png");

  await openAs(page, origin, "ed", "home.html", assigned());
  await shot(page, "07-staff-home.png");

  await openAs(page, origin, "priya", "home.html", sentHome());
  await shot(page, "12-driver-home-final.png");

  await openAs(page, origin, "ed", "home.html", sentHome());
  await shot(page, "12-staff-home-final.png");
  await page.getByRole("heading", { name: "Bus totals" }).evaluate((el) => {
    const section = el.closest("section") || el;
    const y = section.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo(0, Math.max(0, y));
  });
  await shot(page, "15-bus-totals.png", false);

  await openAs(page, origin, "priya", "sheet.html?trip=stjacobs", {
    "aa.trip.stjacobs": trip({ status: "ready", startKm: "", startTime: "", aboard: [] })
  });
  await page.locator("#begin-km").fill("120410");
  await shot(page, "13-driver-1-start-km.png");

  await openAs(page, origin, "priya", "sheet.html?trip=stjacobs", {
    "aa.trip.stjacobs": trip({
      status: "ready",
      startKm: "120410",
      startTime: "09:05",
      aboard: []
    })
  });
  await page.getByRole("button", { name: /Helen Cho/ }).click();
  await page.getByRole("button", { name: /Samir Patel/ }).click();
  await page.getByRole("button", { name: /Helen Cho/ }).waitFor();
  const aboard = await page.getByRole("button", { pressed: true }).count();
  if (aboard !== 2) throw new Error("Expected 2 members aboard, found " + aboard);
  await shot(page, "13-driver-2-pickup.png");

  await openAs(page, origin, "priya", "sheet.html?trip=stjacobs", {
    "aa.trip.stjacobs": trip({
      status: "started",
      startKm: "120410",
      startTime: "09:05",
      endKm: "",
      endTime: "13:05",
      aboard: ["helen", "samir", "mateo", "june"]
    })
  });
  await page.locator("#end-km").fill("120478");
  await page.getByRole("button", { name: /June Berger/ }).click();
  await page.getByText("Where June Berger is dropped off").waitFor();
  await shot(page, "13-driver-3-finish-dropoff-open.png");

  await openAs(page, origin, "priya", "sheet.html?trip=stjacobs", {
    "aa.trip.stjacobs": trip({
      status: "started",
      startKm: "120410",
      startTime: "09:05",
      endKm: "120478",
      endTime: "13:05",
      hours: "4",
      litres: "41.6",
      fuelCost: "64.80",
      aboard: ["helen", "samir", "mateo", "june"]
    })
  });
  await shot(page, "13-driver-4-fuel.png");

  await captureSetup(page, origin);
  await captureCheck(page, origin);
  await captureExport(page, origin);

  await openAs(page, origin, "priya", "home.html", officeDrop());
  await shotBox(page, "10-row-c-icon.png", "li.list-row:has-text('Helen Cho')");
}

async function captureSetup(page: Page, origin: string) {
  await openAs(page, origin, "ed", "home.html", assigned());
  await page.getByRole("button", { name: "New trip" }).click();
  await page.getByRole("heading", { name: "Set up this trip" }).waitFor();
  await page.locator("#trip-name").fill("St. Jacobs Farmers Market");
  await page.locator("#board-at").fill("09:30");
  await page.locator("#board-at").blur();
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, "14-staff-1-new-trip.png", false);

  await page.getByRole("radio", { name: "Priya Sandhu" }).check();
  await page.getByRole("radio", { name: "Paid", exact: true }).check();
  await page.locator("#pay-rate").fill("20.00");
  await page.locator("#destination").fill("St. Jacobs Farmers Market");
  await page.locator("#destination").blur();

  for (const name of ["Helen Cho", "Ruth Abebe", "Samir Patel", "Mateo Ruiz", "June Berger"]) {
    await page.locator("label.check-row", { hasText: name }).locator("input").check();
  }
  await page.getByRole("heading", { name: "Who is coming" }).evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.getByText("2 out of 6 booked").waitFor();
  await page.getByText("All seats booked").waitFor();
  await shot(page, "14-staff-2-whos-coming.png", false);

  await page.getByRole("button", { name: /Drop-off for Helen Cho/ }).click();
  await page.getByRole("radio", { name: /Home:/ }).check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("14 Birch Ave, Kitchener").first().waitFor();

  const top = await page.getByRole("heading", { name: "Where to" }).evaluate((el) => {
    const node = el.closest("section") || el;
    return node.getBoundingClientRect().top + window.scrollY;
  });
  const bottom = await page.locator("section").filter({ has: page.getByRole("heading", { name: "Who is coming" }) }).evaluate((el) => {
    return el.getBoundingClientRect().bottom + window.scrollY;
  });
  const scroll = Math.max(0, top - 8);
  const height = Math.ceil(bottom - scroll + 16);
  await page.setViewportSize({ width: PHONE.width, height: Math.min(Math.max(height, 400), 3200) });
  await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await shot(page, "14-staff-3-where-to.png", false);
  await page.setViewportSize(PHONE);

  await page.getByRole("button", { name: /Send to Priya/ }).evaluate((el) => el.scrollIntoView({ block: "center" }));
  await shot(page, "14-staff-4-send.png", false);
}

async function captureCheck(page: Page, origin: string) {
  await openAs(page, origin, "ed", "sheet.html?trip=stjacobs", sentHome());
  await page.locator("summary").filter({ hasText: "Correct a number" }).click();
  const ending = page.locator("#end-km");
  await ending.waitFor();
  const before = await ending.inputValue();
  if (before !== "120478") throw new Error("Expected ending km 120478, found " + before);
  await ending.fill("120490");
  await page.getByText("80 km").first().waitFor();
  await shot(page, "14-staff-5-check-sheet.png");
}

async function captureExport(page: Page, origin: string) {
  await openAs(page, origin, "ed", "home.html", sentHome());
  await page.locator("summary").click();
  await page.getByRole("button", { name: "Export trips" }).click();
  await page.getByRole("heading", { name: "Export trips" }).waitFor();
  await page.getByRole("radio", { name: "All trips" }).check();
  await page.getByRole("checkbox", { name: /^Members/ }).check();
  await page.getByRole("checkbox", { name: /^Fuel/ }).check();
  await page.getByRole("checkbox", { name: /^Repairs/ }).check();
  const preview = path.join(outDir, "_export-preview.png");
  await shot(page, "_export-preview.png", false);
  try {
    const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
    await page.getByRole("button", { name: "Download PDF" }).click();
    const download = await downloadPromise;
    await download.saveAs(path.join(outDir, "15-export.pdf"));
    note("saved 15-export.pdf");
  } catch (error) {
    note("PDF download failed (" + (error instanceof Error ? error.message : String(error)) + "). Saving the export screen as 15-export.png.");
    fs.copyFileSync(preview, path.join(outDir, "15-export.png"));
  }
}

async function captureRecreated(page: Page, origin: string) {
  note("Plan the run, the boxed tag, the plain label, the orange and peach headers, the quiet-white line, and Atkinson were not found as UI in any commit. Recreating them, then restoring the files.");

  await withPatch(dataFile, (source) => source.replace(
    'if (mode === "lot") return "Start this trip";',
    'if (mode === "lot") return "Plan the run";'
  ), async () => {
    await openAs(page, origin, "priya", "home.html", planTheRun());
    const label = await page.locator(".btn-primary").innerText();
    if (label !== "Plan the run") throw new Error("Plan the run button missing: " + label);
    await shot(page, "09-old-plan-the-run.png");
  });

  const planned = `function plannedRow(trip, member) {
  if (dropPlace(trip) === "Office") return textRow(memberLabel(member));
  return dropRow(member);
}`;

  await withPatch(dataFile, (source) => source.replace(planned, `function plannedRow(trip, member) {
  const children = [el("span", { text: member.name })];
  if (member.seat === "Wheelchair") children.push(el("span", { className: "tag tag-box", text: "Wheelchair" }));
  return el("li", { className: "list-row", children });
}`), async () => {
    await withPatch(cssFile, (source) => source + `
.tag.tag-box { background: #161616; color: #ffffff; border-radius: 2px; padding: 2px 8px; font-weight: 700; }
`, async () => {
      await openAs(page, origin, "priya", "home.html", officeDrop());
      await shotBox(page, "10-row-a-boxed-tag.png", "li.list-row:has-text('Helen Cho')");
    });
  });

  await withPatch(dataFile, (source) => source.replace(planned, `function plannedRow(trip, member) {
  const word = member.seat === "Wheelchair" ? "Wheelchair" : "Seat";
  return el("li", { className: "list-row", children: [el("span", { text: member.name }), el("span", { text: word })] });
}`), async () => {
    await openAs(page, origin, "priya", "home.html", officeDrop());
    await shotBox(page, "10-row-b-plain-label.png", "li.list-row:has-text('Helen Cho')");
  });

  await withPatch(cssFile, (source) => source + `
.masthead { background: #F2682A; color: #14272a; margin: -24px -24px 0; padding: 24px 24px 16px; }
.masthead .status-tag, .masthead h1, .masthead .profile summary { color: #14272a; }
`, async () => {
    await openAs(page, origin, "priya", "home.html", assigned());
    await shot(page, "11-colour-orange.png", false);
  });

  await withPatch(cssFile, (source) => source + `
.masthead { background: #FBDCCB; color: #14272a; margin: -24px -24px 0; padding: 24px 24px 16px; }
.masthead .status-tag { display: inline-block; width: fit-content; padding: 4px 12px; border-radius: 999px; background: #F2682A; color: #14272a; font-weight: 700; }
`, async () => {
    await openAs(page, origin, "priya", "home.html", assigned());
    await shot(page, "11-colour-peach.png", false);
  });

  await withPatch(cssFile, (source) => source + `
.masthead { background: #ffffff; border-bottom: 5px solid #F2682A; padding-bottom: 16px; }
.masthead .status-tag { display: inline-block; width: fit-content; padding: 4px 12px; border-radius: 999px; background: #FDE7DC; color: #A3461A; font-weight: 700; }
`, async () => {
    await openAs(page, origin, "priya", "home.html", assigned());
    await shot(page, "11-colour-white.png", false);
  });

  await withPatch(tokenFile, (source) => {
    return source
      .replace(
        /@import url\("[^"]+"\);/,
        '@import url("https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;500;600;700;800&display=swap");'
      )
      .replace(
        /--font: [^;]+;/,
        '--font: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", sans-serif;'
      );
  }, async () => {
    await openAs(page, origin, "priya", "home.html", assigned());
    const loaded = await page.evaluate(() => document.fonts.check('16px "Atkinson Hyperlegible Next"'));
    if (!loaded) note("Atkinson Hyperlegible Next did not load; the shot may have fallen back to another face.");
    else note("Atkinson Hyperlegible Next loaded.");
    await shot(page, "11-font-atkinson.png");
  });
}

async function captureWireframe(browser: Browser) {
  const dir = "/tmp/accessbus-wt-wireframe";
  execSync("git worktree remove --force " + dir + " 2>/dev/null || true", { cwd: repo });
  execSync("rm -rf " + dir);
  execSync("git worktree prune", { cwd: repo });
  const found = execSync("git rev-parse 1bccc29", { cwd: repo, encoding: "utf8" }).trim();
  note("Wireframes checked out from " + found + " (Add Night Bus wireframes).");
  execSync("git worktree add --detach " + dir + " " + found, { cwd: repo });
  const server = await serve(path.join(dir, "frontend", "app"), 4174);
  const origin = "http://127.0.0.1:4174";
  const page = await browser.newPage({
    viewport: PHONE,
    deviceScaleFactor: 2,
    locale: "en-CA",
    timezoneId: "America/Toronto"
  });
  page.on("pageerror", (error) => note("wireframe page error: " + error.message));
  try {
    await blockRemote(page);
    await openAs(page, origin, "priya", "home.html", assigned());
    await shot(page, "12-driver-home-wireframe.png");
    await openAs(page, origin, "ed", "home.html", assigned());
    await shot(page, "12-staff-home-wireframe.png");
  } finally {
    await page.close();
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    execSync("git worktree remove --force " + dir, { cwd: repo });
    note("Removed wireframe worktree.");
  }
}

function searchHistory() {
  const log = (args: string) => {
    try {
      return execSync("git " + args, { cwd: repo, encoding: "utf8" }).trim();
    } catch {
      return "";
    }
  };
  const commits = log('log --oneline -- frontend/app');
  note("Commits that touch frontend/app:\n" + commits);
  const uiPlan = log('grep -n "return \\"Plan the run\\"" $(git rev-list --all) -- frontend/app/data.js');
  note(uiPlan
    ? "Plan the run button found:\n" + uiPlan
    : "No commit contains a Plan the run button in data.js. D-066 is only in DESIGN_DECISIONS.md.");
  const peach = log('grep -n "FBDCCB" $(git rev-list --all) -- frontend/app/tokens.css frontend/app/components.css');
  note(peach ? "Peach colour found:\n" + peach : "No commit contains the peach header #FBDCCB.");
  const box = log('grep -n "tag-box\\|Wheelchair\\"\\)" $(git rev-list --all) -- frontend/app/data.js');
  note(box ? "Boxed tag search:\n" + box : "No commit contains the boxed Wheelchair tag. The icon row is in the first frontend commit, 1bccc29.");
}

async function contactSheet(browser: Browser) {
  const slides = new Map<string, string[]>();
  for (const name of Object.keys(CAPTIONS)) {
    const file = path.join(outDir, name);
    const png = name.endsWith(".pdf") ? path.join(outDir, "_export-preview.png") : file;
    if (!fs.existsSync(file) && !fs.existsSync(png)) continue;
    const slide = name.slice(0, 2);
    const list = slides.get(slide) || [];
    list.push(name);
    slides.set(slide, list);
  }
  const sections = [...slides.keys()].sort().map((slide) => {
    const figures = (slides.get(slide) || []).map((name) => {
      const src = name.endsWith(".pdf")
        ? path.join(outDir, "_export-preview.png")
        : path.join(outDir, name);
      const caption = CAPTIONS[name] || "";
      return `<figure><img src="${src}" alt=""><figcaption><code>${name}</code>${caption}</figcaption></figure>`;
    }).join("");
    return `<section class="slide"><h1>Slide ${slide}</h1><div class="row">${figures}</div></section>`;
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: 17in 11in; margin: 0.45in; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Public Sans", "Segoe UI", sans-serif; color: #14272a; }
    .slide { break-after: page; }
    h1 { font-size: 22px; margin: 0 0 12px; color: #155e63; }
    .row { display: flex; gap: 16px; align-items: flex-start; }
    figure { margin: 0; flex: 1 1 0; min-width: 0; }
    img { width: auto; max-width: 100%; max-height: 8.4in; object-fit: contain; object-position: top left; border: 1px solid #d4e4e5; }
    figcaption { margin-top: 8px; font-size: 12px; line-height: 1.35; }
    code { display: block; font-size: 11px; margin-bottom: 2px; }
  </style></head><body>${sections}</body></html>`;
  const htmlFile = path.join(outDir, "_contact.html");
  fs.writeFileSync(htmlFile, html);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto("file://" + htmlFile, { waitUntil: "load" });
  await page.pdf({
    path: path.join(outDir, "contact-sheet.pdf"),
    width: "17in",
    height: "11in",
    printBackground: true,
    preferCSSPageSize: true
  });
  await page.close();
  fs.rmSync(htmlFile, { force: true });
  fs.rmSync(path.join(outDir, "_export-preview.png"), { force: true });
  note("saved contact-sheet.pdf");
}

function writeReport() {
  const lines = [
    "# Deck screenshot report",
    "",
    "Staff and driver screens are the same 480px column, drawn for a phone. Both were captured at 375px wide and 2x. Nothing was captured at 1280px.",
    "",
    "The dev server is a local static server for `frontend/app`. Sign-in is skipped with `?as=priya` or `?as=ed`, which writes the same session the PIN screen writes. Cognito and the AWS API are not called. Address lookup (photon.komoot.io) is blocked.",
    "",
    "Sample trip: St. Jacobs Farmers Market, today, driver Priya Sandhu, pickup 9:30 AM, paid at $20.00 an hour. Five members confirmed: Helen Cho and Ruth Abebe (wheelchair), Samir Patel, Mateo Ruiz, and June Berger (seats). That is two wheelchair users, not one: five people with only one wheelchair user would be four seated riders, and the bus has 3 seats. The tiles show 2 of 6 wheelchair spaces and 3 of 3 seats. On the cover, Ruth did not board, so four people are aboard and one of them, Helen Cho, uses a wheelchair. Walter Singh is on the member list and is not on this trip.",
    "",
    "Flow differences are in `FLOWS.md`. The short version: the driver steps match the outline, with the start time, hours, kilometres, and pay calculated. Staff set up a trip on one page, in the order trip, driver and pay, where the group goes, who is coming (drop-off under each name), then Send. Check the sheet happens after the driver sends it back.",
    "",
    "## What was captured",
    "",
    ...REQUIRED.filter((name) => name.endsWith(".png") || name.endsWith(".pdf") && name.startsWith("15")).map((name) => {
      const file = path.join(outDir, name);
      const exists = fs.existsSync(file);
      const size = exists ? fs.statSync(file).size : 0;
      return "- " + name + (exists ? " (" + size + " bytes)" : " MISSING");
    }),
    "",
    "## Commits",
    "",
    "- `1bccc29411fec22622956c6fdcb707c08205a6ac` — Add Night Bus wireframes (2026-11-08). `12-driver-home-wireframe.png` and `12-staff-home-wireframe.png` were captured from a git worktree of this commit, then the worktree was removed. This commit is already past D-066 and D-027: the driver button says Start this trip, and a wheelchair user has the icon.",
    "- `89a7bdaf4fb97ae3816b401a3fbe62c71b062566` — Add AccessBus visual mockups (2026-11-08). Public Sans, the quiet header, and the icon row. The working tree is this commit plus a small uncommitted edit (the \"trip is checked\" notice was removed). Current shots, including `11-font-public-sans.png` and `10-row-c-icon.png`, are from the working tree.",
    "",
    "No other commit contains `frontend/app`. These versions are not in history, so the script changed the source, captured, and restored it:",
    "",
    "- `09-old-plan-the-run.png` — `driverTask` returned \"Plan the run\" for the first step, and the pickup time was cleared so the home is the trip before anyone has planned it. From D-016, removed in D-066. The button text is not in any commit's `data.js`.",
    "- `10-row-a-boxed-tag.png` — Helen Cho's row, wheelchair users only, with a black boxed Wheelchair label. D-018 describes this as the contrasty tag that the plain label replaced. No commit contains it.",
    "- `10-row-b-plain-label.png` — the same row with a plain right-aligned Wheelchair label (D-018). Seat rows get the same kind of label. Not in any commit.",
    "- `11-colour-orange.png` — driver header band `#F2682A` with dark text (D-092). Not in any commit.",
    "- `11-colour-peach.png` — header band `#FBDCCB`, orange status pill (D-094). Not in any commit.",
    "- `11-colour-white.png` — white header, 5px orange line, tinted status pill (D-095). Not in any commit. The working tree is later than this: D-099 drops the orange line and keeps orange in the logo only, which is what `07-driver-home.png` and `12-driver-home-final.png` show.",
    "- `11-font-atkinson.png` — the assigned driver home with Atkinson Hyperlegible Next, the face in D-092. D-095 replaced it with Public Sans. The font is not in any commit.",
    "",
    "`10-row-c-icon.png` is the current component, cropped to Helen Cho. The same icon has been in the code since `1bccc29`.",
    "",
    "## Run log",
    "",
    ...notes.map((line) => line.split("\n").map((part) => part).join("\n")),
    ""
  ];
  fs.writeFileSync(path.join(outDir, "REPORT.md"), lines.join("\n"));
  note("saved REPORT.md");
}

function zipPngs() {
  const pngs = REQUIRED.filter((name) => name.endsWith(".png") && fs.existsSync(path.join(outDir, name)));
  const zip = path.join(repo, "deck-shots.zip");
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  execSync("zip -j " + JSON.stringify(zip) + " " + pngs.map((name) => JSON.stringify(path.join(outDir, name))).join(" "), { cwd: repo });
  note("saved deck-shots.zip (" + pngs.length + " pngs)");
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  searchHistory();
  const server = await serve(appDir, 4173);
  const origin = "http://127.0.0.1:4173";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: PHONE,
    deviceScaleFactor: 2,
    locale: "en-CA",
    timezoneId: "America/Toronto"
  });
  page.on("pageerror", (error) => note("page error: " + error.message));
  try {
    await blockRemote(page);
    await captureCurrent(page, origin);
    await captureRecreated(page, origin);
    await captureWireframe(browser);
    await contactSheet(browser);
    zipPngs();
    writeReport();
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  const missing = REQUIRED.filter((name) => !fs.existsSync(path.join(outDir, name)) && !(name === "15-export.pdf" && fs.existsSync(path.join(outDir, "15-export.png"))));
  if (missing.length) {
    console.error("Missing:\n" + missing.join("\n"));
    process.exit(1);
  }
  const dirty = execSync("git diff --stat -- frontend/app/data.js frontend/app/components.css frontend/app/tokens.css", { cwd: repo, encoding: "utf8" });
  note("Source diff after restore:\n" + (dirty || "(no diff in data.js, components.css, tokens.css beyond what was already dirty)"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
