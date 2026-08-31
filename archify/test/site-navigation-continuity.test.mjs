import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ChromeVisualBrowser, findChrome } from '../bin/visual-check.mjs';
import { DIAGRAM_TYPES, DIAGRAM_TYPE_LABELS } from '../../scripts/site-copy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const navigationPath = path.join(repoRoot, 'docs/assets/site-navigation.css');
const integrationEnabled = process.env.ARCHIFY_SITE_INTEGRATION === '1';
const chromePath = integrationEnabled && process.env.ARCHIFY_CHROME ? findChrome() : null;

const PAGE_CONTRACTS = [
  { source: 'scripts/index-template.html', output: 'docs/index.html', identity: null, cta: '#quickstart' },
  { source: 'scripts/gallery-template.html', output: 'docs/gallery.html', identity: '/ proof lab', cta: 'start.html' },
  { source: 'scripts/guide-template.html', output: 'docs/guide.html', identity: '/ guide', cta: 'start.html' },
  { source: 'scripts/start-template.html', output: 'docs/start.html', identity: '/ start', cta: '#install' },
];

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}

function assertEnglishNavigation(html, label, cta) {
  assert.match(html, /<html lang="en"/, `${label}: English document language missing`);
  assert.match(html, /<link rel="stylesheet" href="assets\/site-navigation\.css">/, `${label}: shared navigation CSS missing`);
  assert.match(html, /<nav class="site-nav" aria-label="Primary navigation">/, `${label}: navigation landmark missing`);
  for (const [href, copy] of [['guide.html', 'Guide'], ['gallery.html', 'Proof Lab'], ['start.html', 'Start']]) {
    assert.match(html, new RegExp(`<a class="nav-link" href="${href}"[^>]*>${copy}<\\/a>`), `${label}: ${copy} link missing`);
  }
  assert.match(
    html,
    new RegExp(`<a class="btn btn-primary nav-cta" href="${cta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>Install (?:Skill|the skill)<\\/a>`, 'i'),
    `${label}: install CTA missing`,
  );
  assert.doesNotMatch(html, /data-zh|btn-lang|ArchifySiteLanguage|site-language\.js/);
}

async function evaluate(browser, sessionId, expression) {
  const response = await browser.cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description
      || response.exceptionDetails.text
      || 'Runtime.evaluate failed');
  }
  return response.result?.value;
}

async function navigate(browser, sessionId, url) {
  const loaded = browser.cdp.waitFor('Page.loadEventFired', sessionId);
  const navigation = await browser.cdp.send('Page.navigate', { url }, sessionId);
  if (navigation.errorText) throw new Error(`Chrome navigation failed: ${navigation.errorText}`);
  await loaded;
}

async function clickAndNavigate(browser, sessionId, selector) {
  const loaded = browser.cdp.waitFor('Page.loadEventFired', sessionId);
  await evaluate(browser, sessionId, `(function () {
    var link = document.querySelector(${JSON.stringify(selector)});
    if (!link) throw new Error('Missing navigation link: ' + ${JSON.stringify(selector)});
    link.click();
  })()`);
  await loaded;
}

function startStaticServer(root) {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    const relative = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '') || 'index.html';
    const requestedPath = path.resolve(root, relative);
    if (!requestedPath.startsWith(`${path.resolve(root)}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const body = fs.readFileSync(requestedPath);
      const contentType = requestedPath.endsWith('.css') ? 'text/css'
        : requestedPath.endsWith('.js') ? 'text/javascript'
          : requestedPath.endsWith('.json') ? 'application/json'
            : 'text/html';
      response.writeHead(200, { 'content-type': `${contentType}; charset=utf-8` });
      response.end(body);
    } catch (_) {
      response.writeHead(404).end('Not found');
    }
  });
}

test('serialized site integration gate retains English navigation coverage', () => {
  const packageJson = JSON.parse(read('archify/package.json'));
  assert.match(packageJson.scripts['test:webm'], /test\/site-navigation-integration\.mjs/);
  assert.equal(fs.existsSync(path.join(here, 'site-navigation-integration.mjs')), true);
});

test('site source and generated pages share English links, CTA, and page identity', () => {
  for (const page of PAGE_CONTRACTS) {
    for (const relative of [page.source, page.output]) {
      const html = read(relative);
      assertEnglishNavigation(html, relative, page.cta);
      if (page.identity) {
        assert.ok(html.includes(`<span class="nav-logo-path">${page.identity}</span>`), `${relative}: identity path missing`);
      }
    }
  }
});

test('shared navigation CSS keeps one desktop and mobile geometry contract', () => {
  const css = read('docs/assets/site-navigation.css');
  assert.match(css, /\.site-nav\s*\{[^}]*position: fixed;[^}]*height: 60px;[^}]*padding: 0 2rem;/s);
  assert.match(css, /\.site-nav \.nav-right\s*\{[^}]*gap: 1\.25rem;/s);
  assert.match(css, /\.site-nav \.nav-logo\s*\{[^}]*min-height: 44px;/s);
  assert.match(css, /\.site-nav \.nav-cta\s*\{[^}]*min-height: 34px;[^}]*border-radius: 6px;/s);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.site-nav \.nav-link \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 390px\)[\s\S]*\.site-nav \.nav-logo-path \{ display: none; \}/);
});

test('English gallery filters preserve labels, selection, URL state, and responsive controls', () => {
  const template = read('scripts/gallery-template.html');
  assert.match(template, /data-filter="all" aria-pressed="true">All \/ \[\[ENTRY_COUNT\]\]<\/button>/);
  for (const type of DIAGRAM_TYPES) {
    const placeholder = type.toUpperCase();
    assert.ok(
      template.includes(`data-filter="${type}" aria-pressed="false">[[DIAGRAM_TYPE_${placeholder}_EN]]</button>`),
      `gallery template: ${type} shared English label missing`,
    );
  }
  assert.match(template, /button\.setAttribute\('aria-pressed', button\.getAttribute\('data-filter'\) === type \? 'true' : 'false'\)/);
  assert.match(template, /url\.searchParams\.set\('type', type\)/);
  assert.match(template, /@media \(max-width: 640px\)[\s\S]*\.controls-inner, \.section-intro \{ align-items: flex-start; flex-direction: column; \}/);

  const html = read('docs/gallery.html');
  assert.match(html, /data-filter="all" aria-pressed="true">All \/ 11<\/button>/);
  for (const type of DIAGRAM_TYPES) {
    assert.match(
      html,
      new RegExp(`data-filter="${type}" aria-pressed="false">${DIAGRAM_TYPE_LABELS.en[type]}<\\/button>`),
      `docs/gallery.html: ${type} English label missing`,
    );
  }
});

test('English guide filters use the shared type inventory and preserve selection', () => {
  const template = read('scripts/guide-template.html');
  assert.match(template, /var types = \[\[DIAGRAM_TYPES_JSON\]\];/);
  assert.match(template, /var labels = \[\[DIAGRAM_TYPE_LABELS_JSON\]\];/);
  assert.match(template, /activeType=filter\.dataset\.filter; renderFilters\(\); renderCards\(\);/);

  const html = read('docs/guide.html');
  assert.ok(html.includes(`var labels = ${JSON.stringify(DIAGRAM_TYPE_LABELS)};`));
  assert.match(html, /var language = 'en';/);
});

test('custom site builders emit canonical navigation CSS and English navigation', {
  skip: integrationEnabled ? false : 'Run through the serialized site integration gate.',
}, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-site-navigation-'));
  try {
    const builds = [
      { script: 'build-index.mjs', args: [path.join(tmp, 'index-site/index.html')], output: 'index-site/index.html', cta: '#quickstart' },
      { script: 'build-start.mjs', args: [path.join(tmp, 'start-site/start.html')], output: 'start-site/start.html', cta: '#install' },
      { script: 'build-guide.mjs', args: [path.join(tmp, 'guide-site/guide.html')], output: 'guide-site/guide.html', cta: 'start.html' },
      { script: 'build-gallery.mjs', args: [path.join(tmp, 'gallery-site')], output: 'gallery-site/gallery.html', cta: 'start.html' },
    ];

    for (const build of builds) {
      execFileSync(process.execPath, [path.join(repoRoot, 'scripts', build.script), ...build.args]);
      const output = path.join(tmp, build.output);
      const emittedCss = path.join(path.dirname(output), 'assets/site-navigation.css');
      assert.equal(fs.readFileSync(emittedCss, 'utf8'), fs.readFileSync(navigationPath, 'utf8'));
      assertEnglishNavigation(fs.readFileSync(output, 'utf8'), build.script, build.cta);
      assert.equal(fs.existsSync(path.join(path.dirname(output), 'assets/site-language.js')), false);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('real Chrome preserves English navigation, filters, CTA, and desktop/mobile geometry', {
  skip: chromePath ? false : 'Set ARCHIFY_CHROME to run the real site regression.',
  timeout: 60000,
}, async () => {
  const docsRoot = path.join(repoRoot, 'docs');
  const server = startStaticServer(docsRoot);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = new ChromeVisualBrowser(chromePath);

  try {
    const sessionId = await browser.sessionPromise;
    await browser.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    }, sessionId);

    await navigate(browser, sessionId, `${baseUrl}/gallery.html`);
    assert.equal(await evaluate(browser, sessionId, 'document.documentElement.lang'), 'en');
    assert.deepEqual(await evaluate(browser, sessionId, `Array.from(document.querySelectorAll('[data-filter]')).map(function (button) { return button.textContent; })`),
      ['All / 11', 'Architecture', 'Workflow', 'Sequence', 'Data flow', 'Lifecycle']);
    await evaluate(browser, sessionId, `document.querySelector('[data-filter="architecture"]').click()`);
    assert.deepEqual(await evaluate(browser, sessionId, `({
      selected: document.querySelector('[data-filter="architecture"]').getAttribute('aria-pressed'),
      typeQuery: new URL(location.href).searchParams.get('type'),
      visibleCount: document.querySelectorAll('.showcase-card:not([hidden])').length,
      onlyArchitecture: Array.from(document.querySelectorAll('.showcase-card:not([hidden])')).every(function (card) { return card.dataset.type === 'architecture'; })
    })`), { selected: 'true', typeQuery: 'architecture', visibleCount: 2, onlyArchitecture: true });

    let loaded = browser.cdp.waitFor('Page.loadEventFired', sessionId);
    await browser.cdp.send('Page.reload', {}, sessionId);
    await loaded;
    assert.equal(await evaluate(browser, sessionId, `document.querySelector('[data-filter="architecture"]').getAttribute('aria-pressed')`), 'true');

    await clickAndNavigate(browser, sessionId, '.site-nav a[href="guide.html"]');
    await evaluate(browser, sessionId, `document.querySelector('#filters [data-filter="sequence"]').click()`);
    assert.deepEqual(await evaluate(browser, sessionId, `({
      selected: document.querySelector('#filters [data-filter="sequence"]').classList.contains('active'),
      visibleCount: document.querySelectorAll('#cards .card').length,
      onlySequence: Array.from(document.querySelectorAll('#cards .card .card-type')).every(function (label) { return label.textContent === 'sequence'; })
    })`), { selected: true, visibleCount: 2, onlySequence: true });
    await clickAndNavigate(browser, sessionId, '.site-nav a[href="start.html"]');
    assert.equal(await evaluate(browser, sessionId, 'document.querySelector(".nav-logo-path").textContent'), '/ start');

    const pages = ['index.html', 'gallery.html', 'guide.html', 'start.html'];
    let desktopGeometry = null;
    for (const page of pages) {
      await navigate(browser, sessionId, `${baseUrl}/${page}`);
      const receipt = await evaluate(browser, sessionId, `(function () {
        var nav = document.querySelector('.site-nav');
        var cta = nav.querySelector('.nav-cta');
        return {
          height: nav.getBoundingClientRect().height,
          position: getComputedStyle(nav).position,
          paddingLeft: getComputedStyle(nav).paddingLeft,
          actionGap: getComputedStyle(nav.querySelector('.nav-right')).gap,
          ctaHeight: cta.getBoundingClientRect().height,
          ctaRadius: getComputedStyle(cta).borderRadius,
          linkCount: nav.querySelectorAll('.nav-link').length,
          linkText: Array.from(nav.querySelectorAll('.nav-link')).slice(0, 3).map(function (link) { return link.textContent; })
        };
      })()`);
      if (!desktopGeometry) desktopGeometry = receipt;
      else assert.deepEqual(receipt, desktopGeometry, page);
    }

    await browser.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    }, sessionId);
    for (const page of pages) {
      await navigate(browser, sessionId, `${baseUrl}/${page}`);
      const mobile = await evaluate(browser, sessionId, `(function () {
        var nav = document.querySelector('.site-nav');
        var rect = nav.getBoundingClientRect();
        return {
          height: rect.height,
          left: rect.left,
          right: rect.right,
          actionsRight: nav.querySelector('.nav-right').getBoundingClientRect().right,
          linkDisplay: getComputedStyle(nav.querySelector('.nav-link')).display,
          ctaVisible: getComputedStyle(nav.querySelector('.nav-cta')).display !== 'none'
        };
      })()`);
      assert.deepEqual(mobile, { height: 60, left: 0, right: 390, actionsRight: 370, linkDisplay: 'none', ctaVisible: true }, page);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
