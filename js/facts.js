/* Read-only study facts. Every prompt resolves back to window.DRUG_BOX.
   Empty lists are skipped. A missing pediatric dose is not turned into zero. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PharmFacts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TEXT_FIELDS = [
    ['classification', 'Classification', 'cl'],
    ['mechanism_of_action', 'Mechanism of action', 'mo'],
    ['indications', 'Indications', 'in'],
    ['contraindications', 'Contraindications', 'ci'],
    ['precautions', 'Precautions', 'pr'],
    ['side_adverse_effects', 'Side / adverse effects', 'se'],
    ['special_considerations', 'Special considerations', 'sc']
  ];

  const BUCKETS = [
    [/antidysrhythm|antiarrhythm|calcium channel|beta.?blocker/i, 'Antidysrhythmics · CCBs · β-blockers'],
    [/adrenergic|sympathomimetic|vasopressor|inotrop/i, 'Sympathomimetics & vasopressors'],
    [/parasympatholytic|anticholinergic/i, 'Anticholinergics'],
    [/beta 2|bronchodil|isotonic/i, 'Bronchodilators & airway'],
    [/electrolyte|buffer|alkaliz/i, 'Electrolytes & buffers'],
    [/hyperglycemic|vitamin/i, 'Metabolic (glucose · thiamine)'],
    [/narcotic analgesic|nonsteroidal|antiplatelet|analgesic/i, 'Analgesics & antiplatelets'],
    [/sedative|benzodiazepine|anesthetic|dissociative|neuromuscular/i, 'Sedation, RSI & paralytics'],
    [/antagonist|antidote|reactivator|adsorbent/i, 'Antidotes & reversal'],
    [/antihistamine|anti-?emetic/i, 'Antiemetics & antihistamines'],
    [/nitrate|vasodilat|diuretic/i, 'Vasodilators & diuretics'],
    [/corticosteroid|steroid/i, 'Steroids'],
    [/fibrinolytic/i, 'Hemostatics']
  ];

  const FILTERS = [
    ['all', 'All fields'],
    ['classification', 'Classification'],
    ['mechanism_of_action', 'Mechanism of action'],
    ['indications', 'Indications'],
    ['contraindications', 'Contraindications'],
    ['precautions', 'Precautions'],
    ['adult_dosage', 'Adult dosage'],
    ['peds_dosage', 'Pediatric dosage'],
    ['side_adverse_effects', 'Side effects'],
    ['special_considerations', 'Special considerations'],
    ['alias', 'Trade / other names']
  ];

  let cache = null;
  let cacheDb = null;

  function db() {
    return (typeof window !== 'undefined' && window.DRUG_BOX) ? window.DRUG_BOX : null;
  }

  function grade() {
    return (typeof PharmGrade !== 'undefined') ? PharmGrade : (typeof require === 'function' ? require('./grade.js') : null);
  }

  function bucket(drug) {
    const c = drug.classification || [];
    const samples = [c[0] || '', c.join(' ')];
    for (let i = 0; i < samples.length; i++) {
      for (let b = 0; b < BUCKETS.length; b++) {
        if (BUCKETS[b][0].test(samples[i])) return BUCKETS[b][1];
      }
    }
    return 'Other';
  }

  function nonempty(arr) {
    return (arr || []).map(function (x) { return String(x == null ? '' : x).trim(); }).filter(Boolean);
  }

  function build(source) {
    const box = source || db();
    if (!box || !box.drugs) return [];
    const G = grade();
    const facts = [];
    Object.keys(box.drugs).forEach(function (key) {
      const d = box.drugs[key];
      const extra = d.module == null;
      const bkt = bucket(d);
      TEXT_FIELDS.forEach(function (spec) {
        const items = nonempty(d[spec[0]]);
        items.forEach(function (text, index) {
          facts.push({
            id: key + '|' + spec[0] + '|' + index,
            drug: key,
            field: spec[0],
            index: index,
            who: null,
            label: spec[1],
            tone: spec[2],
            module: d.module,
            extra: extra,
            bucket: bkt,
            hash: G.hashText(spec[0] + '\n' + text)
          });
        });
      });
      (d.dosage || []).forEach(function (line, index) {
        if (!line || !String(line.t || '').trim()) return;
        const who = line.who === 'Pediatric' ? 'Pediatric' : 'Adult';
        facts.push({
          id: key + '|dosage|' + index,
          drug: key,
          field: 'dosage',
          index: index,
          who: who,
          label: who === 'Pediatric' ? 'Pediatric dosage' : 'Adult dosage',
          tone: 'ds',
          module: d.module,
          extra: extra,
          bucket: bkt,
          hash: G.hashText('dosage\n' + who + '\n' + line.t)
        });
      });
      if (d.alias && String(d.alias).trim()) {
        facts.push({
          id: key + '|alias|0',
          drug: key,
          field: 'alias',
          index: 0,
          who: null,
          label: 'Trade / other names',
          tone: 'sc',
          module: d.module,
          extra: extra,
          bucket: bkt,
          hash: G.hashText('alias\n' + d.alias)
        });
      }
    });
    return facts;
  }

  function all(source) {
    const box = source || db();
    if (cache && cacheDb === box) return cache;
    cache = build(box);
    cacheDb = box;
    return cache;
  }

  function get(id, source) {
    const list = all(source);
    for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function drug(key, source) {
    const box = source || db();
    return box && box.drugs ? box.drugs[key] : null;
  }

  function textOf(fact, source) {
    const d = drug(fact.drug, source);
    if (!d) return '';
    if (fact.field === 'alias') return d.alias || '';
    if (fact.field === 'dosage') return (d.dosage && d.dosage[fact.index] && d.dosage[fact.index].t) || '';
    const arr = d[fact.field] || [];
    return arr[fact.index] == null ? '' : String(arr[fact.index]);
  }

  function siblingsOf(fact, source) {
    const d = drug(fact.drug, source);
    if (!d || fact.field === 'dosage' || fact.field === 'alias') return [];
    return nonempty(d[fact.field]).filter(function (_, i) { return i !== fact.index; });
  }

  function filterKey(fact) {
    if (fact.field === 'dosage') return fact.who === 'Pediatric' ? 'peds_dosage' : 'adult_dosage';
    return fact.field;
  }

  function resetCache() { cache = null; cacheDb = null; }

  return {
    TEXT_FIELDS: TEXT_FIELDS,
    FILTERS: FILTERS,
    BUCKETS: BUCKETS,
    bucket: bucket,
    all: all,
    get: get,
    drug: drug,
    textOf: textOf,
    siblingsOf: siblingsOf,
    filterKey: filterKey,
    resetCache: resetCache,
    build: build
  };
});
