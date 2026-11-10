/* Pharm Hero shell. DB1 study desk, DB2 flashcards / quiz, DB3 dose blanks.
   Drug facts are read from window.DRUG_BOX at answer time. */
(function () {
  const RHYTHM_LABEL = {
    nsr: 'Normal sinus rhythm', sbrady: 'Sinus bradycardia', stach: 'Sinus tachycardia',
    sarrhythmia: 'Sinus arrhythmia', sarrest: 'Sinus arrest', sexit: 'Sinus exit block',
    pac: 'Premature atrial complex', wap: 'Wandering atrial pacemaker', mat: 'Multifocal atrial tachycardia',
    afib: 'Atrial fibrillation', afrvr: 'Atrial fibrillation with RVR', flutter: 'Atrial flutter',
    svt: 'Supraventricular tachycardia', pjc: 'Premature junctional complex', jxesc: 'Junctional escape',
    accjx: 'Accelerated junctional', jxtach: 'Junctional tachycardia', pvc: 'Premature ventricular complex',
    ufpvc: 'Unifocal PVCs', mfpvc: 'Multifocal PVCs', bigeminy: 'Ventricular bigeminy',
    ivr: 'Idioventricular rhythm', aivr: 'Accelerated idioventricular', vt: 'Ventricular tachycardia',
    torsades: 'Torsades de pointes', avb1: '1st-degree AV block', mobitz1: '2nd-degree type I',
    mobitz2: '2nd-degree type II', avb3: '3rd-degree AV block', apaced: 'Atrial paced',
    vpaced: 'Ventricular paced', vf: 'Ventricular fibrillation', pvt: 'Pulseless ventricular tachycardia',
    pea: 'PEA', asystole: 'Asystole'
  };
  const SLOTS_KEY = 'ecg.drugbox.slots.v1';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fail(msg) {
    const el = document.getElementById('boot-error');
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    console.error(msg);
  }
  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function svg(key) {
    try { return window.DrugBoxKit ? DrugBoxKit.svg(key, 'ico') : ''; }
    catch (e) { return ''; }
  }
  function slots() {
    try {
      const raw = JSON.parse(localStorage.getItem(SLOTS_KEY) || 'null');
      return raw && Array.isArray(raw.slots) ? raw.slots : [];
    } catch (e) { return []; }
  }
  function drugsInSlot(slot) {
    const set = new Set();
    ['lid', 'base'].forEach(function (side) {
      const w = slot[side] || {};
      (w.pouches || []).forEach(function (p) { (p.drugs || []).forEach(function (k) { set.add(k); }); });
      (w.items || []).forEach(function (it) { if (it && it.k) set.add(it.k); });
    });
    return set;
  }
  function cardiacHas(key) {
    const rhythms = (window.DRUG_BOX && window.DRUG_BOX.rhythms) || {};
    const ids = Object.keys(rhythms);
    for (let i = 0; i < ids.length; i++) {
      const list = rhythms[ids[i]].drugs || [];
      for (let j = 0; j < list.length; j++) {
        if (list[j] && list[j].drug === key && list[j].role !== 'avoid') return true;
      }
    }
    return false;
  }
  function slotById(id) {
    const all = slots();
    for (let i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  let session = null;
  let openTabs = [];
  let activeTab = null;
  let boxQuery = '';
  let boxView = 'module';
  let rhythmId = 'vf';
  let wizardStep = 1;
  const HOME_VIEWS = [
    ['module', 'Module'],
    ['cardiac', 'Cardiac'],
    ['class', 'Classification'],
    ['alpha', 'A–Z'],
    ['favorites', 'Favorites'],
    ['rhythm', 'This rhythm'],
    ['custom', 'Custom']
  ];
  let suppressReturn = false;
  let returnView = 'box';
  const WALL_KEY = 'pharmhero.wall.v1';

  function activeList(list) {
    return (list || []).filter(function (x) { return x && x !== 'all'; });
  }
  function savedFields(s) {
    s = s || PharmProgress.settings();
    if (Array.isArray(s.fields) && s.fields.length) return s.fields.slice();
    if (s.field && s.field !== 'all') return String(s.field).split(',').filter(Boolean);
    return ['all'];
  }
  function savedSubsets(s) {
    s = s || PharmProgress.settings();
    if (Array.isArray(s.subsets) && s.subsets.length) return s.subsets.slice();
    if (s.subset === 'all') return ['all'];
    if (s.subset && s.subset !== 'manual') return String(s.subset).split(',').filter(Boolean);
    return ['manual'];
  }
  function readOn(root) {
    if (!root) return [];
    return Array.prototype.map.call(root.querySelectorAll('.on'), function (el) { return el.dataset.id; });
  }
  function optsFromUi() {
    const fieldRoot = document.getElementById('field-slots');
    const subsetRoot = document.getElementById('subset-slots');
    const modeBtn = document.querySelector('#mode-slots .mode.on');
    const limitEl = document.getElementById('limit-filter');
    const s = PharmProgress.settings();
    const fields = fieldRoot ? readOn(fieldRoot) : savedFields(s);
    const subsets = subsetRoot ? readOn(subsetRoot) : savedSubsets(s);
    return {
      pop: 'both',
      fields: fields,
      subsets: subsets,
      field: !activeList(fields).length ? 'all' : fields.filter(function (f) { return f !== 'all'; }).join(','),
      subset: !activeList(subsets).length ? 'all' : subsets.filter(function (f) { return f !== 'all'; }).join(','),
      limit: limitEl ? limitEl.value : (s.limit || '20'),
      mode: modeBtn ? modeBtn.dataset.id : (s.mode || '')
    };
  }
  function saveUi() {
    const o = optsFromUi();
    PharmProgress.settings({
      pop: 'both',
      field: !activeList(o.fields).length ? 'all' : o.fields.filter(function (f) { return f !== 'all'; })[0] || 'all',
      fields: o.fields,
      subset: !activeList(o.subsets).length ? 'all' : o.subsets.filter(function (f) { return f !== 'all'; })[0] || 'all',
      subsets: o.subsets,
      limit: o.limit,
      mode: o.mode
    });
  }
  function matchSubset(fact, subset) {
    if (subset === 'manual') return !fact.extra;
    if (subset === 'extra') return !!fact.extra;
    if (subset.indexOf('module:') === 0) return String(fact.module) === subset.slice(7);
    if (subset.indexOf('bucket:') === 0) {
      const row = PharmFacts.BUCKETS[Number(subset.slice(7))];
      return !!(row && fact.bucket === row[1]);
    }
    if (subset === 'bookmarks') return PharmProgress.isBookmarked(fact.drug);
    if (subset === 'hard' || subset === 'starred') return PharmProgress.isHard(fact.id) || PharmProgress.isBookmarked(fact.drug);
    if (subset === 'cardiac') return cardiacHas(fact.drug);
    if (subset.indexOf('box:') === 0) {
      const slot = slotById(subset.slice(4));
      return !!(slot && drugsInSlot(slot).has(fact.drug));
    }
    return false;
  }
  function matchFact(fact, opts) {
    const subsets = opts.subsets ? activeList(opts.subsets) : (opts.subset && opts.subset !== 'all' ? String(opts.subset).split(',') : []);
    if (subsets.length && !subsets.some(function (s) { return matchSubset(fact, s); })) return false;
    const fields = opts.fields ? activeList(opts.fields) : (opts.field && opts.field !== 'all' ? String(opts.field).split(',') : []);
    if (fields.length && fields.indexOf(PharmFacts.filterKey(fact)) < 0) return false;
    if (!fields.length && fact.field === 'dosage') {
      if (opts.pop === 'adult' && fact.who !== 'Adult') return false;
      if (opts.pop === 'peds' && fact.who !== 'Pediatric') return false;
    }
    return true;
  }
  function factsFor(opts) {
    return PharmFacts.all().filter(function (f) { return matchFact(f, opts); });
  }
  function drugIdsFor(opts) {
    const ids = new Set();
    factsFor(opts).forEach(function (f) { ids.add(f.drug); });
    const subsets = opts.subsets ? activeList(opts.subsets) : (opts.subset && String(opts.subset).indexOf('box:') >= 0 ? String(opts.subset).split(',') : []);
    subsets.forEach(function (subset) {
      if (subset.indexOf('box:') !== 0) return;
      const slot = slotById(subset.slice(4));
      if (slot) drugsInSlot(slot).forEach(function (k) { if (window.DRUG_BOX.drugs[k]) ids.add(k); });
    });
    return ids;
  }

  function fillFields() { renderStudyHome(); }
  function fillSubsets() { renderStudyHome(); }
  function applySettings() { renderStudyHome(); }
  function renderDesk() { updateDeckNote(); }

  function trueTexts(fact) {
    const d = PharmFacts.drug(fact.drug);
    if (!d) return [];
    if (fact.field === 'alias') return PharmGrade.aliasTokens(d.alias || '');
    if (fact.field === 'dosage') return (d.dosage || []).map(function (l) { return l.t; });
    return (d[fact.field] || []).map(function (x) { return String(x); });
  }
  function optionText(fact) {
    const text = PharmFacts.textOf(fact);
    if (fact.field === 'dosage') {
      const masked = PharmGrade.maskDoseLine(text);
      if (masked) return PharmGrade.blankLabel(masked.parts);
    }
    if (fact.field === 'alias') {
      const tokens = PharmGrade.aliasTokens(text).filter(function (t) { return t !== text; });
      return tokens[0] || text;
    }
    return text;
  }
  function tooClose(candidate, truths) {
    const n = PharmGrade.normalize(candidate);
    for (let i = 0; i < truths.length; i++) {
      if (!truths[i]) continue;
      if (PharmGrade.answersMatch(candidate, truths[i])) return true;
      if (PharmGrade.normalize(truths[i]) === n) return true;
      const A = PharmGrade.contentWords(candidate);
      const B = PharmGrade.contentWords(truths[i]);
      if (A.length >= 3 && B.length >= 3) {
        const bag = {};
        B.forEach(function (w) { bag[w] = 1; });
        let hit = 0;
        A.forEach(function (w) { if (bag[w]) hit++; });
        if (hit / Math.max(A.length, B.length) >= 0.72) return true;
      }
    }
    return false;
  }
  function makeOptions(fact) {
    const correct = optionText(fact);
    if (!correct) return null;
    const truths = trueTexts(fact).concat([PharmFacts.textOf(fact), correct]);
    const pool = [];
    PharmFacts.all().forEach(function (other) {
      if (other.id === fact.id) return;
      if (PharmFacts.filterKey(other) !== PharmFacts.filterKey(fact)) return;
      const text = optionText(other);
      if (!text || tooClose(text, truths)) return;
      pool.push({ text: text });
    });
    const seen = {};
    seen[PharmGrade.normalize(correct)] = 1;
    const picks = [];
    shuffle(pool).forEach(function (p) {
      const n = PharmGrade.normalize(p.text);
      if (seen[n] || picks.length >= 3) return;
      seen[n] = 1;
      picks.push({ text: p.text, correct: false });
    });
    if (picks.length < 3) return null;
    return shuffle([{ text: correct, correct: true }].concat(picks));
  }

  function presentation(fact) {
    const text = PharmFacts.textOf(fact);
    if (fact.field === 'dosage') {
      const masked = PharmGrade.maskDoseLine(text);
      if (masked) return { kind: 'dose', parts: masked.parts, answer: PharmGrade.blankLabel(masked.parts), full: text };
      return { kind: 'exact', answer: text, full: text };
    }
    if (fact.field === 'alias') {
      return { kind: 'alias', answer: text, accept: PharmGrade.aliasTokens(text), full: text };
    }
    const pres = PharmGrade.presentText(text, PharmFacts.siblingsOf(fact));
    pres.full = text;
    return pres;
  }

  function buildQueue(opts) {
    if (opts.onlyIds && opts.onlyIds.length) return opts.onlyIds.filter(function (id) { return !!PharmFacts.get(id); });
    let list = factsFor(opts);
    const due = [];
    const later = [];
    list.forEach(function (f) {
      PharmProgress.noteHash(f.id, f.hash);
      if (PharmProgress.due(f.id)) due.push(f);
      else later.push(f);
    });
    list = shuffle(due).concat(shuffle(later));
    if (opts.factId) {
      list = list.filter(function (f) { return f.id !== opts.factId; });
      const first = PharmFacts.get(opts.factId);
      if (first) list.unshift(first);
    }
    if (opts.limit && opts.limit !== 'all') list = list.slice(0, Number(opts.limit) || 10);
    if (opts.mode === 'quiz') {
      const quiz = [];
      list.forEach(function (f) { if (makeOptions(f)) quiz.push(f); });
      list = quiz;
    }
    return list.map(function (f) { return f.id; });
  }

  function stopClock() {
    if (session && session.match && session.match.clock) {
      clearInterval(session.match.clock);
      session.match.clock = null;
    }
  }
  function fmtTime(ms) {
    if (ms == null) return '—';
    return (ms / 1000).toFixed(1) + 's';
  }
  function paintScore() {
    if (!session) return;
    document.getElementById('session-score').textContent = String(session.score);
    document.getElementById('session-streak').textContent = String(session.streak);
  }
  function logIfNeeded() {
    if (!session || session.logged) return;
    PharmProgress.logSession({
      at: Date.now(),
      mode: session.mode,
      score: session.score,
      answered: session.answered,
      bestStreak: session.best,
      limit: session.opts.limit,
      field: session.opts.field,
      subset: session.opts.subset
    });
    session.logged = true;
  }

  function prepare() {
    while (session.pos < session.queue.length) {
      const fact = PharmFacts.get(session.queue[session.pos]);
      if (!fact || !PharmFacts.textOf(fact)) { session.pos++; continue; }
      let options = null;
      if (session.mode === 'quiz') {
        options = makeOptions(fact);
        if (!options) { session.pos++; continue; }
      }
      const updated = PharmProgress.noteHash(fact.id, fact.hash);
      session.card = {
        id: fact.id,
        options: options,
        assisted: false,
        revealed: false,
        phase: 'ask',
        result: null,
        hint: '',
        reference: false,
        updated: updated || !!(PharmProgress.get(fact.id) && PharmProgress.get(fact.id).updated)
      };
      if (session.forceReveal) { session.card.revealed = true; session.forceReveal = false; }
      return;
    }
    session.card = null;
    session.phase = 'done';
    logIfNeeded();
  }

  function startSession(opts) {
    opts = Object.assign({ mode: 'flash', pop: 'both', field: 'all', subset: 'manual', limit: 10 }, opts || {});
    stopClock();
    suppressReturn = true;
    if (window.DrugBoxDesigner && document.body.classList.contains('view-build')) DrugBoxDesigner.close();
    suppressReturn = false;
    document.body.classList.add('view-study', 'view-session');
    document.body.classList.remove('view-build', 'view-box', 'view-page');
    if (window.DrugBox) DrugBox.close();
    session = {
      mode: opts.mode,
      opts: opts,
      queue: [],
      pos: 0,
      score: 0,
      answered: 0,
      streak: 0,
      best: 0,
      repeats: {},
      misses: [],
      phase: 'ask',
      card: null,
      forceReveal: !!opts.reveal,
      logged: false,
      piles: opts.mode === 'flash' ? { know: [], learning: [] } : null,
      mastered: [],
      steps: 0,
      learnIds: [],
      test: null,
      match: null
    };
    if (opts.mode === 'learn') initLearn();
    else if (opts.mode === 'test') initTest();
    else if (opts.mode === 'match') initMatch();
    else {
      session.queue = buildQueue(opts);
      prepare();
    }
    paintScore();
    renderStudy();
  }

  function leaveSession() {
    stopClock();
    logIfNeeded();
    session = null;
    wizardStep = 1;
    document.body.classList.remove('view-study', 'view-session', 'view-build', 'view-box');
    document.body.classList.add('view-page');
    renderStudyHome();
  }

  function currentFact() {
    if (!session || !session.card) return null;
    return PharmFacts.get(session.card.id);
  }

  function scoreKind(kind, assisted) {
    session.answered += 1;
    const good = kind === 'got' || kind === 'correct';
    if (good && !assisted) {
      session.score += 1;
      session.streak += 1;
      session.best = Math.max(session.best, session.streak);
    } else if (kind === 'again' || kind === 'wrong') {
      session.streak = 0;
    }
    paintScore();
  }

  function requeue(id) {
    const n = session.repeats[id] || 0;
    if (n >= 2) return;
    session.repeats[id] = n + 1;
    const at = Math.min(session.queue.length, session.pos + 3);
    session.queue.splice(at, 0, id);
  }

  function commit(kind) {
    const fact = currentFact();
    const card = session.card;
    if (!fact || !card || card.committed) return;
    card.committed = true;
    card.pendingKind = kind;
    if (kind === 'skip') return;
    PharmProgress.apply(fact.id, kind, !!card.assisted, fact.hash);
    scoreKind(kind, !!card.assisted);
    if (kind === 'again' || kind === 'wrong') session.misses.push({ id: fact.id, yours: card.yours || '' });
  }

  function advance(kind) {
    if (!session || !session.card) return;
    if (kind) commit(kind);
    const card = session.card;
    if (!card.moved) {
      if (session.mode === 'flash' && session.piles) {
        if (card.pendingKind === 'got') session.piles.know.push(card.id);
        else if (card.pendingKind === 'again' || card.pendingKind === 'almost') session.piles.learning.push(card.id);
      } else if ((card.pendingKind === 'again' || card.pendingKind === 'wrong') && card.id) requeue(card.id);
      card.moved = true;
    }
    session.pos += 1;
    prepare();
    renderStudy();
  }

  function navHtml() {
    const modes = [['flash', 'Flashcards'], ['learn', 'Learn'], ['test', 'Test'], ['match', 'Match'], ['spell', 'Spell']];
    return '<aside class="nav"><p>Study modes</p>' + modes.map(function (m) {
      const on = session.mode === m[0] || (m[0] === 'spell' && (session.mode === 'fill' || session.mode === 'spell'));
      return '<button type="button" data-go="' + m[0] + '"' + (on ? ' class="on"' : '') + '>' + m[1] + '</button>';
    }).join('') + '<button type="button" data-go="desk">Back to Study</button></aside>';
  }
  function barHtml() {
    if (session.mode === 'match' && session.match) {
      const m = session.match;
      const elapsed = m.done ? m.elapsed : (m.started ? Date.now() - m.started : 0);
      return '<div class="study-bar"><span>Match</span><span id="match-time">' + fmtTime(elapsed) + '</span><span>Mistakes ' + m.mistakes + '</span><span>Best ' + fmtTime(m.best) + '</span></div>';
    }
    if (session.mode === 'test' && session.test) {
      const n = session.test.questions.length;
      const at = session.phase === 'done' ? n : Math.min(session.test.index + 1, n);
      return '<div class="study-bar"><span>Test <b>' + at + '</b> of ' + n + '</span><span>Answers stay hidden until you finish.</span></div>';
    }
    if (session.mode === 'learn') {
      const stage = session.card && session.card.stage === 'mc' ? 'Multiple choice' : 'Type the answer';
      const left = Math.max(0, session.queue.length - session.pos);
      return '<div class="study-bar"><span>Learn · ' + stage + '</span><span>' + session.mastered.length + ' mastered · ' + left + ' still in the round</span></div>';
    }
    const fact = currentFact();
    const n = session.queue.length;
    const at = Math.min(session.pos + 1, n);
    const d = fact ? PharmFacts.drug(fact.drug) : null;
    const who = fact && fact.who ? (fact.who === 'Pediatric' ? 'Peds' : 'Adult') : '';
    const piles = session.piles ? '<span>Know ' + session.piles.know.length + ' · Still learning ' + session.piles.learning.length + '</span>' : '';
    return '<div class="study-bar"><span>Card <b>' + (session.phase === 'done' ? n : at) + '</b> of ' + n + '</span><span>' +
      esc(fact ? fact.label : 'Session') + (d ? ' · ' + esc(d.name) : '') + (who ? ' · ' + esc(who) : '') + '</span>' + piles + '</div>';
  }
  function drugRail(fact, reveal) {
    const d = PharmFacts.drug(fact.drug);
    const showAlias = fact.field !== 'alias' && d.alias;
    const cls = fact.field === 'classification' ? '' : (d.classification || []).slice(0, 2).map(esc).join(' · ');
    const ind = fact.field === 'indications' || fact.field === 'dosage' ? '' : '';
    let extra = '';
    if (fact.field === 'dosage') {
      extra = '<p class="kicker tone-cl">Classification</p><p>' + esc((d.classification || []).join(' · ') || 'None listed') + '</p>' +
        '<p class="kicker tone-in">Indications</p><ul class="sibs">' + (d.indications || []).slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    } else if (cls) {
      extra = '<p class="kicker tone-cl">Classification</p><p>' + cls + '</p>';
    }
    if (ind) extra += ind;
    const source = reveal ? '<p class="kicker">Source line</p><p>' + esc(PharmFacts.textOf(fact)) + '</p>' : '<p class="note">The dose and the tested fact stay hidden until you check or reveal.</p>';
    return '<aside class="rail">' + svg(fact.drug) + '<h3>' + esc(d.name) + '</h3>' +
      (showAlias ? '<p class="alias">' + esc(d.alias) + '</p>' : '') +
      (fact.who ? '<p><span class="who-chip ' + (fact.who === 'Pediatric' ? 'peds' : 'adult') + '">' + (fact.who === 'Pediatric' ? 'PEDS' : 'ADULT') + '</span></p>' : '') +
      extra + source +
      '<p class="note">Say it first. A hint or the source line marks the card assisted and does not move the Leitner box.</p>' +
      '<button type="button" class="ghost" id="bookmark">' + (PharmProgress.isBookmarked(fact.drug) ? '★ Bookmarked' : '☆ Bookmark') + '</button>' +
      '</aside>';
  }

  function renderFlash(fact) {
    const card = session.card;
    const d = PharmFacts.drug(fact.drug);
    const pres = presentation(fact);
    const items = fact.field === 'dosage' || fact.field === 'alias' ? null : (PharmFacts.drug(fact.drug)[fact.field] || []);
    const which = items && items.length > 1 ? ' · ' + (fact.index + 1) + ' of ' + items.length : '';
    const hard = PharmProgress.isHard(fact.id);
    const face = card.revealed
      ? '<button type="button" class="reveal flip" id="flip-back">' + esc(pres.full || pres.answer) + '</button>' +
        '<div class="grades"><button type="button" id="grade-again">Still learning<small>Leaves it in that pile</small></button>' +
        '<button type="button" class="got" id="grade-got">Know<small>' + (card.assisted ? 'Assisted — box stays' : 'Moves it to Know') + '</small></button></div>'
      : '<button type="button" class="gold flip" id="show-answer">Flip card</button>';
    const body = '<section class="card"><p class="kicker tone-' + fact.tone + '">' + esc(fact.label) + esc(which) + '</p>' +
      svg(fact.drug) + '<h2>' + esc(d.name) + '</h2>' +
      (fact.field !== 'alias' && d.alias ? '<p class="alias">' + esc(d.alias) + '</p>' : '') +
      (fact.who ? '<p><span class="who-chip ' + (fact.who === 'Pediatric' ? 'peds' : 'adult') + '">' + (fact.who === 'Pediatric' ? 'PEDS' : 'ADULT') + '</span></p>' : '') +
      (card.updated ? '<p class="updated">This line changed in the drug list. Review it again.</p>' : '') +
      '<p class="prompt">' + (card.revealed ? 'Definition' : 'Tap the card to flip it.') + '</p>' + face +
      '<div class="actions"><button type="button" id="star-card">' + (hard ? '★ Hard' : '☆ Mark hard') + '</button><button type="button" id="shuffle">Shuffle</button><button type="button" id="hint">Hint</button></div>' +
      (card.hint ? '<p class="note" id="hint-text">' + esc(card.hint) + '</p>' : '') +
      '<p class="note">Space flips. Then 1 Still learning, 2 Know.</p></section>';
    document.getElementById('study').innerHTML = barHtml() + '<div class="study-body flash" data-layout="DB2">' + navHtml() + body + drugRail(fact, card.revealed || card.reference) + '</div>';
    bindCommon();
    const show = document.getElementById('show-answer');
    if (show) show.onclick = function () { card.revealed = true; renderStudy(); };
    const back = document.getElementById('flip-back');
    if (back) back.onclick = function () { card.revealed = false; renderStudy(); };
    const star = document.getElementById('star-card');
    if (star) star.onclick = function () { PharmProgress.toggleHard(fact.id); fillSubsets(); renderStudy(); };
    const shuffleBtn = document.getElementById('shuffle');
    if (shuffleBtn) shuffleBtn.onclick = function () {
      const rest = shuffle(session.queue.slice(session.pos));
      session.queue = session.queue.slice(0, session.pos).concat(rest);
      session.card = null;
      prepare();
      renderStudy();
    };
    bindGrade();
  }

  function renderFill(fact) {
    const card = session.card;
    const d = PharmFacts.drug(fact.drug);
    const pres = presentation(fact);
    let prompt = '';
    if (pres.kind === 'dose') {
      let ord = 0;
      prompt = '<div class="line">' + pres.parts.map(function (p) {
        if (p.type === 'text') return esc(p.text);
        const i = ord++;
        const val = card.values && card.values[i] != null ? card.values[i] : '';
        return '<input class="blank" data-i="' + i + '" aria-label="Dose blank ' + (i + 1) + '" autocomplete="off" spellcheck="false" value="' + esc(val) + '"' + (card.phase === 'feedback' ? ' readonly' : '') + '>';
      }).join('') + '</div>';
      if (card.phase !== 'feedback') prompt += keypadHtml();
    } else if (pres.kind === 'siblings') {
      prompt = '<p class="prompt">The other listed items are shown. Type the missing one.</p><ul class="sibs">' +
        pres.siblings.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
        '<input class="answer" id="answer" autocomplete="off" spellcheck="false" placeholder="Missing fact">';
    } else if (pres.kind === 'cloze') {
      prompt = '<p class="prompt">' + esc(pres.before) + ' <input class="answer" id="answer" autocomplete="off" spellcheck="false" placeholder="Fill the missing words"> ' + esc(pres.after) + '</p>';
    } else if (pres.kind === 'alias') {
      prompt = '<p class="prompt">Type a trade or other name from the card.</p><input class="answer" id="answer" autocomplete="off" spellcheck="false" placeholder="Name">';
    } else {
      prompt = '<p class="prompt">Type this ' + esc(fact.label.toLowerCase()) + '.</p><textarea class="answer" id="answer" rows="3" spellcheck="false" placeholder="Your recall"></textarea>';
    }
    let feedback = '';
    if (card.phase === 'feedback' && card.result) {
      feedback = '<div class="feedback ' + (card.result.ok ? 'good' : 'bad') + '"><p class="src">' + esc(fact.label) + ' · source</p><p>' +
        (card.result.ok ? (session.mode === 'learn' ? 'Mastered. It leaves the round.' : 'Matched the card.') : (session.mode === 'learn' ? 'Not yet. It goes back to multiple choice.' : 'Not a match for this line.')) +
        (card.assisted ? ' Assisted — the Leitner box stays put.' : '') + '</p><p>' + esc(pres.full || pres.answer) + '</p>' +
        (card.result.blanks ? '<p>' + card.result.blanks.map(function (b) {
          return (b.ok ? '✓ ' : '✗ ') + esc(b.given || 'blank') + ' → ' + esc(b.answer);
        }).join('<br>') + '</p>' : '') +
        '<button type="button" class="gold" id="next-card">Next card</button></div>';
    }
    const actions = card.phase === 'feedback' ? '' :
      '<div class="actions"><button type="button" class="gold" id="check-answer">Check answer</button><button type="button" id="hint">Hint</button><button type="button" id="skip">Skip</button></div>';
    const spellTitle = session.mode === 'learn' ? 'Learn · type it' : (session.mode === 'spell' ? 'Spell / Write' : 'Fill in the blank');
    const body = '<section class="card"><p class="kicker tone-' + fact.tone + '">' + spellTitle + ' · ' + esc(fact.label) + '</p>' +
      '<h2>' + esc(d.name) + '</h2>' +
      (fact.who ? '<p><span class="who-chip ' + (fact.who === 'Pediatric' ? 'peds' : 'adult') + '">' + (fact.who === 'Pediatric' ? 'PEDS' : 'ADULT') + '</span></p>' : '') +
      '<p class="lede">Complete this line from the drug card. Units can be written out.</p>' +
      prompt + (card.hint ? '<p class="note">' + esc(card.hint) + '</p>' : '') + actions + feedback + '</section>';
    document.getElementById('study').innerHTML = barHtml() + '<div class="study-body fill" data-layout="DB3">' + body + drugRail(fact, card.phase === 'feedback') + '</div>';
    bindCommon();
    document.querySelectorAll('.blank').forEach(function (input, idx) {
      input.addEventListener('input', function () {
        card.values = card.values || {};
        card.values[idx] = input.value;
      });
    });
    document.querySelectorAll('.key').forEach(function (k) {
      k.onclick = function () { typeKey(k.dataset.k); };
    });
    const check = document.getElementById('check-answer');
    if (check) check.onclick = checkFill;
    const next = document.getElementById('next-card');
    if (next) next.onclick = function () { if (session.mode === 'learn') learnNext(); else advance(); };
    const skip = document.getElementById('skip');
    if (skip) skip.onclick = function () { advance('skip'); };
    const first = document.querySelector('.blank, #answer');
    if (first && card.phase === 'ask') first.focus();
  }

  function keypadHtml() {
    const rows = [
      ['1', '2', '3', '4', '5', '6'],
      ['7', '8', '9', '0', '.', 'del'],
      ['mg', 'mcg', 'g', 'mL', 'mEq', '/kg']
    ];
    return '<div class="keypad">' + rows.map(function (row) {
      return '<div class="keys">' + row.map(function (k) {
        return '<button type="button" class="key" data-k="' + esc(k) + '">' + esc(k) + '</button>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function typeKey(k) {
    const active = document.activeElement && document.activeElement.classList && (document.activeElement.classList.contains('blank') || document.activeElement.id === 'answer')
      ? document.activeElement
      : document.querySelector('.blank, #answer');
    if (!active) return;
    active.focus();
    if (k === 'del' || k === '⌫') active.value = active.value.slice(0, -1);
    else active.value += (k === 'mL' ? 'mL' : k);
    active.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function checkFill() {
    const fact = currentFact();
    const card = session.card;
    if (!fact || card.phase === 'feedback') return;
    const pres = presentation(fact);
    let result;
    if (pres.kind === 'dose') {
      const inputs = Array.prototype.slice.call(document.querySelectorAll('.blank'));
      const users = [];
      let bi = 0;
      pres.parts.forEach(function (p) {
        if (p.type !== 'blank') return;
        users.push(inputs[bi] ? inputs[bi].value : '');
        bi++;
      });
      card.values = {};
      users.forEach(function (v, i) { card.values[i] = v; });
      card.yours = users.join(' | ');
      result = PharmGrade.gradeBlanks(users, pres.parts);
    } else {
      const el = document.getElementById('answer');
      const user = el ? el.value : '';
      card.yours = user;
      if (pres.kind === 'alias') result = PharmGrade.gradeText(user, pres.full, pres.accept);
      else if (pres.kind === 'cloze') {
        result = PharmGrade.gradeText(user, pres.hidden);
        if (!result.ok && (PharmGrade.answersMatch(user, pres.full) || PharmGrade.loosePhrase(user, pres.full))) result = { ok: true, expected: pres.full };
      } else result = PharmGrade.gradeText(user, pres.answer);
    }
    card.result = result;
    card.phase = 'feedback';
    if (session.mode !== 'learn') commit(result.ok ? 'correct' : 'wrong');
    renderStudy();
  }

  function renderQuiz(fact) {
    const card = session.card;
    const d = PharmFacts.drug(fact.drug);
    const locked = card.phase === 'feedback';
    const options = (card.options || []).map(function (o, i) {
      let cls = 'mcq-option';
      if (locked && o.correct) cls += ' correct';
      if (locked && card.picked === i && !o.correct) cls += ' wrong';
      return '<button type="button" class="' + cls + '" data-i="' + i + '"' + (locked ? ' disabled' : '') + '>' + esc(o.text) + '</button>';
    }).join('');
    const learnNote = session.mode === 'learn'
      ? (card.result && card.result.ok ? 'Correct. Next you will type this fact.' : 'Not yet. This card comes back as multiple choice.')
      : (card.assisted ? 'Assisted — mastery stays where it is.' : '');
    const feedback = locked ? '<div class="feedback ' + (card.result && card.result.ok ? 'good' : 'bad') + '"><p class="src">' + esc(fact.label) + ' · source</p><p>' +
      esc(PharmFacts.textOf(fact)) + '</p>' + (learnNote ? '<p>' + learnNote + '</p>' : '') +
      '<button type="button" class="gold" id="next-card">Next card</button></div>' : '';
    const prompt = session.mode === 'learn'
      ? 'Learn starts with a choice. A correct pick is typed on the next pass.'
      : 'Which of these is listed for this drug? One option matches the card.';
    const body = '<section class="card"><p class="kicker tone-' + fact.tone + '">' + esc(fact.label) + '</p><h2>' + esc(d.name) + '</h2>' +
      (fact.who ? '<p><span class="who-chip ' + (fact.who === 'Pediatric' ? 'peds' : 'adult') + '">' + (fact.who === 'Pediatric' ? 'PEDS' : 'ADULT') + '</span></p>' : '') +
      '<p class="prompt">' + prompt + '</p>' +
      '<div class="mcq">' + options + '</div>' + feedback + '</section>';
    document.getElementById('study').innerHTML = barHtml() + '<div class="study-body quiz" data-layout="DB2">' + navHtml() + body + drugRail(fact, locked) + '</div>';
    bindCommon();
    document.querySelectorAll('.mcq-option').forEach(function (btn) {
      btn.onclick = function () {
        if (card.phase === 'feedback') return;
        const i = Number(btn.dataset.i);
        card.picked = i;
        const ok = !!(card.options[i] && card.options[i].correct);
        card.result = { ok: ok };
        card.yours = card.options[i] ? card.options[i].text : '';
        card.phase = 'feedback';
        if (session.mode !== 'learn') commit(ok ? 'correct' : 'wrong');
        renderStudy();
      };
    });
    const next = document.getElementById('next-card');
    if (next) next.onclick = function () { if (session.mode === 'learn') learnNext(); else advance(); };
  }

  function shortLabel(fact) {
    const text = optionText(fact) || PharmFacts.textOf(fact);
    const clean = String(text).replace(/\s+/g, ' ').trim();
    return clean.length > 72 ? clean.slice(0, 69) + '…' : clean;
  }
  function pickPairs(ids, n) {
    const seenDrug = {};
    const seenText = {};
    const out = [];
    shuffle((ids || []).map(function (id) { return PharmFacts.get(id); }).filter(Boolean)).forEach(function (f) {
      if (out.length >= n || seenDrug[f.drug]) return;
      const label = shortLabel(f);
      const key = PharmGrade.normalize(label);
      if (!label || label.length > 80 || seenText[key]) return;
      seenDrug[f.drug] = 1;
      seenText[key] = 1;
      out.push(f);
    });
    return out.length >= 4 ? out.slice(0, n) : [];
  }
  function makeTf(fact) {
    const d = PharmFacts.drug(fact.drug);
    const truth = PharmFacts.textOf(fact);
    let statement = truth;
    let answer = true;
    const others = shuffle(PharmFacts.all().filter(function (f) {
      return f.id !== fact.id && PharmFacts.filterKey(f) === PharmFacts.filterKey(fact);
    }));
    if (Math.random() < 0.5) {
      for (let i = 0; i < others.length; i++) {
        const t = PharmFacts.textOf(others[i]);
        if (t && !tooClose(t, trueTexts(fact))) { statement = t; answer = false; break; }
      }
    }
    return { type: 'tf', factId: fact.id, statement: d.name + ' — ' + fact.label + ': ' + statement, answer: answer, picked: null, yours: '' };
  }
  function makeMatchQuestion(ids) {
    const facts = pickPairs(ids, 4);
    if (facts.length < 4) return null;
    const pairs = facts.map(function (f) {
      return { factId: f.id, left: PharmFacts.drug(f.drug).name, right: shortLabel(f) };
    });
    return { type: 'match', pairs: pairs, rights: shuffle(pairs.map(function (p) { return p.right; })), picked: {}, factId: pairs[0].factId };
  }
  function initLearn() {
    const ids = buildQueue(session.opts);
    session.learnIds = ids.slice();
    session.queue = ids.map(function (id) { return { id: id, stage: 'mc' }; });
    session.pos = 0;
    session.cap = Math.max(ids.length, 1) * 8;
    prepareLearn();
  }
  function learnCard(fact, extra) {
    const updated = PharmProgress.noteHash(fact.id, fact.hash);
    return Object.assign({
      id: fact.id, options: null, assisted: false, revealed: false, phase: 'ask', result: null,
      hint: '', reference: false, updated: updated, stage: 'write', yours: ''
    }, extra || {});
  }
  function prepareLearn() {
    while (session.pos < session.queue.length && session.steps < session.cap) {
      const item = session.queue[session.pos];
      const fact = PharmFacts.get(item.id);
      if (!fact || !PharmFacts.textOf(fact)) { session.pos++; continue; }
      if (item.stage === 'mc') {
        if (!item.options) item.options = makeOptions(fact);
        if (item.options) { session.card = learnCard(fact, { stage: 'mc', options: item.options }); return; }
        item.stage = 'write';
      }
      session.card = learnCard(fact, { stage: 'write' });
      return;
    }
    session.card = null;
    session.phase = 'done';
    logIfNeeded();
  }
  function learnNext() {
    const card = session.card;
    const item = session.queue[session.pos];
    if (!card || !item) return;
    const ok = !!(card.result && card.result.ok);
    session.steps++;
    if (card.stage === 'mc') {
      if (ok) session.queue.push({ id: item.id, stage: 'write' });
      else {
        session.queue.push({ id: item.id, stage: 'mc' });
        session.streak = 0;
        session.misses.push({ id: item.id, yours: card.yours || '' });
        paintScore();
      }
    } else if (ok) {
      commit('correct');
      session.mastered.push(item.id);
    } else {
      commit('wrong');
      session.queue.push({ id: item.id, stage: 'mc' });
    }
    session.pos++;
    prepareLearn();
    renderStudy();
  }
  function initTest() {
    const ids = buildQueue(Object.assign({}, session.opts, { mode: 'test' }));
    const questions = [];
    const cycle = ['mc', 'tf', 'write', 'mc', 'write', 'tf'];
    ids.forEach(function (id, i) {
      const fact = PharmFacts.get(id);
      if (!fact) return;
      let type = cycle[i % cycle.length];
      if (type === 'mc') {
        const options = makeOptions(fact);
        if (!options) type = 'tf';
        else { questions.push({ type: 'mc', factId: id, options: options, picked: null, yours: '' }); return; }
      }
      if (type === 'tf') { questions.push(makeTf(fact)); return; }
      questions.push({ type: 'write', factId: id, value: '', yours: '' });
    });
    const block = makeMatchQuestion(ids);
    if (block) questions.splice(Math.min(questions.length, 2), 0, block);
    session.test = { questions: questions, index: 0 };
    session.phase = questions.length ? 'ask' : 'done';
    if (!questions.length) logIfNeeded();
  }
  function gradeWriteValue(fact, value) {
    const pres = presentation(fact);
    const text = PharmFacts.textOf(fact);
    if (PharmGrade.answersMatch(value, text) || PharmGrade.loosePhrase(value, text)) return true;
    if (pres.kind === 'dose') {
      if (PharmGrade.answersMatch(value, pres.answer)) return true;
      const blanks = pres.parts.filter(function (p) { return p.type === 'blank'; });
      if (blanks.length === 1) return PharmGrade.gradeBlanks([value], pres.parts).ok;
    }
    if (pres.kind === 'alias') return PharmGrade.gradeText(value, text, pres.accept).ok;
    if (pres.kind === 'cloze') return PharmGrade.gradeText(value, pres.hidden).ok || PharmGrade.answersMatch(value, text);
    return PharmGrade.gradeText(value, pres.answer).ok;
  }
  function scoreQuestion(q) {
    if (q.type === 'mc') return !!(q.options[q.picked] && q.options[q.picked].correct);
    if (q.type === 'tf') return q.picked === q.answer;
    if (q.type === 'write') return gradeWriteValue(PharmFacts.get(q.factId), q.value || '');
    if (q.type === 'match') return q.pairs.every(function (p, i) { return PharmGrade.normalize(q.picked[i] || '') === PharmGrade.normalize(p.right); });
    return false;
  }
  function gradeTest() {
    const qs = session.test.questions;
    let correct = 0;
    qs.forEach(function (q) {
      q.ok = scoreQuestion(q);
      if (q.ok) correct++;
      if (q.type === 'match') {
        q.pairs.forEach(function (p, i) {
          const ok = PharmGrade.normalize(q.picked[i] || '') === PharmGrade.normalize(p.right);
          const fact = PharmFacts.get(p.factId);
          if (fact) PharmProgress.apply(p.factId, ok ? 'correct' : 'wrong', false, fact.hash);
          if (!ok) session.misses.push({ id: p.factId, yours: q.picked[i] || '' });
        });
      } else if (q.factId) {
        const fact = PharmFacts.get(q.factId);
        if (fact) PharmProgress.apply(q.factId, q.ok ? 'correct' : 'wrong', false, fact.hash);
        if (!q.ok) session.misses.push({ id: q.factId, yours: q.yours || q.value || '' });
      }
    });
    session.score = correct;
    session.answered = qs.length;
    session.phase = 'done';
    paintScore();
    logIfNeeded();
  }
  function initMatch() {
    const ids = buildQueue(Object.assign({}, session.opts, { mode: 'match', limit: 'all' }));
    const facts = pickPairs(ids, 6);
    const key = 'match|' + session.opts.field + '|' + session.opts.subset + '|' + session.opts.pop;
    session.match = {
      pairs: [], tiles: [], selected: null, locked: {}, bad: null, mistakes: 0,
      started: 0, elapsed: 0, done: false, best: PharmProgress.bestMatch(key), key: key,
      clock: null, error: ''
    };
    if (facts.length < 4) {
      session.match.error = 'Not enough distinct short facts in this filter for a match board. Try Classification or Adult dosage.';
      return;
    }
    const pairs = facts.map(function (f, i) {
      return { id: 'p' + i, factId: f.id, left: PharmFacts.drug(f.drug).name, right: shortLabel(f) };
    });
    const tiles = [];
    pairs.forEach(function (p) {
      tiles.push({ pair: p.id, side: 'l', text: p.left });
      tiles.push({ pair: p.id, side: 'r', text: p.right });
    });
    session.match.pairs = pairs;
    session.match.tiles = shuffle(tiles);
    session.match.clock = setInterval(function () {
      if (!session || !session.match || !session.match.started || session.match.done) return;
      const el = document.getElementById('match-time');
      if (el) el.textContent = fmtTime(Date.now() - session.match.started);
    }, 200);
  }
  function finishMatch() {
    const m = session.match;
    m.done = true;
    m.elapsed = Date.now() - (m.started || Date.now());
    m.best = PharmProgress.saveMatch(m.key, m.elapsed);
    m.isBest = m.best === m.elapsed;
    session.score = m.pairs.length;
    session.answered = m.pairs.length;
    session.phase = 'done';
    m.pairs.forEach(function (p) {
      const fact = PharmFacts.get(p.factId);
      if (fact) PharmProgress.apply(p.factId, 'correct', false, fact.hash);
    });
    if (m.clock) { clearInterval(m.clock); m.clock = null; }
    logIfNeeded();
  }
  function onTileClick(pair, side) {
    const m = session.match;
    if (!m || m.done || m.error) return;
    const token = pair + ':' + side;
    if (m.locked[token]) return;
    if (!m.started) m.started = Date.now();
    if (!m.selected) { m.selected = token; renderMatch(); return; }
    if (m.selected === token) { m.selected = null; renderMatch(); return; }
    const prev = m.selected.split(':');
    m.selected = null;
    if (prev[0] === pair && prev[1] !== side) {
      m.locked[prev[0] + ':' + prev[1]] = true;
      m.locked[token] = true;
      const all = m.tiles.every(function (t) { return m.locked[t.pair + ':' + t.side]; });
      if (all) finishMatch();
      renderMatch();
      return;
    }
    m.mistakes++;
    m.bad = [prev[0] + ':' + prev[1], token];
    renderMatch();
    setTimeout(function () {
      if (!session || !session.match) return;
      session.match.bad = null;
      renderMatch();
    }, 420);
  }
  function renderMatch() {
    const m = session.match;
    let board = '';
    if (m.error) board = '<section class="card"><h2>Match</h2><p>' + esc(m.error) + '</p></section>';
    else {
      const tiles = m.tiles.map(function (t) {
        const token = t.pair + ':' + t.side;
        let cls = 'mtile';
        if (m.locked[token]) cls += ' locked';
        if (m.selected === token) cls += ' on';
        if (m.bad && m.bad.indexOf(token) >= 0) cls += ' bad';
        return '<button type="button" class="' + cls + '" data-pair="' + esc(t.pair) + '" data-side="' + t.side + '">' + esc(t.text) + '</button>';
      }).join('');
      const banner = m.done
        ? '<p class="feedback good">Matched in ' + fmtTime(m.elapsed) + (m.isBest ? ' · new best' : ' · best ' + fmtTime(m.best)) + '. Mistakes ' + m.mistakes + '.</p>'
        : '<p class="note">Pair the drug with the fact from this filter. The clock starts on the first tile.</p>';
      board = '<section class="card match-board"><p class="kicker">Match</p>' + banner + '<div class="tilegrid">' + tiles + '</div></section>';
    }
    document.getElementById('study').innerHTML = barHtml() + '<div class="study-body matchplay" data-layout="DB2">' + navHtml() + board + '</div>';
    bindCommon();
    document.querySelectorAll('.mtile').forEach(function (btn) {
      btn.onclick = function () { onTileClick(btn.dataset.pair, btn.dataset.side); };
    });
  }
  function renderTest() {
    const q = session.test.questions[session.test.index];
    const fact = q.factId ? PharmFacts.get(q.factId) : null;
    const d = fact ? PharmFacts.drug(fact.drug) : null;
    let body = '';
    if (q.type === 'mc') {
      body = '<p class="prompt">Multiple choice</p><div class="mcq">' + q.options.map(function (o, i) {
        return '<button type="button" class="mcq-option' + (q.picked === i ? ' on' : '') + '" data-i="' + i + '">' + esc(o.text) + '</button>';
      }).join('') + '</div>';
    } else if (q.type === 'tf') {
      body = '<p class="prompt">True or false</p><p class="line">' + esc(q.statement) + '</p><div class="grades"><button type="button" id="tf-true"' + (q.picked === true ? ' class="on"' : '') + '>True</button><button type="button" id="tf-false"' + (q.picked === false ? ' class="on"' : '') + '>False</button></div>';
    } else if (q.type === 'match') {
      const opts = q.rights.map(function (r) { return '<option value="' + esc(r) + '">' + esc(r) + '</option>'; }).join('');
      body = '<p class="prompt">Matching · choose the fact for each drug</p>' + q.pairs.map(function (p, i) {
        return '<label class="matchq"><span>' + esc(p.left) + '</span><select data-i="' + i + '"><option value="">Choose</option>' + opts + '</select></label>';
      }).join('');
    } else {
      const pres = presentation(fact);
      const mask = pres.kind === 'dose' ? '<p class="line">' + pres.parts.map(function (p) { return p.type === 'text' ? esc(p.text) : '____'; }).join('') + '</p>' : '';
      body = '<p class="prompt">Type the answer</p>' + mask + '<textarea class="answer" id="answer" spellcheck="false" placeholder="Type the fact">' + esc(q.value || '') + '</textarea>';
    }
    const card = '<section class="card"><p class="kicker">' + (fact ? esc(fact.label) : 'Matching') + '</p>' +
      (d ? '<h2>' + esc(d.name) + '</h2>' : '<h2>Match the pairs</h2>') + body +
      '<button type="button" class="gold" id="next-card">' + (session.test.index + 1 >= session.test.questions.length ? 'Grade test' : 'Next') + '</button></section>';
    document.getElementById('study').innerHTML = barHtml() + '<div class="study-body quiz" data-layout="DB2">' + navHtml() + card + (fact ? drugRail(fact, false) : '<aside class="rail"><p class="note">This question is graded with the rest of the test.</p></aside>') + '</div>';
    bindCommon();
    document.querySelectorAll('.mcq-option').forEach(function (btn) {
      btn.onclick = function () { q.picked = Number(btn.dataset.i); q.yours = q.options[q.picked].text; renderTest(); };
    });
    const yes = document.getElementById('tf-true');
    const no = document.getElementById('tf-false');
    if (yes) yes.onclick = function () { q.picked = true; q.yours = 'True'; renderTest(); };
    if (no) no.onclick = function () { q.picked = false; q.yours = 'False'; renderTest(); };
    document.querySelectorAll('.matchq select').forEach(function (sel) {
      if (q.picked[sel.dataset.i]) sel.value = q.picked[sel.dataset.i];
      sel.onchange = function () { q.picked[sel.dataset.i] = sel.value; };
    });
    const area = document.getElementById('answer');
    if (area) area.oninput = function () { q.value = area.value; q.yours = area.value; };
    document.getElementById('next-card').onclick = function () {
      if (q.type === 'write' && area) q.value = area.value;
      if (session.test.index + 1 >= session.test.questions.length) { gradeTest(); renderDone(); }
      else { session.test.index++; renderTest(); }
    };
  }

  function renderDone() {
    const misses = session.misses.slice(-8).map(function (m) {
      const f = PharmFacts.get(m.id);
      if (!f) return '';
      const d = PharmFacts.drug(f.drug);
      return '<div class="miss"><b>' + esc(d ? d.name : f.drug) + ' · ' + esc(f.label) + '</b><span>' + esc(PharmFacts.textOf(f)) + '</span></div>';
    }).join('');
    let headline = session.score + ' unassisted correct';
    let detail = session.answered + ' graded · best streak ' + session.best + '.';
    let extra = '';
    if (session.mode === 'test' && session.test) {
      const n = session.test.questions.length;
      headline = session.score + ' / ' + n;
      detail = n ? Math.round(100 * session.score / n) + '% on this test.' : 'No questions for these filters.';
      extra = '<div id="test-score"></div>' + session.test.questions.map(function (q, i) {
        const f = q.factId ? PharmFacts.get(q.factId) : null;
        const name = f ? PharmFacts.drug(f.drug).name : 'Matching';
        return '<div class="miss"><b>' + (q.ok ? 'Correct' : 'Missed') + ' · ' + esc(name) + '</b><span>' + esc(f ? PharmFacts.textOf(f) : q.pairs.map(function (p) { return p.left + ' → ' + p.right; }).join(' · ')) + '</span></div>';
      }).join('');
    } else if (session.mode === 'learn') {
      headline = session.mastered.length + ' mastered';
      detail = 'Out of ' + session.learnIds.length + ' facts in this round.';
    } else if (session.piles) {
      detail = 'Know ' + session.piles.know.length + ' · Still learning ' + session.piles.learning.length + '.';
      if (session.piles.learning.length) extra += '<button type="button" class="gold" id="restudy">Study still learning</button>';
    }
    document.getElementById('study').innerHTML = '<div class="study-bar"><span>Session complete</span></div>' +
      '<div class="study-body"><section class="card done"><p class="eyebrow">This session</p><h2>' + headline + '</h2>' +
      '<p class="lede">' + detail + '</p>' + extra +
      (session.mode === 'test' ? '' : (misses ? '<h3>Look again</h3>' + misses : '<p>No misses in this session.</p>')) +
      '<button type="button" class="ghost" id="back-desk">Back to Study</button></section></div>';
    document.getElementById('back-desk').onclick = leaveSession;
    const restudy = document.getElementById('restudy');
    if (restudy) {
      const ids = session.piles.learning.slice();
      const opts = Object.assign({}, session.opts, { mode: 'flash', onlyIds: ids, factId: null, reveal: false });
      restudy.onclick = function () { startSession(opts); };
    }
  }

  function renderStudy() {
    if (!session) return;
    if (session.mode === 'match') { renderMatch(); paintScore(); return; }
    if (session.mode === 'test') {
      if (session.phase === 'done') renderDone();
      else renderTest();
      paintScore();
      return;
    }
    if (session.mode === 'learn') {
      if (session.phase === 'done' || !session.card) renderDone();
      else if (session.card.stage === 'mc') renderQuiz(currentFact());
      else renderFill(currentFact());
      paintScore();
      return;
    }
    if (session.phase === 'done' || !session.card) { renderDone(); return; }
    const fact = currentFact();
    if (!fact) { renderDone(); return; }
    if (session.mode === 'fill' || session.mode === 'spell') renderFill(fact);
    else if (session.mode === 'quiz') renderQuiz(fact);
    else renderFlash(fact);
    paintScore();
  }

  function bindGrade() {
    const again = document.getElementById('grade-again');
    const almost = document.getElementById('grade-almost');
    const got = document.getElementById('grade-got');
    if (again) again.onclick = function () { advance('again'); };
    if (almost) almost.onclick = function () { advance('almost'); };
    if (got) got.onclick = function () { advance('got'); };
  }
  function bindCommon() {
    document.querySelectorAll('[data-go]').forEach(function (btn) {
      btn.onclick = function () {
        const go = btn.dataset.go;
        if (go === 'desk') leaveSession();
        else startSession(Object.assign({}, session.opts, { mode: go, factId: null, reveal: false }));
      };
    });
    const hint = document.getElementById('hint');
    if (hint) hint.onclick = function () {
      const fact = currentFact();
      if (!fact) return;
      session.card.assisted = true;
      const pres = presentation(fact);
      if (pres.kind === 'dose') {
        session.card.hint = 'Units on the blanks: ' + pres.parts.filter(function (p) { return p.type === 'blank'; }).map(function (p) {
          const m = String(p.answer).match(/(mg\/kg\/min|mcg\/kg\/min|mg\/kg|mcg\/kg|meq|mg|mcg|ml|gm|g|vials?|inch|")/i);
          return m ? m[0] : 'text';
        }).join(' · ') + '. Assisted.';
      } else {
        const words = String(pres.answer || '').trim().split(/\s+/).filter(Boolean);
        const first = words[0] ? words[0].slice(0, 1) : '';
        session.card.hint = (words.length || 0) + ' word' + (words.length === 1 ? '' : 's') + ' · starts with “' + first + '”. Assisted.';
      }
      renderStudy();
    };
    const ref = document.getElementById('reference');
    if (ref) ref.onclick = function () {
      session.card.assisted = true;
      session.card.reference = true;
      session.card.revealed = true;
      renderStudy();
    };
    const bm = document.getElementById('bookmark');
    if (bm) bm.onclick = function () {
      const fact = currentFact();
      if (!fact) return;
      PharmProgress.toggleBookmark(fact.drug);
      fillSubsets();
      renderStudy();
    };
  }

  const FIELD_SLOTS = [
    ['all', 'All'],
    ['classification', 'Classification'],
    ['mechanism_of_action', 'Mechanism'],
    ['indications', 'Indications'],
    ['contraindications', 'Contraindications'],
    ['precautions', 'Precautions'],
    ['adult_dosage', 'Adult dose'],
    ['peds_dosage', 'Peds dose'],
    ['side_adverse_effects', 'Side effects'],
    ['special_considerations', 'Special notes'],
    ['alias', 'Trade names']
  ];
  const WALL_SECTIONS = [
    ['classification', 'Classification', 'cl'],
    ['mechanism_of_action', 'Mechanism of action', 'mo'],
    ['dosage', 'Dosage', 'ds'],
    ['indications', 'Indications', 'in'],
    ['contraindications', 'Contraindications', 'ci'],
    ['precautions', 'Precautions', 'pr'],
    ['side_adverse_effects', 'Side / adverse effects', 'se'],
    ['special_considerations', 'Special considerations', 'sc']
  ];
  const MODE_SLOTS = [
    ['flash', '01', 'Flashcards', 'Flip the card, star the hard ones, then sort Know or Still learning.'],
    ['learn', '02', 'Learn', 'Multiple choice first. Type it once you get it. Misses come back.'],
    ['test', '03', 'Test', 'Multiple choice, true or false, typing, and matching. Graded at the end.'],
    ['match', '04', 'Match', 'Timed tiles. Pair the drug with the fact. Best time is saved.'],
    ['spell', '05', 'Spell', 'Type the answer. Case, spacing, and milligrams all count.']
  ];

  function shortDrug(name) {
    return String(name || '').replace(/ (Sulfate|Hydrochloride|Bromide|Citrate|Chloride|Bitartrate)$/, '');
  }
  function showBox() {
    document.body.classList.remove('view-page', 'view-session', 'view-study', 'view-build');
    document.body.classList.add('view-box');
    renderFoam();
    renderWall();
  }
  function showPage() {
    document.body.classList.remove('view-box', 'view-session', 'view-study', 'view-build');
    document.body.classList.add('view-page');
    renderStudyHome();
  }
  function loadTabs() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(WALL_KEY) || 'null');
      if (!raw || !Array.isArray(raw.tabs)) return;
      openTabs = raw.tabs.filter(function (k) { return window.DRUG_BOX.drugs[k]; });
      activeTab = window.DRUG_BOX.drugs[raw.active] ? raw.active : (openTabs[0] || null);
    } catch (e) {}
  }
  function saveTabs() {
    try { sessionStorage.setItem(WALL_KEY, JSON.stringify({ tabs: openTabs, active: activeTab })); } catch (e) {}
  }
  function openTab(key) {
    if (!window.DRUG_BOX.drugs[key]) return;
    if (openTabs.indexOf(key) < 0) openTabs.push(key);
    activeTab = key;
    saveTabs();
    renderFoam();
    renderWall();
  }
  function closeTab(key) {
    const i = openTabs.indexOf(key);
    if (i < 0) return;
    openTabs.splice(i, 1);
    if (activeTab === key) activeTab = openTabs[Math.max(0, i - 1)] || openTabs[0] || null;
    saveTabs();
    renderFoam();
    renderWall();
  }
  function sectionHtml(drug, spec) {
    if (spec[0] === 'dosage') {
      const lines = drug.dosage || [];
      const items = lines.length ? lines.map(function (line) {
        const peds = line.who === 'Pediatric';
        return '<li class="' + (peds ? 'pd' : 'ad') + '"><span class="who' + (peds ? ' p' : '') + '">' + (peds ? 'PEDS' : 'ADULT') + '</span>' + esc(line.t) + '</li>';
      }).join('') : '<li>None listed on the card.</li>';
      return '<section class="sec sect ds"><h3 class="k">Dosage</h3><ul>' + items + '</ul></section>';
    }
    const arr = drug[spec[0]] || [];
    const items = arr.length ? arr.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') : '<li>None listed on the card.</li>';
    return '<section class="sec sect ' + spec[2] + '"><h3 class="k">' + esc(spec[1]) + '</h3><ul>' + items + '</ul></section>';
  }
  function matchesQuery(key, drug) {
    if (!boxQuery) return true;
    const blob = (key + ' ' + drug.name + ' ' + (drug.alias || '') + ' ' + (drug.classification || []).join(' ') + ' ' + (drug.indications || []).join(' ')).toLowerCase();
    return boxQuery.toLowerCase().split(/\s+/).every(function (w) { return blob.indexOf(w) >= 0; });
  }
  function favoriteDrug(key) {
    if (PharmProgress.isBookmarked(key)) return true;
    const facts = PharmFacts.all();
    for (let i = 0; i < facts.length; i++) {
      if (facts[i].drug === key && PharmProgress.isHard(facts[i].id)) return true;
    }
    return false;
  }
  function tileHtml(key) {
    const d = window.DRUG_BOX.drugs[key];
    return '<button type="button" class="tile' + (openTabs.indexOf(key) >= 0 ? ' on' : '') + '" data-drug="' + esc(key) + '">' +
      '<span class="mod">' + (d.module == null ? 'EXTRA' : 'M' + d.module) + '</span>' +
      svg(key) + '<b>' + esc(shortDrug(d.name)) + '</b><em>' + esc(d.alias || '') + '</em></button>';
  }
  function renderViews() {
    const host = document.getElementById('views');
    if (!host) return;
    host.innerHTML = HOME_VIEWS.map(function (row) {
      return '<button type="button" class="vslot' + (row[0] === boxView ? ' on' : '') + '" data-view="' + row[0] + '">' + esc(row[1]) + '</button>';
    }).join('');
  }
  function renderFoam() {
    const foam = document.getElementById('foam');
    if (!foam) return;
    const top = foam.scrollTop;
    const drugs = window.DRUG_BOX.drugs;
    const keys = Object.keys(drugs).filter(function (key) { return matchesQuery(key, drugs[key]); });
    const sections = [];
    function push(title, list) {
      if (!list.length) return;
      list.sort(function (a, b) { return drugs[a].name.localeCompare(drugs[b].name); });
      sections.push([title, list]);
    }
    if (boxView === 'module') {
      const mods = {};
      keys.forEach(function (key) {
        const title = drugs[key].module == null ? 'Unscheduled / extra' : 'Module ' + drugs[key].module;
        (mods[title] = mods[title] || []).push(key);
      });
      Object.keys(mods).sort(function (a, b) {
        const na = a === 'Unscheduled / extra' ? 99 : Number(a.slice(7));
        const nb = b === 'Unscheduled / extra' ? 99 : Number(b.slice(7));
        return na - nb;
      }).forEach(function (title) { push(title, mods[title]); });
    } else if (boxView === 'alpha') {
      const letters = {};
      keys.forEach(function (key) {
        const letter = (drugs[key].name || '?')[0].toUpperCase();
        (letters[letter] = letters[letter] || []).push(key);
      });
      Object.keys(letters).sort().forEach(function (letter) { push(letter, letters[letter]); });
    } else if (boxView === 'class' || boxView === 'cardiac') {
      const order = PharmFacts.BUCKETS.map(function (row) { return row[1]; }).concat('Other');
      const groups = {};
      keys.forEach(function (key) {
        if (boxView === 'cardiac' && !cardiacHas(key)) return;
        const name = PharmFacts.bucket(drugs[key]);
        (groups[name] = groups[name] || []).push(key);
      });
      order.forEach(function (name) { if (groups[name]) push(name, groups[name]); });
    } else if (boxView === 'favorites') {
      push('Starred', keys.filter(favoriteDrug));
    } else if (boxView === 'rhythm') {
      const rhythm = (window.DRUG_BOX.rhythms || {})[rhythmId];
      const roles = window.DRUG_BOX.roles || {};
      const groups = {};
      ((rhythm && rhythm.drugs) || []).forEach(function (entry) {
        if (!entry || !drugs[entry.drug] || keys.indexOf(entry.drug) < 0) return;
        (groups[entry.role] = groups[entry.role] || []).push(entry.drug);
      });
      ['first', 'next', 'cond', 'sed', 'avoid'].forEach(function (role) {
        if (groups[role]) push(roles[role] || role, groups[role]);
      });
    } else if (boxView === 'custom') {
      const boxes = slots();
      if (!boxes.length) {
        foam.innerHTML = '<p class="foam-empty">No custom box saved yet. Use Build to make one.</p>';
        return;
      }
      boxes.forEach(function (box) {
        push(box.name || 'Custom box', keys.filter(function (key) { return drugsInSlot(box).has(key); }));
      });
    }
    let extra = '';
    if (boxView === 'rhythm') {
      const rhythms = window.DRUG_BOX.rhythms || {};
      const opts = Object.keys(rhythms).map(function (id) {
        const label = RHYTHM_LABEL[id] || id;
        return '<option value="' + esc(id) + '"' + (id === rhythmId ? ' selected' : '') + '>' + esc(label) + '</option>';
      }).join('');
      extra = '<label class="rhythm-pick">Rhythm <select id="rhythm-pick">' + opts + '</select></label>';
    }
    if (!sections.length) {
      foam.innerHTML = extra + '<p class="foam-empty">' + (boxView === 'favorites' ? 'No favorites yet. Bookmark a drug or star a card.' : 'Nothing in this view.') + '</p>';
      foam.scrollTop = top;
      return;
    }
    foam.innerHTML = extra + sections.map(function (section) {
      return '<p class="group-h">' + esc(section[0]) + '</p><div class="grid">' + section[1].map(tileHtml).join('') + '</div>';
    }).join('');
    foam.scrollTop = top;
  }
  function renderWall() {
    const wall = document.getElementById('wall');
    if (!wall) return;
    const drugs = window.DRUG_BOX.drugs;
    if (!openTabs.length || !drugs[activeTab]) {
      document.body.classList.remove('has-tabs');
      wall.innerHTML = '<div class="empty-wall"><img src="assets/icons/pharm-hero.png" alt=""><p>Select a drug. Each one opens as a tab on this wall.</p></div>';
      return;
    }
    const tabHtml = openTabs.map(function (key) {
      const on = key === activeTab ? ' on' : '';
      return '<span class="tab' + on + '" data-tab="' + esc(key) + '">' + esc(shortDrug(drugs[key].name)) +
        '<button type="button" class="x" data-x="' + esc(key) + '" aria-label="Close ' + esc(drugs[key].name) + '">×</button></span>';
    }).join('');
    const d = drugs[activeTab];
    const marked = PharmProgress.isBookmarked(activeTab);
    const head = '<div class="sheet-head">' + svg(activeTab) + '<div><h2>' + esc(d.name) + '</h2>' +
      (d.alias ? '<p class="alias">' + esc(d.alias) + '</p>' : '') +
      '<div class="chips"><span class="m">' + (d.module == null ? 'EXTRA' : 'MODULE ' + d.module) + '</span></div>' +
      '<button type="button" class="bm" id="wall-bookmark">' + (marked ? '★ Bookmarked' : '☆ Bookmark') + '</button></div></div>';
    document.body.classList.toggle('has-tabs', openTabs.length > 0);
    wall.innerHTML = '<div class="tabbar"><button type="button" class="tab-add" id="add-tab" aria-label="Add a drug tab">+</button><div class="tabs">' + tabHtml + '</div><button type="button" class="clear" id="clear-tabs">Clear all</button></div>' +
      '<div class="sheet"><div class="detail">' + head + WALL_SECTIONS.map(function (spec) { return sectionHtml(d, spec); }).join('') + '</div></div>';
  }
  function updateDeckNote() {
    const note = document.getElementById('deck-note');
    if (!note) return;
    const opts = optsFromUi();
    const facts = factsFor(opts);
    facts.forEach(function (f) { PharmProgress.noteHash(f.id, f.hash); });
    const due = PharmProgress.countDue(facts.map(function (f) { return f.id; }));
    const row = document.getElementById('start-row');
    const start = document.getElementById('start-mode');
    const names = { flash: 'Flashcards', learn: 'Learn', test: 'Test', match: 'Match', spell: 'Spell' };
    if (row) row.hidden = !opts.mode;
    if (start && opts.mode) start.textContent = 'Start ' + names[opts.mode];
    note.textContent = facts.length
      ? (due + ' due now · ' + facts.length + ' facts match these filters.')
      : 'Nothing matches these filters. Empty pediatric doses are not listed.';
  }
  function isPhone() {
    /* Viewport only. iPadOS Safari sends a Mac user agent, so this must not
       sniff the UA. A short landscape phone still uses the wizard; an iPad
       is wide and tall enough for the full Study page in both orientations. */
    return window.matchMedia('(max-width: 700px), (max-height: 500px)').matches;
  }
  function studyRows() {
    const drugs = window.DRUG_BOX.drugs;
    const mods = {};
    const classCount = {};
    Object.keys(drugs).forEach(function (key) {
      const d = drugs[key];
      if (d.module != null) mods[d.module] = (mods[d.module] || 0) + 1;
      classCount[PharmFacts.bucket(d)] = (classCount[PharmFacts.bucket(d)] || 0) + 1;
    });
    const rows = [];
    Object.keys(mods).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (m) {
      rows.push(['module:' + m, 'Module ' + m, mods[m] + ' drugs']);
    });
    let cardiacN = 0;
    Object.keys(drugs).forEach(function (key) { if (cardiacHas(key)) cardiacN++; });
    rows.push(['cardiac', 'Cardiac', cardiacN + ' drugs']);
    rows.push(['divider', 'More ways to pick']);
    rows.push(['all', 'All drugs', Object.keys(drugs).length + ' drugs']);
    PharmFacts.BUCKETS.forEach(function (row, i) {
      const n = classCount[row[1]] || 0;
      if (n) rows.push(['bucket:' + i, row[1], n + ' drugs']);
    });
    const savedBoxes = slots();
    if (!savedBoxes.length) rows.push(['open-build', 'Custom box', 'None saved yet']);
    savedBoxes.forEach(function (box) {
      rows.push(['box:' + box.id, 'Custom box · ' + (box.name || 'Untitled'), '']);
    });
    rows.push(['hard', 'Starred', 'Bookmarks and hard cards']);
    return rows;
  }
  function fieldHtml(fieldsOn) {
    return FIELD_SLOTS.map(function (row) {
      return '<button type="button" class="slot' + (fieldsOn.indexOf(row[0]) >= 0 ? ' on' : '') + '" data-group="field" data-id="' + esc(row[0]) + '"><b>' + esc(row[1]) + '</b></button>';
    }).join('');
  }
  function subsetHtml(subsetsOn) {
    return studyRows().map(function (row) {
      if (row[0] === 'divider') return '<div class="divider">' + esc(row[1]) + '</div>';
      const on = row[0] === 'open-build' ? '' : (subsetsOn.indexOf(row[0]) >= 0 ? ' on' : '');
      return '<button type="button" class="slot' + on + '" data-group="subset" data-id="' + esc(row[0]) + '"><b>' + esc(row[1]) + '</b>' +
        (row[2] ? '<small>' + esc(row[2]) + '</small>' : '') + '</button>';
    }).join('');
  }
  function modeHtml(modeOn) {
    return MODE_SLOTS.map(function (row) {
      return '<button type="button" class="mode' + (modeOn === row[0] ? ' on' : '') + '" data-group="mode" data-id="' + row[0] + '"><span class="num">' + row[1] + '</span><span><h3>' + row[2] + '</h3><p>' + row[3] + '</p></span><span class="go">›</span></button>';
    }).join('');
  }
  function renderWizard(host, s) {
    const fieldsOn = savedFields(s);
    const subsetsOn = savedSubsets(s).filter(function (id) { return id !== 'manual'; });
    const modeOn = s.mode || '';
    const names = { flash: 'Flashcards', learn: 'Learn', test: 'Test', match: 'Match', spell: 'Spell' };
    let dots = '';
    for (let i = 1; i <= 4; i++) dots += '<i class="' + (i === wizardStep ? 'on' : (i < wizardStep ? 'done' : '')) + '"></i>';
    let body = '';
    if (wizardStep === 1) {
      body = '<div class="ask"><h1>Which mode?</h1><p>Pick one.</p></div><div class="choices"><div class="modes" id="mode-slots">' + modeHtml(modeOn) + '</div></div>';
    } else if (wizardStep === 2) {
      body = '<div class="ask"><h1>What do you want to memorize?</h1><p>Pick any fields. All clears the others.</p></div><div class="choices"><div class="slots" id="field-slots">' + fieldHtml(fieldsOn) + '</div></div>';
    } else if (wizardStep === 3) {
      body = '<div class="ask"><h1>Which drugs?</h1><p>Modules and Cardiac first. All drugs clears the others.</p></div><div class="choices"><div class="slots" id="subset-slots">' + subsetHtml(subsetsOn) + '</div></div>';
    } else {
      const fieldLabels = FIELD_SLOTS.filter(function (row) { return fieldsOn.indexOf(row[0]) >= 0; }).map(function (row) { return row[1]; });
      const drugLabels = studyRows().filter(function (row) { return row[0] !== 'divider' && subsetsOn.indexOf(row[0]) >= 0; }).map(function (row) { return row[1]; });
      body = '<div class="ask"><h1>Ready when you are.</h1><p>This is the deck. Start begins ' + esc(names[modeOn] || 'study') + '.</p></div><div class="choices"><div class="summary">' +
        '<div class="row"><p class="k">Mode</p><strong>' + esc(names[modeOn] || 'Choose a mode') + '</strong></div>' +
        '<div class="row"><p class="k">Memorize</p><strong>' + esc(fieldLabels.join(', ') || 'All') + '</strong></div>' +
        '<div class="row"><p class="k">Drugs</p><strong>' + esc(drugLabels.join(', ') || 'All drugs') + '</strong></div></div></div>';
    }
    const backLabel = wizardStep === 1 ? 'Drug box' : 'Back';
    const primary = wizardStep === 4
      ? '<button type="button" class="start-go" id="wiz-start">Start</button>'
      : '<button type="button" class="start-go" id="wiz-next">Next</button>';
    host.innerHTML = '<div class="wizard"><header class="wiz-top"><img class="brand-icon" src="assets/icons/pharm-hero.png" alt=""><div><strong>Pharm Hero</strong><span>Study</span></div><div class="progress"><div class="dots">' + dots + '</div><span class="count">' + wizardStep + '/4</span></div></header>' +
      body + '<p class="wiz-hint" id="wiz-hint" hidden></p><div class="dock"><button type="button" class="back" id="wiz-back">' + backLabel + '</button>' + primary + '</div></div>';
    syncWizardNav();
  }
  function renderStudyHome() {
    const host = document.getElementById('study-split');
    const page = document.getElementById('study-page');
    if (!host || !window.DRUG_BOX) return;
    if (isPhone()) {
      if (page) page.classList.add('is-wizard');
      renderWizard(host, PharmProgress.settings());
      return;
    }
    if (page) page.classList.remove('is-wizard');
    const s = PharmProgress.settings();
    const fieldsOn = savedFields(s);
    const subsetsOn = savedSubsets(s);
    const modeOn = s.mode || '';
    const limit = String(s.limit || '20');
    const fieldButtons = fieldHtml(fieldsOn);
    const subsetButtons = subsetHtml(subsetsOn);
    const modes = modeHtml(modeOn);
    const limits = [['10', '10'], ['20', '20'], ['all', 'All']];
    host.innerHTML =
      '<div class="col"><section class="group"><p class="eyebrow">What to memorize</p><div class="slots" id="field-slots">' + fieldButtons + '</div></section>' +
      '<section class="group"><p class="eyebrow">Drug subset</p><div class="slots" id="subset-slots">' + subsetButtons + '</div></section></div>' +
      '<section class="col"><p class="eyebrow">Mode</p><div class="modes" id="mode-slots">' + modes + '</div>' +
      '<p class="deck-note" id="deck-note"></p>' +
      '<div class="start-row" id="start-row" hidden><label>Cards <select id="limit-filter" aria-label="How many cards">' +
      limits.map(function (row) { return '<option value="' + row[0] + '"' + (limit === row[0] ? ' selected' : '') + '>' + row[1] + '</option>'; }).join('') +
      '</select></label><button type="button" class="start-go" id="start-mode">Start</button></div></section>';
    updateDeckNote();
  }
  function toggleSlot(btn) {
    const id = btn.dataset.id;
    if (id === 'open-build') { openDesigner(); return; }
    if (btn.dataset.group === 'mode') {
      const was = btn.classList.contains('on');
      document.querySelectorAll('#mode-slots .mode').forEach(function (el) { el.classList.remove('on'); });
      if (!was) btn.classList.add('on');
    } else if (id === 'all') {
      btn.parentElement.querySelectorAll('.slot').forEach(function (el) { el.classList.toggle('on', el === btn); });
    } else {
      btn.classList.toggle('on');
      const all = btn.parentElement.querySelector('[data-id="all"]');
      if (all) all.classList.remove('on');
    }
    saveUi();
    updateDeckNote();
    syncWizardNav();
  }
  function wizardBlockReason() {
    const opts = optsFromUi();
    if ((wizardStep === 1 || wizardStep === 4) && !opts.mode) return 'Pick a mode to continue.';
    if (wizardStep === 2 && !document.querySelector('#field-slots .on')) return 'Pick at least one field.';
    if (wizardStep === 3 && !document.querySelector('#subset-slots .on')) return 'Pick at least one drug group.';
    if (wizardStep === 3 && !factsFor(opts).length) return 'No drugs in that group. Pick another.';
    if (wizardStep === 4 && !factsFor(opts).length) return 'No drugs in that group. Go back and pick another.';
    return '';
  }
  function wizardHint(text) {
    const hint = document.getElementById('wiz-hint');
    if (!hint) return;
    hint.hidden = !text;
    hint.textContent = text || '';
  }
  function syncWizardNav() {
    const next = document.getElementById('wiz-next');
    const start = document.getElementById('wiz-start');
    const reason = wizardBlockReason();
    [next, start].forEach(function (btn) {
      if (!btn) return;
      btn.disabled = false;
      btn.classList.toggle('is-blocked', !!reason);
      btn.setAttribute('aria-disabled', reason ? 'true' : 'false');
    });
    wizardHint(reason);
  }
  function openDesigner() {
    if (!window.DrugBoxDesigner) return;
    DrugBoxDesigner.open();
  }

  function boot() {
    if (!window.DRUG_BOX || !window.DRUG_BOX.drugs) { fail('Drug list failed to load.'); return; }
    if (!window.DrugBox || !window.DrugBoxKit) { fail('Drug Box UI failed to load.'); return; }
    DrugBox.init({
      select: function () {},
      has: function () { return false; },
      title: function (id) { return RHYTHM_LABEL[id] || (id ? String(id) : ''); }
    });
    loadTabs();
    renderViews();
    renderFoam();
    window.addEventListener('resize', function () {
      if (document.body.classList.contains('view-page')) renderStudyHome();
    });
    renderWall();
    renderStudyHome();
    showBox();

    document.getElementById('box-find').addEventListener('input', function () {
      boxQuery = this.value;
      renderFoam();
    });
    document.getElementById('views').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      boxView = btn.dataset.view;
      renderViews();
      renderFoam();
    });
    document.getElementById('foam').addEventListener('change', function (e) {
      if (e.target.id === 'rhythm-pick') { rhythmId = e.target.value; renderFoam(); }
    });
    document.getElementById('foam').addEventListener('click', function (e) {
      const tile = e.target.closest('.tile');
      if (tile && tile.dataset.drug) openTab(tile.dataset.drug);
    });
    document.getElementById('wall').addEventListener('click', function (e) {
      const x = e.target.closest('[data-x]');
      if (x) { e.stopPropagation(); closeTab(x.dataset.x); return; }
      const tab = e.target.closest('[data-tab]');
      if (tab) { activeTab = tab.dataset.tab; saveTabs(); renderFoam(); renderWall(); return; }
      if (e.target.closest('#add-tab')) {
        if (window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches) {
          document.body.classList.remove('has-tabs');
        }
        const find = document.getElementById('box-find');
        if (find) { find.focus(); find.select(); }
        return;
      }
      if (e.target.closest('#clear-tabs')) { openTabs = []; activeTab = null; saveTabs(); renderFoam(); renderWall(); return; }
      if (e.target.closest('#wall-bookmark') && activeTab) {
        PharmProgress.toggleBookmark(activeTab);
        renderWall();
        renderStudyHome();
      }
    });
    document.getElementById('study-open').onclick = function () { showPage(); };
    document.getElementById('back-box').onclick = function () { showBox(); };
    document.getElementById('end-session').onclick = function () { if (session) leaveSession(); else showPage(); };
    document.getElementById('build-box').onclick = openDesigner;
    document.getElementById('build-from-box').onclick = openDesigner;
    let lastStudyPointer = 0;
    function studyTarget(e) {
      const node = e.target && e.target.nodeType === 1 ? e.target : (e.target && e.target.parentElement);
      return node || null;
    }
    function onStudyTap(e) {
      const target = studyTarget(e);
      if (!target || !target.closest) return;
      if (target.closest('#wiz-back')) {
        if (wizardStep <= 1) showBox();
        else { wizardStep -= 1; renderStudyHome(); }
        return;
      }
      if (target.closest('#wiz-next') || target.closest('#wiz-start')) {
        const reason = wizardBlockReason();
        if (reason) { wizardHint(reason); return; }
        if (target.closest('#wiz-start')) {
          const opts = optsFromUi();
          saveUi();
          startSession(Object.assign({ mode: opts.mode }, opts));
          return;
        }
        wizardStep = Math.min(4, wizardStep + 1);
        saveUi();
        renderStudyHome();
        return;
      }
      if (target.closest('#start-mode')) {
        const opts = optsFromUi();
        if (!opts.mode) return;
        saveUi();
        startSession(Object.assign({ mode: opts.mode }, opts));
        return;
      }
      const btn = target.closest('#study-split .slot, #study-split .mode');
      if (btn) toggleSlot(btn);
    }
    const studyPage = document.getElementById('study-page');
    let studyDown = null;
    studyPage.addEventListener('pointerdown', function (e) {
      studyDown = { x: e.clientX, y: e.clientY, type: e.pointerType || 'mouse' };
    });
    studyPage.addEventListener('pointercancel', function () { studyDown = null; });
    studyPage.addEventListener('pointerup', function (e) {
      if (!studyDown || studyDown.type === 'mouse' || (e.pointerType || 'mouse') === 'mouse') {
        studyDown = null;
        return;
      }
      const dx = e.clientX - studyDown.x;
      const dy = e.clientY - studyDown.y;
      studyDown = null;
      if (dx * dx + dy * dy > 144) return;
      lastStudyPointer = Date.now();
      onStudyTap(e);
    });
    studyPage.addEventListener('click', function (e) {
      if (Date.now() - lastStudyPointer < 700) return;
      onStudyTap(e);
    });
    document.getElementById('study-page').addEventListener('change', function (e) {
      if (e.target.id === 'limit-filter') { saveUi(); updateDeckNote(); }
    });
    document.getElementById('progress-open').onclick = function () {
      const dlg = document.getElementById('progress-dialog');
      if (dlg.showModal) dlg.showModal();
    };
    document.getElementById('export-progress').onclick = function () {
      const blob = new Blob([JSON.stringify(PharmProgress.exportJson(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pharm-hero-progress.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    };
    document.getElementById('import-progress').onclick = function () { document.getElementById('import-file').click(); };
    document.getElementById('import-file').onchange = function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          PharmProgress.importJson(JSON.parse(String(reader.result)));
          applySettings();
          fillSubsets();
          renderDesk();
          alert('Progress imported.');
        } catch (err) { alert(err.message || 'Could not import that file.'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    };
    document.getElementById('reset-progress').onclick = function () {
      if (!confirm('Erase Pharm Hero scores, bookmarks, and Leitner boxes on this computer?')) return;
      PharmProgress.reset();
      applySettings();
      fillFields();
      fillSubsets();
      renderDesk();
    };

    if (window.DrugBoxDesigner) {
      const openD = DrugBoxDesigner.open;
      const closeD = DrugBoxDesigner.close;
      DrugBoxDesigner.open = function () {
        returnView = document.body.classList.contains('view-page') ? 'page' : 'box';
        if (window.DrugBox) DrugBox.close();
        document.body.classList.add('view-build');
        document.body.classList.remove('view-study', 'view-session', 'view-page', 'view-box');
        if (session) { stopClock(); logIfNeeded(); session = null; }
        return openD.apply(this, arguments);
      };
      DrugBoxDesigner.close = function () {
        const out = closeD.apply(this, arguments);
        document.body.classList.remove('view-build');
        renderStudyHome();
        renderFoam();
        if (!suppressReturn) {
          document.body.classList.remove('view-page', 'view-box', 'view-session', 'view-study');
          document.body.classList.add(returnView === 'page' ? 'view-page' : 'view-box');
        }
        return out;
      };
    }

    document.addEventListener('keydown', function (e) {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Enter' && e.target.closest && e.target.closest('#study')) {
          const check = document.getElementById('check-answer');
          const next = document.getElementById('next-card');
          if (check) { e.preventDefault(); check.click(); }
          else if (next) { e.preventDefault(); next.click(); }
        }
        return;
      }
      if (!session || document.body.classList.contains('view-build')) return;
      if (e.key === ' ' && session.mode === 'flash' && session.card) {
        e.preventDefault();
        session.card.revealed = !session.card.revealed;
        renderStudy();
      } else if (session.mode === 'flash' && session.card && session.card.revealed && (e.key === '1' || e.key === '2')) {
        advance(e.key === '1' ? 'again' : 'got');
      } else if ((session.mode === 'quiz' || (session.mode === 'learn' && session.card && session.card.stage === 'mc')) && session.card && session.card.phase === 'ask' && /^[1-4]$/.test(e.key)) {
        const btn = document.querySelector('.mcq-option[data-i="' + (Number(e.key) - 1) + '"]');
        if (btn) btn.click();
      }
    });

    window.PharmHero = {
      start: startSession,
      leave: leaveSession,
      openDrug: function (key) {
        if (session) { stopClock(); logIfNeeded(); session = null; }
        showBox();
        if (key) openTab(key);
      },
      state: function () { return session; },
      facts: function () { return PharmFacts.all(); },
      grade: PharmGrade
    };
  }

  try { boot(); }
  catch (err) { fail(err && err.message ? err.message : String(err)); }
})();
