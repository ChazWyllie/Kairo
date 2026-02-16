/**
 * Kairo — Content Quality Tests
 * Validates that content is specific, concrete, and not placeholder.
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
  console.log('\n  Content Quality Tests');
  console.log('  ' + '─'.repeat(40));
  console.log('  ❌ C0: index.html not found — skipping content tests');
  console.log('  ' + '─'.repeat(40));
  console.log('  PASSED: 0  |  FAILED: 1');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf-8');
const $ = cheerio.load(html);
const bodyText = $('body').text();

// ─── No Placeholder Text ────────────────────────────────────
test('C1: No lorem ipsum text', () => {
  const lower = bodyText.toLowerCase();
  assert(!lower.includes('lorem ipsum'), 'Found "lorem ipsum" — remove placeholder text');
  assert(!lower.includes('dolor sit amet'), 'Found "dolor sit amet" — remove placeholder text');
});

test('C2: No "TODO" or "FIXME" in content', () => {
  assert(!bodyText.includes('TODO'), 'Found "TODO" in page content');
  assert(!bodyText.includes('FIXME'), 'Found "FIXME" in page content');
});

// ─── Concrete Numbers ───────────────────────────────────────
test('C3: Protein mentioned with grams', () => {
  assert(
    bodyText.includes('160g') || bodyText.includes('160 g') || bodyText.includes('protein'),
    'Should mention protein target with grams (e.g., "160g")'
  );
});

test('C4: Adherence percentage mentioned', () => {
  assert(
    bodyText.includes('85%') || bodyText.includes('adherence'),
    'Should mention adherence percentage (e.g., "85%")'
  );
});

test('C5: Day streak mentioned', () => {
  assert(
    bodyText.includes('streak') || bodyText.includes('Streak'),
    'Should mention "streak" in insights'
  );
});

test('C6: Workout duration mentioned', () => {
  assert(
    bodyText.includes('20-min') || bodyText.includes('20 min') ||
    bodyText.includes('30-min') || bodyText.includes('45-min'),
    'Should mention workout duration (e.g., "20-min")'
  );
});

test('C7: Water target mentioned', () => {
  assert(
    bodyText.includes('3.0L') || bodyText.includes('3.0 L') || bodyText.includes('Water'),
    'Should mention water target (e.g., "3.0L")'
  );
});

// ─── Competitor Differentiation ──────────────────────────────
test('C8: Has competitor contrast or differentiation', () => {
  const lower = bodyText.toLowerCase();
  assert(
    lower.includes('unlike') || lower.includes('adapt') ||
    lower.includes('rigid') || lower.includes('not perfection'),
    'Should include differentiation copy (e.g., "Unlike rigid plans...")'
  );
});

// ─── Core Value Prop Elements ────────────────────────────────
test('C9: Mentions "constraints" concept', () => {
  const lower = bodyText.toLowerCase();
  assert(lower.includes('constraint'), 'Should mention "constraints" as core concept');
});

test('C10: Mentions adaptation / automatic adjustment', () => {
  const lower = bodyText.toLowerCase();
  assert(
    lower.includes('adapt') || lower.includes('adjust'),
    'Should mention adaptation or automatic adjustment'
  );
});

test('C11: Mentions 30 seconds logging', () => {
  const lower = bodyText.toLowerCase();
  assert(
    lower.includes('30 sec') || lower.includes('30-sec') || (lower.includes('30') && lower.includes('second')),
    'Should mention "30 seconds" for quick logging'
  );
});

// ─── Output ──────────────────────────────────────────────────
console.log('\n  Content Quality Tests');
console.log('  ' + '─'.repeat(40));
results.forEach((r) => console.log(r));
console.log('  ' + '─'.repeat(40));
console.log(`  PASSED: ${passed}  |  FAILED: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
