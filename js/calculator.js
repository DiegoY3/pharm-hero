/* Pharm Hero calculator: drip-rate master formula, unit conversion, and a basic keypad.
   Self-contained. Works offline. Does not touch drug data. */
(function (root) {
  var LB_PER_KG = 2.2;
  var MASS_TO_MCG = { g: 1e6, mg: 1e3, mcg: 1, ug: 1, ng: 0.001 };
  var DOSE_UNITS = {
    'mcg/kg/min': { mass: 'mcg', weight: true, timeMin: 1 },
    'mg/kg/min':  { mass: 'mg',  weight: true, timeMin: 1 },
    'mcg/kg/hr':  { mass: 'mcg', weight: true, timeMin: 60 },
    'mg/kg/hr':   { mass: 'mg',  weight: true, timeMin: 60 },
    'mcg/min':    { mass: 'mcg', weight: false, timeMin: 1 },
    'mg/min':     { mass: 'mg',  weight: false, timeMin: 1 },
    'mcg/hr':     { mass: 'mcg', weight: false, timeMin: 60 },
    'mg/hr':      { mass: 'mg',  weight: false, timeMin: 60 }
  };

  function isBlank(v) {
    return v == null || String(v).trim() === '';
  }
  function parseNum(v) {
    if (isBlank(v)) return null;
    var n = Number(String(v).trim().replace(/,/g, ''));
    return isFinite(n) ? n : NaN;
  }
  function massToMcg(value, unit) {
    var f = MASS_TO_MCG[unit];
    if (!f) return NaN;
    return value * f;
  }
  function mcgToMass(mcg, unit) {
    var f = MASS_TO_MCG[unit];
    if (!f) return NaN;
    return mcg / f;
  }
  function toKg(value, unit) {
    if (unit === 'lb') return value / LB_PER_KG;
    return value;
  }
  function fmt(n, maxFrac) {
    if (n == null || !isFinite(n)) return '—';
    var d = maxFrac == null ? 8 : maxFrac;
    var cleaned = Number(Number(n).toPrecision(12));
    if (Object.is(cleaned, -0)) cleaned = 0;
    var s = cleaned.toFixed(d);
    if (s.indexOf('.') !== -1) s = s.replace(/\.?0+$/, '');
    if (s === '-0') s = '0';
    return s;
  }
  function fmtComma(n, maxFrac) {
    var s = fmt(n, maxFrac);
    if (s === '—') return s;
    var sign = '';
    if (s.charAt(0) === '-') { sign = '-'; s = s.slice(1); }
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return sign + parts.join('.');
  }
  function fmtSmart(n) {
    if (n == null || !isFinite(n)) return '—';
    var a = Math.abs(n);
    if (a !== 0 && (a >= 1e10 || a < 1e-7)) return String(Number(n.toPrecision(6)));
    return fmtComma(n, a >= 1 ? 8 : 10);
  }

  function computeDrip(input) {
    var unit = DOSE_UNITS[input.doseUnit];
    if (!unit) return { ok: false, error: 'Pick a dose unit.' };

    var missing = [];
    if (isBlank(input.dose)) missing.push('desired dose');
    if (unit.weight && isBlank(input.weight)) missing.push('weight');
    if (isBlank(input.volumeMl)) missing.push('volume');
    if (isBlank(input.dripSet)) missing.push('drip set');
    if (isBlank(input.onHand)) missing.push('drug on hand');
    if (missing.length) {
      return { ok: false, incomplete: true, error: 'Enter the ' + missing.join(', ') + '.' };
    }

    var dose = parseNum(input.dose);
    var weight = unit.weight ? parseNum(input.weight) : 1;
    var volumeMl = parseNum(input.volumeMl);
    var dripSet = parseNum(input.dripSet);
    var onHand = parseNum(input.onHand);
    if ([dose, weight, volumeMl, dripSet, onHand].some(function (n) { return !isFinite(n); })) {
      return { ok: false, error: 'Use numbers only.' };
    }
    if (dose <= 0) return { ok: false, error: 'Desired dose must be greater than zero.' };
    if (unit.weight && weight <= 0) return { ok: false, error: 'Weight must be greater than zero.' };
    if (volumeMl <= 0) return { ok: false, error: 'Volume must be greater than zero.' };
    if (dripSet <= 0) return { ok: false, error: 'Drip set must be greater than zero.' };
    if (onHand <= 0) return { ok: false, error: 'Drug on hand must be greater than zero.' };

    var timeMin = unit.timeMin;
    var weightKg = unit.weight ? toKg(weight, input.weightUnit || 'kg') : null;
    var doseMcg = massToMcg(dose, unit.mass);
    var onHandMcg = massToMcg(onHand, input.onHandUnit || 'mg');
    if (!isFinite(doseMcg) || !isFinite(onHandMcg)) {
      return { ok: false, error: 'That unit is not supported.' };
    }

    var weightFactor = unit.weight ? weightKg : 1;
    var gttsExact = (doseMcg * weightFactor * volumeMl * dripSet) / (onHandMcg * timeMin);
    if (!isFinite(gttsExact)) return { ok: false, error: 'Could not calculate that combination.' };

    var gtts = Math.round(gttsExact);
    var mlHr = (gttsExact / dripSet) * 60;
    var mcgPerMl = onHandMcg / volumeMl;
    var mgPerMl = mcgPerMl / 1000;
    var concLabel;
    if (mgPerMl >= 0.1) concLabel = fmtComma(mgPerMl, 6) + ' mg/mL  (' + fmtComma(mcgPerMl, 4) + ' mcg/mL)';
    else concLabel = fmtComma(mcgPerMl, 6) + ' mcg/mL';

    var doseSame = doseMcg;
    var onHandSame = onHandMcg;
    var sameUnit = 'mcg';
    if (unit.mass === 'mg' && input.onHandUnit === 'mg') {
      doseSame = mcgToMass(doseMcg, 'mg');
      onHandSame = mcgToMass(onHandMcg, 'mg');
      sameUnit = 'mg';
    } else if (unit.mass === 'mcg' && (input.onHandUnit === 'mcg' || onHandMcg < 1000)) {
      sameUnit = 'mcg';
    }

    var notes = [];
    notes.push('Time is ' + timeMin + ' min because the dose is per ' + (timeMin === 1 ? 'minute' : 'hour') + '.');
    if (unit.weight && input.weightUnit === 'lb') {
      notes.push(fmtComma(weight, 6) + ' lb ÷ 2.2 = ' + fmtComma(weightKg, 6) + ' kg.');
    }
    var origUnit = input.onHandUnit || 'mg';
    if (origUnit !== sameUnit) {
      notes.push(fmtComma(onHand, 6) + ' ' + origUnit + ' = ' + fmtComma(onHandSame, 6) + ' ' + sameUnit + ' so it matches the dose unit.');
    } else if (unit.mass !== origUnit) {
      notes.push('Dose and drug on hand are both in ' + sameUnit + ' before dividing.');
    }

    var numParts = [fmtComma(doseSame, 8)];
    if (unit.weight) numParts.push(fmtComma(weightKg, 6));
    numParts.push(fmtComma(volumeMl, 6), fmtComma(dripSet, 6));
    var denParts = [fmtComma(onHandSame, 8), fmtComma(timeMin, 4)];

    return {
      ok: true,
      gtts: gtts,
      gttsExact: gttsExact,
      mlHr: mlHr,
      mcgPerMl: mcgPerMl,
      mgPerMl: mgPerMl,
      concLabel: concLabel,
      timeMin: timeMin,
      weightKg: weightKg,
      usesWeight: unit.weight,
      doseMcg: doseMcg,
      onHandMcg: onHandMcg,
      sameUnit: sameUnit,
      notes: notes,
      numerator: numParts.join(' × '),
      denominator: denParts.join(' × '),
      formula: unit.weight
        ? 'gtts/min = (Desired dose × weight (kg) × Volume (mL) × drip set) / (drug on hand × time)'
        : 'gtts/min = (Desired dose × Volume (mL) × drip set) / (drug on hand × time)'
    };
  }

  var CONV = {
    mass: {
      units: [['g', 'g'], ['mg', 'mg'], ['mcg', 'mcg'], ['ng', 'ng']],
      toBase: { g: 1, mg: 1e-3, mcg: 1e-6, ng: 1e-9 }
    },
    volume: {
      units: [['L', 'L'], ['mL', 'mL']],
      toBase: { L: 1, mL: 1e-3 }
    },
    weight: {
      units: [['kg', 'kg'], ['lb', 'lb']],
      toBase: { kg: 1, lb: 1 / LB_PER_KG }
    },
    time: {
      units: [['hr', 'hr'], ['min', 'min'], ['sec', 'sec']],
      toBase: { hr: 3600, min: 60, sec: 1 }
    }
  };

  function convertAll(category, fromUnit, value) {
    if (category === 'temp') {
      if (!isFinite(value)) return { C: NaN, F: NaN };
      if (fromUnit === 'C') return { C: value, F: value * 9 / 5 + 32 };
      if (fromUnit === 'F') return { F: value, C: (value - 32) * 5 / 9 };
      return { C: NaN, F: NaN };
    }
    var cat = CONV[category];
    if (!cat || !cat.toBase[fromUnit] || !isFinite(value)) return null;
    var base = value * cat.toBase[fromUnit];
    var out = {};
    Object.keys(cat.toBase).forEach(function (u) { out[u] = base / cat.toBase[u]; });
    return out;
  }

  function cleanCalcNum(n) {
    if (!isFinite(n)) return n;
    var r = Number(n.toPrecision(12));
    if (Object.is(r, -0)) return 0;
    return r;
  }
  function padState() {
    return { acc: null, op: null, cur: '0', fresh: true, expr: '', error: false };
  }
  function padDisplay(cur) {
    if (cur === 'Error') return 'Error';
    if (cur.indexOf('e') !== -1 || cur.indexOf('E') !== -1) return cur;
    var neg = cur.charAt(0) === '-';
    var s = neg ? cur.slice(1) : cur;
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + parts.join('.');
  }
  function padApply(a, op, b) {
    var x = a;
    var y = b;
    var r;
    if (op === '+') r = x + y;
    else if (op === '-') r = x - y;
    else if (op === '*') r = x * y;
    else if (op === '/') r = y === 0 ? NaN : x / y;
    else r = y;
    return cleanCalcNum(r);
  }
  function padPress(state, key) {
    var s = {
      acc: state.acc,
      op: state.op,
      cur: state.cur,
      fresh: state.fresh,
      expr: state.expr,
      error: state.error
    };
    if (s.error && key !== 'AC' && key !== 'BS') {
      if (/^[0-9.]$/.test(key)) {
        s.error = false;
        s.acc = null;
        s.op = null;
        s.cur = '0';
        s.fresh = true;
        s.expr = '';
      } else {
        return s;
      }
    }
    if (key === 'AC') return padState();
    if (key === 'BS') {
      if (s.fresh || s.cur === 'Error') return s;
      var next = s.cur.length <= 1 || s.cur === '-0' || (s.cur.charAt(0) === '-' && s.cur.length === 2)
        ? '0'
        : s.cur.slice(0, -1);
      if (next === '-') next = '0';
      s.cur = next;
      return s;
    }
    if (key === '%') {
      var n = parseFloat(s.cur);
      if (!isFinite(n)) return s;
      if (s.op && s.acc != null && (s.op === '+' || s.op === '-')) n = s.acc * (n / 100);
      else n = n / 100;
      s.cur = String(cleanCalcNum(n));
      s.fresh = true;
      return s;
    }
    if (key === '.') {
      if (s.fresh) { s.cur = '0.'; s.fresh = false; return s; }
      if (s.cur.indexOf('.') === -1) s.cur += '.';
      return s;
    }
    if (/^[0-9]$/.test(key)) {
      if (s.fresh || s.cur === '0') { s.cur = key; s.fresh = false; }
      else if (s.cur === '-0') { s.cur = '-' + key; s.fresh = false; }
      else if (s.cur.length < 16) s.cur += key;
      return s;
    }
    if (key === '+' || key === '-' || key === '*' || key === '/' || key === '=') {
      var curN = parseFloat(s.cur);
      if (!isFinite(curN) && s.cur !== 'Error') return s;
      if (s.op && !s.fresh) {
        var r = padApply(s.acc, s.op, curN);
        if (!isFinite(r)) {
          s.cur = 'Error';
          s.acc = null;
          s.op = null;
          s.fresh = true;
          s.expr = '';
          s.error = true;
          return s;
        }
        s.acc = r;
        s.cur = String(r);
      } else if (s.acc == null) {
        s.acc = curN;
      }
      if (key === '=') {
        s.expr = '';
        s.op = null;
        s.fresh = true;
      } else {
        s.op = key;
        s.fresh = true;
        var sym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[key];
        s.expr = fmtSmart(s.acc) + ' ' + sym;
      }
      return s;
    }
    return s;
  }


  var SLOT_LABELS = {
    dose: 'Desired dose',
    weight: 'weight (kg)',
    volume: 'Volume (mL)',
    dripSet: 'drip set',
    onHand: 'drug on hand',
    time: 'time'
  };


  function alignOnHandToDoseUnit(onHand, onHandUnit, doseUnit) {
    var unit = DOSE_UNITS[doseUnit];
    if (!unit) return null;
    var n = parseNum(onHand);
    if (n == null || !isFinite(n)) return null;
    var mcg = massToMcg(n, onHandUnit || 'mg');
    if (!isFinite(mcg)) return null;
    var value = mcgToMass(mcg, unit.mass);
    if (!isFinite(value)) return null;
    return { value: value, unit: unit.mass };
  }

  function formulaSlots(input) {
    var unit = DOSE_UNITS[input && input.doseUnit] || DOSE_UNITS['mcg/kg/min'];
    var usesWeight = !!unit.weight;
    var focus = (input && input.focus) || null;
    var timeMin = unit.timeMin;
    var formulaMode = (input && input.formulaMode) || 'master';

    function rawSlot(id, raw, displayOverride, valueOverride) {
      var n = parseNum(raw);
      var filled = n != null && isFinite(n);
      return {
        id: id,
        label: SLOT_LABELS[id],
        filled: filled,
        value: filled ? (valueOverride != null ? valueOverride : n) : null,
        display: filled ? (displayOverride != null ? displayOverride : fmtComma(n, 8)) : SLOT_LABELS[id],
        focus: focus === id,
        hidden: false
      };
    }

    var dose = rawSlot('dose', input && input.dose);
    var weight;
    if (!usesWeight) {
      weight = {
        id: 'weight',
        label: SLOT_LABELS.weight,
        filled: false,
        value: null,
        display: SLOT_LABELS.weight,
        focus: false,
        hidden: true
      };
    } else {
      var w = parseNum(input && input.weight);
      var filledW = w != null && isFinite(w);
      var kgVal = filledW ? toKg(w, (input && input.weightUnit) || 'kg') : null;
      weight = {
        id: 'weight',
        label: SLOT_LABELS.weight,
        filled: filledW,
        value: kgVal,
        display: filledW ? fmtComma(kgVal, 6) : SLOT_LABELS.weight,
        focus: focus === 'weight',
        hidden: false
      };
    }
    var volume = rawSlot('volume', input && input.volumeMl);
    var dripSet = rawSlot('dripSet', input && input.dripSet);
    var onHandAligned = alignOnHandToDoseUnit(input && input.onHand, (input && input.onHandUnit) || 'mg', input && input.doseUnit);
    var onHand = onHandAligned
      ? rawSlot('onHand', input && input.onHand, fmtComma(onHandAligned.value, 8), onHandAligned.value)
      : rawSlot('onHand', input && input.onHand);
    var time;
    if (formulaMode === 'timed' || (input && input.timeMode === 'infusion')) {
      time = rawSlot('time', input && input.timeMin);
      timeMin = time.value;
    } else if (formulaMode === 'volumeRate') {
      time = rawSlot('time', '');
      time.hidden = true;
      time.filled = false;
      timeMin = null;
    } else {
      time = {
        id: 'time',
        label: SLOT_LABELS.time,
        filled: true,
        value: timeMin,
        display: String(timeMin),
        focus: focus === 'time',
        hidden: false
      };
    }
    var numerator;
    var denominator;
    if (formulaMode === 'timed') {
      usesWeight = false;
      weight.hidden = true;
      dose.hidden = true;
      onHand.hidden = true;
      numerator = [volume, dripSet];
      denominator = [time];
    } else if (formulaMode === 'volumeRate') {
      usesWeight = false;
      weight.hidden = true;
      onHand.hidden = true;
      var ml = parseNum(input && input.mlPerMin);
      var filledR = ml != null && isFinite(ml);
      dose = {
        id: 'dose',
        label: 'mL/min',
        filled: filledR,
        value: filledR ? ml : null,
        display: filledR ? fmtComma(ml, 6) : 'mL/min',
        focus: focus === 'dose',
        hidden: false
      };
      numerator = [dose, dripSet];
      denominator = [];
    } else {
      numerator = usesWeight ? [dose, weight, volume, dripSet] : [dose, volume, dripSet];
      denominator = [onHand, time];
    }
    return {
      usesWeight: usesWeight,
      timeMin: timeMin,
      formulaMode: formulaMode,
      numerator: numerator,
      denominator: denominator,
      slots: { dose: dose, weight: weight, volume: volume, dripSet: dripSet, onHand: onHand, time: time }
    };
  }

  function lbToKg(lb) {
    var n = parseNum(lb);
    if (n == null || !isFinite(n)) return { ok: false, kg: null };
    return { ok: true, kg: Math.round((n / LB_PER_KG) * 100) / 100 };
  }

  var SPIKED_RATE_UNITS = ['mcg/kg/min','mg/kg/min','mcg/kg/hr','mg/kg/hr','mcg/min','mg/min','mcg/hr','mg/hr'];
  var MASS_UNIT_NORM = { ug: 'mcg', µg: 'mcg', mcg: 'mcg', mg: 'mg', g: 'g', gm: 'g', meq: 'mEq', mEq: 'mEq' };
  var MASS_UNIT_RE = 'mcg|ug|µg|mg|gm|g|mEq|meq';
  var BAG_VOLUMES = [50, 100, 250, 500, 1000];

  function normMassUnit(u) {
    if (!u) return null;
    var k = String(u).replace(/\s+/g, '');
    var lower = k.toLowerCase();
    if (lower === 'meq') return 'mEq';
    return MASS_UNIT_NORM[lower] || MASS_UNIT_NORM[k] || lower;
  }
  function fieldPath(drugKey, who, index) {
    return 'drugs.' + drugKey + '.dosage[' + index + '].t (' + who + ')';
  }
  function looksLikeNebOrOral(text) {
    return /via\s+neb|nebulizer|duoneb|\bodt\b|\bpo\b|\bsl\b|tablet|ng\/og|as tolerated/i.test(text);
  }
  function looksLikeInfusion(text) {
    if (/no current aha recommendations/i.test(text) && /maintenance|infusion/i.test(text)) return true;
    if (looksLikeNebOrOral(text)) return false;
    if (/\bD50W\b|\bD10\b|\bD25W\b|\bD10W\b/i.test(text) && !/\b(mcg|mg)\s*\//i.test(text)) return false;
    if (/\bat\s+\d+\s*mg\s*\/\s*min\b/i.test(text) && !/\b(drip|infusion|in\s+\d+\s*ml|\/\s*\d+\s*ml)\b/i.test(text)) return false;
    if (/(mcg|mg)\s*\/\s*kg\s*\/\s*(min|hr)|(mcg|mg)\s*\/\s*(min|hr)/i.test(text)) return true;
    if (/\b(infusion|infuse|drip)\b/i.test(text)) return true;
    if (/\b1\s*ml\s*\/\s*min\b/i.test(text)) return true;
    if (/\bin\s+\d+(\s*-\s*\d+)?\s*ml\b/i.test(text) && /\bover\s+\d+/i.test(text)) return true;
    if (/\bdiluted in\s+\d+\s*ml\b/i.test(text) && /\bover\s+\d+/i.test(text)) return true;
    if (/\d+\s*(mcg|mg|g|gm|meq)\s*\/\s*\d+\s*ml/i.test(text) && /\b(drip|infusion|over\s+\d+|mcg\/min|mcg\/kg\/min|mg\/min|mg\/hr|ml\/min)\b/i.test(text)) return true;
    return false;
  }
  function skipFillerLine(text) {
    if (/^iv use only$/i.test(text.trim())) return true;
    if (/^iv\/io infusion only/i.test(text.trim())) return true;
    if (/^adjust to clinical response/i.test(text.trim())) return true;
    if (/no iv push/i.test(text) && !/(mcg|mg)\//i.test(text)) return true;
    return false;
  }
  function parseRangeOrValue(text, beforeUnit) {
    var re = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(?:-|–|to)\\s*(\\d+(?:\\.\\d+)?)\\s*' + beforeUnit, 'i');
    var m = text.match(re);
    if (m) return { min: parseFloat(m[1]), max: parseFloat(m[2]), exact: null };
    re = new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + beforeUnit, 'i');
    m = text.match(re);
    if (m) return { min: parseFloat(m[1]), max: parseFloat(m[1]), exact: parseFloat(m[1]) };
    return null;
  }
  function parseDoseRate(text) {
    var typical = null;
    var typ = text.match(/typically starts\s+(\d+(?:\.\d+)?)\s*(mcg\/kg\/min|mg\/kg\/min|mcg\/kg\/hr|mg\/kg\/hr|mcg\/min|mg\/min|mcg\/hr|mg\/hr)/i);
    if (typ) typical = { value: parseFloat(typ[1]), unit: typ[2].toLowerCase() };
    var i, unit, found = null;
    for (i = 0; i < SPIKED_RATE_UNITS.length; i++) {
      unit = SPIKED_RATE_UNITS[i];
      var esc = unit.replace(/\//g, '\\/');
      var r = parseRangeOrValue(text, esc);
      if (r) {
        found = { unit: unit, min: r.min, max: r.max, exact: r.exact, typical: null };
        break;
      }
    }
    if (found && typical && typical.unit === found.unit) found.typical = typical.value;
    else if (!found && typical) found = { unit: typical.unit, min: typical.value, max: typical.value, exact: null, typical: typical.value };
    var mlmin = text.match(/\b(\d+(?:\.\d+)?)\s*ml\s*\/\s*min\b/i);
    if (mlmin) {
      found = found || {};
      found.mlPerMin = parseFloat(mlmin[1]);
    }
    return found;
  }
  function parseOverMinutes(text) {
    var m = text.match(/\bover\s+(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(min|minute|minutes|hr|hrs|hour|hours)\b/i);
    if (m) {
      var a = parseFloat(m[1]), b = parseFloat(m[2]);
      if (/^hr/i.test(m[3])) { a *= 60; b *= 60; }
      return { min: a, max: b, exact: a === b ? a : null, range: a !== b };
    }
    m = text.match(/\bover\s+(\d+(?:\.\d+)?)\s*(min|minute|minutes|hr|hrs|hour|hours)\b/i);
    if (m) {
      var t = parseFloat(m[1]);
      if (/^hr/i.test(m[2])) t *= 60;
      return { min: t, max: t, exact: t, range: false };
    }
    return null;
  }
  function attachMixMax(out, text) {
    var mx = text.match(/\bmax(?:imum)?\s+(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\b/i);
    if (mx) {
      out.maxAmount = parseFloat(mx[1]);
      out.maxAmountUnit = normMassUnit(mx[2]);
    }
    return out;
  }
  function parseMix(text) {
    var out = {
      amount: null, amountMax: null, amountUnit: null, amountPerKg: false,
      volume: null, volumeMax: null, fluid: null, rangeAmount: false, rangeVolume: false,
      maxAmount: null, maxAmountUnit: null
    };
    var fluid = text.match(/\b(NS\/D5W|D5W\/NS|NSS|D5W|NS)\b/i);
    if (fluid) out.fluid = fluid[1].replace(/NSS/i, 'NS');
    attachMixMax(out, text);

    var m;
    m = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\s*\/\s*kg\s+(?:diluted\s+in|in)\s*(\d+(?:\.\d+)?)\s*ml/i);
    if (m) {
      out.amount = parseFloat(m[1]); out.amountMax = parseFloat(m[2]); out.amountUnit = normMassUnit(m[3]);
      out.amountPerKg = true; out.rangeAmount = true;
      out.volume = parseFloat(m[4]);
      return out;
    }
    m = text.match(/(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\s*\/\s*kg\s+(?:diluted\s+in|in)\s*(\d+(?:\.\d+)?)\s*ml/i);
    if (m) {
      out.amount = parseFloat(m[1]); out.amountUnit = normMassUnit(m[2]); out.amountPerKg = true;
      out.volume = parseFloat(m[3]);
      return out;
    }
    m = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\s*(?:\/|diluted\s+in|in)\s*(\d+(?:\.\d+)?)\s*ml/i);
    if (m) {
      out.amount = parseFloat(m[1]); out.amountMax = parseFloat(m[2]); out.amountUnit = normMassUnit(m[3]);
      out.volume = parseFloat(m[4]); out.rangeAmount = out.amount !== out.amountMax;
      return out;
    }
    m = text.match(/(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\s+in\s+(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*ml/i);
    if (m) {
      out.amount = parseFloat(m[1]); out.amountUnit = normMassUnit(m[2]);
      out.volume = parseFloat(m[3]); out.volumeMax = parseFloat(m[4]); out.rangeVolume = out.volume !== out.volumeMax;
      return out;
    }
    m = text.match(/(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\s*(?:diluted\s+in|in)\s*(\d+(?:\.\d+)?)\s*ml/i);
    if (m) {
      out.amount = parseFloat(m[1]); out.amountUnit = normMassUnit(m[2]);
      out.volume = parseFloat(m[3]);
      return out;
    }
    m = text.match(/(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\s*\/\s*(\d+(?:\.\d+)?)\s*ml/i);
    if (m) {
      out.amount = parseFloat(m[1]); out.amountUnit = normMassUnit(m[2]);
      out.volume = parseFloat(m[3]);
      return out;
    }
    return out.amount || out.volume ? out : null;
  }
  function parseAgeBand(text) {
    if (!text) return null;
    if (/age-specific/i.test(text) && !/\b(?:years?|yo|yrs?)\b/i.test(text)) return null;
    var m = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yo|yrs?)\b/i);
    if (m) return { minYears: parseFloat(m[1]), maxYears: parseFloat(m[2]), maxInclusive: true, text: m[0] };
    m = text.match(/(?:≥|>=|at least|older than|over)\s*(\d+(?:\.\d+)?)\s*(?:years?|yo|yrs?)\b/i);
    if (m) return { minYears: parseFloat(m[1]), maxYears: null, minInclusive: !/older than|over/i.test(m[0]), text: m[0] };
    m = text.match(/(?:≤|<=|<|under|younger than|less than)\s*(\d+(?:\.\d+)?)\s*(?:years?|yo|yrs?)\b/i);
    if (m) {
      var inclusive = /≤|<=/.test(m[0]);
      return { minYears: null, maxYears: parseFloat(m[1]), maxInclusive: inclusive, text: m[0] };
    }
    return null;
  }
  function ageInBand(ageYears, band) {
    if (!band) return false;
    var age = Number(ageYears);
    if (!isFinite(age) || age < 0) return false;
    if (band.minYears != null) {
      if (band.minInclusive === false && age <= band.minYears) return false;
      if (band.minInclusive !== false && age < band.minYears) return false;
    }
    if (band.maxYears != null) {
      if (band.maxInclusive === false && age >= band.maxYears) return false;
      if (band.maxInclusive !== false && age > band.maxYears) return false;
    }
    return true;
  }
  function whoFromAge(ageYears, recipes) {
    var age = Number(ageYears);
    if (!isFinite(age) || age < 0 || !recipes || !recipes.length) return null;
    var withBand = recipes.filter(function (r) { return r.ageBand; });
    if (!withBand.length) return null;
    var hits = [];
    withBand.forEach(function (r) {
      if (ageInBand(age, r.ageBand) && hits.indexOf(r.who) === -1) hits.push(r.who);
    });
    return hits.length === 1 ? hits[0] : null;
  }
  function indicationLabel(text) {
    var m = text.match(/^\s*([^:]{2,48}):/);
    if (m) {
      var lab = m[1].replace(/\(1mg\/250ml D5W Drip\)/i, '').replace(/\(1:10,000\)|\(1:1,000\)/g, '').trim();
      lab = lab.replace(/\s+/g, ' ');
      if (lab && !/^adult$/i.test(lab)) return lab;
    }
    if (/maintenance infusion/i.test(text)) return 'Maintenance infusion';
    if (/maintenance/i.test(text) && /mg\/hr|mg\/min/i.test(text)) return 'Maintenance';
    if (/then infuse/i.test(text)) return 'Infusion after bolus';
    if (/crush injury/i.test(text)) return 'Crush injury maintenance';
    if (/no current aha/i.test(text)) return 'Maintenance infusion';
    return 'Infusion';
  }
  function recipeGaps(rec) {
    var gaps = [];
    if (rec.noRecommendation) gaps.push('no dose or mix in Drug Box');
    if (!rec.mix || rec.mix.amount == null || rec.mix.rangeAmount) {
      if (rec.mix && rec.mix.rangeAmount) {
        gaps.push('mix amount is a range in Drug Box (' + rec.mix.amount + '–' + rec.mix.amountMax + ' ' + rec.mix.amountUnit + (rec.mix.amountPerKg ? '/kg' : '') + ')');
      } else if (!rec.mix || rec.mix.amount == null) {
        gaps.push('mix not in Drug Box');
      }
    }
    if (rec.over && rec.over.range) gaps.push('infusion time is a range in Drug Box (' + rec.over.min + '–' + rec.over.max + ' min)');
    if (rec.rate && rec.rate.mlPerMin && !rec.rate.unit) { /* documented volume rate */ }
    else if (!rec.rate || !rec.rate.unit) {
      if (!rec.over || rec.over.range) {
        if (!rec.noRecommendation && !(rec.over && !rec.over.range)) gaps.push('no single dose rate in Drug Box');
      }
    }
    return gaps;
  }
  function listSpikedBagRecipes(drugs) {
    var list = [];
    if (!drugs) return list;
    Object.keys(drugs).forEach(function (key) {
      var d = drugs[key];
      if (!d) return;
      var rows = d.dosage || [];
      rows.forEach(function (row, index) {
        var text = String(row && row.t || '');
        if (!text || skipFillerLine(text) || !looksLikeInfusion(text)) return;
        var mix = parseMix(text);
        if (mix && mix.volume != null && (mix.volumeMax || mix.volume) < 50 && !/\b(drip|infusion|infuse)\b/i.test(text)) return;
        var rate = parseDoseRate(text);
        var over = parseOverMinutes(text);
        var noRec = /no current aha recommendations/i.test(text);
        var rec = {
          id: key + '|' + String(row.who || '').toLowerCase() + '|' + index,
          drugKey: key,
          name: d.name || key,
          alias: d.alias || '',
          extra: d.module == null,
          module: d.module,
          who: row.who || '',
          label: indicationLabel(text),
          text: text,
          field: fieldPath(key, row.who || '?', index),
          mix: mix,
          rate: rate,
          over: over,
          ageBand: parseAgeBand(text),
          noRecommendation: noRec
        };
        rec.gaps = recipeGaps(rec);
        rec.mixMissing = !mix || mix.amount == null || mix.rangeAmount;
        rec.doseUnit = rate && rate.unit ? rate.unit : null;
        rec.usesWeight = !!(rec.doseUnit && DOSE_UNITS[rec.doseUnit] && DOSE_UNITS[rec.doseUnit].weight) || !!(mix && mix.amountPerKg);
        rec.formulaMode = (rate && rate.mlPerMin && !rate.unit) ? 'volumeRate'
          : (over && !rec.doseUnit) ? 'timed'
          : 'master';
        list.push(rec);
      });
    });
    return list;
  }
  function groupSpikedBagDrugs(recipes) {
    var groups = [];
    var map = {};
    (recipes || []).forEach(function (r) {
      if (!map[r.drugKey]) {
        map[r.drugKey] = {
          drugKey: r.drugKey,
          name: r.name,
          alias: r.alias,
          extra: r.extra,
          module: r.module,
          recipes: [],
          mixMissingAll: true
        };
        groups.push(map[r.drugKey]);
      }
      map[r.drugKey].recipes.push(r);
      if (!r.mixMissing) map[r.drugKey].mixMissingAll = false;
    });
    groups.sort(function (a, b) {
      var am = a.module == null ? 99 : a.module;
      var bm = b.module == null ? 99 : b.module;
      if (am !== bm) return am - bm;
      return String(a.name).localeCompare(String(b.name));
    });
    return groups;
  }
  function mixAmountLabel(mix) {
    if (!mix || mix.amount == null) return '';
    var unit = mix.amountUnit + (mix.amountPerKg ? '/kg' : '');
    if (mix.rangeAmount) return mix.amount + '–' + mix.amountMax + ' ' + unit;
    return mix.amount + ' ' + unit;
  }
  function mixVolumeLabel(mix) {
    if (!mix || mix.volume == null) return '';
    return mix.rangeVolume ? (mix.volume + '–' + mix.volumeMax + ' mL') : (mix.volume + ' mL');
  }
  function amountToAdd(recipe, bagVolumeMl, weightKg) {
    var out = { ok: false, manual: false, amount: null, unit: null, note: '', gaps: [] };
    if (!recipe) { out.manual = true; out.note = 'Custom entry.'; return out; }
    if (recipe.noRecommendation) {
      out.manual = true;
      out.note = 'No current recommendation in Drug Box.';
      out.gaps = recipe.gaps.slice();
      return out;
    }
    var mix = recipe.mix;
    if (!mix || mix.amount == null) {
      out.manual = true;
      out.note = 'Mix not in Drug Box. Enter the amount to add.';
      out.gaps = ['mix not in Drug Box'];
      return out;
    }
    if (mix.rangeAmount) {
      out.manual = true;
      out.unit = mix.amountUnit;
      out.note = 'Drug Box lists a range of ' + mixAmountLabel(mix) + (mix.volume ? ' in ' + mixVolumeLabel(mix) : '') +
        (mix.maxAmount != null ? ', max ' + mix.maxAmount + ' ' + mix.maxAmountUnit : '') +
        '. Enter the amount to add.';
      out.gaps = recipe.gaps.slice();
      return out;
    }
    var vol = Number(bagVolumeMl);
    var vmin = mix.volume;
    var vmax = mix.volumeMax != null ? mix.volumeMax : mix.volume;
    if (mix.volume == null) {
      out.manual = true;
      out.note = 'Drug Box has an amount but no bag volume. Enter the amount to add.';
      return out;
    }
    if (!isFinite(vol)) {
      out.note = 'Pick a bag volume.';
      return out;
    }
    if (vol < vmin || vol > vmax) {
      out.manual = true;
      out.unit = mix.amountUnit;
      out.note = 'Drug Box mix is ' + mixAmountLabel(mix) + ' in ' + mixVolumeLabel(mix) +
        (mix.fluid ? ' ' + mix.fluid : '') +
        '. This bag volume does not match. Pick ' + mixVolumeLabel(mix) + ' or enter the amount manually.';
      out.gaps = ['selected volume ' + vol + ' mL does not match Drug Box mix volume ' + mixVolumeLabel(mix)];
      return out;
    }
    if (mix.amountPerKg) {
      var w = Number(weightKg);
      if (!isFinite(w) || w <= 0) {
        out.note = 'Enter weight to calculate ' + mixAmountLabel(mix) + ' in ' + mixVolumeLabel(mix) + '.';
        out.unit = mix.amountUnit;
        return out;
      }
      var amt = mix.amount * w;
      var note = 'From Drug Box: ' + mix.amount + ' ' + mix.amountUnit + '/kg × ' + fmtComma(w, 6) + ' kg in ' + mixVolumeLabel(mix) + '.';
      if (mix.maxAmount != null) {
        var maxMcg = massToMcg(mix.maxAmount, mix.maxAmountUnit);
        var amtMcg = massToMcg(amt, mix.amountUnit);
        if (isFinite(maxMcg) && isFinite(amtMcg) && amtMcg > maxMcg) {
          amt = mcgToMass(maxMcg, mix.amountUnit);
          note += ' Capped at the Drug Box maximum of ' + mix.maxAmount + ' ' + mix.maxAmountUnit + '.';
        } else {
          note += ' Drug Box maximum is ' + mix.maxAmount + ' ' + mix.maxAmountUnit + '.';
        }
      }
      out.ok = true;
      out.amount = amt;
      out.unit = mix.amountUnit;
      out.note = note;
      return out;
    }
    out.ok = true;
    out.amount = mix.amount;
    out.unit = mix.amountUnit;
    out.note = 'From Drug Box: add ' + mix.amount + ' ' + mix.amountUnit + ' to ' + vol + ' mL' + (mix.fluid ? ' (' + mix.fluid + ')' : '') + '.';
    return out;
  }
  function dosePrefill(recipe) {
    var out = { fill: false, value: null, unit: null, typical: null, hint: null };
    if (!recipe || !recipe.rate || !recipe.rate.unit) return out;
    out.unit = recipe.rate.unit;
    if (recipe.rate.exact != null) {
      out.fill = true;
      out.value = recipe.rate.exact;
      return out;
    }
    if (recipe.rate.min != null && recipe.rate.max != null) {
      out.hint = recipe.rate.min + (recipe.rate.min === recipe.rate.max ? '' : '–' + recipe.rate.max) + ' ' + recipe.rate.unit;
    }
    if (recipe.rate.typical != null) out.typical = { value: recipe.rate.typical, unit: recipe.rate.unit };
    return out;
  }
  function concentrationFromAmount(amount, unit, volumeMl) {
    var vol = Number(volumeMl);
    var amt = Number(amount);
    if (!isFinite(vol) || vol <= 0 || !isFinite(amt) || amt <= 0 || !unit) return null;
    if (unit === 'mEq') {
      return {
        concLabel: fmtComma(amt / vol, 6) + ' mEq/mL',
        mcgPerMl: null,
        mgPerMl: null,
        meqPerMl: amt / vol
      };
    }
    var mcg = massToMcg(amt, unit);
    if (!isFinite(mcg)) return null;
    var mcgPerMl = mcg / vol;
    var mgPerMl = mcgPerMl / 1000;
    var concLabel = mgPerMl >= 0.1
      ? fmtComma(mgPerMl, 6) + ' mg/mL  (' + fmtComma(mcgPerMl, 4) + ' mcg/mL)'
      : fmtComma(mcgPerMl, 6) + ' mcg/mL';
    return { concLabel: concLabel, mcgPerMl: mcgPerMl, mgPerMl: mgPerMl, meqPerMl: null };
  }
  function computeTimedInfusion(input) {
    var missing = [];
    if (isBlank(input.volumeMl)) missing.push('volume');
    if (isBlank(input.dripSet)) missing.push('drip set');
    if (isBlank(input.timeMin)) missing.push('infusion time');
    if (missing.length) return { ok: false, incomplete: true, error: 'Enter the ' + missing.join(', ') + '.' };
    var volumeMl = parseNum(input.volumeMl);
    var dripSet = parseNum(input.dripSet);
    var timeMin = parseNum(input.timeMin);
    if ([volumeMl, dripSet, timeMin].some(function (n) { return !isFinite(n); })) return { ok: false, error: 'Use numbers only.' };
    if (volumeMl <= 0) return { ok: false, error: 'Volume must be greater than zero.' };
    if (dripSet <= 0) return { ok: false, error: 'Drip set must be greater than zero.' };
    if (timeMin <= 0) return { ok: false, error: 'Infusion time must be greater than zero.' };
    var gttsExact = (volumeMl * dripSet) / timeMin;
    var mlHr = (volumeMl / timeMin) * 60;
    var conc = concentrationFromAmount(input.onHand, input.onHandUnit || 'mg', volumeMl);
    var notes = ['Rate is bag volume × drip set ÷ infusion time (' + fmtComma(timeMin, 4) + ' min).'];
    return {
      ok: true,
      mode: 'timed',
      gtts: Math.round(gttsExact),
      gttsExact: gttsExact,
      mlHr: mlHr,
      mcgPerMl: conc && conc.mcgPerMl,
      mgPerMl: conc && conc.mgPerMl,
      concLabel: conc ? conc.concLabel : '—',
      timeMin: timeMin,
      notes: notes
    };
  }
  function computeVolumeRate(input) {
    var missing = [];
    if (isBlank(input.mlPerMin)) missing.push('volume rate');
    if (isBlank(input.dripSet)) missing.push('drip set');
    if (missing.length) return { ok: false, incomplete: true, error: 'Enter the ' + missing.join(', ') + '.' };
    var mlPerMin = parseNum(input.mlPerMin);
    var dripSet = parseNum(input.dripSet);
    if ([mlPerMin, dripSet].some(function (n) { return !isFinite(n); })) return { ok: false, error: 'Use numbers only.' };
    if (mlPerMin <= 0) return { ok: false, error: 'Volume rate must be greater than zero.' };
    if (dripSet <= 0) return { ok: false, error: 'Drip set must be greater than zero.' };
    var gttsExact = mlPerMin * dripSet;
    var mlHr = mlPerMin * 60;
    var conc = concentrationFromAmount(input.onHand, input.onHandUnit || 'mg', input.volumeMl);
    var notes = ['Rate is the Drug Box volume rate (' + fmtComma(mlPerMin, 6) + ' mL/min) × drip set.'];
    return {
      ok: true,
      mode: 'volumeRate',
      gtts: Math.round(gttsExact),
      gttsExact: gttsExact,
      mlHr: mlHr,
      mcgPerMl: conc && conc.mcgPerMl,
      mgPerMl: conc && conc.mgPerMl,
      concLabel: conc ? conc.concLabel : '—',
      timeMin: null,
      notes: notes
    };
  }

  var api = {
    LB_PER_KG: LB_PER_KG,
    DOSE_UNITS: DOSE_UNITS,
    computeDrip: computeDrip,
    convertAll: convertAll,
    massToMcg: massToMcg,
    toKg: toKg,
    fmt: fmt,
    fmtComma: fmtComma,
    fmtSmart: fmtSmart,
    padState: padState,
    padPress: padPress,
    padDisplay: padDisplay,
    padApply: padApply,
    alignOnHandToDoseUnit: alignOnHandToDoseUnit,
    formulaSlots: formulaSlots,
    SLOT_LABELS: SLOT_LABELS,
    lbToKg: lbToKg,
    parseMix: parseMix,
    parseDoseRate: parseDoseRate,
    parseOverMinutes: parseOverMinutes,
    parseAgeBand: parseAgeBand,
    whoFromAge: whoFromAge,
    listSpikedBagRecipes: listSpikedBagRecipes,
    groupSpikedBagDrugs: groupSpikedBagDrugs,
    amountToAdd: amountToAdd,
    dosePrefill: dosePrefill,
    computeTimedInfusion: computeTimedInfusion,
    computeVolumeRate: computeVolumeRate,
    concentrationFromAmount: concentrationFromAmount,
    BAG_VOLUMES: BAG_VOLUMES
  };

  if (typeof document === 'undefined') {
    root.PharmCalc = api;
    return;
  }

  var weightUnit = 'kg';
  var convCat = 'mass';
  var convLock = false;
  var keys = padState();
  var currentTab = 'drip';
  var focusSlot = null;
  var spike = {
    drugKey: '',
    recipeId: null,
    who: null,
    pickerOpen: false,
    lastAutoOnHand: null,
    lastAutoDose: null,
    lastAutoTime: null,
    applying: false
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function drugBoxDrugs() {
    return (root.DRUG_BOX && root.DRUG_BOX.drugs) || (root.window && root.window.DRUG_BOX && root.window.DRUG_BOX.drugs) || {};
  }
  function spikedCatalog() {
    return groupSpikedBagDrugs(listSpikedBagRecipes(drugBoxDrugs()));
  }
  function currentSpikeGroup() {
    if (!spike.drugKey) return null;
    var groups = spikedCatalog();
    var i;
    for (i = 0; i < groups.length; i++) {
      if (groups[i].drugKey === spike.drugKey) return groups[i];
    }
    return null;
  }
  function currentSpikeRecipe() {
    var group = currentSpikeGroup();
    if (!group) return null;
    var i;
    for (i = 0; i < group.recipes.length; i++) {
      if (group.recipes[i].id === spike.recipeId) return group.recipes[i];
    }
    return null;
  }
  function recipesForWho(group, who) {
    if (!group) return [];
    if (!who) return group.recipes.slice();
    return group.recipes.filter(function (r) { return r.who === who; });
  }
  function uniqueWhos(group) {
    var out = [];
    if (!group) return out;
    group.recipes.forEach(function (r) {
      if (r.who && out.indexOf(r.who) === -1) out.push(r.who);
    });
    return out;
  }
  function spikeWeightKg() {
    var raw = parseNum($('drip-weight') && $('drip-weight').value);
    if (!isFinite(raw) || raw == null) return null;
    return toKg(raw, weightUnit);
  }
  function setOnHandSelectUnit(unit) {
    var sel = $('drip-onhand-unit');
    if (!sel || !unit) return;
    var ok = false;
    Array.prototype.forEach.call(sel.options, function (opt) {
      if (opt.value === unit) ok = true;
    });
    if (!ok) {
      var opt = document.createElement('option');
      opt.value = unit;
      opt.textContent = unit;
      sel.appendChild(opt);
    }
    sel.value = unit;
  }
  function sameAuto(auto, value, unit) {
    if (!auto) return false;
    var n = parseNum(value);
    return auto.unit === unit && isFinite(n) && Number(auto.value) === Number(n);
  }

  function $(id) { return document.getElementById(id); }

  function showCalc() {
    document.body.classList.remove('view-box', 'view-page', 'view-session', 'view-study', 'view-build');
    document.body.classList.add('view-calc');
    showTab(currentTab || 'drip');
  }
  function hideCalc() {
    document.body.classList.remove('view-calc');
    document.body.classList.add('view-box');
  }
  function showTab(name) {
    currentTab = name;
    ['drip', 'convert', 'calc'].forEach(function (id) {
      var tab = $('calc-tab-' + id);
      var panel = $('calc-panel-' + id);
      var on = id === name;
      if (tab) {
        tab.classList.toggle('on', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
      }
      if (panel) {
        panel.classList.toggle('on', on);
        panel.hidden = !on;
      }
    });
    if (name === 'convert') renderConv(true);
    if (name === 'calc') renderPad();
  }

  function dripInputs() {
    var rec = currentSpikeRecipe();
    var mode = rec ? rec.formulaMode : 'master';
    var timeVal = $('drip-time') ? $('drip-time').value : '';
    var timeNum = parseNum(timeVal);
    if (!isFinite(timeNum)) timeNum = rec && rec.over && rec.over.exact != null ? rec.over.exact : null;
    return {
      dose: $('drip-dose').value,
      doseUnit: $('drip-dose-unit').value,
      weight: $('drip-weight').value,
      weightUnit: weightUnit,
      volumeMl: $('drip-volume').value,
      dripSet: $('drip-set').value,
      onHand: $('drip-onhand').value,
      onHandUnit: $('drip-onhand-unit').value,
      formulaMode: mode,
      timeMode: mode === 'timed' ? 'infusion' : 'unit',
      timeMin: mode === 'timed' ? timeNum : undefined,
      mlPerMin: rec && rec.rate && rec.rate.mlPerMin != null ? rec.rate.mlPerMin : undefined,
      focus: focusSlot
    };
  }
  function syncTimeAndWeight() {
    var rec = currentSpikeRecipe();
    var unit = DOSE_UNITS[$('drip-dose-unit').value] || DOSE_UNITS['mcg/kg/min'];
    var usesWeight = rec ? rec.usesWeight : !!unit.weight;
    var wrap = $('drip-weight-wrap');
    if (wrap) wrap.hidden = !usesWeight;
    if ($('drip-weight')) $('drip-weight').disabled = !usesWeight;
    var timeEl = $('drip-time');
    var note = $('drip-time-note');
    if (rec && rec.formulaMode === 'timed') {
      if (timeEl) timeEl.readOnly = false;
      if (rec.over && rec.over.exact != null) {
        if (timeEl && (isBlank(timeEl.value) || sameAuto(spike.lastAutoTime, parseNum(timeEl.value), 'min') || /min/.test(timeEl.value))) {
          timeEl.value = String(rec.over.exact);
          spike.lastAutoTime = { value: rec.over.exact, unit: 'min' };
        }
        if (note) note.textContent = 'from Drug Box';
      } else if (rec.over && rec.over.range) {
        if (timeEl && (sameAuto(spike.lastAutoTime, parseNum(timeEl.value), 'min') || /min/.test(String(timeEl.value)))) {
          timeEl.value = '';
          spike.lastAutoTime = null;
        }
        if (note) note.textContent = 'Drug Box: ' + rec.over.min + '–' + rec.over.max + ' min';
      } else if (note) {
        note.textContent = 'infusion time';
      }
    } else if (rec && rec.formulaMode === 'volumeRate') {
      if (timeEl) {
        timeEl.readOnly = true;
        timeEl.value = '';
      }
      if (note) note.textContent = rec.rate && rec.rate.mlPerMin != null ? (rec.rate.mlPerMin + ' mL/min') : '';
    } else {
      if (timeEl) timeEl.readOnly = true;
      var label = unit.timeMin === 1 ? '1 min' : '60 min';
      if (timeEl) timeEl.value = label;
      if (note) note.textContent = unit.timeMin === 1 ? 'per minute' : 'per hour';
    }
  }
  function syncSetButtons() {
    var v = String($('drip-set').value).trim();
    document.querySelectorAll('.drip-set').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-gtt') === v);
    });
  }
  function slotMarkup(slot) {
    if (slot.hidden) return '';
    var cls = 'fx-slot' + (slot.filled ? ' filled' : '') + (slot.focus ? ' focus' : '');
    return '<button type="button" class="' + cls + '" data-slot="' + slot.id + '">' + slot.display + '</button>';
  }
  function rowMarkup(items) {
    var html = [];
    items.forEach(function (slot, i) {
      if (i) html.push('<span class="fx-op">×</span>');
      html.push(slotMarkup(slot));
    });
    return html.join('');
  }
  function renderFormula() {
    var frac = $('fx-frac');
    if (!frac) return;
    var input = dripInputs();
    input.focus = focusSlot;
    var fx = formulaSlots(input);
    var html = '<div class="fx-row fx-num">' + rowMarkup(fx.numerator) + '</div>';
    if (fx.denominator && fx.denominator.length) {
      html += '<div class="fx-bar"></div><div class="fx-row fx-den">' + rowMarkup(fx.denominator) + '</div>';
    }
    frac.innerHTML = html;
  }
  function renderDrip() {
    if (!spike.applying) syncSpikeChrome();
    syncTimeAndWeight();
    syncSetButtons();
    renderFormula();
    var rec = currentSpikeRecipe();
    var input = dripInputs();
    var out;
    if (rec && rec.formulaMode === 'volumeRate') out = computeVolumeRate(input);
    else if (rec && rec.formulaMode === 'timed') out = computeTimedInfusion(input);
    else out = computeDrip(input);
    var box = $('drip-out');
    var err = $('drip-error');
    var notes = $('drip-notes');
    var addRow = $('drip-add-row');
    var addVal = $('drip-add');
    var addInfo = spikeAmountInfo();
    var showAdd = !!(addInfo && (addInfo.ok || addInfo.note));
    var concOnly = null;
    if ((!out || !out.ok || !out.concLabel || out.concLabel === '—') && addInfo && addInfo.ok) {
      concOnly = concentrationFromAmount(addInfo.amount, addInfo.unit, input.volumeMl);
    }
    if (!out || !out.ok) {
      var canShowPartial = showAdd || (concOnly && concOnly.concLabel);
      if (box) box.hidden = !canShowPartial;
      if (canShowPartial) {
        if ($('drip-gtts')) $('drip-gtts').textContent = '—';
        if ($('drip-exact')) $('drip-exact').textContent = '';
        if ($('drip-mlhr')) $('drip-mlhr').textContent = '—';
        if ($('drip-conc')) $('drip-conc').textContent = concOnly ? concOnly.concLabel : '—';
      }
      if (addRow) addRow.hidden = !showAdd;
      if (addVal && addInfo) addVal.textContent = addInfo.ok ? (fmtComma(addInfo.amount, 6) + ' ' + addInfo.unit) : (addInfo.manual ? 'Enter manually' : '—');
      if (notes) {
        var partialNotes = [];
        if (addInfo && addInfo.note) partialNotes.push(addInfo.note);
        notes.innerHTML = partialNotes.map(function (n) { return '<p>' + escapeHtml(n) + '</p>'; }).join('');
        notes.hidden = !partialNotes.length;
      }
      fillSpikeRate(out, concOnly);
      if (out && out.incomplete) {
        if (err) { err.hidden = true; err.textContent = ''; }
      } else if (out && out.error) {
        if (err) { err.hidden = false; err.textContent = out.error; }
      } else if (err) { err.hidden = true; err.textContent = ''; }
      return;
    }
    if (err) { err.hidden = true; err.textContent = ''; }
    if (box) box.hidden = false;
    $('drip-gtts').textContent = fmtComma(out.gtts, 0);
    var exact = fmtComma(out.gttsExact, 6);
    $('drip-exact').textContent = exact === String(out.gtts)
      ? 'Exactly ' + exact + ' gtts/min'
      : 'Exact ' + exact + ' gtts/min, rounded to the nearest drop';
    $('drip-mlhr').textContent = fmtComma(out.mlHr, 4);
    $('drip-conc').textContent = out.concLabel;
    if (addRow) addRow.hidden = !showAdd;
    if (addVal && addInfo) addVal.textContent = addInfo.ok ? (fmtComma(addInfo.amount, 6) + ' ' + addInfo.unit) : (addInfo.manual ? 'Enter manually' : '—');
    if (notes) {
      var allNotes = (out.notes || []).slice();
      if (addInfo && addInfo.note) allNotes.unshift(addInfo.note);
      notes.innerHTML = allNotes.map(function (n) { return '<p>' + escapeHtml(n) + '</p>'; }).join('');
      notes.hidden = !allNotes.length;
    }
    fillSpikeRate(out);
  }
  function slotFromEventTarget(el) {
    if (!el || !el.closest) return null;
    var field = el.closest('[data-slot]');
    if (field) return field.getAttribute('data-slot');
    if (el.closest('#drip-dose-unit, #drip-dose')) return 'dose';
    if (el.closest('#drip-weight-wrap, #drip-unit-kg, #drip-unit-lb')) return 'weight';
    if (el.closest('#drip-onhand-unit')) return 'onHand';
    return null;
  }
  function focusSlotInput(id) {
    var map = { dose: 'drip-dose', weight: 'drip-weight', volume: 'drip-volume', dripSet: 'drip-set', onHand: 'drip-onhand', time: 'drip-time' };
    var el = $(map[id]);
    if (el && !el.disabled) el.focus();
  }
  function convertQwt(box) {
    if (!box) return;
    var inp = box.querySelector('.qwt-lb');
    var out = box.querySelector('.qwt-kg');
    if (!inp || !out) return;
    var res = lbToKg(inp.value);
    out.textContent = res.ok ? fmt(res.kg, 2) : '—';
  }



  function fillSpikeRate(out, concFallback) {
    var extra = $('spike-add-extra');
    var hasRate = out && out.ok;
    var conc = (out && out.ok && out.concLabel && out.concLabel !== '—') ? out.concLabel : (concFallback && concFallback.concLabel);
    if ($('spike-gtts')) $('spike-gtts').textContent = hasRate ? fmtComma(out.gtts, 0) : '—';
    if ($('spike-mlhr')) $('spike-mlhr').textContent = hasRate ? fmtComma(out.mlHr, 4) : '—';
    if ($('spike-conc')) $('spike-conc').textContent = conc || '—';
    if (extra) extra.hidden = !(hasRate || conc);
  }
  function spikeAmountInfo() {
    var rec = currentSpikeRecipe();
    if (!rec) return null;
    var vol = parseNum($('drip-volume') && $('drip-volume').value);
    return amountToAdd(rec, vol, spikeWeightKg());
  }
  function drugButtonLabel(group) {
    if (!group) return 'Custom';
    return group.name;
  }
  function renderSpikeChrome() {
    var vol = parseNum($('drip-volume') && $('drip-volume').value);
    document.querySelectorAll('.spike-vol').forEach(function (btn) {
      var n = Number(btn.getAttribute('data-ml'));
      btn.classList.toggle('on', isFinite(vol) && n === vol);
      btn.setAttribute('aria-pressed', isFinite(vol) && n === vol ? 'true' : 'false');
    });
    var group = currentSpikeGroup();
    var rec = currentSpikeRecipe();
    var btn = $('spike-drug-btn');
    if (btn) {
      var label = drugButtonLabel(group);
      btn.innerHTML = escapeHtml(label);
      if (group && group.extra) btn.innerHTML += ' <span class="spike-tag extra">EXTRA</span>';
      if (group && group.mixMissingAll) btn.innerHTML += ' <span class="spike-tag gap">mix not in Drug Box</span>';
      btn.setAttribute('aria-expanded', spike.pickerOpen ? 'true' : 'false');
      btn.classList.toggle('open', spike.pickerOpen);
    }
    var picker = $('spike-picker');
    if (picker) {
      picker.hidden = !spike.pickerOpen;
      var html = '<button type="button" class="spike-opt' + (!spike.drugKey ? ' on' : '') + '" data-key="">Custom</button>';
      spikedCatalog().forEach(function (g) {
        var cls = 'spike-opt' + (g.drugKey === spike.drugKey ? ' on' : '');
        html += '<button type="button" class="' + cls + '" data-key="' + escapeHtml(g.drugKey) + '">';
        html += '<span class="spike-opt-name">' + escapeHtml(g.name) + '</span>';
        if (g.extra) html += '<span class="spike-tag extra">EXTRA</span>';
        if (g.mixMissingAll) html += '<span class="spike-tag gap">mix not in Drug Box</span>';
        html += '</button>';
      });
      picker.innerHTML = html;
    }
    var whos = uniqueWhos(group);
    var whoWrap = $('spike-who-wrap');
    if (whoWrap) {
      whoWrap.hidden = !(group && whos.length > 1);
      whoWrap.querySelectorAll('[data-who]').forEach(function (b) {
        var on = spike.who === b.getAttribute('data-who');
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    var recWrap = $('spike-recipe-wrap');
    var recBox = $('spike-recipes');
    if (recWrap && recBox) {
      var list = recipesForWho(group, whos.length > 1 ? spike.who : (whos[0] || null));
      recWrap.hidden = !(group && list.length);
      recBox.innerHTML = list.map(function (r) {
        var cls = 'spike-rec' + (r.id === spike.recipeId ? ' on' : '');
        var tags = '';
        if (r.mixMissing) tags += '<span class="spike-tag gap">mix not in Drug Box</span>';
        return '<button type="button" class="' + cls + '" data-id="' + escapeHtml(r.id) + '">' +
          escapeHtml(r.label) + (whos.length <= 1 && r.who ? ' <span class="spike-who-pill">' + escapeHtml(r.who) + '</span>' : '') +
          tags + '</button>';
      }).join('');
    }
    var ageWrap = $('spike-age-wrap');
    if (ageWrap) ageWrap.hidden = !group;
    var ageNote = $('spike-age-note');
    if (ageNote) {
      var bands = group ? group.recipes.filter(function (r) { return r.ageBand; }) : [];
      if (!group) ageNote.textContent = '';
      else if (!bands.length) ageNote.textContent = 'Drug Box has no age cutoff for this drug. Pick Adult or Pediatric when both are listed.';
      else ageNote.textContent = 'Age selects Adult or Pediatric only from a cutoff written in Drug Box.';
    }
    var hint = $('spike-hint');
    var typWrap = $('spike-typical');
    var typBtn = $('spike-typical-btn');
    var addBox = $('spike-add');
    var addV = $('spike-add-v');
    var addN = $('spike-add-note');
    if (!group) {
      if (hint) { hint.hidden = true; hint.innerHTML = ''; }
      if (typWrap) typWrap.hidden = true;
      if (addBox) addBox.hidden = true;
    } else {
      var bits = [];
      if (rec) {
        bits.push('<p class="spike-src">' + escapeHtml(rec.who ? rec.who + ' — ' : '') + escapeHtml(rec.text) + '</p>');
        var pre = dosePrefill(rec);
        if (pre.hint && !pre.fill) bits.push('<p>Dose in Drug Box: ' + escapeHtml(pre.hint) + '. Enter a dose from that range.</p>');
        if (pre.fill) bits.push('<p>Dose is the exact rate in Drug Box: ' + escapeHtml(String(pre.value) + ' ' + pre.unit) + '.</p>');
        if (rec.over && rec.over.range) bits.push('<p>Infusion time in Drug Box is ' + rec.over.min + '–' + rec.over.max + ' min. Enter a single time.</p>');
        if (rec.gaps && rec.gaps.length) bits.push('<p class="spike-gaps">Left manual: ' + escapeHtml(rec.gaps.join('; ')) + '.</p>');
        if (typWrap && typBtn) {
          typWrap.hidden = !(pre.typical);
          if (pre.typical) typBtn.textContent = 'Typically starts ' + pre.typical.value + ' ' + pre.typical.unit;
        }
      } else if (typWrap) typWrap.hidden = true;
      if (hint) {
        hint.innerHTML = bits.join('');
        hint.hidden = !bits.length;
      }
      var info = spikeAmountInfo();
      if (addBox) {
        addBox.hidden = !info;
        if (info && addV) addV.textContent = info.ok ? (fmtComma(info.amount, 6) + ' ' + info.unit) : (info.manual ? 'Enter manually' : '—');
        if (info && addN) addN.textContent = info.note || '';
      }
    }
  }
  function syncSpikeChrome() {
    renderSpikeChrome();
  }
  function applyCurrentRecipe(opts) {
    opts = opts || {};
    var rec = currentSpikeRecipe();
    spike.applying = true;
    if (!rec) {
      spike.lastAutoOnHand = null;
      spike.lastAutoDose = null;
      spike.lastAutoTime = null;
      spike.applying = false;
      renderSpikeChrome();
      return;
    }
    if (rec.doseUnit && $('drip-dose-unit')) $('drip-dose-unit').value = rec.doseUnit;
    var pre = dosePrefill(rec);
    var doseEl = $('drip-dose');
    if (doseEl) {
      if (pre.fill) {
        if (isBlank(doseEl.value) || sameAuto(spike.lastAutoDose, doseEl.value, pre.unit) || opts.force) {
          doseEl.value = String(pre.value);
          spike.lastAutoDose = { value: pre.value, unit: pre.unit };
        }
      } else if (sameAuto(spike.lastAutoDose, doseEl.value, spike.lastAutoDose && spike.lastAutoDose.unit) || opts.clearDose) {
        doseEl.value = '';
        spike.lastAutoDose = null;
      }
    }
    var info = spikeAmountInfo();
    var onEl = $('drip-onhand');
    if (onEl) {
      if (info && info.ok) {
        if (isBlank(onEl.value) || sameAuto(spike.lastAutoOnHand, onEl.value, $('drip-onhand-unit') && $('drip-onhand-unit').value) || opts.force) {
          onEl.value = fmt(info.amount, 6);
          setOnHandSelectUnit(info.unit);
          spike.lastAutoOnHand = { value: info.amount, unit: info.unit };
        }
      } else if (sameAuto(spike.lastAutoOnHand, onEl.value, $('drip-onhand-unit') && $('drip-onhand-unit').value) || opts.force) {
        onEl.value = '';
        spike.lastAutoOnHand = null;
        if (info && info.unit) setOnHandSelectUnit(info.unit);
      }
    }
    spike.applying = false;
    renderSpikeChrome();
  }
  function selectSpikeVolume(ml) {
    if ($('drip-volume')) $('drip-volume').value = String(ml);
    applyCurrentRecipe();
    renderDrip();
  }
  function selectSpikeDrug(key) {
    spike.pickerOpen = false;
    spike.drugKey = key || '';
    spike.lastAutoOnHand = null;
    spike.lastAutoDose = null;
    spike.lastAutoTime = null;
    if (!spike.drugKey) {
      spike.recipeId = null;
      spike.who = null;
      renderSpikeChrome();
      renderDrip();
      return;
    }
    var group = currentSpikeGroup();
    var whos = uniqueWhos(group);
    spike.who = whos.indexOf('Adult') !== -1 ? 'Adult' : (whos[0] || null);
    var list = recipesForWho(group, whos.length > 1 ? spike.who : null);
    spike.recipeId = list[0] ? list[0].id : null;
    applyCurrentRecipe({ force: true, clearDose: true });
    renderDrip();
  }
  function selectSpikeWho(who) {
    spike.who = who;
    var list = recipesForWho(currentSpikeGroup(), who);
    spike.recipeId = list[0] ? list[0].id : null;
    applyCurrentRecipe({ force: true, clearDose: true });
    renderDrip();
  }
  function selectSpikeRecipe(id) {
    spike.recipeId = id;
    var rec = currentSpikeRecipe();
    if (rec) spike.who = rec.who;
    applyCurrentRecipe({ force: true, clearDose: true });
    renderDrip();
  }
  function applyAgeToWho() {
    var group = currentSpikeGroup();
    if (!group) return;
    var age = parseNum($('spike-age') && $('spike-age').value);
    var who = whoFromAge(age, group.recipes);
    if (who && who !== spike.who) selectSpikeWho(who);
    else renderSpikeChrome();
  }
  function openSpikePicker(open) {
    spike.pickerOpen = open == null ? !spike.pickerOpen : !!open;
    renderSpikeChrome();
  }
  function applySpikedBag(values) {
    values = values || {};
    if (values.volumeMl != null && $('drip-volume')) $('drip-volume').value = values.volumeMl;
    if (values.weight != null) {
      if ($('drip-weight')) $('drip-weight').value = values.weight;
      if (values.weightUnit) {
        weightUnit = values.weightUnit;
        var kg = $('drip-unit-kg');
        var lb = $('drip-unit-lb');
        if (kg) { kg.classList.toggle('on', weightUnit === 'kg'); kg.setAttribute('aria-pressed', weightUnit === 'kg' ? 'true' : 'false'); }
        if (lb) { lb.classList.toggle('on', weightUnit === 'lb'); lb.setAttribute('aria-pressed', weightUnit === 'lb' ? 'true' : 'false'); }
      }
    }
    if (values.drugKey) {
      spike.drugKey = values.drugKey;
      var group = currentSpikeGroup();
      var whos = uniqueWhos(group);
      spike.who = values.who || (whos.indexOf('Adult') !== -1 ? 'Adult' : (whos[0] || null));
      if (values.recipeId) spike.recipeId = values.recipeId;
      else {
        var list = recipesForWho(group, spike.who);
        if (values.label) {
          var hit = list.filter(function (r) { return r.label === values.label; })[0];
          spike.recipeId = hit ? hit.id : (list[0] && list[0].id);
        } else {
          spike.recipeId = list[0] ? list[0].id : null;
        }
      }
      applyCurrentRecipe({ force: true });
    }
    if (values.dose != null && $('drip-dose')) $('drip-dose').value = values.dose;
    if (values.doseUnit && $('drip-dose-unit')) $('drip-dose-unit').value = values.doseUnit;
    if (values.dripSet != null && $('drip-set')) $('drip-set').value = values.dripSet;
    if (values.age != null && $('spike-age')) $('spike-age').value = values.age;
    spike.pickerOpen = false;
    renderSpikeChrome();
    renderDrip();
  }

  function resetSpike() {
    spike.drugKey = '';
    spike.recipeId = null;
    spike.who = null;
    spike.pickerOpen = false;
    spike.lastAutoOnHand = null;
    spike.lastAutoDose = null;
    spike.lastAutoTime = null;
    if ($('spike-age')) $('spike-age').value = '';
  }
  function clearDrip() {
    resetSpike();
    ['drip-dose', 'drip-weight', 'drip-volume', 'drip-onhand'].forEach(function (id) {
      if ($(id)) $(id).value = '';
    });
    if ($('drip-dose-unit')) $('drip-dose-unit').value = 'mcg/kg/min';
    if ($('drip-onhand-unit')) $('drip-onhand-unit').value = 'mg';
    if ($('drip-set')) $('drip-set').value = '60';
    weightUnit = 'kg';
    var kg = $('drip-unit-kg');
    var lb = $('drip-unit-lb');
    if (kg) { kg.classList.add('on'); kg.setAttribute('aria-pressed', 'true'); }
    if (lb) { lb.classList.remove('on'); lb.setAttribute('aria-pressed', 'false'); }
    renderSpikeChrome();
    renderDrip();
  }
  function fillDrip(values) {
    values = values || {};
    if (values.dose != null) $('drip-dose').value = values.dose;
    if (values.doseUnit) $('drip-dose-unit').value = values.doseUnit;
    if (values.weight != null) $('drip-weight').value = values.weight;
    if (values.weightUnit) {
      weightUnit = values.weightUnit;
      var kg = $('drip-unit-kg');
      var lb = $('drip-unit-lb');
      if (kg) { kg.classList.toggle('on', weightUnit === 'kg'); kg.setAttribute('aria-pressed', weightUnit === 'kg' ? 'true' : 'false'); }
      if (lb) { lb.classList.toggle('on', weightUnit === 'lb'); lb.setAttribute('aria-pressed', weightUnit === 'lb' ? 'true' : 'false'); }
    }
    if (values.volumeMl != null) $('drip-volume').value = values.volumeMl;
    if (values.dripSet != null) $('drip-set').value = values.dripSet;
    if (values.onHand != null) $('drip-onhand').value = values.onHand;
    if (values.onHandUnit) $('drip-onhand-unit').value = values.onHandUnit;
    renderDrip();
  }
  function setWeightUnit(next) {
    if (next === weightUnit) return;
    var raw = parseNum($('drip-weight').value);
    if (isFinite(raw) && raw !== null) {
      if (next === 'lb') $('drip-weight').value = fmt(raw * LB_PER_KG, 6);
      else $('drip-weight').value = fmt(raw / LB_PER_KG, 6);
    }
    weightUnit = next;
    var kg = $('drip-unit-kg');
    var lb = $('drip-unit-lb');
    if (kg) { kg.classList.toggle('on', next === 'kg'); kg.setAttribute('aria-pressed', next === 'kg' ? 'true' : 'false'); }
    if (lb) { lb.classList.toggle('on', next === 'lb'); lb.setAttribute('aria-pressed', next === 'lb' ? 'true' : 'false'); }
    renderDrip();
  }

  function convUnits() {
    if (convCat === 'temp') return [['C', '°C'], ['F', '°F']];
    return CONV[convCat].units;
  }
  function renderConv(keep) {
    var rows = $('conv-rows');
    if (!rows) return;
    var prev = {};
    if (keep) {
      rows.querySelectorAll('input[data-unit]').forEach(function (inp) {
        prev[inp.getAttribute('data-unit')] = inp.value;
      });
    }
    rows.innerHTML = convUnits().map(function (u) {
      return '<div class="conv-row"><label for="conv-' + u[0] + '">' + u[1] + '</label>' +
        '<input id="conv-' + u[0] + '" data-unit="' + u[0] + '" type="text" inputmode="decimal" aria-label="' + u[1] + '"></div>';
    }).join('');
    var seedUnit = convUnits()[0][0];
    var seedVal = 1;
    if (keep) {
      var used = false;
      convUnits().forEach(function (u) {
        if (!used && prev[u[0]] != null && prev[u[0]] !== '') {
          var n = parseNum(prev[u[0]]);
          if (isFinite(n) && n !== null) { seedUnit = u[0]; seedVal = n; used = true; }
        }
      });
      if (!used) seedVal = convCat === 'temp' ? 0 : 1;
    } else {
      seedVal = convCat === 'temp' ? 0 : 1;
    }
    fillConv(seedUnit, seedVal);
    rows.oninput = function (e) {
      var inp = e.target.closest('input[data-unit]');
      if (!inp) return;
      var n = parseNum(inp.value);
      if (inp.value.trim() === '') {
        fillConv(inp.getAttribute('data-unit'), null, inp);
        return;
      }
      if (!isFinite(n)) return;
      fillConv(inp.getAttribute('data-unit'), n, inp);
    };
  }
  function fillConv(fromUnit, value, keepEl) {
    if (convLock) return;
    convLock = true;
    var map = (value == null || !isFinite(value)) ? null : convertAll(convCat, fromUnit, value);
    document.querySelectorAll('#conv-rows input[data-unit]').forEach(function (inp) {
      if (keepEl && inp === keepEl) return;
      var u = inp.getAttribute('data-unit');
      inp.value = map && isFinite(map[u]) ? fmtComma(map[u], 10) : '';
    });
    convLock = false;
  }
  function setConvCat(cat) {
    convCat = cat;
    document.querySelectorAll('#conv-cats button').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-cat') === cat);
    });
    renderConv(false);
  }

  function renderPad() {
    if ($('pad-val')) $('pad-val').textContent = keys.error ? 'Error' : padDisplay(keys.cur);
    if ($('pad-expr')) $('pad-expr').textContent = keys.expr || '';
  }
  function pressPad(key) {
    keys = padPress(keys, key);
    renderPad();
    var btn = document.querySelector('#pad-keys button[data-k="' + key + '"]');
    if (btn) {
      btn.classList.add('flash');
      setTimeout(function () { btn.classList.remove('flash'); }, 120);
    }
  }

  function bind() {
    var openBtn = $('calc-open');
    var backBtn = $('calc-back');
    if (openBtn) openBtn.addEventListener('click', function (e) { e.preventDefault(); showCalc(); });
    if (backBtn) backBtn.addEventListener('click', function (e) { e.preventDefault(); hideCalc(); });

    ['drip', 'convert', 'calc'].forEach(function (id) {
      var tab = $('calc-tab-' + id);
      if (tab) tab.addEventListener('click', function () { showTab(id); });
    });

    var form = $('drip-form');
    if (form) {
      form.addEventListener('input', renderDrip);
      form.addEventListener('change', renderDrip);
      form.addEventListener('submit', function (e) { e.preventDefault(); renderDrip(); });
    }
    if ($('drip-dose-unit')) $('drip-dose-unit').addEventListener('change', function () { syncTimeAndWeight(); renderDrip(); });
    if ($('drip-unit-kg')) $('drip-unit-kg').addEventListener('click', function () { setWeightUnit('kg'); });
    if ($('drip-unit-lb')) $('drip-unit-lb').addEventListener('click', function () { setWeightUnit('lb'); });
    document.querySelectorAll('.drip-set').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $('drip-set').value = btn.getAttribute('data-gtt');
        renderDrip();
      });
    });
    if ($('drip-clear')) $('drip-clear').addEventListener('click', clearDrip);
    document.querySelectorAll('.spike-vol').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectSpikeVolume(btn.getAttribute('data-ml'));
      });
    });
    if ($('spike-drug-btn')) $('spike-drug-btn').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openSpikePicker();
    });
    if ($('spike-picker')) $('spike-picker').addEventListener('click', function (e) {
      var opt = e.target.closest('[data-key]');
      if (!opt) return;
      selectSpikeDrug(opt.getAttribute('data-key'));
    });
    if ($('spike-recipes')) $('spike-recipes').addEventListener('click', function (e) {
      var recBtn = e.target.closest('[data-id]');
      if (recBtn) selectSpikeRecipe(recBtn.getAttribute('data-id'));
    });
    if ($('spike-who-wrap')) $('spike-who-wrap').addEventListener('click', function (e) {
      var w = e.target.closest('[data-who]');
      if (w) selectSpikeWho(w.getAttribute('data-who'));
    });
    if ($('spike-age')) {
      $('spike-age').addEventListener('input', applyAgeToWho);
      $('spike-age').addEventListener('change', applyAgeToWho);
    }
    if ($('spike-typical-btn')) $('spike-typical-btn').addEventListener('click', function () {
      var rec = currentSpikeRecipe();
      var pre = rec ? dosePrefill(rec) : null;
      if (pre && pre.typical && $('drip-dose')) {
        $('drip-dose').value = String(pre.typical.value);
        if (pre.typical.unit && $('drip-dose-unit')) $('drip-dose-unit').value = pre.typical.unit;
        spike.lastAutoDose = { value: pre.typical.value, unit: pre.typical.unit };
        renderDrip();
      }
    });
    document.addEventListener('click', function (e) {
      if (!spike.pickerOpen) return;
      var box = $('spike-box');
      if (box && box.contains(e.target)) return;
      openSpikePicker(false);
    });
    if ($('drip-volume')) $('drip-volume').addEventListener('input', function () {
      applyCurrentRecipe();
    });
    if ($('drip-weight')) $('drip-weight').addEventListener('input', function () {
      applyCurrentRecipe();
    });
    if ($('drip-onhand')) $('drip-onhand').addEventListener('input', function () {
      if (!sameAuto(spike.lastAutoOnHand, $('drip-onhand').value, $('drip-onhand-unit') && $('drip-onhand-unit').value)) {
        spike.lastAutoOnHand = null;
      }
    });
    if ($('drip-dose')) $('drip-dose').addEventListener('input', function () {
      if (!sameAuto(spike.lastAutoDose, $('drip-dose').value, $('drip-dose-unit') && $('drip-dose-unit').value)) {
        spike.lastAutoDose = null;
      }
    });
    if (form) {
      form.addEventListener('focusin', function (e) {
        focusSlot = slotFromEventTarget(e.target);
        renderFormula();
      });
      form.addEventListener('focusout', function () {
        setTimeout(function () {
          var a = document.activeElement;
          if (!form.contains(a)) {
            focusSlot = null;
            renderFormula();
          }
        }, 0);
      });
    }
    var frac = $('fx-frac');
    if (frac) frac.addEventListener('click', function (e) {
      var slot = e.target.closest('[data-slot]');
      if (slot) focusSlotInput(slot.getAttribute('data-slot'));
    });

    document.querySelectorAll('.qwt').forEach(function (box) {
      var go = box.querySelector('.qwt-go');
      var inp = box.querySelector('.qwt-lb');
      if (go) go.addEventListener('click', function () { convertQwt(box); });
      if (inp) {
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); convertQwt(box); }
        });
      }
    });

    document.querySelectorAll('#conv-cats button').forEach(function (btn) {
      btn.addEventListener('click', function () { setConvCat(btn.getAttribute('data-cat')); });
    });

    var pad = $('pad-keys');
    if (pad) pad.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-k]');
      if (btn) pressPad(btn.getAttribute('data-k'));
    });

    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('view-calc')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (currentTab !== 'calc') return;
      var t = e.target;
      if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
      var k = e.key;
      var m = null;
      if (/^[0-9]$/.test(k) || k === '.') m = k;
      else if (k === ',') m = '.';
      else if (k === '+' || k === '-' || k === '*' || k === '/') m = k;
      else if (k === 'x' || k === 'X') m = '*';
      else if (k === 'Enter' || k === '=') m = '=';
      else if (k === 'Backspace' || k === 'Delete') m = 'BS';
      else if (k === 'Escape' || k === 'c' || k === 'C') m = 'AC';
      else if (k === '%') m = '%';
      if (!m) return;
      e.preventDefault();
      pressPad(m);
    });

    renderSpikeChrome();
    syncTimeAndWeight();
    renderDrip();
    renderConv(false);
    renderPad();
  }

  function boot() { bind(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  api.open = showCalc;
  api.close = hideCalc;
  api.showTab = showTab;
  api.fillDrip = fillDrip;
  api.clearDrip = clearDrip;
  api.renderDrip = renderDrip;
  api.setConvCat = setConvCat;
  api.press = pressPad;
  api.currentTab = function () { return currentTab; };
  api.setFocusSlot = function (id) { focusSlot = id || null; renderFormula(); };
  api.convertQwt = convertQwt;
  api.openSpikePicker = openSpikePicker;
  api.applySpikedBag = applySpikedBag;
  api.selectSpikeDrug = selectSpikeDrug;
  api.selectSpikeVolume = selectSpikeVolume;
  api.currentSpikeRecipe = currentSpikeRecipe;
  root.PharmCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
