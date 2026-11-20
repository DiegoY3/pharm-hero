import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { Module } from 'node:module';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [
  path.join(ROOT, 'node_modules', 'jsdom'),
  path.join(ROOT, 'tests', 'node_modules', 'jsdom'),
  '/tmp/jsdom-root/node_modules/jsdom',
];
const jsdomPath = candidates.find((p) => fs.existsSync(path.join(p, 'package.json')));
if (!jsdomPath) {
  console.error('jsdom is required for calculator-dom.test.mjs (looked in ' + candidates.join(', ') + ')');
  process.exit(1);
}
const require = createRequire(path.join(jsdomPath, 'package.json'));
const { JSDOM } = require(jsdomPath);

let failed = 0;
let passed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log('  PASS  ' + name);
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (detail ? '  — ' + detail : ''));
  }
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '');
const dom = new JSDOM(html, {
  url: 'http://127.0.0.1/pharm-hero/',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});
const { window } = dom;
const { document } = window;
window.localStorage.setItem('pharmhero.unlocked.v1', '1');

function loadScript(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const script = document.createElement('script');
  script.textContent = src;
  document.body.appendChild(script);
  // JSDOM outside-only does not eval appended classic scripts automatically in all versions.
  // Run in the window context instead.
  window.eval(src);
}

loadScript('assets/drug-box.js');
loadScript('js/calculator.js');
if (document.readyState === 'loading') {
  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
}

const C = window.PharmCalc;
ok('PharmCalc booted against the page DOM', !!(C && C.showTab && C.open && C.press && C.setConvCat));

C.open();
C.showTab('drip');
const drip = document.getElementById('calc-panel-drip');
const conv = document.getElementById('calc-panel-convert');
const calc = document.getElementById('calc-panel-calc');
ok('panels exist', !!(drip && conv && calc));
ok('Convert and Calculator are not descendants of the Master Equation panel',
  drip && conv && calc && !drip.contains(conv) && !drip.contains(calc));

C.showTab('convert');
ok('switching to Convert hides only the Master Equation panel',
  drip.hidden === true && conv.hidden === false && calc.hidden === true &&
  document.getElementById('calc-tab-convert').classList.contains('on') &&
  document.getElementById('calc-tab-drip').classList.contains('on') === false);
ok('Convert stays visible after the drip panel is hidden, because it is not inside it',
  conv.hidden === false && drip.contains(conv) === false);

const mg = document.getElementById('conv-mg');
const g = document.getElementById('conv-g');
const mcg = document.getElementById('conv-mcg');
ok('converter rendered mass rows (mg, g, mcg)', !!(mg && g && mcg));
if (mg) {
  mg.value = '1000';
  mg.dispatchEvent(new window.Event('input', { bubbles: true }));
}
ok('typing 1000 mg fills 1 g and 1,000,000 mcg',
  g && g.value === '1' && mcg && (mcg.value === '1,000,000' || mcg.value === '1000000'),
  JSON.stringify({ g: g && g.value, mcg: mcg && mcg.value }));

C.setConvCat('weight');
const lb = document.getElementById('conv-lb');
const kg = document.getElementById('conv-kg');
ok('weight category shows lb and kg fields', !!(lb && kg));
if (lb) {
  lb.value = '176';
  lb.dispatchEvent(new window.Event('input', { bubbles: true }));
}
ok('176 lb converts to 80 kg',
  kg && (kg.value === '80' || Number(String(kg.value).replace(/,/g, '')) === 80),
  kg && kg.value);

C.showTab('calc');
ok('switching to Calculator shows the keypad panel and hides Convert',
  calc.hidden === false && conv.hidden === true && drip.hidden === true &&
  document.getElementById('calc-tab-calc').classList.contains('on'));

function tapKey(k) {
  const btn = document.querySelector('#pad-keys button[data-k="' + k + '"]');
  if (!btn) throw new Error('missing key ' + k);
  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}
tapKey('1');
tapKey('+');
tapKey('2');
tapKey('=');
const padVal = (document.getElementById('pad-val') || {}).textContent;
ok('tapping 1 + 2 = on the keypad shows 3', padVal === '3', String(padVal));

C.press('AC');
ok('AC clears the keypad display to 0', (document.getElementById('pad-val') || {}).textContent === '0');

C.showTab('drip');
ok('switching back to Master Equation hides Convert and Calculator',
  drip.hidden === false && conv.hidden === true && calc.hidden === true);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed) process.exit(1);
