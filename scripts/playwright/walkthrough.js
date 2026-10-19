// Walks the 8-step demo script from CLAUDE.md section 7 and saves a screenshot of every screen.
// Run with the Playwright MCP tool `browser_run_code_unsafe` (filename: scripts/playwright/walkthrough.js)
// against `npm run dev`. Screenshots go to screenshots/<viewport width>/.
async (page) => {
  // Runs against whichever server the browser is on (dev on 5173 or `npm run preview` on 4173).
  const BASE = page.url().startsWith('http') ? new URL(page.url()).origin : 'http://localhost:5173';
  const width = page.viewportSize().width;
  const dir = `screenshots/${width}`;
  const results = [];
  const errors = [];
  const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text()); };
  const onPageError = (e) => errors.push(e.message);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  const shot = (name, opts = {}) => page.screenshot({ path: `${dir}/${name}.png`, ...opts });
  const check = async (step, ok, detail = '') => results.push({ step, ok: !!ok, detail });
  const visible = (text) => page.getByText(text, { exact: false }).first().isVisible().catch(() => false);
  const wait = (ms) => page.waitForTimeout(ms);

  try {
    // 1. Open app: flood overlay around Southbank, bell shows 2 unread
    await page.goto(BASE + '/');
    await wait(1800);
    await shot('01-live-map');
    const badge = await page.locator('nav[aria-label="Main"] a[href="/alerts"]').innerText();
    await check('1 alerts badge shows 2 unread', /\b2\b/.test(badge), badge.replace(/\s+/g, ' '));
    await check('1 flooded streets rendered', (await page.locator('path.fp-flow').count()) >= 3, `${await page.locator('path.fp-flow').count()} flowing flood lines`);

    // Detail card on a flood segment (tap the Southbank Blvd banner's street via the alert flow instead of pixel-hunting)
    await page.getByRole('button', { name: /^(Map layers|Layers)$/ }).click();
    await wait(300);
    await page.getByRole('button', { name: 'Close layers' }).click();

    // 2. Search Flinders St Station: original blocked at Southbank Blvd, alternative suggested
    await page.getByRole('button', { name: 'Where to?' }).click();
    await page.getByLabel('Search for a destination').fill('Flinders');
    await wait(300);
    await shot('02a-search');
    await page.getByRole('button', { name: /Flinders St Station/ }).first().click();
    await wait(1500);
    await shot('02b-route-walk');
    await check('2 original blocked at Southbank Blvd', await visible('Flooded at Southbank Blvd'));
    await check('2 alternative recommended', await visible('Recommended'));

    // 3. Compare modes
    await page.getByRole('radio', { name: /Drive/ }).click();
    await wait(1200);
    await shot('03a-route-drive');
    const driveEta = await page.getByRole('radio', { name: /Drive/ }).innerText();
    await page.getByRole('radio', { name: /Transit/ }).click();
    await wait(1200);
    await shot('03b-route-transit');
    await check('3 transit shows tram disruption', await visible('Route 1 suspended'));
    await check('3 transit note about Routes 3, 5 and 6', await visible('Routes 3, 5 and 6'));
    await check('3 results differ by mode', driveEta.replace(/\s+/g, ' ') !== (await page.getByRole('radio', { name: /Walk/ }).innerText()).replace(/\s+/g, ' '), driveEta.replace(/\s+/g, ' '));
    await page.getByRole('radio', { name: /Walk/ }).click();
    await wait(800);

    // 4. Start navigation: marker moves along the alternative
    await page.getByRole('button', { name: 'Start navigation' }).click();
    await wait(2500);
    const before = await page.locator('[aria-live="polite"] p').first().innerText();
    await wait(1500);
    const after = await page.locator('[aria-live="polite"] p').first().innerText();
    await shot('04-navigation');
    await check('4 marker is moving', before !== after, `${before} -> ${after}`);

    // 5. Live re-route via the demo panel
    await page.keyboard.press('Shift+D');
    await wait(400);
    await shot('05a-demo-panel');
    const suggested = await page.getByLabel('Street to flood').inputValue();
    await check('5 demo panel suggests the street ahead', suggested === 'seg-stkr', suggested);
    await page.getByRole('button', { name: 'Flood it' }).click();
    await wait(700);
    await page.keyboard.press('Shift+D');
    await wait(300);
    await shot('05b-reroute-banner');
    await check('5 reroute banner appears', await visible('New flooding ahead on St Kilda Rd'));
    const etaBefore = await page.locator('[data-testid=trip-eta]').innerText();
    await page.getByRole('button', { name: 'Reroute', exact: true }).click();
    await wait(1200);
    await shot('05c-rerouted');
    const etaAfter = await page.locator('[data-testid=trip-eta]').innerText();
    await check('5 rerouted and ETA updated', (await visible('Rerouted')) && etaBefore !== etaAfter, `${etaBefore.replace(/\s+/g, ' ')} -> ${etaAfter.replace(/\s+/g, ' ')}`);
    await page.getByRole('button', { name: 'End', exact: true }).click();
    await wait(800);

    // 6. Report flooding with a photo: pending, then verified, +10 points
    await page.getByRole('link', { name: 'Report' }).click();
    await wait(500);
    await page.locator('input[type=file]').setInputFiles('scripts/playwright/flood-photo.jpg');
    await page.getByRole('radio', { name: /Flooded road/ }).click();
    await page.getByRole('radio', { name: /Impassable/ }).click();
    await page.getByLabel('Details').fill('Water over the footpath outside ACCA. Too deep to walk through.');
    await wait(300);
    await shot('06a-report-form');
    await shot('06a-report-form-full', { fullPage: true });
    await page.getByRole('button', { name: 'Submit report' }).click();
    await wait(400);
    await shot('06b-report-pending');
    await check('6 report pending', await visible('Checking with nearby sensors'));
    await wait(4500);
    await shot('06c-report-verified');
    await check('6 report verified with +10 points', (await visible('Report verified')) && (await visible('130 in total')));
    await page.getByRole('button', { name: 'View on map' }).first().click();
    await wait(1500);
    await shot('06d-report-on-map');

    // 7. Layers: shelters, medical, power and sensors
    await page.getByRole('button', { name: /^(Map layers|Layers)$/ }).click();
    await wait(300);
    for (const name of ['Shelters', 'Medical services', 'Charging and backup power', 'Water level sensors']) {
      await page.getByRole('switch', { name }).click();
    }
    await wait(300);
    await shot('07a-layers-panel');
    await page.getByRole('button', { name: 'Close layers' }).click();
    await page.getByRole('button', { name: 'Close details' }).click().catch(() => {});
    await wait(800);
    await shot('07b-civic-layers');
    await check('7 civic markers on the map', (await page.locator('.leaflet-marker-icon').count()) >= 15, `${await page.locator('.leaflet-marker-icon').count()} markers`);

    // 8. Alerts feed: sensor-triggered and saved-route alerts
    await page.keyboard.press('Shift+D');
    await page.getByRole('button', { name: 'Trigger' }).click();
    await wait(500);
    await page.keyboard.press('Shift+D');
    await page.getByRole('link', { name: /Alerts/ }).click();
    await wait(600);
    await shot('08-alerts');
    await check('8 sensor alert in feed', await visible('Rising water on City Rd'));
    await check('8 saved route alert in feed', await visible('Your route to work is disrupted'));

    // Remaining screens
    await page.getByRole('link', { name: 'Hub' }).click();
    await wait(500);
    await shot('09a-hub');
    await page.getByRole('button', { name: /Emergency services/ }).click();
    await wait(400);
    await shot('09b-emergency');
    await page.goto(BASE + '/hub/info');
    await wait(400);
    await shot('09c-further-info');
    await page.goto(BASE + '/profile');
    await wait(400);
    await shot('10-profile');
    await page.goto(BASE + '/');
    await wait(1500);
    await page.getByRole('button', { name: 'Roads' }).click();
    await wait(500);
    await shot('11a-filter-roads');
    await page.getByRole('button', { name: 'Roads' }).click();
    await page.getByRole('button', { name: 'Show my location' }).click();
    await wait(900);
    // open a flood segment detail card through its alert
    await page.goto(BASE + '/alerts');
    await page.getByRole('button', { name: 'View on map' }).first().click();
    await wait(1500);
    await shot('11b-segment-detail');
    await check('detail card shows Report an update', await visible('Report an update'));
  } catch (e) {
    results.push({ step: 'exception', ok: false, detail: String(e).slice(0, 400) });
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
  return { width, passed: results.filter((r) => r.ok).length, total: results.length, results, errors };
}
