/**
 * ConsistAI — HTML Structure Tests
 * Validates that index.html contains all required sections and elements.
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

// ─── Check file exists ───────────────────────────────────────
test('T0: index.html exists', () => {
  assert(fs.existsSync(HTML_PATH), `File not found: ${HTML_PATH}`);
});

if (!fs.existsSync(HTML_PATH)) {
  results.forEach((r) => console.log(r));
  console.log(`\n  PASSED: ${passed}  |  FAILED: ${failed}`);
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf-8');
const $ = cheerio.load(html);

// ─── Meta & Head ─────────────────────────────────────────────
test('T1: Has <title> with "ConsistAI"', () => {
  const title = $('title').text();
  assert(title.includes('ConsistAI'), `Title is "${title}", expected to contain "ConsistAI"`);
});

test('T2: Has meta viewport tag', () => {
  const viewport = $('meta[name="viewport"]');
  assert(viewport.length > 0, 'Missing <meta name="viewport">');
});

test('T3: Has charset meta tag', () => {
  const charset = $('meta[charset]');
  assert(charset.length > 0, 'Missing <meta charset>');
});

// ─── Hero Section ────────────────────────────────────────────
test('T4: Has hero section', () => {
  const hero = $('[class*="hero"], [id*="hero"], #hero, .hero, section:first-of-type');
  assert(hero.length > 0, 'No hero section found (need .hero or #hero)');
});

test('T5: Hero contains product name "ConsistAI"', () => {
  const bodyText = $('body').text();
  assert(bodyText.includes('ConsistAI'), 'Product name "ConsistAI" not found');
});

test('T6: Hero contains tagline about adapting', () => {
  const bodyText = $('body').text();
  assert(
    bodyText.includes('Your plan adapts') || bodyText.includes('plan adapts'),
    'Tagline "Your plan adapts" not found'
  );
});

// ─── 3-Step Flow ─────────────────────────────────────────────
test('T7: Has a section with 3 step items', () => {
  const steps = $('[class*="step"], [class*="flow"] > *, .steps > *');
  assert(steps.length >= 3, `Found ${steps.length} step items, expected ≥ 3`);
});

test('T8: Step 1 mentions setting constraints', () => {
  const text = $('body').text().toLowerCase();
  assert(
    text.includes('set') && text.includes('constraint'),
    'Step 1 should mention "set" and "constraint"'
  );
});

test('T9: Step 2 mentions getting today\'s plan', () => {
  const text = $('body').text().toLowerCase();
  assert(
    text.includes('get') && text.includes('plan'),
    'Step 2 should mention "get" and "plan"'
  );
});

test('T10: Step 3 mentions logging in 30 seconds', () => {
  const text = $('body').text().toLowerCase();
  assert(
    text.includes('log') && text.includes('30'),
    'Step 3 should mention "log" and "30" (seconds)'
  );
});

// ─── Phone Mockups ───────────────────────────────────────────
test('T11: Has 3 phone mockup containers', () => {
  const phones = $('[class*="phone"], [class*="mockup"], [class*="device"]');
  assert(phones.length >= 3, `Found ${phones.length} phone mockups, expected ≥ 3`);
});

test('T12: Phone 1 - Today screen has workout options', () => {
  const text = $('body').text();
  assert(
    text.includes('Hotel Circuit') || text.includes('Workout'),
    'Today screen should mention workout options'
  );
});

test('T13: Phone 1 - Today screen has nutrition targets', () => {
  const text = $('body').text();
  assert(
    text.includes('Protein') || text.includes('protein'),
    'Today screen should mention nutrition/protein targets'
  );
});

test('T14: Phone 2 - Quick Log screen has checklist', () => {
  const text = $('body').text();
  assert(
    text.includes('Quick Log') || text.includes('Checklist'),
    'Quick Log screen should mention checklist'
  );
});

test('T15: Phone 3 - Insights screen has adherence', () => {
  const text = $('body').text();
  assert(
    text.includes('Adherence') || text.includes('adherence'),
    'Insights screen should mention adherence'
  );
});

test('T16: Phone 3 - Insights screen has streak', () => {
  const text = $('body').text();
  assert(
    text.includes('Streak') || text.includes('streak'),
    'Insights screen should mention streak'
  );
});

// ─── Waitlist Form ───────────────────────────────────────────
test('T17: Has a form element', () => {
  const form = $('form');
  assert(form.length > 0, 'No <form> element found');
});

test('T18: Form has email input', () => {
  const emailInput = $('input[type="email"]');
  assert(emailInput.length > 0, 'No <input type="email"> found');
});

test('T19: Form has submit button', () => {
  const submit = $('button[type="submit"], input[type="submit"], button:contains("Join"), button:contains("waitlist")');
  assert(submit.length > 0, 'No submit button found');
});

// ─── Navigation ──────────────────────────────────────────────
test('T20: Phone screens have navigation items', () => {
  const text = $('body').text();
  const hasToday = text.includes('Today');
  const hasLog = text.includes('Log');
  const hasInsights = text.includes('Insight');
  assert(hasToday && hasLog && hasInsights, 'Phone nav should include Today, Log, Insights');
});

// ─── Footer ──────────────────────────────────────────────────
test('T21: Has footer element', () => {
  const footer = $('footer');
  assert(footer.length > 0, 'No <footer> element found');
});

// ─── Output ──────────────────────────────────────────────────
console.log('\n  HTML Structure Tests');
console.log('  ' + '─'.repeat(40));
results.forEach((r) => console.log(r));
console.log('  ' + '─'.repeat(40));
console.log(`  PASSED: ${passed}  |  FAILED: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
