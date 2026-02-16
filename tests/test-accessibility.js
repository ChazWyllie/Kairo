/**
 * ConsistAI — Accessibility Tests
 * Validates basic accessibility requirements for the landing page.
 *
 * Tests run against: src/landing/index.html
 * Dependencies: cheerio
 */

const fs = require('fs');
const path = require('path');

let cheerio;
try {
  cheerio = require('cheerio');
} catch {
  console.error('ERROR: cheerio not installed. Run: npm install');
  process.exit(1);
}

const HTML_PATH = path.resolve(__dirname, '..', 'src', 'landing', 'index.html');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    results.push(`  ❌ ${name}\n     → ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Check file exists first
if (!fs.existsSync(HTML_PATH)) {
  console.log('\n  Accessibility Tests');
  console.log('  ' + '─'.repeat(40));
  console.log('  ❌ A0: index.html not found — skipping accessibility tests');
  console.log('  ' + '─'.repeat(40));
  console.log('  PASSED: 0  |  FAILED: 1');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf-8');
const $ = cheerio.load(html);

// ─── Language ────────────────────────────────────────────────
test('A1: Has lang attribute on <html>', () => {
  const lang = $('html').attr('lang');
  assert(lang, 'Missing lang attribute on <html>');
  assert(lang === 'en' || lang.startsWith('en-'), `lang="${lang}", expected "en"`);
});

// ─── Images ──────────────────────────────────────────────────
test('A2: All images have alt text', () => {
  const images = $('img');
  if (images.length === 0) return; // No images is fine for this page
  images.each((i, img) => {
    const alt = $(img).attr('alt');
    assert(alt !== undefined, `<img> at index ${i} missing alt attribute`);
  });
});

// ─── Forms ───────────────────────────────────────────────────
test('A3: Email input has associated label or aria-label', () => {
  const emailInput = $('input[type="email"]');
  if (emailInput.length === 0) {
    throw new Error('No email input found');
  }
  const id = emailInput.attr('id');
  const ariaLabel = emailInput.attr('aria-label');
  const placeholder = emailInput.attr('placeholder');
  const label = id ? $(`label[for="${id}"]`) : $();

  assert(
    label.length > 0 || ariaLabel || placeholder,
    'Email input needs a <label>, aria-label, or placeholder'
  );
});

// ─── Heading Hierarchy ───────────────────────────────────────
test('A4: Has exactly one <h1>', () => {
  const h1s = $('h1');
  assert(h1s.length === 1, `Found ${h1s.length} <h1> elements, expected exactly 1`);
});

test('A5: Heading hierarchy — no skipped levels', () => {
  const headings = [];
  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    headings.push(parseInt(el.tagName.replace('h', ''), 10));
  });

  if (headings.length < 2) return; // Only h1 is fine

  for (let i = 1; i < headings.length; i++) {
    const diff = headings[i] - headings[i - 1];
    assert(
      diff <= 1,
      `Heading hierarchy skip: h${headings[i - 1]} → h${headings[i]} (max jump is +1)`
    );
  }
});

// ─── Semantic Elements ───────────────────────────────────────
test('A6: Uses semantic <header> element', () => {
  assert($('header').length > 0, 'Missing <header> element');
});

test('A7: Uses semantic <main> element', () => {
  assert($('main').length > 0, 'Missing <main> element');
});

test('A8: Uses semantic <footer> element', () => {
  assert($('footer').length > 0, 'Missing <footer> element');
});

// ─── Focus & Interaction ─────────────────────────────────────
test('A9: Submit button is focusable', () => {
  const btn = $('button[type="submit"], input[type="submit"]');
  if (btn.length === 0) throw new Error('No submit button found');
  // Buttons are focusable by default unless tabindex="-1"
  const tabindex = btn.attr('tabindex');
  assert(tabindex !== '-1', 'Submit button has tabindex="-1" (not focusable)');
});

// ─── Output ──────────────────────────────────────────────────
console.log('\n  Accessibility Tests');
console.log('  ' + '─'.repeat(40));
results.forEach((r) => console.log(r));
console.log('  ' + '─'.repeat(40));
console.log(`  PASSED: ${passed}  |  FAILED: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
