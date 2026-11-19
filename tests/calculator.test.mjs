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
ok('zero drug on hand is rejected', zeroBag.ok === false && /greater than zero/i.test(zeroBag.error || ''), zeroBag.error);

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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed) process.exit(1);
