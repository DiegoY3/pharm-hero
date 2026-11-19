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
    'mg/hr':      { mass: 'mg',  weight: false, timeMin: 60 },
    'mcg/kg':     { mass: 'mcg', weight: true,  timeMin: null },
    'mg/kg':      { mass: 'mg',  weight: true,  timeMin: null },
    'mcg':        { mass: 'mcg', weight: false, timeMin: null },
    'mg':         { mass: 'mg',  weight: false, timeMin: null },
    'g':          { mass: 'g',   weight: false, timeMin: null }
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

  function parseTimeToMin(raw, unit) {
    if (isBlank(raw)) return null;
    var s = String(raw).trim().replace(/,/g, '');
    var m = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*(min|mins|minute|minutes|m|hr|hrs|hour|hours|h)?$/i);
    if (!m) return NaN;
    var n = Number(m[1]);
    if (!isFinite(n)) return NaN;
    var u = (m[2] || unit || 'min').toLowerCase();
    if (u === 'hr' || u === 'hrs' || u === 'hour' || u === 'hours' || u === 'h') return n * 60;
    return n;
  }
  function defaultTimeForUnit(doseUnit) {
    var unit = DOSE_UNITS[doseUnit];
    if (!unit || unit.timeMin == null) return { value: null, unit: 'min', auto: true };
    return { value: unit.timeMin, unit: 'min', auto: true };
  }
  function resolveTime(input, unit) {
    unit = unit || (input && DOSE_UNITS[input.doseUnit]) || null;
    var hasKey = !!(input && Object.prototype.hasOwnProperty.call(input, 'timeMin'));
    var hasTime = !!(input && Object.prototype.hasOwnProperty.call(input, 'time'));
    if (hasKey) {
      if (isBlank(input.timeMin)) return { present: false, minutes: null, auto: false };
      var fromMin = parseTimeToMin(input.timeMin, 'min');
      if (fromMin == null || !isFinite(fromMin)) return { present: true, minutes: fromMin, auto: false, invalid: true };
      return { present: true, minutes: fromMin, auto: false };
    }
    if (hasTime) {
      if (isBlank(input.time)) return { present: false, minutes: null, auto: false };
      var minutes = parseTimeToMin(input.time, (input && input.timeUnit) || 'min');
      if (minutes == null || !isFinite(minutes)) return { present: true, minutes: minutes, auto: false, invalid: true };
      return { present: true, minutes: minutes, auto: false };
    }
    if (unit && unit.timeMin != null) return { present: true, minutes: unit.timeMin, auto: true };
    return { present: false, minutes: null, auto: true };
  }
  function fmtResult(n) {
    if (n == null || !isFinite(n)) return '—';
    var nearest = Math.round(n);
    if (Math.abs(n - nearest) <= Math.max(1e-8, Math.abs(n) * 1e-10)) return fmtComma(nearest, 0);
    if (Math.abs(n) >= 1) return fmtComma(Math.round(n * 10) / 10, 1);
    return fmtComma(n, 4);
  }
  function inferResultUnit(f) {
    if (f.hasDripSet && (f.hasTime || f.dosePerTime)) return 'gtts/min';
    if (f.hasDripSet && f.hasVolume && !f.hasTime && !f.dosePerTime) return 'gtts';
    var mass = f.doseMass || 'mg';
    if (f.hasDose && !f.hasVolume && !f.hasDripSet && !f.hasOnHand) {
      var label = mass;
      if (f.dosePerKg && !f.hasWeight) label += '/kg';
      if (f.dosePerTime && !f.hasTime) label += '/' + f.dosePerTime;
      return label;
    }
    if (f.hasVolume && f.hasTime && !f.hasDripSet && !f.hasDose) return 'mL/min';
    if (f.hasVolume && f.hasOnHand && f.hasDose && !f.hasDripSet) {
      if (f.dosePerTime && !f.hasTime) return 'mL/' + f.dosePerTime;
      return 'mL';
    }
    if (f.hasVolume && !f.hasDripSet && !f.hasDose && !f.hasTime && !f.hasOnHand) return 'mL';
    if (f.hasDripSet) return 'gtts/min';
    if (f.hasDose) {
      var leftover = mass;
      if (f.dosePerKg && !f.hasWeight) leftover += '/kg';
      if (f.dosePerTime && !f.hasTime) leftover += '/' + f.dosePerTime;
      return leftover;
    }
    return '';
  }

  function computeDrip(input) {
    input = input || {};
    var unit = DOSE_UNITS[input.doseUnit];
    if (!isBlank(input.dose) && !unit) return { ok: false, error: 'Pick a dose unit.' };
    unit = unit || { mass: 'mcg', weight: false, timeMin: null };

    function readFactor(raw, label, role) {
      if (isBlank(raw)) return { present: false, value: 1 };
      var n = parseNum(raw);
      if (!isFinite(n)) return { error: 'Use numbers only.' };
      if (n < 0) return { error: label + ' must be greater than zero.' };
      if (n === 0 && role === 'den') return { zeroDen: true };
      if (n === 0) return { error: label + ' must be greater than zero.' };
      return { present: true, value: n };
    }

    var doseR = readFactor(input.dose, 'Desired dose', 'num');
    if (doseR.error) return { ok: false, error: doseR.error };

    var usesWeight = !!unit.weight;
    var weightR = { present: false, value: 1, kg: null };
    if (usesWeight) {
      if (isBlank(input.weight)) {
        weightR = { present: false, value: 1, kg: null };
      } else {
        var w = parseNum(input.weight);
        if (!isFinite(w)) return { ok: false, error: 'Use numbers only.' };
        if (w <= 0) return { ok: false, error: 'Weight must be greater than zero.' };
        var weightKg = toKg(w, input.weightUnit || 'kg');
        weightR = { present: true, value: weightKg, kg: weightKg, raw: w };
      }
    }

    var volR = readFactor(input.volumeMl, 'Volume', 'num');
    if (volR.error) return { ok: false, error: volR.error };
    var setR = readFactor(input.dripSet, 'Drip set', 'num');
    if (setR.error) return { ok: false, error: setR.error };
    var onR = readFactor(input.onHand, 'Drug on hand', 'den');
    if (onR.error) return { ok: false, error: onR.error };
    if (onR.zeroDen) return { ok: false, invalid: true };

    var t = resolveTime(input, unit);
    var timeR;
    if (!t.present) {
      timeR = { present: false, value: 1, minutes: null, auto: !!t.auto };
    } else if (t.invalid || !isFinite(t.minutes)) {
      return { ok: false, error: 'Use numbers only.' };
    } else if (t.minutes === 0) {
      return { ok: false, invalid: true };
    } else if (t.minutes < 0) {
      return { ok: false, error: 'Time must be greater than zero.' };
    } else {
      timeR = { present: true, value: t.minutes, minutes: t.minutes, auto: !!t.auto };
    }

    var hasNumerator = doseR.present || weightR.present || volR.present || setR.present;
    var hasProblem = doseR.present || weightR.present || volR.present || onR.present;
    if (!hasNumerator || !hasProblem) {
      return { ok: false, incomplete: true, error: 'Enter a value to solve.' };
    }

    var doseMcg = null;
    var onHandMcg = null;
    var sameUnit = unit.mass;
    var doseSame = doseR.present ? doseR.value : null;
    var onHandSame = onR.present ? onR.value : null;
    if (doseR.present) {
      doseMcg = massToMcg(doseR.value, unit.mass);
      if (!isFinite(doseMcg)) return { ok: false, error: 'That unit is not supported.' };
    }
    if (onR.present) {
      onHandMcg = massToMcg(onR.value, input.onHandUnit || 'mg');
      if (!isFinite(onHandMcg)) return { ok: false, error: 'That unit is not supported.' };
      if (doseR.present) {
        var aligned = alignOnHandToDoseUnit(input.onHand, input.onHandUnit || 'mg', input.doseUnit);
        if (aligned) {
          onHandSame = aligned.value;
          sameUnit = aligned.unit;
          doseSame = mcgToMass(doseMcg, aligned.unit);
        }
      }
    }

    var numer = 1;
    if (doseR.present) numer *= (doseR.present && onR.present) ? doseMcg : doseR.value;
    if (weightR.present) numer *= weightR.value;
    if (volR.present) numer *= volR.value;
    if (setR.present) numer *= setR.value;
    var den = 1;
    if (onR.present) den *= (doseR.present && isFinite(onHandMcg)) ? onHandMcg : onR.value;
    if (timeR.present) den *= timeR.value;
    if (den === 0) return { ok: false, invalid: true };
    var exact = numer / den;
    if (!isFinite(exact)) return { ok: false, invalid: true };

    var resultUnit = inferResultUnit({
      hasDose: doseR.present,
      hasWeight: weightR.present,
      hasVolume: volR.present,
      hasDripSet: setR.present,
      hasOnHand: onR.present,
      hasTime: timeR.present,
      doseMass: unit.mass,
      dosePerKg: !!unit.weight,
      dosePerTime: unit.timeMin === 1 ? 'min' : (unit.timeMin === 60 ? 'hr' : null)
    });

    var mlHr = null;
    if (setR.present && resultUnit === 'gtts/min') mlHr = (exact / setR.value) * 60;
    else if (volR.present && timeR.present && !setR.present) mlHr = (volR.value / timeR.value) * 60;

    var mcgPerMl = null;
    var mgPerMl = null;
    var concLabel = '—';
    if (onR.present && volR.present) {
      mcgPerMl = onHandMcg / volR.value;
      mgPerMl = mcgPerMl / 1000;
      if (String(input.onHandUnit || 'mg').toLowerCase() === 'meq') {
        concLabel = fmtComma(onR.value / volR.value, 6) + ' mEq/mL';
        mcgPerMl = null;
        mgPerMl = null;
      } else if (mgPerMl >= 0.1) {
        concLabel = fmtComma(mgPerMl, 6) + ' mg/mL  (' + fmtComma(mcgPerMl, 4) + ' mcg/mL)';
      } else {
        concLabel = fmtComma(mcgPerMl, 6) + ' mcg/mL';
      }
    }

    var gtts = (resultUnit === 'gtts/min' || resultUnit === 'gtts') ? Math.round(exact) : null;

    var notes = [];
    if (timeR.present) {
      if (timeR.auto) {
        notes.push('Time is ' + timeR.minutes + ' min because the dose is per ' + (timeR.minutes === 1 ? 'minute' : 'hour') + '.');
      } else if (input.timeUnit === 'hr' || (input.time && /hr|hour/i.test(String(input.time)))) {
        var hrs = timeR.minutes / 60;
        notes.push(fmtComma(hrs, 6) + ' hr = ' + fmtComma(timeR.minutes, 4) + ' min.');
      } else {
        notes.push('Time is ' + fmtComma(timeR.minutes, 4) + ' min.');
      }
    }
    if (usesWeight && weightR.present && input.weightUnit === 'lb') {
      notes.push(fmtComma(weightR.raw, 6) + ' lb ÷ 2.2 = ' + fmtComma(weightR.kg, 2) + ' kg.');
    }
    if (doseR.present && onR.present) {
      var origUnit = input.onHandUnit || 'mg';
      if (origUnit !== sameUnit) {
        notes.push(fmtComma(onR.value, 6) + ' ' + origUnit + ' = ' + fmtComma(onHandSame, 6) + ' ' + sameUnit + ' so it matches the dose unit.');
      } else if (unit.mass !== origUnit) {
        notes.push('Dose and drug on hand are both in ' + sameUnit + ' before dividing.');
      }
    }
    if (!doseR.present || (usesWeight && !weightR.present) || !volR.present || !setR.present || !onR.present || !timeR.present) {
      notes.push('Blank fields are left out of the equation.');
    }

    var numParts = [];
    if (doseR.present) numParts.push(fmtComma(doseR.present && onR.present ? doseSame : doseR.value, 8));
    if (weightR.present) numParts.push(fmtComma(weightR.kg, 6));
    if (volR.present) numParts.push(fmtComma(volR.value, 6));
    if (setR.present) numParts.push(fmtComma(setR.value, 6));
    var denParts = [];
    if (onR.present) denParts.push(fmtComma(doseR.present ? onHandSame : onR.value, 8));
    if (timeR.present) denParts.push(fmtComma(timeR.minutes, 4));

    return {
      ok: true,
      value: exact,
      display: fmtResult(exact),
      resultUnit: resultUnit,
      gtts: gtts != null ? gtts : Math.round(exact),
      gttsExact: exact,
      mlHr: mlHr,
      mcgPerMl: mcgPerMl,
      mgPerMl: mgPerMl,
      concLabel: concLabel,
      timeMin: timeR.present ? timeR.minutes : null,
      weightKg: weightR.present ? weightR.kg : null,
      usesWeight: usesWeight,
      doseMcg: doseMcg,
      onHandMcg: onHandMcg,
      sameUnit: sameUnit,
      notes: notes,
      numerator: numParts.join(' × '),
      denominator: denParts.join(' × '),
      formula: usesWeight
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
        display: filledW ? fmtComma(kgVal, 2) : SLOT_LABELS.weight,
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
      var resolved = resolveTime(input, unit);
      if (resolved.present && isFinite(resolved.minutes)) {
        time = {
          id: 'time',
          label: SLOT_LABELS.time,
          filled: true,
          value: resolved.minutes,
          display: fmtComma(resolved.minutes, 8),
          focus: focus === 'time',
          hidden: false
        };
        timeMin = resolved.minutes;
      } else {
        time = rawSlot('time', '');
        timeMin = null;
      }
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
  function collectUnitHits(text, unitRe) {
    var hits = [];
    var used = [];
    var src = String(text || '');
    var re = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(?:-|–|to)\\s*(\\d+(?:\\.\\d+)?)\\s*' + unitRe, 'gi');
    var m;
    while ((m = re.exec(src))) {
      var a = parseFloat(m[1]), b = parseFloat(m[2]);
      hits.push({ min: Math.min(a, b), max: Math.max(a, b), exact: a === b ? a : null });
      used.push([m.index, m.index + m[0].length]);
    }
    re = new RegExp('(\\d+(?:\\.\\d+)?)\\s*' + unitRe, 'gi');
    while ((m = re.exec(src))) {
      var covered = used.some(function (sp) { return m.index >= sp[0] && m.index < sp[1]; });
      if (covered) continue;
      var v = parseFloat(m[1]);
      hits.push({ min: v, max: v, exact: v });
    }
    return hits;
  }
  function stripMixAndMax(text) {
    return String(text || '')
      .replace(/\bmax(?:imum)?\s+\d+(?:\.\d+)?\s*(mcg|ug|µg|mg|gm|g|mEq|meq)\b/gi, ' ')
      .replace(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)(?:\s*\/\s*kg)?\s*(?:diluted\s+in|in|\/)\s*(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*ml/gi, ' ')
      .replace(/(\d+(?:\.\d+)?)\s*(mcg|ug|µg|mg|gm|g|mEq|meq)(?:\s*\/\s*kg)?\s*(?:diluted\s+in|in|\/)\s*(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*ml/gi, ' ');
  }
  function parseMasterDose(text) {
    var rate = parseDoseRate(text);
    if (rate && rate.unit) {
      return {
        unit: rate.unit,
        min: rate.min,
        max: rate.max,
        exact: rate.exact,
        typical: rate.typical,
        multiple: false,
        kind: 'rate'
      };
    }
    var i, hits, unit, src;
    var perKg = [
      { unit: 'mcg/kg', re: '(?:mcg|ug|µg)\\s*\\/\\s*kg(?!\\s*\\/\\s*(?:min|hr))' },
      { unit: 'mg/kg', re: 'mg\\s*\\/\\s*kg(?!\\s*\\/\\s*(?:min|hr))' }
    ];
    for (i = 0; i < perKg.length; i++) {
      hits = collectUnitHits(text, perKg[i].re);
      if (!hits.length) continue;
      if (hits.length > 1) return { unit: perKg[i].unit, min: null, max: null, exact: null, typical: null, multiple: true, kind: 'bolus' };
      return { unit: perKg[i].unit, min: hits[0].min, max: hits[0].max, exact: hits[0].exact, typical: null, multiple: false, kind: 'bolus' };
    }
    src = stripMixAndMax(text);
    var plain = [
      { unit: 'mcg', re: '(?:mcg|ug|µg)\\b(?!\\s*\\/)' },
      { unit: 'mg', re: 'mg\\b(?!\\s*\\/)' },
      { unit: 'g', re: '(?:^|[^a-zµμ])(?:gm|g)\\b(?!\\s*\\/)' }
    ];
    for (i = 0; i < plain.length; i++) {
      hits = collectUnitHits(src, plain[i].re);
      if (!hits.length) continue;
      if (hits.length > 1) return { unit: plain[i].unit, min: null, max: null, exact: null, typical: null, multiple: true, kind: 'bolus' };
      return { unit: plain[i].unit, min: hits[0].min, max: hits[0].max, exact: hits[0].exact, typical: null, multiple: false, kind: 'bolus' };
    }
    return null;
  }
  function masterIndicationLabel(text) {
    var m = String(text || '').match(/^\s*([^:]{2,48}):/);
    if (m) {
      var lab = m[1].replace(/\(1mg\/250ml D5W Drip\)/i, '').replace(/\(1:10,000\)|\(1:1,000\)/g, '').trim();
      lab = lab.replace(/\s+/g, ' ');
      if (lab && !/^adult$/i.test(lab) && !/^pediatric$/i.test(lab)) return lab;
    }
    if (/maintenance infusion/i.test(text)) return 'Maintenance infusion';
    if (/maintenance/i.test(text) && /mg\/hr|mg\/min/i.test(text)) return 'Maintenance';
    if (/then infuse/i.test(text)) return 'Infusion after bolus';
    if (/crush injury/i.test(text)) return 'Crush injury maintenance';
    if (/no current aha/i.test(text)) return 'Maintenance infusion';
    if (looksLikeInfusion(text)) return 'Infusion';
    var short = String(text || '').replace(/\s+/g, ' ').trim();
    if (short.length > 40) short = short.slice(0, 38) + '…';
    return short || 'Dose';
  }
  function listMasterDrugEntries(drugs) {
    var list = [];
    if (!drugs) return list;
    Object.keys(drugs).forEach(function (key) {
      var d = drugs[key];
      if (!d) return;
      var rows = d.dosage || [];
      rows.forEach(function (row, index) {
        var text = String(row && row.t || '');
        if (!text || skipFillerLine(text)) return;
        var mix = parseMix(text);
        var dose = parseMasterDose(text);
        var hasMix = !!(mix && (mix.amount != null || mix.volume != null));
        if (!dose && !hasMix) return;
        var rec = {
          id: key + '|master|' + String(row.who || '').toLowerCase() + '|' + index,
          drugKey: key,
          name: d.name || key,
          alias: d.alias || '',
          extra: d.module == null,
          module: d.module,
          who: row.who || '',
          label: masterIndicationLabel(text),
          text: text,
          field: fieldPath(key, row.who || '?', index),
          mix: hasMix ? mix : null,
          dose: dose,
          over: parseOverMinutes(text),
          ageBand: parseAgeBand(text),
          noRecommendation: /no current aha recommendations/i.test(text)
        };
        rec.doseUnit = dose && dose.unit && !dose.multiple ? dose.unit : null;
        rec.usesWeight = !!(rec.doseUnit && DOSE_UNITS[rec.doseUnit] && DOSE_UNITS[rec.doseUnit].weight) || !!(mix && mix.amountPerKg);
        list.push(rec);
      });
    });
    return list;
  }
  function groupMasterDrugs(entries, drugs) {
    var groups = [];
    var map = {};
    if (drugs) {
      Object.keys(drugs).forEach(function (key) {
        var d = drugs[key];
        if (!d || map[key]) return;
        map[key] = {
          drugKey: key,
          name: d.name || key,
          alias: d.alias || '',
          extra: d.module == null,
          module: d.module,
          recipes: []
        };
        groups.push(map[key]);
      });
    }
    (entries || []).forEach(function (r) {
      if (!map[r.drugKey]) {
        map[r.drugKey] = {
          drugKey: r.drugKey,
          name: r.name,
          alias: r.alias,
          extra: r.extra,
          module: r.module,
          recipes: []
        };
        groups.push(map[r.drugKey]);
      }
      map[r.drugKey].recipes.push(r);
    });
    groups.sort(function (a, b) {
      var am = a.module == null ? 99 : a.module;
      var bm = b.module == null ? 99 : b.module;
      if (am !== bm) return am - bm;
      return String(a.name).localeCompare(String(b.name));
    });
    return groups;
  }
  function formatDoseHint(dose) {
    if (!dose || !dose.unit || dose.multiple) return '';
    if (dose.exact == null && dose.min != null && dose.max != null) {
      var hint = 'Drug Box: ' + dose.min + (dose.min === dose.max ? '' : '–' + dose.max) + ' ' + dose.unit;
      if (dose.typical != null) hint += ' (typically starts ' + dose.typical + ')';
      return hint;
    }
    return '';
  }
  function formatMixHint(mix) {
    if (!mix || (mix.amount == null && mix.volume == null)) return '';
    var amt = '';
    if (mix.amount != null) {
      amt = (mix.rangeAmount ? (mix.amount + '–' + mix.amountMax) : String(mix.amount)) +
        ' ' + mix.amountUnit + (mix.amountPerKg ? '/kg' : '');
    }
    var vol = '';
    if (mix.volume != null) {
      vol = mix.rangeVolume ? (mix.volume + '–' + mix.volumeMax + ' mL') : (mix.volume + ' mL');
    }
    var fluid = mix.fluid ? ' ' + mix.fluid : '';
    if (amt && vol) return 'Drug Box: ' + amt + ' in ' + vol + fluid;
    if (amt) return 'Drug Box: ' + amt + fluid;
    if (vol) return 'Drug Box: ' + vol + fluid;
    return '';
  }
  function masterPrefill(entry) {
    var out = {
      dose: null,
      doseUnit: null,
      doseHint: '',
      onHand: null,
      onHandUnit: null,
      volumeMl: null,
      mixHint: '',
      volumeHint: '',
      field: entry && entry.field ? entry.field : '',
      text: entry && entry.text ? entry.text : '',
      loadedFields: []
    };
    if (!entry) return out;
    var dose = entry.dose || parseMasterDose(entry.text || '');
    if (dose && dose.unit && !dose.multiple) {
      out.doseUnit = dose.unit;
      out.loadedFields.push('doseUnit');
      if (dose.exact != null) {
        out.dose = dose.exact;
        out.loadedFields.push('dose');
      }
      out.doseHint = formatDoseHint(dose);
    }
    var mix = entry.mix;
    if (mix) {
      if (mix.amount != null && !mix.rangeAmount && !mix.amountPerKg) {
        out.onHand = mix.amount;
        out.onHandUnit = mix.amountUnit;
        out.loadedFields.push('onHand');
        if (mix.amountUnit) out.loadedFields.push('onHandUnit');
      }
      if (mix.volume != null && !mix.rangeVolume) {
        out.volumeMl = mix.volume;
        out.loadedFields.push('volume');
      } else if (mix.volume != null && mix.rangeVolume) {
        out.volumeHint = 'Drug Box: ' + mix.volume + '–' + mix.volumeMax + ' mL';
      }
      out.mixHint = formatMixHint(mix);
    }
    return out;
  }
  function applyMasterDrugChange(prev, prefill) {
    prev = prev || {};
    var next = {
      dose: '',
      doseUnit: 'mcg/kg/min',
      volumeMl: '',
      onHand: '',
      onHandUnit: 'mg',
      weight: Object.prototype.hasOwnProperty.call(prev, 'weight') ? prev.weight : '',
      weightUnit: prev.weightUnit || 'kg',
      dripSet: Object.prototype.hasOwnProperty.call(prev, 'dripSet') ? prev.dripSet : '60',
      time: prev.time,
      timeUnit: prev.timeUnit || 'min',
      timeManual: !!prev.timeManual,
      loaded: { dose: false, doseUnit: false, onHand: false, onHandUnit: false, volume: false },
      loadedValues: { dose: null, doseUnit: null, onHand: null, onHandUnit: null, volume: null },
      hints: { dose: '', mix: '', volume: '' },
      spikeUntouched: true
    };
    if (prefill) {
      if (prefill.doseUnit) {
        next.doseUnit = prefill.doseUnit;
        next.loaded.doseUnit = true;
        next.loadedValues.doseUnit = prefill.doseUnit;
      }
      if (prefill.dose != null) {
        next.dose = prefill.dose;
        next.loaded.dose = true;
        next.loadedValues.dose = prefill.dose;
      }
      if (prefill.onHand != null) {
        next.onHand = prefill.onHand;
        next.loaded.onHand = true;
        next.loadedValues.onHand = prefill.onHand;
      }
      if (prefill.onHandUnit) {
        next.onHandUnit = prefill.onHandUnit;
        next.loaded.onHandUnit = true;
        next.loadedValues.onHandUnit = prefill.onHandUnit;
      }
      if (prefill.volumeMl != null) {
        next.volumeMl = prefill.volumeMl;
        next.loaded.volume = true;
        next.loadedValues.volume = prefill.volumeMl;
      }
      next.hints.dose = prefill.doseHint || '';
      next.hints.mix = prefill.mixHint || '';
      next.hints.volume = prefill.volumeHint || '';
    }
    if (!next.timeManual) {
      var auto = defaultTimeForUnit(next.doseUnit);
      next.time = auto.value == null ? '' : auto.value;
      next.timeUnit = auto.unit || 'min';
    }
    return next;
  }
  function masterLoadedTagVisible(field, currentValue, currentUnit, loadedValues) {
    if (!loadedValues) return false;
    var n = parseNum(currentValue);
    if (field === 'dose') return loadedValues.dose != null && isFinite(n) && Number(loadedValues.dose) === Number(n);
    if (field === 'onHand') {
      return loadedValues.onHand != null && isFinite(n) && Number(loadedValues.onHand) === Number(n) &&
        (!loadedValues.onHandUnit || loadedValues.onHandUnit === currentUnit);
    }
    if (field === 'volume') return loadedValues.volume != null && isFinite(n) && Number(loadedValues.volume) === Number(n);
    return false;
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

  function parseBagVolume(raw) {
    var n = parseNum(raw);
    return n != null && isFinite(n) && n > 0 ? n : null;
  }
  function isPresetBagVolume(n) {
    return BAG_VOLUMES.indexOf(Number(n)) !== -1;
  }
  function computeSpikedBag(input) {
    input = input || {};
    var recipe = input.recipe || null;
    var volumeMl = parseBagVolume(input.volumeMl);
    var weightRaw = input.weight;
    var weightKg = null;
    if (!isBlank(weightRaw)) {
      var w = parseNum(weightRaw);
      if (isFinite(w)) weightKg = toKg(w, input.weightUnit || 'kg');
    }
    var add = amountToAdd(recipe, volumeMl, weightKg);
    var dripSet = isBlank(input.dripSet) ? 60 : input.dripSet;
    var pre = dosePrefill(recipe);
    var dose = input.dose;
    var doseUnit = input.doseUnit;
    if (isBlank(dose) && pre && pre.fill) {
      dose = pre.value;
      doseUnit = pre.unit;
    } else if (isBlank(doseUnit) && pre && pre.unit) {
      doseUnit = pre.unit;
    }
    var onHand = add && add.ok ? add.amount : input.onHand;
    var onHandUnit = add && add.ok ? add.unit : (input.onHandUnit || (add && add.unit) || 'mg');
    var timeMin = input.timeMin;
    if ((timeMin == null || timeMin === '') && recipe && recipe.over && recipe.over.exact != null) {
      timeMin = recipe.over.exact;
    }
    var rate = null;
    if (recipe && recipe.formulaMode === 'volumeRate') {
      var mlPerMin = input.mlPerMin != null ? input.mlPerMin : (recipe.rate && recipe.rate.mlPerMin);
      rate = computeVolumeRate({
        mlPerMin: mlPerMin,
        dripSet: dripSet,
        volumeMl: volumeMl,
        onHand: onHand,
        onHandUnit: onHandUnit
      });
    } else if (recipe && recipe.formulaMode === 'timed') {
      rate = computeTimedInfusion({
        volumeMl: volumeMl,
        dripSet: dripSet,
        timeMin: timeMin,
        onHand: onHand,
        onHandUnit: onHandUnit
      });
    } else if (!isBlank(dose) && doseUnit) {
      var dripInput = {
        dose: dose,
        doseUnit: doseUnit,
        weight: weightRaw,
        weightUnit: input.weightUnit || 'kg',
        volumeMl: volumeMl,
        dripSet: dripSet,
        onHand: onHand,
        onHandUnit: onHandUnit
      };
      if (timeMin != null && timeMin !== '') dripInput.timeMin = timeMin;
      rate = computeDrip(dripInput);
    }
    return {
      amount: add,
      rate: rate,
      volumeMl: volumeMl,
      customVolume: volumeMl != null && !isPresetBagVolume(volumeMl),
      masterTouched: false
    };
  }

  var api = {
    LB_PER_KG: LB_PER_KG,
    DOSE_UNITS: DOSE_UNITS,
    computeDrip: computeDrip,
    parseTimeToMin: parseTimeToMin,
    defaultTimeForUnit: defaultTimeForUnit,
    resolveTime: resolveTime,
    fmtResult: fmtResult,
    inferResultUnit: inferResultUnit,
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
    parseMasterDose: parseMasterDose,
    masterIndicationLabel: masterIndicationLabel,
    listMasterDrugEntries: listMasterDrugEntries,
    groupMasterDrugs: groupMasterDrugs,
    formatDoseHint: formatDoseHint,
    formatMixHint: formatMixHint,
    masterPrefill: masterPrefill,
    applyMasterDrugChange: applyMasterDrugChange,
    masterLoadedTagVisible: masterLoadedTagVisible,
    computeTimedInfusion: computeTimedInfusion,
    computeVolumeRate: computeVolumeRate,
    concentrationFromAmount: concentrationFromAmount,
    BAG_VOLUMES: BAG_VOLUMES,
    parseBagVolume: parseBagVolume,
    isPresetBagVolume: isPresetBagVolume,
    computeSpikedBag: computeSpikedBag
  };

  if (typeof document === 'undefined') {
    root.PharmCalc = api;
    return;
  }

  var weightUnit = 'kg';
  var timeUnit = 'min';
  var timeManual = false;
  var spikeWeightUnit = 'kg';
  var spikeTimeUnit = 'min';
  var spikeOpen = true;
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
    lastAutoSet: null,
    applying: false,
    open: true
  };
  var dripLastAutoSet = { value: 60, unit: 'gtt' };
  var master = {
    drugKey: '',
    recipeId: null,
    who: null,
    pickerOpen: false,
    loadedValues: { dose: null, doseUnit: null, onHand: null, onHandUnit: null, volume: null }
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
    var raw = parseNum($('spike-weight') && $('spike-weight').value);
    if (!isFinite(raw) || raw == null) return null;
    return toKg(raw, spikeWeightUnit);
  }
  function setSpikeSelectUnit(selId, unit) {
    var sel = $(selId);
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
  function syncSpikeUnitButtons() {
    var kg = $('spike-unit-kg');
    var lb = $('spike-unit-lb');
    if (kg) { kg.classList.toggle('on', spikeWeightUnit === 'kg'); kg.setAttribute('aria-pressed', spikeWeightUnit === 'kg' ? 'true' : 'false'); }
    if (lb) { lb.classList.toggle('on', spikeWeightUnit === 'lb'); lb.setAttribute('aria-pressed', spikeWeightUnit === 'lb' ? 'true' : 'false'); }
    var minBtn = $('spike-time-min');
    var hrBtn = $('spike-time-hr');
    if (minBtn) { minBtn.classList.toggle('on', spikeTimeUnit === 'min'); minBtn.setAttribute('aria-pressed', spikeTimeUnit === 'min' ? 'true' : 'false'); }
    if (hrBtn) { hrBtn.classList.toggle('on', spikeTimeUnit === 'hr'); hrBtn.setAttribute('aria-pressed', spikeTimeUnit === 'hr' ? 'true' : 'false'); }
    var v = String($('spike-set') && $('spike-set').value || '').trim();
    document.querySelectorAll('.spike-set').forEach(function (btn) {
      btn.classList.toggle('on', btn.getAttribute('data-gtt') === v);
    });
  }
  function setSpikeOpen(open) {
    spikeOpen = open != null ? !!open : !spikeOpen;
    spike.open = spikeOpen;
    var box = $('spike-box');
    var toggle = $('spike-toggle');
    if (box) box.classList.toggle('collapsed', !spikeOpen);
    if (toggle) toggle.setAttribute('aria-expanded', spikeOpen ? 'true' : 'false');
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
    var timeVal = $('drip-time') ? $('drip-time').value : '';
    var timeNum = parseTimeToMin(timeVal, timeUnit);
    return {
      dose: $('drip-dose').value,
      doseUnit: $('drip-dose-unit').value,
      weight: $('drip-weight').value,
      weightUnit: weightUnit,
      volumeMl: $('drip-volume').value,
      dripSet: $('drip-set').value,
      onHand: $('drip-onhand').value,
      onHandUnit: $('drip-onhand-unit').value,
      formulaMode: 'master',
      timeMin: timeNum,
      timeUnit: timeUnit,
      focus: focusSlot
    };
  }
  function syncTimeUnitButtons() {
    var minBtn = $('drip-time-min');
    var hrBtn = $('drip-time-hr');
    if (minBtn) { minBtn.classList.toggle('on', timeUnit === 'min'); minBtn.setAttribute('aria-pressed', timeUnit === 'min' ? 'true' : 'false'); }
    if (hrBtn) { hrBtn.classList.toggle('on', timeUnit === 'hr'); hrBtn.setAttribute('aria-pressed', timeUnit === 'hr' ? 'true' : 'false'); }
  }
  function applyAutoTime() {
    var auto = defaultTimeForUnit($('drip-dose-unit') && $('drip-dose-unit').value);
    timeUnit = 'min';
    var timeEl = $('drip-time');
    if (timeEl) timeEl.value = auto.value == null ? '' : String(auto.value);
    timeManual = false;
    syncTimeUnitButtons();
  }
  function syncDefaultDripSet(unit) {
    var setEl = $('drip-set');
    if (!setEl) return;
    var isBolus = !unit || unit.timeMin == null;
    if (isBolus) {
      if (isBlank(setEl.value) || sameAuto(dripLastAutoSet, setEl.value, 'gtt') || String(setEl.value).trim() === '60') {
        var volBlank = !$('drip-volume') || isBlank($('drip-volume').value);
        var onBlank = !$('drip-onhand') || isBlank($('drip-onhand').value);
        if (volBlank && onBlank) {
          setEl.value = '';
          dripLastAutoSet = { value: 60, unit: 'gtt' };
        }
      }
    } else if (isBlank(setEl.value)) {
      setEl.value = '60';
      dripLastAutoSet = { value: 60, unit: 'gtt' };
    }
  }
  function syncTimeAndWeight() {
    var unit = DOSE_UNITS[$('drip-dose-unit') && $('drip-dose-unit').value] || DOSE_UNITS['mcg/kg/min'];
    var usesWeight = !!unit.weight;
    var wrap = $('drip-weight-wrap');
    if (wrap) wrap.hidden = !usesWeight;
    if ($('drip-weight')) $('drip-weight').disabled = !usesWeight;
    var timeEl = $('drip-time');
    var note = $('drip-time-note');
    if (timeEl && document.activeElement === timeEl) timeManual = true;
    if (timeEl) timeEl.readOnly = false;
    if (!timeManual) applyAutoTime();
    else syncTimeUnitButtons();
    if (note) {
      if (timeEl && isBlank(timeEl.value)) note.textContent = 'enter any time';
      else if (timeManual) note.textContent = timeUnit === 'hr' ? 'custom hours' : 'custom';
      else if (unit.timeMin === 1) note.textContent = 'per minute';
      else if (unit.timeMin === 60) note.textContent = 'per hour';
      else note.textContent = 'enter any time';
    }
    if (!timeManual) syncDefaultDripSet(unit);
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
    syncTimeAndWeight();
    syncSetButtons();
    renderMasterChrome();
    renderFormula();
    var input = dripInputs();
    var out = computeDrip(input);
    var box = $('drip-out');
    var err = $('drip-error');
    var notes = $('drip-notes');
    if (!out || !out.ok) {
      if (box) box.hidden = true;
      if ($('drip-gtts')) $('drip-gtts').textContent = '—';
      if ($('drip-unit')) $('drip-unit').textContent = '';
      if ($('fx-kicker')) $('fx-kicker').textContent = '';
      if (out && (out.incomplete || out.invalid)) {
        if (err) { err.hidden = true; err.textContent = ''; }
      } else if (out && out.error) {
        if (err) { err.hidden = false; err.textContent = out.error; }
      } else if (err) { err.hidden = true; err.textContent = ''; }
      return;
    }
    if (err) { err.hidden = true; err.textContent = ''; }
    if (box) box.hidden = false;
    var unitLabel = out.resultUnit || '';
    var mainVal = out.display || fmtResult(out.value != null ? out.value : out.gttsExact);
    if ($('drip-gtts')) $('drip-gtts').textContent = mainVal;
    if ($('drip-unit')) $('drip-unit').textContent = unitLabel;
    var kicker = $('fx-kicker');
    if (kicker) kicker.textContent = unitLabel ? unitLabel + ' =' : '';
    var exactLine = '';
    if (unitLabel === 'gtts/min' && out.gtts != null && isFinite(out.gttsExact)) {
      var exact = fmtComma(out.gttsExact, 6);
      exactLine = exact === String(out.gtts)
        ? 'Exactly ' + exact + ' gtts/min'
        : 'Exact ' + exact + ' gtts/min, rounds to ' + fmtComma(out.gtts, 0) + ' drops';
    } else if (out.value != null && isFinite(out.value)) {
      exactLine = 'Exact ' + fmtComma(out.value, 6) + (unitLabel ? ' ' + unitLabel : '');
    }
    if ($('drip-exact')) $('drip-exact').textContent = exactLine;
    var mlRow = $('drip-mlhr-row');
    if (out.mlHr != null && isFinite(out.mlHr)) {
      if ($('drip-mlhr')) $('drip-mlhr').textContent = fmtComma(out.mlHr, 4);
      if (mlRow) mlRow.hidden = false;
    } else {
      if ($('drip-mlhr')) $('drip-mlhr').textContent = '—';
      if (mlRow) mlRow.hidden = true;
    }
    var concRow = $('drip-conc-row');
    if (out.concLabel && out.concLabel !== '—') {
      if ($('drip-conc')) $('drip-conc').textContent = out.concLabel;
      if (concRow) concRow.hidden = false;
    } else {
      if ($('drip-conc')) $('drip-conc').textContent = '—';
      if (concRow) concRow.hidden = true;
    }
    if (notes) {
      var allNotes = (out.notes || []).slice();
      notes.innerHTML = allNotes.map(function (n) { return '<p>' + escapeHtml(n) + '</p>'; }).join('');
      notes.hidden = !allNotes.length;
    }
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



  function spikeInputs() {
    var rec = currentSpikeRecipe();
    var vol = $('spike-volume') ? $('spike-volume').value : '';
    var timeVal = $('spike-time') ? $('spike-time').value : '';
    var timeNum = parseTimeToMin(timeVal, spikeTimeUnit);
    return {
      recipe: rec,
      volumeMl: vol,
      weight: $('spike-weight') ? $('spike-weight').value : '',
      weightUnit: spikeWeightUnit,
      dripSet: $('spike-set') ? $('spike-set').value : 60,
      dose: $('spike-dose') ? $('spike-dose').value : '',
      doseUnit: $('spike-dose-unit') ? $('spike-dose-unit').value : '',
      timeMin: timeNum,
      mlPerMin: rec && rec.rate && rec.rate.mlPerMin != null ? rec.rate.mlPerMin : undefined
    };
  }
  function fillSpikeRate(out, concFallback) {
    var extra = $('spike-add-extra');
    var hasRate = out && out.ok;
    var unitLabel = (out && out.resultUnit) || (hasRate ? 'gtts/min' : '');
    var conc = (out && out.ok && out.concLabel && out.concLabel !== '—') ? out.concLabel : (concFallback && concFallback.concLabel);
    var gttsText = '—';
    if (hasRate) {
      if (out.display) gttsText = out.display + (unitLabel && unitLabel !== 'gtts/min' ? ' ' + unitLabel : '');
      else if (out.gtts != null) gttsText = fmtComma(out.gtts, 0);
    }
    if ($('spike-gtts')) $('spike-gtts').textContent = gttsText;
    if ($('spike-mlhr')) $('spike-mlhr').textContent = hasRate && out.mlHr != null && isFinite(out.mlHr) ? fmtComma(out.mlHr, 4) : '—';
    if ($('spike-conc')) $('spike-conc').textContent = conc || '—';
    if (extra) extra.hidden = !(hasRate || conc);
  }
  function spikeAmountInfo() {
    var rec = currentSpikeRecipe();
    if (!rec) return null;
    var vol = parseBagVolume($('spike-volume') && $('spike-volume').value);
    return amountToAdd(rec, vol, spikeWeightKg());
  }
  function drugButtonLabel(group) {
    if (!group) return 'Custom';
    return group.name;
  }
  function renderSpikeChrome() {
    var vol = parseBagVolume($('spike-volume') && $('spike-volume').value);
    document.querySelectorAll('.spike-vol').forEach(function (btn) {
      var n = Number(btn.getAttribute('data-ml'));
      btn.classList.toggle('on', vol != null && n === vol);
      btn.setAttribute('aria-pressed', vol != null && n === vol ? 'true' : 'false');
    });
    var box = $('spike-box');
    if (box) box.classList.toggle('collapsed', !spikeOpen);
    var toggle = $('spike-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', spikeOpen ? 'true' : 'false');
    syncSpikeUnitButtons();
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
    var recNeedsWeight = !!(rec && rec.usesWeight);
    var wtWrap = $('spike-weight-wrap');
    if (wtWrap) wtWrap.hidden = !recNeedsWeight;
    var doseWrap = $('spike-dose-wrap');
    if (doseWrap) doseWrap.hidden = !(rec && rec.formulaMode !== 'timed' && rec.formulaMode !== 'volumeRate' && (rec.doseUnit || (rec.rate && rec.rate.unit)));
    var timeWrap = $('spike-time-wrap');
    if (timeWrap) timeWrap.hidden = !(rec && rec.formulaMode === 'timed');
    var setWrap = $('spike-set-wrap');
    if (setWrap) setWrap.hidden = !rec;
    var ageNote = $('spike-age-note');
    var bands = group ? group.recipes.filter(function (r) { return r.ageBand; }) : [];
    var ageWrap = $('spike-age-wrap');
    if (ageWrap) ageWrap.hidden = !group || !bands.length;
    if (ageNote) {
      if (!group || !bands.length) ageNote.textContent = '';
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
      var computed = computeSpikedBag(spikeInputs());
      var concOnly = (info && info.ok) ? concentrationFromAmount(info.amount, info.unit, vol) : null;
      fillSpikeRate(computed && computed.rate, concOnly);
    }
  }
  function syncSpikeChrome() {
    renderSpikeChrome();
  }
  function renderSpike() {
    renderSpikeChrome();
  }
  function applyCurrentRecipe(opts) {
    opts = opts || {};
    var rec = currentSpikeRecipe();
    spike.applying = true;
    if (!rec) {
      spike.lastAutoDose = null;
      spike.lastAutoTime = null;
      spike.applying = false;
      renderSpike();
      return;
    }
    var pre = dosePrefill(rec);
    var doseEl = $('spike-dose');
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
    var unit = (pre && pre.unit) || rec.doseUnit;
    if (unit) setSpikeSelectUnit('spike-dose-unit', unit);
    var timeEl = $('spike-time');
    if (rec.formulaMode === 'timed') {
      if (rec.over && rec.over.exact != null && timeEl && (opts.force || isBlank(timeEl.value) || sameAuto(spike.lastAutoTime, parseTimeToMin(timeEl.value, spikeTimeUnit), spikeTimeUnit))) {
        timeEl.value = String(rec.over.exact);
        spikeTimeUnit = 'min';
        spike.lastAutoTime = { value: rec.over.exact, unit: 'min' };
      }
    } else if (timeEl && (opts.force || sameAuto(spike.lastAutoTime, parseTimeToMin(timeEl.value, spikeTimeUnit), spikeTimeUnit))) {
      timeEl.value = '';
      spike.lastAutoTime = null;
    }
    spike.applying = false;
    renderSpike();
  }
  function selectSpikeVolume(ml) {
    if ($('spike-volume')) $('spike-volume').value = ml == null ? '' : String(ml);
    renderSpike();
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
      renderSpike();
      return;
    }
    var group = currentSpikeGroup();
    var whos = uniqueWhos(group);
    spike.who = whos.indexOf('Adult') !== -1 ? 'Adult' : (whos[0] || null);
    var list = recipesForWho(group, whos.length > 1 ? spike.who : null);
    spike.recipeId = list[0] ? list[0].id : null;
    applyCurrentRecipe({ force: true, clearDose: true });
    renderSpike();
  }
  function selectSpikeWho(who) {
    spike.who = who;
    var list = recipesForWho(currentSpikeGroup(), who);
    spike.recipeId = list[0] ? list[0].id : null;
    applyCurrentRecipe({ force: true, clearDose: true });
    renderSpike();
  }
  function selectSpikeRecipe(id) {
    spike.recipeId = id;
    var rec = currentSpikeRecipe();
    if (rec) spike.who = rec.who;
    applyCurrentRecipe({ force: true, clearDose: true });
    renderSpike();
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
    if (spike.pickerOpen) {
      master.pickerOpen = false;
      renderMasterChrome();
    }
    renderSpikeChrome();
  }
  function applySpikedBag(values) {
    values = values || {};
    if (values.volumeMl != null && $('spike-volume')) $('spike-volume').value = values.volumeMl;
    if (values.weight != null) {
      if ($('spike-weight')) $('spike-weight').value = values.weight;
      if (values.weightUnit) spikeWeightUnit = values.weightUnit;
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
    if (values.dose != null && $('spike-dose')) $('spike-dose').value = values.dose;
    if (values.doseUnit) setSpikeSelectUnit('spike-dose-unit', values.doseUnit);
    if (values.dripSet != null && $('spike-set')) $('spike-set').value = values.dripSet;
    if (values.time != null && $('spike-time')) {
      $('spike-time').value = values.time;
      if (values.timeUnit) spikeTimeUnit = values.timeUnit;
    } else if (values.timeMin != null && $('spike-time')) {
      $('spike-time').value = values.timeMin;
      spikeTimeUnit = 'min';
    }
    if (values.age != null && $('spike-age')) $('spike-age').value = values.age;
    if (values.open != null) setSpikeOpen(!!values.open);
    else setSpikeOpen(true);
    spike.pickerOpen = false;
    renderSpike();
  }

  function resetSpike() {
    spike.drugKey = '';
    spike.recipeId = null;
    spike.who = null;
    spike.pickerOpen = false;
    spike.lastAutoOnHand = null;
    spike.lastAutoDose = null;
    spike.lastAutoTime = null;
    spike.lastAutoSet = null;
    ['spike-age', 'spike-weight', 'spike-dose', 'spike-time'].forEach(function (id) {
      if ($(id)) $(id).value = '';
    });
    if ($('spike-volume')) $('spike-volume').value = '';
    if ($('spike-set')) $('spike-set').value = '60';
    spikeWeightUnit = 'kg';
    spikeTimeUnit = 'min';
  }
  function masterCatalog() {
    return groupMasterDrugs(listMasterDrugEntries(drugBoxDrugs()), drugBoxDrugs());
  }
  function currentMasterGroup() {
    if (!master.drugKey) return null;
    var groups = masterCatalog();
    var i;
    for (i = 0; i < groups.length; i++) {
      if (groups[i].drugKey === master.drugKey) return groups[i];
    }
    return null;
  }
  function currentMasterEntry() {
    var group = currentMasterGroup();
    if (!group) return null;
    if (master.recipeId) {
      var hit = group.recipes.filter(function (r) { return r.id === master.recipeId; })[0];
      if (hit) return hit;
    }
    var list = recipesForWho(group, master.who);
    return list[0] || group.recipes[0] || null;
  }
  function setFieldHint(id, text) {
    var el = $(id);
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
  }
  function setLoadedTag(id, on) {
    var el = $(id);
    if (!el) return;
    el.hidden = !on;
  }
  function renderMasterChrome() {
    var group = currentMasterGroup();
    var entry = currentMasterEntry();
    var pre = masterPrefill(entry);
    var btn = $('master-drug-btn');
    if (btn) {
      btn.innerHTML = escapeHtml(group ? group.name : 'None / custom');
      if (group && group.extra) btn.innerHTML += ' <span class="spike-tag extra">EXTRA</span>';
      btn.setAttribute('aria-expanded', master.pickerOpen ? 'true' : 'false');
      btn.classList.toggle('open', master.pickerOpen);
    }
    var picker = $('master-picker');
    if (picker) {
      picker.hidden = !master.pickerOpen;
      var html = '<button type="button" class="spike-opt' + (!master.drugKey ? ' on' : '') + '" data-key="">None / custom</button>';
      masterCatalog().forEach(function (g) {
        var cls = 'spike-opt' + (g.drugKey === master.drugKey ? ' on' : '');
        html += '<button type="button" class="' + cls + '" data-key="' + escapeHtml(g.drugKey) + '">';
        html += '<span class="spike-opt-name">' + escapeHtml(g.name) + '</span>';
        if (g.extra) html += '<span class="spike-tag extra">EXTRA</span>';
        html += '</button>';
      });
      picker.innerHTML = html;
    }
    var whos = uniqueWhos(group);
    var whoWrap = $('master-who-wrap');
    if (whoWrap) {
      whoWrap.hidden = !(group && whos.length > 1);
      whoWrap.querySelectorAll('[data-who]').forEach(function (b) {
        var on = master.who === b.getAttribute('data-who');
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    var recWrap = $('master-recipe-wrap');
    var recBox = $('master-recipes');
    if (recWrap && recBox) {
      var list = recipesForWho(group, whos.length > 1 ? master.who : (whos[0] || null));
      recWrap.hidden = !(group && list.length > 1);
      recBox.innerHTML = list.map(function (r) {
        var cls = 'spike-rec' + (r.id === (entry && entry.id) ? ' on' : '');
        return '<button type="button" class="' + cls + '" data-id="' + escapeHtml(r.id) + '">' +
          escapeHtml(r.label) + (whos.length <= 1 && r.who ? ' <span class="spike-who-pill">' + escapeHtml(r.who) + '</span>' : '') +
          '</button>';
      }).join('');
    }
    setFieldHint('drip-dose-hint', entry ? (pre.doseHint || '') : '');
    if (entry && pre.mixHint && pre.onHand != null || (entry && pre.mixHint && entry.mix && entry.mix.amount != null)) {
      setFieldHint('drip-onhand-hint', pre.mixHint);
      setFieldHint('drip-volume-hint', pre.volumeHint && pre.volumeHint !== pre.mixHint ? pre.volumeHint : '');
    } else if (entry && (pre.mixHint || pre.volumeHint)) {
      setFieldHint('drip-onhand-hint', '');
      setFieldHint('drip-volume-hint', pre.mixHint || pre.volumeHint);
    } else {
      setFieldHint('drip-onhand-hint', '');
      setFieldHint('drip-volume-hint', '');
    }
    setLoadedTag('drip-dose-loaded', masterLoadedTagVisible('dose', $('drip-dose') && $('drip-dose').value, null, master.loadedValues));
    setLoadedTag('drip-onhand-loaded', masterLoadedTagVisible('onHand', $('drip-onhand') && $('drip-onhand').value, $('drip-onhand-unit') && $('drip-onhand-unit').value, master.loadedValues));
    setLoadedTag('drip-volume-loaded', masterLoadedTagVisible('volume', $('drip-volume') && $('drip-volume').value, null, master.loadedValues));
  }
  function writeMasterPrefill(prefill) {
    var next = applyMasterDrugChange({
      weight: $('drip-weight') && $('drip-weight').value,
      weightUnit: weightUnit,
      dripSet: $('drip-set') && $('drip-set').value,
      time: $('drip-time') && $('drip-time').value,
      timeUnit: timeUnit,
      timeManual: false
    }, prefill);
    if ($('drip-dose')) $('drip-dose').value = next.dose == null || next.dose === '' ? '' : String(next.dose);
    if ($('drip-dose-unit')) $('drip-dose-unit').value = next.doseUnit || 'mcg/kg/min';
    if ($('drip-onhand')) $('drip-onhand').value = next.onHand == null || next.onHand === '' ? '' : String(next.onHand);
    if ($('drip-onhand-unit')) $('drip-onhand-unit').value = next.onHandUnit || 'mg';
    if ($('drip-volume')) $('drip-volume').value = next.volumeMl == null || next.volumeMl === '' ? '' : String(next.volumeMl);
    master.loadedValues = {
      dose: next.loadedValues.dose,
      doseUnit: next.loadedValues.doseUnit,
      onHand: next.loadedValues.onHand,
      onHandUnit: next.loadedValues.onHandUnit,
      volume: next.loadedValues.volume
    };
    timeManual = false;
    timeUnit = next.timeUnit || 'min';
    if ($('drip-time')) $('drip-time').value = next.time == null || next.time === '' ? '' : String(next.time);
    syncTimeUnitButtons();
  }
  function applyMasterEntry() {
    writeMasterPrefill(masterPrefill(currentMasterEntry()));
    renderMasterChrome();
    renderDrip();
  }
  function openMasterPicker(open) {
    master.pickerOpen = open == null ? !master.pickerOpen : !!open;
    if (master.pickerOpen) spike.pickerOpen = false;
    renderMasterChrome();
    if (typeof renderSpikeChrome === 'function') renderSpikeChrome();
  }
  function selectMasterDrug(key) {
    master.pickerOpen = false;
    master.drugKey = key || '';
    if (!master.drugKey) {
      master.recipeId = null;
      master.who = null;
      applyMasterEntry();
      return;
    }
    var group = currentMasterGroup();
    var whos = uniqueWhos(group);
    master.who = whos.indexOf('Adult') !== -1 ? 'Adult' : (whos[0] || null);
    var list = recipesForWho(group, whos.length > 1 ? master.who : null);
    master.recipeId = list[0] ? list[0].id : null;
    applyMasterEntry();
  }
  function selectMasterWho(who) {
    master.who = who;
    var list = recipesForWho(currentMasterGroup(), who);
    master.recipeId = list[0] ? list[0].id : null;
    applyMasterEntry();
  }
  function selectMasterRecipe(id) {
    master.recipeId = id;
    var rec = currentMasterEntry();
    if (rec) master.who = rec.who;
    applyMasterEntry();
  }
  function resetMasterDrug() {
    master.drugKey = '';
    master.recipeId = null;
    master.who = null;
    master.pickerOpen = false;
    master.loadedValues = { dose: null, doseUnit: null, onHand: null, onHandUnit: null, volume: null };
  }

  function clearDrip() {
    resetMasterDrug();
    ['drip-dose', 'drip-weight', 'drip-volume', 'drip-onhand'].forEach(function (id) {
      if ($(id)) $(id).value = '';
    });
    if ($('drip-dose-unit')) $('drip-dose-unit').value = 'mcg/kg/min';
    if ($('drip-onhand-unit')) $('drip-onhand-unit').value = 'mg';
    if ($('drip-set')) $('drip-set').value = '60';
    dripLastAutoSet = { value: 60, unit: 'gtt' };
    weightUnit = 'kg';
    timeUnit = 'min';
    timeManual = false;
    var kg = $('drip-unit-kg');
    var lb = $('drip-unit-lb');
    if (kg) { kg.classList.add('on'); kg.setAttribute('aria-pressed', 'true'); }
    if (lb) { lb.classList.remove('on'); lb.setAttribute('aria-pressed', 'false'); }
    applyAutoTime();
    renderMasterChrome();
    renderDrip();
  }
  function fillDrip(values) {
    values = values || {};
    if (values.drugKey) {
      selectMasterDrug(values.drugKey);
      if (values.who) selectMasterWho(values.who);
      if (values.recipeId) selectMasterRecipe(values.recipeId);
      else if (values.label) {
        var group = currentMasterGroup();
        var list = recipesForWho(group, master.who);
        var hit = list.filter(function (r) { return r.label === values.label; })[0];
        if (hit) selectMasterRecipe(hit.id);
      }
    }
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
    if (values.dripSet != null && $('drip-set')) {
      $('drip-set').value = values.dripSet;
      if (isBlank(values.dripSet)) dripLastAutoSet = { value: 60, unit: 'gtt' };
    }
    if (Object.prototype.hasOwnProperty.call(values, 'time') || Object.prototype.hasOwnProperty.call(values, 'timeMin')) {
      var raw = Object.prototype.hasOwnProperty.call(values, 'time') ? values.time : values.timeMin;
      timeUnit = values.timeUnit || 'min';
      if ($('drip-time')) $('drip-time').value = isBlank(raw) ? '' : String(raw);
      timeManual = true;
      syncTimeUnitButtons();
    }
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
  function setTimeUnit(next) {
    if (next === timeUnit) return;
    var raw = parseNum($('drip-time') && $('drip-time').value);
    if (isFinite(raw) && raw !== null) {
      if (next === 'hr') $('drip-time').value = fmt(raw / 60, 6);
      else $('drip-time').value = fmt(raw * 60, 6);
    }
    timeUnit = next;
    timeManual = true;
    syncTimeUnitButtons();
    renderDrip();
  }
  function resetTimeAuto() {
    timeManual = false;
    applyAutoTime();
    var unit = DOSE_UNITS[$('drip-dose-unit') && $('drip-dose-unit').value] || DOSE_UNITS['mcg/kg/min'];
    syncDefaultDripSet(unit);
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
    if ($('drip-time')) {
      $('drip-time').addEventListener('input', function () { timeManual = true; });
      $('drip-time').addEventListener('change', function () { timeManual = true; });
    }
    if ($('drip-dose-unit')) $('drip-dose-unit').addEventListener('change', function () {
      timeManual = false;
      syncTimeAndWeight();
      renderDrip();
    });
    if ($('drip-unit-kg')) $('drip-unit-kg').addEventListener('click', function () { setWeightUnit('kg'); });
    if ($('drip-unit-lb')) $('drip-unit-lb').addEventListener('click', function () { setWeightUnit('lb'); });
    if ($('drip-time-min')) $('drip-time-min').addEventListener('click', function () { setTimeUnit('min'); });
    if ($('drip-time-hr')) $('drip-time-hr').addEventListener('click', function () { setTimeUnit('hr'); });
    if ($('drip-time-auto')) $('drip-time-auto').addEventListener('click', function () { resetTimeAuto(); });
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
    if ($('master-drug-btn')) $('master-drug-btn').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openMasterPicker();
    });
    if ($('master-picker')) $('master-picker').addEventListener('click', function (e) {
      var opt = e.target.closest('[data-key]');
      if (!opt) return;
      e.preventDefault();
      e.stopPropagation();
      selectMasterDrug(opt.getAttribute('data-key'));
    });
    if ($('master-recipes')) $('master-recipes').addEventListener('click', function (e) {
      var recBtn = e.target.closest('[data-id]');
      if (recBtn) selectMasterRecipe(recBtn.getAttribute('data-id'));
    });
    if ($('master-who-wrap')) $('master-who-wrap').addEventListener('click', function (e) {
      var w = e.target.closest('[data-who]');
      if (w) selectMasterWho(w.getAttribute('data-who'));
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
      if (pre && pre.typical && $('spike-dose')) {
        $('spike-dose').value = String(pre.typical.value);
        if (pre.typical.unit) setSpikeSelectUnit('spike-dose-unit', pre.typical.unit);
        spike.lastAutoDose = { value: pre.typical.value, unit: pre.typical.unit };
        renderSpike();
      }
    });
    document.addEventListener('click', function (e) {
      if (master.pickerOpen) {
        var masterField = document.querySelector('.master-drug-field');
        if (!masterField || !masterField.contains(e.target)) openMasterPicker(false);
      }
      if (!spike.pickerOpen) return;
      var box = $('spike-box');
      if (box && box.contains(e.target)) return;
      openSpikePicker(false);
    });
    if ($('spike-toggle')) $('spike-toggle').addEventListener('click', function (e) {
      e.preventDefault();
      setSpikeOpen();
    });
    if ($('spike-volume')) {
      $('spike-volume').addEventListener('input', renderSpike);
      $('spike-volume').addEventListener('change', renderSpike);
    }
    if ($('spike-weight')) $('spike-weight').addEventListener('input', renderSpike);
    if ($('spike-dose')) {
      $('spike-dose').addEventListener('input', function () {
        if (!sameAuto(spike.lastAutoDose, $('spike-dose').value, $('spike-dose-unit') && $('spike-dose-unit').value)) {
          spike.lastAutoDose = null;
        }
        renderSpike();
      });
    }
    if ($('spike-dose-unit')) $('spike-dose-unit').addEventListener('change', renderSpike);
    if ($('spike-time')) $('spike-time').addEventListener('input', renderSpike);
    if ($('spike-set')) $('spike-set').addEventListener('input', renderSpike);
    if ($('spike-unit-kg')) $('spike-unit-kg').addEventListener('click', function () {
      if (spikeWeightUnit === 'kg') return;
      var raw = parseNum($('spike-weight') && $('spike-weight').value);
      if (isFinite(raw) && raw !== null) $('spike-weight').value = fmt(raw / LB_PER_KG, 6);
      spikeWeightUnit = 'kg';
      renderSpike();
    });
    if ($('spike-unit-lb')) $('spike-unit-lb').addEventListener('click', function () {
      if (spikeWeightUnit === 'lb') return;
      var raw = parseNum($('spike-weight') && $('spike-weight').value);
      if (isFinite(raw) && raw !== null) $('spike-weight').value = fmt(raw * LB_PER_KG, 6);
      spikeWeightUnit = 'lb';
      renderSpike();
    });
    if ($('spike-time-min')) $('spike-time-min').addEventListener('click', function () {
      if (spikeTimeUnit === 'min') return;
      var raw = parseNum($('spike-time') && $('spike-time').value);
      if (isFinite(raw) && raw !== null) $('spike-time').value = fmt(raw * 60, 6);
      spikeTimeUnit = 'min';
      renderSpike();
    });
    if ($('spike-time-hr')) $('spike-time-hr').addEventListener('click', function () {
      if (spikeTimeUnit === 'hr') return;
      var raw = parseNum($('spike-time') && $('spike-time').value);
      if (isFinite(raw) && raw !== null) $('spike-time').value = fmt(raw / 60, 6);
      spikeTimeUnit = 'hr';
      renderSpike();
    });
    document.querySelectorAll('.spike-set').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if ($('spike-set')) $('spike-set').value = btn.getAttribute('data-gtt');
        renderSpike();
      });
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

    setSpikeOpen(true);
    renderSpike();
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
  api.renderSpike = renderSpike;
  api.setSpikeOpen = setSpikeOpen;
  api.resetSpike = resetSpike;
  api.selectMasterDrug = selectMasterDrug;
  api.selectMasterWho = selectMasterWho;
  api.selectMasterRecipe = selectMasterRecipe;
  api.openMasterPicker = openMasterPicker;
  api.currentMasterEntry = currentMasterEntry;
  api.resetMasterDrug = resetMasterDrug;
  api.renderMasterChrome = renderMasterChrome;
  root.PharmCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
