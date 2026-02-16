/**
 * ConsistAI — Minimal Test Runner
 * Runs all test files and reports results.
 * No external test framework — uses Node.js assert.
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'test-html-structure.js',
  'test-content-quality.js',
  'test-accessibility.js',
  'test-styles.js',
];

let totalPassed = 0;
let totalFailed = 0;
let totalErrors = [];

console.log('\n╔══════════════════════════════════════════╗');
console.log('║     ConsistAI Test Suite                 ║');
console.log('╚══════════════════════════════════════════╝\n');

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  console.log(`\n▸ Running: ${file}`);
  console.log('─'.repeat(44));

  try {
    const output = execSync(`node "${filePath}"`, {
      encoding: 'utf-8',
      timeout: 30000,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    console.log(output);

    // Parse pass/fail counts from output
    const passMatch = output.match(/PASSED:\s*(\d+)/);
    const failMatch = output.match(/FAILED:\s*(\d+)/);
    if (passMatch) totalPassed += parseInt(passMatch[1], 10);
    if (failMatch) totalFailed += parseInt(failMatch[1], 10);
  } catch (err) {
    console.log(err.stdout || '');
    console.error(err.stderr || '');

    const passMatch = (err.stdout || '').match(/PASSED:\s*(\d+)/);
    const failMatch = (err.stdout || '').match(/FAILED:\s*(\d+)/);
    if (passMatch) totalPassed += parseInt(passMatch[1], 10);
    if (failMatch) {
      totalFailed += parseInt(failMatch[1], 10);
    } else {
      totalFailed += 1;
    }
    totalErrors.push(file);
  }
}

console.log('\n╔══════════════════════════════════════════╗');
console.log(`║  TOTAL  PASSED: ${String(totalPassed).padStart(3)}                      ║`);
console.log(`║  TOTAL  FAILED: ${String(totalFailed).padStart(3)}                      ║`);
console.log('╚══════════════════════════════════════════╝');

if (totalErrors.length > 0) {
  console.log(`\n⚠  Files with errors: ${totalErrors.join(', ')}`);
}

process.exit(totalFailed > 0 ? 1 : 0);
