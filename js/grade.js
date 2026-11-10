/* Pharm Hero answer grading. Compares what the student typed to the
   source line already stored in drug-box.js. Does not contain a second
   dose table. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PharmGrade = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const STOP = new Set(('a an the and or of to for with from that this into over under than then ' +
    'after before by in on at is are was were be been being it its as not but per via your their ' +
    'may can will which when while during within without onto upon about across also than').split(' '));

  function hashText(s) {
    let h = 5381;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function trimNum(v) {
    const n = Math.round(Number(v) * 1e6) / 1e6;
    if (!isFinite(n)) return String(v);
    return String(n);
  }

  function normalize(s) {
    let t = String(s == null ? '' : s).toLowerCase().normalize('NFKC');
    t = t.replace(/[μµ]g/g, 'mcg');
    t = t.replace(/[–—−]/g, '-');
    t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    t = t.replace(/\bmicro\s*grams?\b/g, 'mcg');
    t = t.replace(/\bmilli\s*grams?\b/g, 'mg');
    t = t.replace(/\bmilli\s*lit(?:er|re)s?\b/g, 'ml');
    t = t.replace(/\bmilli\s*equivalents?\b/g, 'meq');
    t = t.replace(/\bkilograms?\b/g, 'kg');
    t = t.replace(/\bminutes?\b/g, 'min');
    t = t.replace(/\bhours?\b/g, 'hr');
    t = t.replace(/\bgrams?\b/g, 'g');
    t = t.replace(/\bgm\b/g, 'g');
    t = t.replace(/\bug\b/g, 'mcg');
    t = t.replace(/\bvials\b/g, 'vial');
    t = t.replace(/\binches\b/g, 'inch');
    t = t.replace(/(\d)\s*"+\s*/g, '$1inch');
    t = t.replace(/(\d)\s*inch\b/g, '$1inch');
    t = t.replace(/(\d)\s*in\b/g, '$1inch');
    t = t.replace(/\s+per\s+/g, '/');
    t = t.replace(/(\d)\s*(?:to|thru|through)\s*(?=\d)/g, '$1-');
    t = t.replace(/([a-z])-(\d)/g, '$1 $2');
    t = t.replace(/(\d),(?=\d{3}\b)/g, '$1');
    t = t.replace(/[()[\]]/g, ' ');
    t = t.replace(/\s*\/\s*/g, '/');
    t = t.replace(/(\d)\s*-\s*(?=\d)/g, '$1-');
    t = t.replace(/(\d)\s+(mg|mcg|g|ml|meq|kg|min|hr|vial|inch|%)/g, '$1$2');
    t = t.replace(/(\d)\s+(mg|mcg|g|ml|meq|vial|inch)/g, '$1$2');
    t = t.replace(/(^|[^\d])\.(\d)/g, '$10.$2');
    t = t.replace(/(\d+)\.(\d+)/g, function (_, a, b) {
      b = b.replace(/0+$/, '');
      return b ? a + '.' + b : a;
    });
    t = t.replace(/\s+/g, ' ').trim();
    t = t.replace(/[.;:]+$/g, '');
    t = t.replace(/\s*"\s*/g, '"');
    return t;
  }

  function canonMass(s) {
    let t = normalize(s);
    t = t.replace(/(\d+(?:\.\d+)?)(mcg|mg|g)\b/g, function (_, n, u) {
      let v = parseFloat(n);
      if (u === 'mcg') v = v / 1000;
      else if (u === 'g') v = v * 1000;
      return trimNum(v) + 'mg';
    });
    return t;
  }

  const ABSENCE = [
    { re: /^not indicated$/, also: ['not indicated', 'none', 'not listed', 'n/a', 'na'] },
    { re: /^none currently recommended$/, also: ['none currently recommended', 'none', 'not recommended', 'not listed', 'no recommendation'] },
    { re: /^no current aha recommendations$/, also: ['no current aha recommendations', 'none', 'not listed', 'no recommendation', 'no current recommendations'] },
    { re: /^follow local protocol$/, also: ['follow local protocol', 'local protocol'] },
    { re: /^none$/, also: ['none', 'not listed'] }
  ];

  function absenceMatch(user, expected) {
    const e = normalize(expected);
    const u = normalize(user);
    for (const row of ABSENCE) {
      if (!row.re.test(e)) continue;
      return row.also.some(function (a) { return normalize(a) === u; });
    }
    return false;
  }

  function inchMatch(user, expected) {
    const e = normalize(expected).replace(/"/g, '');
    if (e !== '1inch' && e !== '1in' && e !== '1') return false;
    const raw = normalize(expected);
    if (!/"|inch|\bin\b/.test(raw) && !/"/.test(String(expected))) return false;
    const u = normalize(user).replace(/"/g, '');
    return u === '1inch' || u === '1in' || u === '1"' || normalize(user) === '1"' || u === '1inch';
  }

  function answersMatch(user, expected) {
    if (user == null || !String(user).trim()) return false;
    if (expected == null || !String(expected).trim()) return false;
    if (normalize(user) === normalize(expected)) return true;
    if (canonMass(user) === canonMass(expected)) return true;
    if (absenceMatch(user, expected)) return true;
    if (inchMatch(user, expected)) return true;
    return false;
  }

  function contentWords(s) {
    return normalize(s).split(/[^a-z0-9/+.-]+/).filter(function (w) {
      return w && !STOP.has(w) && (w.length > 3 || /\d/.test(w));
    });
  }

  function numberSet(s) {
    return contentWords(s).filter(function (w) { return /\d/.test(w); }).sort().join('|');
  }

  function loosePhrase(user, expected) {
    const E = contentWords(expected);
    if (E.length < 4) return false;
    if (numberSet(user) !== numberSet(expected)) return false;
    const U = contentWords(user);
    const bag = {};
    U.forEach(function (w) { bag[w] = (bag[w] || 0) + 1; });
    let hit = 0;
    E.forEach(function (w) { if (bag[w]) { bag[w]--; hit++; } });
    return hit / E.length >= 0.9 && U.length >= E.length * 0.75;
  }

  function gradeText(user, expected, acceptList) {
    const list = (acceptList && acceptList.length) ? acceptList : [expected];
    for (let i = 0; i < list.length; i++) {
      if (answersMatch(user, list[i]) || loosePhrase(user, list[i])) {
        return { ok: true, expected: expected };
      }
    }
    return { ok: false, expected: expected };
  }

  const DOSE_RE = /(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*(mg\/kg\/min|mcg\/kg\/min|mg\/min|mcg\/min|mg\/hr|mcg\/hr|mg\/kg|mcg\/kg|meq|gm|mg|mcg|ml|vials|vial|g)\b|(\d+(?:\.\d+)?)\s*(")/gi;

  function maskDoseLine(line) {
    const src = String(line);
    DOSE_RE.lastIndex = 0;
    const matches = [];
    let m;
    while ((m = DOSE_RE.exec(src))) {
      matches.push({ index: m.index, end: m.index + m[0].length, text: m[0] });
    }
    if (!matches.length) return null;
    const mask = new Set([0]);
    if (matches[1]) {
      const between = src.slice(matches[0].end, matches[1].index);
      if (/max/i.test(between) && between.length <= 24) mask.add(1);
      else if (between.trim() === '/') mask.add(1);
      else if (/vial/i.test(matches[0].text) && /^\s*\(/.test(between) && between.length <= 4) mask.add(1);
    }
    const parts = [];
    let cursor = 0;
    matches.forEach(function (hit, i) {
      if (!mask.has(i)) return;
      parts.push({ type: 'text', text: src.slice(cursor, hit.index) });
      parts.push({ type: 'blank', answer: hit.text.replace(/\s+/g, ' ').trim() });
      cursor = hit.end;
    });
    parts.push({ type: 'text', text: src.slice(cursor) });
    return { parts: parts };
  }

  function gradeBlanks(users, parts) {
    const blanks = parts.filter(function (p) { return p.type === 'blank'; });
    const given = users || [];
    let ok = blanks.length > 0 && given.length >= blanks.length;
    const detail = blanks.map(function (b, i) {
      const pass = answersMatch(given[i], b.answer);
      if (!pass) ok = false;
      return { answer: b.answer, given: given[i] == null ? '' : String(given[i]), ok: pass };
    });
    return { ok: ok, blanks: detail };
  }

  function clozeMiddle(text) {
    const parts = String(text).trim().split(/\s+/);
    if (parts.length < 8) return null;
    const start = Math.max(2, Math.floor(parts.length * 0.33));
    const end = Math.min(parts.length - 2, start + Math.max(3, Math.round(parts.length * 0.28)));
    if (end - start < 3) return null;
    return {
      before: parts.slice(0, start).join(' '),
      hidden: parts.slice(start, end).join(' '),
      after: parts.slice(end).join(' ')
    };
  }

  function presentText(text, siblings) {
    const t = String(text || '');
    const sibs = (siblings || []).filter(function (s) { return s && s !== t; });
    if (sibs.length && t.length <= 110) return { kind: 'siblings', answer: t, siblings: sibs };
    if (t.length > 110) {
      const cloze = clozeMiddle(t);
      if (cloze) return { kind: 'cloze', before: cloze.before, hidden: cloze.hidden, after: cloze.after, answer: cloze.hidden };
    }
    return { kind: 'exact', answer: t };
  }

  function aliasTokens(alias) {
    if (!alias || !String(alias).trim()) return [];
    const raw = String(alias).trim();
    const out = new Set([raw]);
    raw.split(/\s+-\s+/).forEach(function (part) {
      const p = part.trim();
      if (!p) return;
      out.add(p);
      p.split(/,(?!\d)/).forEach(function (piece) {
        const n = piece.trim();
        if (n) out.add(n);
      });
    });
    return Array.from(out);
  }

  function blankLabel(parts) {
    return (parts || []).filter(function (p) { return p.type === 'blank'; }).map(function (p) { return p.answer; }).join(' · ');
  }

  return {
    hashText: hashText,
    normalize: normalize,
    canonMass: canonMass,
    answersMatch: answersMatch,
    loosePhrase: loosePhrase,
    gradeText: gradeText,
    maskDoseLine: maskDoseLine,
    gradeBlanks: gradeBlanks,
    presentText: presentText,
    aliasTokens: aliasTokens,
    blankLabel: blankLabel,
    contentWords: contentWords
  };
});
