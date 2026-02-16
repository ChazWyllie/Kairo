/**
 * Kairo — CSS / Styles Tests
 * Validates that styles.css exists and meets quality requirements.
 *
 * Tests run against: src/landing/styles.css
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.resolve(__dirname, '..', 'src', 'landing', 'styles.css');

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

// ─── File Existence ──────────────────────────────────────────
test('S1: styles.css exists', () => {
  assert(fs.existsSync(CSS_PATH), `File not found: ${CSS_PATH}`);
});

if (!fs.existsSync(CSS_PATH)) {
  results.forEach((r) => console.log(r));
  console.log(`\n  PASSED: ${passed}  |  FAILED: ${failed}`);
  process.exit(1);
}

const css = fs.readFileSync(CSS_PATH, 'utf-8');

// ─── No External Dependencies ───────────────────────────────
test('S2: No external URLs in CSS', () => {
  const externalUrls = css.match(/url\s*\(\s*['"]?https?:\/\//g);
  assert(!externalUrls, `Found external URL(s) in CSS — keep all assets local`);
});

test('S3: No @import of external stylesheets', () => {
  const externalImports = css.match(/@import\s+url\s*\(\s*['"]?https?:\/\//g);
  assert(!externalImports, 'Found external @import — keep all styles local');
});

// ─── Responsive Design ──────────────────────────────────────
test('S4: Has responsive media query', () => {
  assert(css.includes('@media'), 'No @media query found — page must be responsive');
});

test('S5: Has a breakpoint for mobile (≤ 768px)', () => {
  const mobileQuery = css.match(/@media[^{]*max-width\s*:\s*768px|@media[^{]*min-width\s*:\s*769px/);
  assert(mobileQuery, 'No breakpoint near 768px found');
});

// ─── CSS Variables ───────────────────────────────────────────
test('S6: Uses CSS custom properties (variables)', () => {
  assert(css.includes('--'), 'No CSS custom properties (--var) found — use variables for theming');
});

// ─── Basic Quality ───────────────────────────────────────────
test('S7: CSS is non-trivial (> 100 lines)', () => {
  const lines = css.split('\n').length;
  assert(lines > 100, `CSS has only ${lines} lines — expected > 100 for a complete landing page`);
});

test('S8: No !important abuse (≤ 3 instances)', () => {
  const importants = (css.match(/!important/g) || []).length;
  assert(importants <= 3, `Found ${importants} !important declarations — max 3 allowed`);
});

// ─── Output ──────────────────────────────────────────────────
console.log('\n  CSS / Styles Tests');
console.log('  ' + '─'.repeat(40));
results.forEach((r) => console.log(r));
console.log('  ' + '─'.repeat(40));
console.log(`  PASSED: ${passed}  |  FAILED: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
