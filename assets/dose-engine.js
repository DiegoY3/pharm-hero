// Scenario-mode dose logic. Reads dosage lines from window.DRUG_BOX (drug-box.js, Druggy-owned) — no doses are hard-coded here
// except the DuoNeb split for ipratropium (the guideline line lists albuterol/atrovent together).
(function(){
const U = { mcg:0.001, mg:1, g:1000, gm:1000 };
const NUM = '(\\d+(?:\\.\\d+)?)';
const UNIT = '(mcg|mg|gm|g|mEq|ml|mL)';
const TOK = new RegExp(NUM + '\\s*(?:' + UNIT + '\\s*)?(?:-\\s*' + NUM + ')?\\s*' + UNIT + '(?![a-zA-Z])((?:\\/kg)?(?:\\/min|\\/hr)?)', 'g');
function dim(u, rate){ u = u.toLowerCase(); const d = (u in U) ? 'mass' : (u==='meq' ? 'meq' : 'vol'); return d + (rate ? rate : ''); }
function toBase(v, u){ u = u.toLowerCase(); return (u in U) ? v*U[u] : v; }        // mass -> mg, mEq/ml as-is
function context(t){ t = t.replace(/\([^)]*\)/g, ' ').replace(/\s+/g,' ');
  let m = t.match(/^([^:]{2,80}):\s/), c = m ? m[1].trim() : ((t.match(/^([A-Za-z][A-Za-z\/ ]{1,40}?)\s+\d/)||[])[1]||'').trim();
  return /^(1st|adult|adults only|adult only|pediatric|d)$/i.test(c) ? '' : c; }
// Parse one guideline dosage line into { ctx, dim, perKg, lo, hi, alts[], cap, capPerKg, unitLabel }
function parse(t, drugKey){
  let s = t.replace(/\([^)]*\)/g, ' ');
  const ctx = context(t);
  const toks = []; let m; TOK.lastIndex = 0;
  while ((m = TOK.exec(s))){
    const pre = s.slice(Math.max(0, m.index-12), m.index);
    const lo = +m[1], hi = m[3] ? +m[3] : lo, unit = m[4], tail = m[5] || '';
    toks.push({ lo, hi, unit, perKg:/\/kg/.test(tail), rate:(tail.match(/\/(min|hr)/)||[])[0]||'', isMax:/max(imum)?\s*(initial|single|total)?\s*(dose)?\s*(of)?\s*$/i.test(pre),
      diluent:/(\bin|with|\/)\s*$/i.test(pre) || /^\s*\//.test(s.slice(m.index+m[0].length, m.index+m[0].length+1)) && false });
  }
  if (drugKey==='ipratropium'){ const d = t.match(/\(([\d.]+)\s*mg\/([\d.]+)\s*mg\)/); if (d) return { ctx, dim:'mass', unit:'mg', perKg:false, alts:[[+d[2], +d[2]]], cap:null, line:t }; }
  const doses = toks.filter(x=>!x.isMax && !x.diluent); if (!doses.length) return null;
  const d0 = dim(doses[0].unit, doses[0].rate);
  const use = doses.filter(x=>dim(x.unit, x.rate)===d0);
  const caps = toks.filter(x=>x.isMax && dim(x.unit, x.rate)===d0);
  return { ctx, dim:d0, unit:doses[0].unit + (doses[0].perKg ? '/kg' : '') + doses[0].rate, perKg:doses[0].perKg,
    alts: use.map(x=>[toBase(x.lo,x.unit)*(x.perKg?1:1), toBase(x.hi,x.unit)].map(v=>v)), perKgEach: use.map(x=>x.perKg),
    cap: caps.length ? { v: toBase(caps[0].hi, caps[0].unit), perKg: caps[0].perKg } : null, line:t };
}
// expected [lo,hi] ranges (base units: mg | mEq | ml, rate suffix kept in dim) for a patient weight
function expected(p, kg){
  if (!p) return null;
  const capV = p.cap ? (p.cap.perKg ? p.cap.v*kg : p.cap.v) : Infinity;
  return p.alts.map((a,i)=>{ const k = (p.perKgEach ? p.perKgEach[i] : p.perKg) ? kg : 1; let lo=a[0]*k, hi=a[1]*k; return [Math.min(lo,capV), Math.min(hi,capV)]; });
}
const ENTRY_UNITS = ['mg','mcg','g','mEq','mL','mcg/min','mg/min','mcg/kg/min','mg/hr'];
function entryToBase(v, unit, kg){
  const m = unit.match(/^(mcg|mg|g|mEq|mL)((?:\/kg)?)((?:\/min|\/hr)?)$/); if (!m) return null;
  let x = toBase(v, m[1]); if (m[2]) x *= kg; return { v:x, dim: dim(m[1], m[3]) };
}
function check(p, kg, v, unit){
  const ex = expected(p, kg); if (!ex) return { ok:true, gradeable:false };
  const e = entryToBase(v, unit, kg); if (!e || !isFinite(v) || v<=0) return { ok:false, why:'Enter a dose', ex };
  if (e.dim !== p.dim) return { ok:false, why:'Wrong unit type for this line (expected '+fmtDim(p.dim)+')', ex };
  const hit = ex.some(([lo,hi])=> e.v >= lo*0.95 - 0.011 && e.v <= hi*1.05 + 0.011);
  return { ok:hit, ex, given:e.v, why: hit ? '' : 'Outside the guideline range for '+kg+' kg' };
}
function fmtDim(d){ return { mass:'mg/mcg/g', meq:'mEq', vol:'mL', 'mass/min':'mcg/min or mg/min', 'mass/hr':'mg/hr', 'meq/min':'mEq/min', 'vol/min':'mL/min' }[d] || d; }
function fmtMass(mg){ if (mg < 1) return +(mg*1000).toFixed(1) + ' mcg'; if (mg >= 1000) return +(mg/1000).toFixed(2) + ' g'; return +mg.toFixed(2) + ' mg'; }
function fmtRange(p, ex){ if (!ex) return ''; const f = v=> p.dim.startsWith('mass') ? fmtMass(v) : (+v.toFixed(2) + (p.dim.startsWith('meq')?' mEq':' mL'));
  const r = p.dim.includes('/') ? p.dim.slice(p.dim.indexOf('/')) : '';
  return ex.map(([lo,hi])=> (Math.abs(lo-hi)<1e-9 ? f(lo) : f(lo)+' – '+f(hi)) + r).join(' or '); }
// Indication relevance: which dosing line context fits this patient's scenario text?
const CTX = [
  [/cardiac arrest|w\/o pulse|vfib|pulseless/i, (t,hr)=>hr===0 || /cardiac arrest|pulseless/i.test(t)],
  [/w\/ pulse|with a pulse|tdp with pulse/i, (t,hr)=>hr>0 && /ventricular|vtach|v-tach|torsades|tdp|wide|pre-excited|wpw/i.test(t)],
  [/bradycardia/i, t=>/brady|av block|heart block|junctional/i.test(t)],
  [/anaphyla|severe reactions|asthma/i, t=>/anaphyla|allerg|hives|urticaria|angioedema|asthma|wheez/i.test(t)],
  [/croup/i, t=>/croup/i.test(t)],
  [/eclamp/i, t=>/eclamp/i.test(t)],
  [/bronchospasm|asthmaticus/i, t=>/asthma|bronchospasm|wheez/i.test(t)],
  [/cholinergic|organophosphate/i, t=>/organophos|pesticide|nerve agent|sludge|cholinergic|insecticide/i.test(t)],
  [/hypoglycemia w\/o iv/i, t=>/no iv|without iv|iv access (unobtain|failed)|unable to (obtain|establish) iv/i.test(t)],
  [/beta\/ca blocker|choking/i, t=>/overdose|blocker|metoprolol|propranolol|atenolol|diltiazem|verapamil|amlodipine|steakhouse|choking/i.test(t)],
  [/\bami\b|chest pain/i, t=>/stemi|chest|acs|infarct/i.test(t)],
  [/pulmonary edema|chf/i, t=>/chf|edema|crackles|rales/i.test(t)],
  [/burns/i, t=>/burn/i.test(t)], [/isolated injury/i, t=>/fracture|injur|trauma/i.test(t)],
  [/rsi/i, t=>/\brsi\b|intubat/i.test(t)], [/pain management/i, t=>/pain/i.test(t)],
  [/behavioral|seizure/i, t=>/seiz|agitat|combative|delirium/i.test(t)],
];
const NEG = /maintenance|io numbing|repeat|continuous eclamptic/i;
function relevance(p, text, hr, kg){ if (!p || !p.ctx) return 0; let s = 0;
  const wg = p.ctx.match(/(≥|>=|>|<=|<)\s*(\d+)\s*kg/i); if (wg && kg){ const n=+wg[2], ok = wg[1].startsWith('<') ? kg < n : kg >= n; return ok ? 2 : -3; }
  for (const [re, f] of CTX) if (re.test(p.ctx)) s += f(text, hr) ? 2 : -1;
  if (NEG.test(p.ctx) && !(/eclamp/i.test(p.ctx) && /eclamp/i.test(text))) s -= 1;
  return s; }
// lines for a drug, for this patient's age group
function lines(drug, age){
  const who = age < 18 ? 'Pediatric' : 'Adult';
  let L = (drug.dosage||[]).filter(d=>d.who===who); if (!L.length) L = drug.dosage||[];
  return L.map(d=>({ t:d.t, p:null }));
}
window.DoseEngine = { parse, expected, check, relevance, lines, fmtRange, ENTRY_UNITS, fmtDim };
})();
