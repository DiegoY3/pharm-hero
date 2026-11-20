import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import fs from 'node:fs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'js/calculator.js'), 'utf8');
const boxSrc = fs.readFileSync(path.join(ROOT, 'assets/drug-box.js'), 'utf8');
const sandbox = { console, globalThis: {} };
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(boxSrc, sandbox);
vm.runInContext(src, sandbox);
const C = sandbox.PharmCalc || (sandbox.window && sandbox.window.PharmCalc);
if (!C) {
  console.error('PharmCalc was not exported');
  process.exit(1);
}
const drugs = sandbox.window.DRUG_BOX.drugs;

let failed = 0;
let passed = 0;
function nearly(a, b, eps = 1e-9) {
  if (!isFinite(a) || !isFinite(b)) return false;
  const d = Math.abs(a - b);
  return d <= eps || d <= Math.max(Math.abs(a), Math.abs(b)) * eps;
}
function ok(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log('  PASS  ' + name);
  } else {
    failed += 1;
    console.log('  FAIL  ' + name + (detail ? '  — ' + detail : ''));
  }
}

console.log('Drip rate');
const dopa = C.computeDrip({
  dose: 5,
  doseUnit: 'mcg/kg/min',
  weight: 80,
  weightUnit: 'kg',
  volumeMl: 250,
  dripSet: 60,
  onHand: 400,
  onHandUnit: 'mg',
});
ok('dopamine 5 mcg/kg/min, 80 kg, 400 mg/250 mL, 60 gtt = 15 gtts/min',
  dopa.ok && dopa.gtts === 15 && nearly(dopa.gttsExact, 15),
  JSON.stringify({ gtts: dopa.gtts, exact: dopa.gttsExact, err: dopa.error }));
ok('same case is 15 mL/hr', dopa.ok && nearly(dopa.mlHr, 15), String(dopa.mlHr));
ok('concentration is 1.6 mg/mL (1600 mcg/mL)',
  dopa.ok && nearly(dopa.mgPerMl, 1.6) && nearly(dopa.mcgPerMl, 1600),
  dopa.concLabel);

const dopaLb = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 176, weightUnit: 'lb',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('176 lb (÷ 2.2) matches 80 kg', dopaLb.ok && nearly(dopaLb.gttsExact, 15) && nearly(dopaLb.weightKg, 80),
  String(dopaLb.gttsExact));

const dopaMg = C.computeDrip({
  dose: 0.005, doseUnit: 'mg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('0.005 mg/kg/min auto-converts to the same 15 gtts/min',
  dopaMg.ok && nearly(dopaMg.gttsExact, 15), String(dopaMg.gttsExact));

const dopaHr = C.computeDrip({
  dose: 300, doseUnit: 'mcg/kg/hr', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('300 mcg/kg/hr (time = 60 min) is still 15 gtts/min',
  dopaHr.ok && nearly(dopaHr.gttsExact, 15) && dopaHr.timeMin === 60, String(dopaHr.gttsExact));

const dopaMgHr = C.computeDrip({
  dose: 0.3, doseUnit: 'mg/kg/hr', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('0.3 mg/kg/hr is still 15 gtts/min', dopaMgHr.ok && nearly(dopaMgHr.gttsExact, 15), String(dopaMgHr.gttsExact));

const noWt = C.computeDrip({
  dose: 400, doseUnit: 'mcg/min',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('non-weight 400 mcg/min (5×80) is 15 gtts/min and skips weight',
  noWt.ok && nearly(noWt.gttsExact, 15) && noWt.usesWeight === false, String(noWt.gttsExact));

const ten = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 10, onHand: 400, onHandUnit: 'mg',
});
ok('10 gtt set is 2.5 exact, rounds to 3 gtts/min',
  ten.ok && nearly(ten.gttsExact, 2.5) && ten.gtts === 3 && nearly(ten.mlHr, 15),
  JSON.stringify({ exact: ten.gttsExact, gtts: ten.gtts, mlHr: ten.mlHr }));

const onHandMcg = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400000, onHandUnit: 'mcg',
});
ok('400,000 mcg on hand matches 400 mg', onHandMcg.ok && nearly(onHandMcg.gttsExact, 15));

const onHandG = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 0.4, onHandUnit: 'g',
});
ok('0.4 g on hand matches 400 mg', onHandG.ok && nearly(onHandG.gttsExact, 15));

const epi = C.computeDrip({
  dose: 2, doseUnit: 'mcg/min', volumeMl: 250, dripSet: 60, onHand: 1, onHandUnit: 'mg',
});
ok('epi 2 mcg/min, 1 mg in 250 mL, 60 gtt = 30 gtts/min / 30 mL/hr',
  epi.ok && nearly(epi.gttsExact, 30) && nearly(epi.mlHr, 30), String(epi.gttsExact));

const empty = C.computeDrip({ dose: '', doseUnit: 'mcg/kg/min', weight: '', volumeMl: '', dripSet: '60', onHand: '' });
ok('empty fields are incomplete, not a hard error', empty.incomplete === true && empty.ok === false);

const zero = C.computeDrip({
  dose: 0, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('zero dose is rejected', zero.ok === false && /greater than zero/i.test(zero.error || ''), zero.error);

const zeroBag = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 0, onHandUnit: 'mg',
});
ok('zero in the denominator shows nothing, not a hard error',
  zeroBag.ok === false && zeroBag.invalid === true && !zeroBag.error,
  JSON.stringify(zeroBag));

const junk = C.computeDrip({
  dose: 'abc', doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('non-numeric dose is rejected', junk.ok === false);

console.log('Unit conversion');
const mass = C.convertAll('mass', 'mg', 1);
ok('1 mg = 0.001 g = 1000 mcg = 1e6 ng',
  nearly(mass.g, 0.001) && nearly(mass.mcg, 1000) && nearly(mass.ng, 1e6));
const vol = C.convertAll('volume', 'L', 1);
ok('1 L = 1000 mL', nearly(vol.mL, 1000));
const wt = C.convertAll('weight', 'kg', 80);
ok('80 kg = 176 lb (× 2.2)', nearly(wt.lb, 176));
const back = C.convertAll('weight', 'lb', 176);
ok('176 lb = 80 kg (÷ 2.2)', nearly(back.kg, 80));
const time = C.convertAll('time', 'hr', 1);
ok('1 hr = 60 min = 3600 sec', nearly(time.min, 60) && nearly(time.sec, 3600));
const tf = C.convertAll('temp', 'C', 0);
ok('0 °C = 32 °F', nearly(tf.F, 32));
const tc = C.convertAll('temp', 'F', 98.6);
ok('98.6 °F ≈ 37 °C', nearly(tc.C, 37, 1e-9));

console.log('Regular calculator');
function run(keys) {
  let s = C.padState();
  for (const k of keys) s = C.padPress(s, k);
  return s;
}
const add = run(['1', '+', '2', '=']);
ok('1 + 2 = 3', add.cur === '3' || Number(add.cur) === 3, add.cur);
const mul = run(['6', '*', '7', '=']);
ok('6 × 7 = 42', Number(mul.cur) === 42, mul.cur);
const div = run(['1', '0', '0', '/', '8', '=']);
ok('100 ÷ 8 = 12.5', Number(div.cur) === 12.5, div.cur);
const chain = run(['2', '+', '3', '*', '4', '=']);
ok('2 + 3 × 4 (left-to-right) = 20', Number(chain.cur) === 20, chain.cur);
const dec = run(['0', '.', '1', '+', '0', '.', '2', '=']);
ok('0.1 + 0.2 is a clean 0.3', Number(dec.cur) === 0.3, dec.cur);
const clr = run(['9', 'AC']);
ok('AC resets to 0', clr.cur === '0' && clr.acc == null, clr.cur);
const bs = run(['1', '2', '3', 'BS']);
ok('backspace turns 123 into 12', bs.cur === '12', bs.cur);
const pct = run(['5', '0', '%']);
ok('50% = 0.5', Number(pct.cur) === 0.5, pct.cur);
const pctOf = run(['2', '0', '0', '+', '1', '0', '%']);
ok('200 + 10% = 20 (10% of 200)', Number(pctOf.cur) === 20, pctOf.cur);
const zeroDiv = run(['8', '/', '0', '=']);
ok('divide by zero shows Error', zeroDiv.error === true && zeroDiv.cur === 'Error', zeroDiv.cur);

console.log('Formula slots');
const emptyFx = C.formulaSlots({ doseUnit: 'mcg/kg/min', dripSet: '60' });
ok('empty formula keeps gray labels for unfilled slots',
  emptyFx.slots.dose.display === 'Desired dose' && emptyFx.slots.dose.filled === false &&
  emptyFx.slots.weight.display === 'weight (kg)' && emptyFx.slots.volume.display === 'Volume (mL)' &&
  emptyFx.slots.onHand.display === 'drug on hand');
ok('time slot is always filled from the dose unit (1 min)',
  emptyFx.slots.time.filled === true && emptyFx.slots.time.display === '1' && emptyFx.slots.time.value === 1);
ok('default drip set 60 is a filled slot showing 60',
  emptyFx.slots.dripSet.filled === true && emptyFx.slots.dripSet.display === '60');
ok('weight-based formula has 4 numerator slots including weight',
  emptyFx.usesWeight === true && emptyFx.numerator.length === 4 && emptyFx.numerator[1].id === 'weight');

const part = C.formulaSlots({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: '', dripSet: 60, onHand: '', focus: 'dose'
});
ok('typed 5 and 80 light those slots with the plugged-in numbers',
  part.slots.dose.filled && part.slots.dose.display === '5' &&
  part.slots.weight.filled && part.slots.weight.display === '80');
ok('empty volume and on-hand stay labeled and unfilled',
  part.slots.volume.filled === false && part.slots.volume.display === 'Volume (mL)' &&
  part.slots.onHand.filled === false && part.slots.onHand.display === 'drug on hand');
ok('focused input maps to a stronger highlight on its slot',
  part.slots.dose.focus === true && part.slots.weight.focus === false);

const full = C.formulaSlots({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400
});
ok('full dopamine example fills dose, weight, volume, set, on-hand, time',
  full.slots.dose.display === '5' && full.slots.weight.display === '80' &&
  full.slots.volume.display === '250' && full.slots.dripSet.display === '60' &&
  full.slots.onHand.display === '400,000' && full.slots.time.display === '1');
ok('400 mg on hand shows as 400,000 mcg so the line matches the mcg dose',
  nearly(full.slots.onHand.value, 400000) && full.slots.onHand.display === '400,000');
ok('those displayed numbers compute to the 15 gtts/min result',
  nearly((5 * 80 * 250 * 60) / (400000 * 1), 15));

const mgOnHand = C.formulaSlots({
  dose: 0.1, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 1, onHandUnit: 'mg'
});
ok('1 mg on hand shows as 1,000 mcg when the dose is in mcg',
  mgOnHand.slots.onHand.display === '1,000' && nearly(mgOnHand.slots.onHand.value, 1000),
  String(mgOnHand.slots.onHand.display));
ok('0.1 × 80 × 250 × 60 / 1,000 × 1 computes to 120 gtts/min',
  nearly((0.1 * 80 * 250 * 60) / (1000 * 1), 120));

const sameUnit = C.formulaSlots({
  dose: 1, doseUnit: 'mg/min', volumeMl: 100, dripSet: 60, onHand: 100, onHandUnit: 'mg'
});
ok('on hand already in the dose unit stays 100 mg, not converted',
  sameUnit.slots.onHand.display === '100' && nearly(sameUnit.slots.onHand.value, 100));

const lbFx = C.formulaSlots({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 176, weightUnit: 'lb',
  volumeMl: 250, dripSet: 60, onHand: 400
});
ok('176 lb shows as 80 in the weight (kg) slot',
  lbFx.slots.weight.filled && nearly(lbFx.slots.weight.value, 80) && lbFx.slots.weight.display === '80');

const noW = C.formulaSlots({ dose: 400, doseUnit: 'mcg/min', volumeMl: 250, dripSet: 60, onHand: 400 });
ok('non-weight units hide the weight slot and drop it from the numerator',
  noW.usesWeight === false && noW.slots.weight.hidden === true && noW.numerator.length === 3 &&
  noW.numerator.every((s) => s.id !== 'weight'));

const hrFx = C.formulaSlots({ dose: 300, doseUnit: 'mcg/kg/hr' });
ok('per-hour dose unit fills time with 60', hrFx.slots.time.display === '60' && hrFx.timeMin === 60);

console.log('Quick lb → kg');
ok('176 lb ÷ 2.2 = 80 kg, rounded to 2 decimals like ECG Hero',
  C.lbToKg(176).ok && C.lbToKg(176).kg === 80);
ok('175 lb ÷ 2.2 rounds to 79.55 kg', C.lbToKg(175).ok && C.lbToKg(175).kg === 79.55);
ok('empty or junk lb input is not ok', C.lbToKg('').ok === false && C.lbToKg('abc').ok === false);


function recsOf(key) {
  return C.listSpikedBagRecipes(drugs).filter((r) => r.drugKey === key);
}
function rec(key, who, labelPart) {
  return recsOf(key).find((r) => r.who === who && r.label.toLowerCase().includes(labelPart.toLowerCase()));
}


console.log('Editable time and auto reset');
ok('per-minute dose unit auto time is 1 min',
  C.defaultTimeForUnit('mcg/kg/min').value === 1 && C.defaultTimeForUnit('mcg/kg/min').unit === 'min');
ok('per-hour dose unit auto time is 60 min',
  C.defaultTimeForUnit('mg/hr').value === 60);
ok('mg/kg has no auto time so the box can stay blank',
  C.defaultTimeForUnit('mg/kg').value == null);
ok('4 hr parses to 240 min', C.parseTimeToMin(4, 'hr') === 240);
ok('20 min stays 20', C.parseTimeToMin(20, 'min') === 20);
ok('"4 hr" in the time box parses to 240 min', C.parseTimeToMin('4 hr') === 240);

const customTime = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
  timeMin: 20,
});
ok('custom time 20 min divides the same dopamine example by 20',
  customTime.ok && nearly(customTime.gttsExact, 15 / 20) && customTime.timeMin === 20,
  String(customTime.gttsExact));
const customFx = C.formulaSlots({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
  timeMin: 20,
});
ok('time slot shows the typed 20, not the auto 1',
  customFx.slots.time.filled === true && customFx.slots.time.display === '20' && customFx.timeMin === 20);
const blankTimeFx = C.formulaSlots({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
  timeMin: '',
});
ok('cleared time stays a gray empty slot and drops out of the math',
  blankTimeFx.slots.time.filled === false && blankTimeFx.slots.time.display === 'time');
const noTime = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
  timeMin: '',
});
ok('blank time is omitted (treated as 1) and still solves',
  noTime.ok && nearly(noTime.gttsExact, 15) && noTime.timeMin == null, String(noTime.gttsExact));
const zeroTime = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: 250, dripSet: 60, onHand: 400, onHandUnit: 'mg',
  timeMin: 0,
});
ok('zero time in the denominator shows nothing',
  zeroTime.ok === false && zeroTime.invalid === true);

console.log('Blank fields drop out');
const noVol = C.computeDrip({
  dose: 5, doseUnit: 'mcg/kg/min', weight: 80, weightUnit: 'kg',
  volumeMl: '', dripSet: 60, onHand: 400, onHandUnit: 'mg',
});
ok('blank volume drops out and still returns a number',
  noVol.ok && nearly(noVol.gttsExact, 15 / 250), String(noVol.gttsExact));
const onlySet = C.computeDrip({ dose: '', doseUnit: 'mcg/kg/min', weight: '', volumeMl: '', dripSet: '60', onHand: '' });
ok('only a drip set, with no word-problem values, stays incomplete',
  onlySet.ok === false && onlySet.incomplete === true);
const blankSetFx = C.formulaSlots({ dose: 5, doseUnit: 'mcg/kg/min', weight: 80, volumeMl: '', dripSet: '', onHand: '' });
ok('blank drip set stays gray in the equation graphic',
  blankSetFx.slots.dripSet.filled === false && blankSetFx.slots.dripSet.display === 'drip set');

console.log('Word problems');
const wp202 = C.computeDrip({
  dose: 10, doseUnit: 'mcg/kg/min', weight: 145, weightUnit: 'lb',
  volumeMl: 250, dripSet: 60, onHand: 200, onHandUnit: 'mg',
  timeMin: 1,
});
ok('202 dobutamine 10 mcg/kg/min, 145 lb, 200 mg/250 mL, 60 gtt, 1 min ≈ 49.4 gtts/min',
  wp202.ok && wp202.resultUnit === 'gtts/min' && nearly(wp202.gttsExact, 10 * (145 / 2.2) * 250 * 60 / (200000 * 1)) &&
  C.fmtResult(wp202.gttsExact) === '49.4',
  JSON.stringify({ exact: wp202.gttsExact, display: C.fmtResult(wp202.gttsExact), unit: wp202.resultUnit, notes: wp202.notes }));
ok('202 on-hand 200 mg converts to 200,000 mcg',
  nearly(wp202.onHandMcg, 200000), String(wp202.onHandMcg));
const wp202fx = C.formulaSlots({
  dose: 10, doseUnit: 'mcg/kg/min', weight: 145, weightUnit: 'lb',
  volumeMl: 250, dripSet: 60, onHand: 200, onHandUnit: 'mg', timeMin: 1,
});
ok('202 formula shows 200,000 mcg on hand and 65.909... kg from 145 lb',
  wp202fx.slots.onHand.display === '200,000' && nearly(wp202fx.slots.weight.value, 145 / 2.2),
  JSON.stringify({ onHand: wp202fx.slots.onHand.display, kg: wp202fx.slots.weight.value }));

const wp203 = C.computeDrip({
  dose: '', weight: '', volumeMl: 350, dripSet: 20, onHand: '',
  time: 4, timeUnit: 'hr',
});
ok('203 350 mL over 4 hr, 20 gtt, dose/weight/on-hand blank ≈ 29.2 gtts/min',
  wp203.ok && wp203.resultUnit === 'gtts/min' && nearly(wp203.gttsExact, 350 * 20 / 240) &&
  wp203.timeMin === 240 && C.fmtResult(wp203.gttsExact) === '29.2',
  JSON.stringify({ exact: wp203.gttsExact, display: C.fmtResult(wp203.gttsExact), unit: wp203.resultUnit, time: wp203.timeMin }));
const wp203min = C.computeDrip({
  volumeMl: 350, dripSet: 20, timeMin: 240,
});
ok('203 also works when time is entered as 240 min',
  wp203min.ok && nearly(wp203min.gttsExact, 29.1666666667) && wp203min.resultUnit === 'gtts/min');
const wp203fx = C.formulaSlots({
  volumeMl: 350, dripSet: 20, time: 4, timeUnit: 'hr', dose: '', weight: '', onHand: '',
});
ok('203 equation lights volume, set, and 240 min; dose, weight, on-hand stay gray',
  wp203fx.slots.volume.display === '350' && wp203fx.slots.dripSet.display === '20' &&
  wp203fx.slots.time.display === '240' && wp203fx.slots.dose.filled === false &&
  wp203fx.slots.weight.filled === false && wp203fx.slots.onHand.filled === false);

const wp204 = C.computeDrip({
  dose: 0.3, doseUnit: 'mg/kg', weight: 175, weightUnit: 'lb',
});
ok('204 etomidate 0.3 mg/kg, 175 lb, only dose × weight ≈ 23.9 mg',
  wp204.ok && wp204.resultUnit === 'mg' && nearly(wp204.value, 0.3 * (175 / 2.2)) &&
  C.fmtResult(wp204.value) === '23.9',
  JSON.stringify({ exact: wp204.value, display: C.fmtResult(wp204.value), unit: wp204.resultUnit }));
ok('204 is not labeled gtts/min', wp204.resultUnit === 'mg' && wp204.mlHr == null);
const wp204fx = C.formulaSlots({
  dose: 0.3, doseUnit: 'mg/kg', weight: 175, weightUnit: 'lb',
  volumeMl: '', dripSet: '', onHand: '', timeMin: '',
});
ok('204 equation lights dose and weight (79.545... kg); volume, set, on-hand, time stay gray',
  wp204fx.slots.dose.display === '0.3' && wp204fx.slots.weight.filled &&
  nearly(wp204fx.slots.weight.value, 175 / 2.2) && wp204fx.slots.volume.filled === false &&
  wp204fx.slots.dripSet.filled === false && wp204fx.slots.onHand.filled === false &&
  wp204fx.slots.time.filled === false);

console.log('Spiked Bag catalog');
const recipes = C.listSpikedBagRecipes(drugs);
const keys = [...new Set(recipes.map((r) => r.drugKey))];
ok('reads live Drug Box infusion lines only', recipes.length === 22 && keys.length === 10, JSON.stringify({ n: recipes.length, keys }));
ok('includes module drugs and norepinephrine as EXTRA',
  keys.includes('epinephrine') && keys.includes('dopamine') && recipes.some((r) => r.drugKey === 'norepinephrine' && r.extra === true));
ok('excludes calcium chloride push and dextrose D10 fluid drip',
  !keys.includes('calciumchloride') && !keys.includes('calcium') && !keys.includes('dextrose'));
ok('does not invent a pediatric epinephrine drip',
  recsOf('epinephrine').every((r) => r.who === 'Adult'));

const txa = recsOf('tranexamicacid')[0];
ok('TXA 1-2gm/100ml is a range, not 2 g only',
  txa && txa.mix && txa.mix.rangeAmount && txa.mix.amount === 1 && txa.mix.amountMax === 2 && txa.mix.amountUnit === 'g' && txa.mix.volume === 100,
  JSON.stringify(txa && txa.mix));

const magVf = rec('magnesium', 'Adult', 'VFib');
ok('magnesium 1-2g diluted in 50ml stays a range',
  magVf && magVf.mix.rangeAmount && magVf.mix.amount === 1 && magVf.mix.amountMax === 2 && magVf.mix.volume === 50,
  JSON.stringify(magVf && magVf.mix));

const magPeds = rec('magnesium', 'Pediatric', 'VFib');
ok('peds magnesium 25-50 mg/kg diluted in 50ml plus max 2 g',
  magPeds && magPeds.mix.rangeAmount && magPeds.mix.amountPerKg && magPeds.mix.amount === 25 && magPeds.mix.amountMax === 50 &&
  magPeds.mix.volume === 50 && magPeds.mix.maxAmount === 2 && magPeds.mix.maxAmountUnit === 'g',
  JSON.stringify(magPeds && magPeds.mix));

console.log('Amount to add — Drug Box only, never scaled');
const epiRosc = rec('epinephrine', 'Adult', 'ROSC');
const add250 = C.amountToAdd(epiRosc, 250);
ok('epi ROSC 1 mg in 250 mL returns 1 mg when volume matches',
  add250.ok && add250.amount === 1 && add250.unit === 'mg' && !add250.manual, JSON.stringify(add250));
const add500 = C.amountToAdd(epiRosc, 500);
ok('epi ROSC at 500 mL is manual and is not scaled to 2 mg',
  add500.manual && add500.amount == null && /does not match/i.test(add500.note), JSON.stringify(add500));

const amioPulse = rec('amiodarone', 'Adult', 'VTach with a pulse');
ok('amiodarone 150 mg in 50-100 mL accepts 50 and 100, same 150 mg, no scaling',
  C.amountToAdd(amioPulse, 50).ok && C.amountToAdd(amioPulse, 50).amount === 150 &&
  C.amountToAdd(amioPulse, 100).ok && C.amountToAdd(amioPulse, 100).amount === 150 &&
  C.amountToAdd(amioPulse, 75).ok && C.amountToAdd(amioPulse, 75).amount === 150);
ok('amiodarone 150 mg mix rejects 250 mL',
  C.amountToAdd(amioPulse, 250).manual && C.amountToAdd(amioPulse, 250).amount == null);

const dopaAd = rec('dopamine', 'Adult', 'Infusion');
ok('dopamine mix is 400 mg in 500 mL D5W when the volume matches',
  C.amountToAdd(dopaAd, 500).ok && C.amountToAdd(dopaAd, 500).amount === 400 && C.amountToAdd(dopaAd, 500).unit === 'mg');
ok('dopamine 400 mg/500 mL is not scaled to a 250 mL bag',
  C.amountToAdd(dopaAd, 250).manual && C.amountToAdd(dopaAd, 250).amount == null && /does not match/i.test(C.amountToAdd(dopaAd, 250).note));

const dilt = rec('diltiazem', 'Adult', 'Maintenance');
ok('diltiazem mix is 100 mg in 100 mL when the volume matches',
  C.amountToAdd(dilt, 100).ok && C.amountToAdd(dilt, 100).amount === 100 && C.amountToAdd(dilt, 100).unit === 'mg');

const norepiAd = rec('norepinephrine', 'Adult', 'Hypotension');
ok('norepinephrine mix is 4 mg in 250 mL when the volume matches',
  C.amountToAdd(norepiAd, 250).ok && C.amountToAdd(norepiAd, 250).amount === 4 && C.amountToAdd(norepiAd, 250).unit === 'mg');
ok('norepinephrine 4 mg/250 mL is not scaled to a 500 mL bag',
  C.amountToAdd(norepiAd, 500).manual && C.amountToAdd(norepiAd, 500).amount == null);

const txa2 = rec('tranexamicacid', 'Adult', 'If transport delayed');
ok('TXA second dose is 1 g in 100 mL over 8 hr (480 min)',
  txa2 && txa2.mix && txa2.mix.amount === 1 && txa2.mix.amountUnit === 'g' && txa2.mix.volume === 100 &&
  txa2.over && txa2.over.exact === 480 && C.amountToAdd(txa2, 100).ok && C.amountToAdd(txa2, 100).amount === 1,
  JSON.stringify(txa2 && { mix: txa2.mix, over: txa2.over }));

const amioPedsKg = rec('amiodarone', 'Pediatric', 'VTach with a pulse');
ok('peds amiodarone 5 mg/kg in 100 mL needs weight, then 5×20=100 mg',
  !C.amountToAdd(amioPedsKg, 100).ok && /weight/i.test(C.amountToAdd(amioPedsKg, 100).note) &&
  C.amountToAdd(amioPedsKg, 100, 20).ok && C.amountToAdd(amioPedsKg, 100, 20).amount === 100);
ok('peds amiodarone is not scaled when the bag is 250 mL',
  C.amountToAdd(amioPedsKg, 250, 20).manual && C.amountToAdd(amioPedsKg, 250, 20).amount == null);

const magRangeAdd = C.amountToAdd(magPeds, 50, 20);
ok('25-50 mg/kg range is left manual even with weight',
  magRangeAdd.manual && magRangeAdd.amount == null && /25–50 mg\/kg/.test(magRangeAdd.note), magRangeAdd.note);

console.log('Dose prefill and age bands');
const amioMaint = rec('amiodarone', 'Adult', 'Maintenance');
const preAmio = C.dosePrefill(amioMaint);
ok('amiodarone maintenance prefills the exact 1 mg/min from Drug Box',
  preAmio.fill && preAmio.value === 1 && preAmio.unit === 'mg/min');

const glu = recsOf('glucagon').find((r) => r.who === 'Adult' && r.rate && r.rate.exact === 3);
const preGlu = C.dosePrefill(glu);
ok('glucagon prefills the exact 3 mg/hr from Drug Box',
  glu && preGlu.fill && preGlu.value === 3 && preGlu.unit === 'mg/hr', JSON.stringify(preGlu));

const preDopa = C.dosePrefill(dopaAd);
ok('dopamine range is a hint; typically starts 5 is a chip, not an auto-filled dose',
  !preDopa.fill && preDopa.typical && preDopa.typical.value === 5 && /5–20/.test(preDopa.hint));

ok('no infusion line in the current Drug Box has an age cutoff',
  recipes.every((r) => !r.ageBand));
ok('whoFromAge returns null when Drug Box has no cutoff',
  C.whoFromAge(8, recsOf('dopamine')) == null && C.whoFromAge(40, recsOf('epinephrine')) == null);
ok('parseAgeBand reads a cutoff only when the line actually has one',
  C.parseAgeBand('2-20 mcg/kg/min, titrated to age-specific BP') == null &&
  C.parseAgeBand('Pediatric <12yo: 5 mg/kg in 100ml over 20 min') &&
  C.parseAgeBand('Pediatric <12yo: 5 mg/kg in 100ml over 20 min').maxYears === 12 &&
  C.parseAgeBand('Pediatric <12yo: 5 mg/kg in 100ml over 20 min').maxInclusive === false);

const fake = [
  { who: 'Pediatric', ageBand: C.parseAgeBand('Pediatric <12yo: x') },
  { who: 'Adult', ageBand: C.parseAgeBand('Adult ≥12yo: x') },
];
ok('whoFromAge uses a numeric band only when it is present on the recipe',
  C.whoFromAge(8, fake) === 'Pediatric' && C.whoFromAge(12, fake) === 'Adult' && C.whoFromAge(40, fake) === 'Adult');

const gluMix = C.amountToAdd(glu, 250);
ok('glucagon infusion stays manual — mix still not in Drug Box',
  gluMix.manual && /mix not in Drug Box/i.test(gluMix.note));
const amioPedsMaint = rec('amiodarone', 'Pediatric', 'Maintenance');
ok('amiodarone pediatric maintenance stays manual — no AHA recommendation in Drug Box',
  amioPedsMaint && amioPedsMaint.noRecommendation && C.amountToAdd(amioPedsMaint, 100).manual);

console.log('Timed bag and volume-rate math');
const timed = C.computeTimedInfusion({ volumeMl: 50, dripSet: 60, timeMin: 10, onHand: 2, onHandUnit: 'g' });
ok('magnesium 2 g in 50 mL over 10 min, 60 gtt = 300 gtts/min and 300 mL/hr',
  timed.ok && timed.gtts === 300 && nearly(timed.gttsExact, 300) && nearly(timed.mlHr, 300), JSON.stringify(timed));
ok('same bag concentration is 40 mg/mL',
  timed.ok && nearly(timed.mgPerMl, 40) && /40 mg\/mL/.test(timed.concLabel), timed.concLabel);

const bicarb = C.computeVolumeRate({ mlPerMin: 1, dripSet: 60, volumeMl: 250, onHand: 50, onHandUnit: 'mEq' });
ok('bicarb 50 mEq in 250 mL at 1 mL/min, 60 gtt = 60 gtts/min and 60 mL/hr',
  bicarb.ok && bicarb.gtts === 60 && nearly(bicarb.mlHr, 60));
ok('bicarb concentration is 0.2 mEq/mL, not a invented mass conversion',
  /0\.2 mEq\/mL/.test(bicarb.concLabel), bicarb.concLabel);

const timedFx = C.formulaSlots({ formulaMode: 'timed', volumeMl: 50, dripSet: 60, timeMin: 10, onHand: 2 });
ok('timed formula highlights volume × drip set / time and hides dose',
  timedFx.formulaMode === 'timed' && timedFx.numerator.map((s) => s.id).join() === 'volume,dripSet' &&
  timedFx.denominator.map((s) => s.id).join() === 'time' && timedFx.slots.dose.hidden && timedFx.slots.time.display === '10');


console.log('Spiked Bag is standalone');
ok('250 mL is a preset bag size and 75 mL is a custom size',
  C.isPresetBagVolume(250) && C.parseBagVolume('75') === 75 && C.isPresetBagVolume(75) === false);
ok('custom bag size rejects blanks and zero',
  C.parseBagVolume('') == null && C.parseBagVolume(0) == null && C.parseBagVolume('abc') == null);

const master202 = {
  dose: 10, doseUnit: 'mcg/kg/min', weight: 145, weightUnit: 'lb',
  volumeMl: 250, dripSet: 60, onHand: 200, onHandUnit: 'mg', timeMin: 1,
};
const beforeMaster = C.computeDrip(master202);
const frozenMaster = JSON.stringify(master202);
const spikeEpi = C.computeSpikedBag({
  recipe: epiRosc, volumeMl: 250, weight: 80, weightUnit: 'kg',
  dripSet: 60, dose: 0.1, doseUnit: 'mcg/kg/min',
});
const afterMaster = C.computeDrip(master202);
ok('Master Equation 202 result is unchanged after a Spiked Bag calculation',
  beforeMaster.ok && afterMaster.ok && nearly(beforeMaster.gttsExact, afterMaster.gttsExact) &&
  C.fmtResult(beforeMaster.gttsExact) === '49.4' && JSON.stringify(master202) === frozenMaster,
  JSON.stringify({ before: beforeMaster.gttsExact, after: afterMaster.gttsExact }));
ok('Spiked Bag does not report touching Master Equation fields', spikeEpi.masterTouched === false);
ok('epi ROSC at the 250 mL Drug Box volume adds 1 mg and has its own rate',
  spikeEpi.amount.ok && spikeEpi.amount.amount === 1 && spikeEpi.amount.unit === 'mg' &&
  spikeEpi.rate && spikeEpi.rate.ok && nearly(spikeEpi.rate.gttsExact, 120),
  JSON.stringify({ amount: spikeEpi.amount, rate: spikeEpi.rate && { gtts: spikeEpi.rate.gttsExact, unit: spikeEpi.rate.resultUnit } }));
ok('Master Equation 202 stays 49.4 gtts/min, not the epi 120 gtts/min rate',
  C.fmtResult(beforeMaster.gttsExact) === '49.4' && C.fmtResult(spikeEpi.rate.gttsExact) === '120');

const amio150 = recsOf('amiodarone').find((r) => r.who === 'Adult' && r.mix && r.mix.amount === 150);
ok('found adult amiodarone 150 mg mix for a custom bag test', !!amio150, String(amio150 && amio150.label));
const custom75 = C.computeSpikedBag({ recipe: amio150, volumeMl: 75, dripSet: 60 });
ok('custom 75 mL bag is accepted for the 50–100 mL amiodarone mix and adds 150 mg',
  custom75.amount.ok && custom75.amount.amount === 150 && custom75.volumeMl === 75 && custom75.customVolume === true,
  JSON.stringify(custom75.amount));
const custom400 = C.computeSpikedBag({ recipe: epiRosc, volumeMl: 400, dripSet: 60, dose: 0.1, doseUnit: 'mcg/kg/min', weight: 80 });
ok('custom 400 mL epi bag stays manual because it does not match the 250 mL Drug Box mix',
  custom400.customVolume === true && custom400.amount.manual === true && /does not match/i.test(custom400.amount.note || ''),
  custom400.amount.note);
ok('a Master Equation object passed beside a custom bag is not mutated',
  JSON.stringify(master202) === frozenMaster);


console.log('Master Equation drug picker');
const masterEntries = C.listMasterDrugEntries(drugs);
const masterGroups = C.groupMasterDrugs(masterEntries, drugs);
const boxKeys = Object.keys(drugs);
ok('picker source lists every Drug Box drug, including drugs with no infusion mix',
  masterGroups.length === boxKeys.length &&
  boxKeys.every((k) => masterGroups.some((g) => g.drugKey === k)) &&
  masterGroups.some((g) => g.drugKey === 'etomidate') &&
  masterGroups.some((g) => g.drugKey === 'aspirin'));
ok('Dobutamine is not in drug-box.js, so the picker cannot invent or select it',
  drugs.dobutamine == null && !masterGroups.some((g) => g.drugKey === 'dobutamine' || /dobutamine/i.test(g.name || '')));

function masterOf(key, who, pred) {
  const g = masterGroups.find((x) => x.drugKey === key);
  return (g && g.recipes || []).find((r) => (!who || r.who === who) && (!pred || pred(r)));
}

const dopaAdult = masterOf('dopamine', 'Adult', (r) => r.dose && r.dose.unit === 'mcg/kg/min');
const dopaPre = C.masterPrefill(dopaAdult);
ok('dopamine adult is a range: dose stays blank, unit and mix load from dosage[2]',
  dopaAdult && dopaAdult.field === 'drugs.dopamine.dosage[2].t (Adult)' &&
  dopaPre.dose == null && dopaPre.doseUnit === 'mcg/kg/min' &&
  dopaPre.doseHint === 'Drug Box: 5–20 mcg/kg/min (typically starts 5)' &&
  dopaPre.onHand === 400 && dopaPre.onHandUnit === 'mg' && dopaPre.volumeMl === 500 &&
  dopaPre.mixHint === 'Drug Box: 400 mg in 500 mL D5W' &&
  dopaPre.loadedFields.join() === 'doseUnit,onHand,onHandUnit,volume',
  JSON.stringify(dopaPre));
ok('typically starts 5 is hint only — not filled as the desired dose',
  dopaAdult.dose.typical === 5 && dopaPre.dose == null && /typically starts 5/.test(dopaPre.doseHint));

const amioMaintMaster = masterOf('amiodarone', 'Adult', (r) => /maintenance infusion/i.test(r.label) || /maintenance infusion/i.test(r.text));
const amioPre = C.masterPrefill(amioMaintMaster);
ok('amiodarone adult maintenance loads the single 1 mg/min dose and 100 mg in 100 mL mix from dosage[2]',
  amioMaintMaster && amioMaintMaster.field === 'drugs.amiodarone.dosage[2].t (Adult)' &&
  amioPre.dose === 1 && amioPre.doseUnit === 'mg/min' && amioPre.doseHint === '' &&
  amioPre.onHand === 100 && amioPre.onHandUnit === 'mg' && amioPre.volumeMl === 100 &&
  amioPre.mixHint === 'Drug Box: 100 mg in 100 mL D5W' &&
  amioPre.loadedFields.indexOf('dose') !== -1,
  JSON.stringify(amioPre));

const etom = masterOf('etomidate', 'Adult');
const etomPre = C.masterPrefill(etom);
ok('etomidate loads the single 0.3 mg/kg bolus from dosage[0]; no mix is invented',
  etom && etom.field === 'drugs.etomidate.dosage[0].t (Adult)' &&
  etomPre.dose === 0.3 && etomPre.doseUnit === 'mg/kg' &&
  etomPre.onHand == null && etomPre.volumeMl == null && etomPre.mixHint === '');

const epiRoscMaster = masterOf('epinephrine', 'Adult', (r) => /ROSC/i.test(r.text));
const epiPre = C.masterPrefill(epiRoscMaster);
ok('epi ROSC range stays blank with a 0.1–0.5 hint and loads 1 mg in 250 mL NS from dosage[1]',
  epiRoscMaster && epiRoscMaster.field === 'drugs.epinephrine.dosage[1].t (Adult)' &&
  epiPre.dose == null && epiPre.doseUnit === 'mcg/kg/min' &&
  epiPre.doseHint === 'Drug Box: 0.1–0.5 mcg/kg/min' &&
  epiPre.onHand === 1 && epiPre.volumeMl === 250,
  JSON.stringify(epiPre));

const adenoAdult = masterOf('adenosine', 'Adult', (r) => /6 mg/.test(r.text));
ok('adenosine 6 mg then 12 mg is not treated as a single dose',
  adenoAdult && C.parseMasterDose(adenoAdult.text).multiple === true && C.masterPrefill(adenoAdult).dose == null);

const loadedDopa = C.applyMasterDrugChange({ weight: 145, weightUnit: 'lb', dripSet: 60 }, dopaPre);
ok('loading dopamine fills unit and mix, leaves dose blank, keeps weight and drip set, auto time is 1 min',
  loadedDopa.dose === '' && loadedDopa.doseUnit === 'mcg/kg/min' &&
  loadedDopa.onHand === 400 && loadedDopa.volumeMl === 500 &&
  loadedDopa.weight === 145 && loadedDopa.weightUnit === 'lb' && loadedDopa.dripSet === 60 &&
  loadedDopa.time === 1 && loadedDopa.timeUnit === 'min' && loadedDopa.spikeUntouched === true,
  JSON.stringify(loadedDopa));

const overridden = Object.assign({}, loadedDopa, { dose: 10, volumeMl: 250, onHand: 200, onHandUnit: 'mg' });
const masterWp202 = C.computeDrip({
  dose: overridden.dose, doseUnit: overridden.doseUnit, weight: overridden.weight, weightUnit: overridden.weightUnit,
  volumeMl: overridden.volumeMl, dripSet: overridden.dripSet, onHand: overridden.onHand, onHandUnit: overridden.onHandUnit,
  timeMin: 1,
});
ok('word problem 202 override (200 mg/250 mL, dose 10) is kept and solves to 49.4 gtts/min',
  masterWp202.ok && C.fmtResult(masterWp202.gttsExact) === '49.4' && masterWp202.resultUnit === 'gtts/min');
ok('override hides Loaded tags on volume and on-hand, but the Drug Box mix hint remains',
  C.masterLoadedTagVisible('volume', 250, null, loadedDopa.loadedValues) === false &&
  C.masterLoadedTagVisible('onHand', 200, 'mg', loadedDopa.loadedValues) === false &&
  C.masterLoadedTagVisible('volume', 500, null, loadedDopa.loadedValues) === true &&
  C.masterLoadedTagVisible('onHand', 400, 'mg', loadedDopa.loadedValues) === true &&
  loadedDopa.hints.mix === 'Drug Box: 400 mg in 500 mL D5W');
ok('range-dose field was not autofilled, so typing 10 is a user value and has no Loaded tag',
  C.masterLoadedTagVisible('dose', 10, 'mcg/kg/min', loadedDopa.loadedValues) === false &&
  loadedDopa.loaded.dose === false);

const clearedDrug = C.applyMasterDrugChange(overridden, null);
ok('clearing the drug resets autofilled fields only — weight and drip set stay',
  clearedDrug.dose === '' && clearedDrug.volumeMl === '' && clearedDrug.onHand === '' &&
  clearedDrug.doseUnit === 'mcg/kg/min' && clearedDrug.onHandUnit === 'mg' &&
  clearedDrug.weight === 145 && clearedDrug.weightUnit === 'lb' && clearedDrug.dripSet === 60 &&
  clearedDrug.hints.dose === '' && clearedDrug.loaded.volume === false,
  JSON.stringify(clearedDrug));

const switched = C.applyMasterDrugChange(overridden, amioPre);
ok('changing the drug resets prior autofill/overrides and loads the new Drug Box values, keeping weight and drip set',
  switched.dose === 1 && switched.doseUnit === 'mg/min' &&
  switched.onHand === 100 && switched.volumeMl === 100 &&
  switched.weight === 145 && switched.dripSet === 60 &&
  C.masterLoadedTagVisible('dose', 1, 'mg/min', switched.loadedValues) === true);

const beforeSpikeObj = { dose: 10, doseUnit: 'mcg/kg/min', weight: 145, weightUnit: 'lb', volumeMl: 250, dripSet: 60, onHand: 200, onHandUnit: 'mg', timeMin: 1 };
const frozenBefore = JSON.stringify(beforeSpikeObj);
const afterLoad = C.applyMasterDrugChange({ weight: 80, weightUnit: 'kg', dripSet: 60 }, dopaPre);
const spikeAfterLoad = C.computeSpikedBag({
  recipe: epiRosc, volumeMl: 250, weight: 80, weightUnit: 'kg', dripSet: 60, dose: 0.1, doseUnit: 'mcg/kg/min',
});
ok('applying a Master Equation drug prefill does not mutate a Spiked Bag input object or 202 problem',
  afterLoad.spikeUntouched === true && JSON.stringify(beforeSpikeObj) === frozenBefore);
ok('Spiked Bag still computes its own epi ROSC rate after a Master Equation prefill',
  spikeAfterLoad.masterTouched === false && spikeAfterLoad.amount && spikeAfterLoad.amount.ok &&
  spikeAfterLoad.amount.amount === 1 && spikeAfterLoad.rate && C.fmtResult(spikeAfterLoad.rate.gttsExact) === '120');
ok('Master Equation 202 override stays 49.4 and is not the Spiked Bag 120 gtts/min',
  C.fmtResult(masterWp202.gttsExact) === '49.4' && C.fmtResult(spikeAfterLoad.rate.gttsExact) === '120');


console.log('Calculator tab panel structure');
const pageHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function panelAncestors(html, id) {
  const re = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>/g;
  const voidTags = new Set(['input','img','br','hr','meta','link','source','area','col','embed','wbr']);
  const stack = [];
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const raw = m[0];
    if (raw.startsWith('</')) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack.splice(i); break; }
      }
      continue;
    }
    const self = /\/\s*>$/.test(raw) || voidTags.has(tag);
    const idM = raw.match(/\sid=(["'])([^"']+)\1/i);
    const classM = raw.match(/\sclass=(["'])([^"']*)\1/i);
    const el = { tag, id: idM ? idM[2] : '', className: classM ? classM[2] : '' };
    if (el.id === id) return stack.map((s) => s.id || s.className.split(/\s+/)[0] || s.tag);
    if (!self) stack.push(el);
  }
  return null;
}
const dripParents = panelAncestors(pageHtml, 'calc-panel-drip');
const convertParents = panelAncestors(pageHtml, 'calc-panel-convert');
const calcParents = panelAncestors(pageHtml, 'calc-panel-calc');
ok('found the three calculator tab panels in index.html', !!(dripParents && convertParents && calcParents));
ok('Convert is a sibling of Master Equation, not nested inside it',
  convertParents && convertParents.indexOf('calc-panel-drip') === -1,
  JSON.stringify(convertParents));
ok('Calculator (keypad) is a sibling of Master Equation, not nested inside it',
  calcParents && calcParents.indexOf('calc-panel-drip') === -1,
  JSON.stringify(calcParents));
ok('all three panels are under .calc-panels so hiding one cannot hide the others',
  dripParents && convertParents && calcParents &&
  dripParents.indexOf('calc-panels') !== -1 &&
  convertParents.indexOf('calc-panels') !== -1 &&
  calcParents.indexOf('calc-panels') !== -1 &&
  convertParents.join('>') === dripParents.join('>') &&
  calcParents.join('>') === dripParents.join('>'),
  JSON.stringify({ dripParents, convertParents, calcParents }));

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed) process.exit(1);
