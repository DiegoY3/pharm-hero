/* Session mastery stays in localStorage under a Pharm Hero key.
   Leitner intervals are study preferences (1/2/4/8/16 days), not a
   claim that the schedule is validated. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PharmProgress = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const KEY = 'pharmhero.progress.v1';
  const DAY = 86400000;
  const INTERVAL = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };

  function blank() {
    return {
      version: 1,
      facts: {},
      bookmarks: {},
      hard: {},
      matchBest: {},
      sessions: [],
      settings: { pop: 'both', field: 'all', subset: 'manual', limit: 10 }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) return blank();
      parsed.facts = parsed.facts || {};
      parsed.bookmarks = parsed.bookmarks || {};
      parsed.hard = parsed.hard || {};
      parsed.matchBest = parsed.matchBest || {};
      parsed.sessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];
      parsed.settings = Object.assign(blank().settings, parsed.settings || {});
      return parsed;
    } catch (e) {
      return blank();
    }
  }

  let mem = null;
  function store() {
    if (!mem) mem = load();
    return mem;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store())); return true; }
    catch (e) { return false; }
  }

  function get(id) {
    return store().facts[id] || null;
  }

  function ensure(id) {
    const s = store();
    if (!s.facts[id]) {
      s.facts[id] = { box: 0, due: 0, attempts: 0, correct: 0, misses: 0, assisted: 0, hash: null, updated: false, last: 0 };
    }
    return s.facts[id];
  }

  function noteHash(id, hash) {
    const rec = get(id);
    if (!rec || !rec.hash || rec.hash === hash) {
      if (rec && hash && rec.hash !== hash) { rec.hash = hash; save(); }
      return false;
    }
    rec.box = 1;
    rec.due = 0;
    rec.hash = hash;
    rec.updated = true;
    save();
    return true;
  }

  function due(id, now) {
    const rec = get(id);
    if (!rec || !rec.box) return true;
    return (rec.due || 0) <= (now || Date.now());
  }

  function apply(id, kind, assisted, hash) {
    const rec = ensure(id);
    rec.attempts += 1;
    rec.last = Date.now();
    if (hash) rec.hash = hash;
    if (assisted) rec.assisted += 1;
    if (kind === 'got' || kind === 'correct') {
      rec.correct += 1;
      rec.updated = false;
      if (!assisted) {
        rec.box = Math.max(1, Math.min(5, (rec.box || 0) + 1));
        rec.due = Date.now() + (INTERVAL[rec.box] || 1) * DAY;
      } else {
        rec.due = Date.now() + Math.round(0.5 * DAY);
      }
    } else if (kind === 'almost') {
      rec.box = Math.max(1, rec.box || 1);
      rec.due = Date.now() + DAY;
    } else if (kind === 'again' || kind === 'wrong') {
      rec.misses += 1;
      rec.box = 1;
      rec.due = Date.now() + DAY;
    }
    save();
    return rec;
  }

  function histogram(ids) {
    const bins = [0, 0, 0, 0, 0, 0];
    (ids || []).forEach(function (id) {
      const rec = get(id);
      const box = rec && rec.box ? rec.box : 0;
      bins[box] += 1;
    });
    return bins;
  }

  function countDue(ids, now) {
    let n = 0;
    (ids || []).forEach(function (id) { if (due(id, now)) n++; });
    return n;
  }

  function toggleBookmark(drugKey) {
    const b = store().bookmarks;
    if (b[drugKey]) delete b[drugKey];
    else b[drugKey] = true;
    save();
    return !!b[drugKey];
  }

  function isBookmarked(drugKey) {
    return !!store().bookmarks[drugKey];
  }

  function toggleHard(factId) {
    const h = store().hard;
    if (h[factId]) delete h[factId];
    else h[factId] = true;
    save();
    return !!store().hard[factId];
  }

  function isHard(factId) {
    return !!(store().hard && store().hard[factId]);
  }

  function bestMatch(key) {
    const m = store().matchBest || {};
    return m[key] || null;
  }

  function saveMatch(key, ms) {
    const s = store();
    s.matchBest = s.matchBest || {};
    if (!s.matchBest[key] || ms < s.matchBest[key]) s.matchBest[key] = ms;
    save();
    return s.matchBest[key];
  }

  function settings(next) {
    if (next) {
      store().settings = Object.assign(store().settings, next);
      save();
    }
    return store().settings;
  }

  function logSession(row) {
    const list = store().sessions;
    list.unshift(row);
    store().sessions = list.slice(0, 30);
    save();
  }

  function exportJson() {
    return {
      app: 'Pharm Hero',
      version: 1,
      exported: new Date().toISOString(),
      progress: store()
    };
  }

  function importJson(obj) {
    if (!obj || obj.app !== 'Pharm Hero' || !obj.progress || obj.progress.version !== 1) {
      throw new Error('That file is not a Pharm Hero progress export.');
    }
    mem = obj.progress;
    mem.facts = mem.facts || {};
    mem.bookmarks = mem.bookmarks || {};
    mem.hard = mem.hard || {};
    mem.matchBest = mem.matchBest || {};
    mem.sessions = Array.isArray(mem.sessions) ? mem.sessions : [];
    mem.settings = Object.assign(blank().settings, mem.settings || {});
    if (!save()) throw new Error('Could not write localStorage.');
    return mem;
  }

  function reset() {
    mem = blank();
    save();
  }

  return {
    KEY: KEY,
    INTERVAL: INTERVAL,
    get: get,
    due: due,
    noteHash: noteHash,
    apply: apply,
    histogram: histogram,
    countDue: countDue,
    toggleBookmark: toggleBookmark,
    isBookmarked: isBookmarked,
    toggleHard: toggleHard,
    isHard: isHard,
    bestMatch: bestMatch,
    saveMatch: saveMatch,
    settings: settings,
    logSession: logSession,
    exportJson: exportJson,
    importJson: importJson,
    reset: reset,
    reload: function () { mem = null; return store(); }
  };
});
