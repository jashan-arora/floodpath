// Dead-control audit: on each screen, clicks every visible, enabled control one at a time
// (fresh page load each time) and flags any click that changes nothing: no URL change,
// no DOM change and no change to app state. Run with `browser_run_code_unsafe`.
async (page) => {
  const BASE = 'http://localhost:5173';
  const desktop = page.viewportSize().width >= 1024;
  const store = (fn) => page.evaluate(fn);
  // Fresh load; a previous click may still be navigating, so retry once if interrupted.
  const go = async (path) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }); return; }
      catch { await page.waitForTimeout(300); }
    }
  };
  const setups = {
    'home': async () => go('/'),
    'home + detail card': async () => {
      await go('/');
      await page.waitForTimeout(700);
      await store(() => window.__floodpath.getState().focusOn({ kind: 'segment', id: 'seg-sbb' }));
    },
    'home + layers panel': async () => {
      await go('/');
      await page.waitForTimeout(700);
      await page.getByRole('button', { name: /^(Map layers|Layers)$/ }).click();
    },
    'search': async () => go('/search'),
    'route': async () => go('/route/j-fss'),
    'navigate': async () => {
      await go('/route/j-fss');
      await page.waitForTimeout(600);
      await page.getByRole('button', { name: 'Start navigation' }).click();
    },
    'demo panel': async () => {
      await go('/');
      await page.waitForTimeout(600);
      await page.keyboard.press('Shift+D');
    },
    'hub': async () => go('/hub'),
    'emergency': async () => go('/hub/emergency'),
    'info': async () => go('/hub/info'),
    'report': async () => go('/report'),
    'alerts': async () => go('/alerts'),
    'profile': async () => go('/profile'),
  };

  const SELECTOR = 'button:not([disabled]):not([aria-hidden="true"]), a[href], [role="switch"], [role="radio"], select, [role="button"]';
  const signature = () => page.evaluate(() => {
    const s = window.__floodpath.getState();
    const pick = {
      selected: s.selected, layers: s.layers, journeyId: s.journeyId, mode: s.mode, chosen: s.chosenRouteId,
      nav: [s.nav.status, s.nav.paused, s.nav.rerouteCount, !!s.nav.reroute], demo: s.demoOpen, toasts: s.toasts.length,
      read: s.alerts.filter((a) => a.read).length, alerts: s.alerts.length, focus: s.focus?.nonce, fit: s.fit?.nonce,
      segs: s.segments.map((g) => g.severity).join(), sensors: s.sensors.map((x) => x.status).join(), auto: s.autoUpdates,
    };
    return JSON.stringify([location.pathname + location.search, document.body.innerHTML.length, pick]);
  });
  const describe = (el) => el.evaluate((n) => (n.getAttribute('aria-label') || n.textContent || n.getAttribute('title') || n.tagName).trim().replace(/\s+/g, ' ').slice(0, 48));

  // The photo picker opens a real file chooser; answer it with the fixture photo.
  const onChooser = (fc) => fc.setFiles('scripts/playwright/flood-photo.jpg').catch(() => {});
  page.on('filechooser', onChooser);

  const report = [];
  let clicked = 0;
  for (const [screen, setup] of Object.entries(setups)) {
    await setup();
    await page.waitForTimeout(900);
    const count = await page.locator(SELECTOR).count();
    const seen = new Set();
    for (let i = 0; i < count; i++) {
      await setup();
      await page.waitForTimeout(700);
      const el = page.locator(SELECTOR).nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      const name = await describe(el).catch(() => '?');
      const tag = await el.evaluate((n) => n.tagName.toLowerCase()).catch(() => '');
      const key = `${screen}:${name}`;
      if (seen.has(key) || (name.startsWith('Map pin') && seen.size > 40)) continue;
      seen.add(key);
      const href = tag === 'a' ? await el.getAttribute('href') : null;
      if (href && (/^(tel:|https?:)/.test(href))) { report.push({ screen, control: name, result: `external link ${href}` }); continue; }
      if (tag === 'select') { report.push({ screen, control: name, result: 'select (changes value)' }); continue; }
      // Opens the OS file picker (covered by the walkthrough's real upload); the MCP host intercepts it.
      if (/Take or add a photo|^Replace$/.test(name)) { report.push({ screen, control: name, result: 'opens file picker' }); continue; }
      const before = await signature();
      try {
        await el.click({ timeout: 2500 });
      } catch (e) {
        report.push({ screen, control: name, result: 'NOT CLICKABLE', detail: String(e).split('\n').find((l) => l.includes('intercepts')) || String(e).slice(0, 120) });
        continue;
      }
      clicked++;
      await page.waitForTimeout(450);
      const after = await signature();
      if (before === after) report.push({ screen, control: name, result: 'DEAD (no change)' });
    }
  }
  page.off('filechooser', onChooser);
  const problems = report.filter((r) => /DEAD|NOT CLICKABLE/.test(r.result));
  return { desktop, clicked, problems, notes: report.filter((r) => !/DEAD|NOT CLICKABLE/.test(r.result)).map((r) => `${r.screen}: ${r.control} -> ${r.result}`) };
}
