// Pocket calculator for the ECG viewer, with a green lb→kg (÷ 2.2) key.
// Self-contained: injects its own CSS + panel. Wires #tCalc (toolbar) if present. API: window.Calc.{open,close,toggle,kg,press,value}
(function(){
const LB_PER_KG = 2.2;
const KG_ICON = `<svg class="kgi" viewBox="0 0 48 48" aria-hidden="true">
<path d="M7.75 19A17 17 0 0 1 40.25 19" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>
<path d="M41.6 23.4L44.2 17.6L36.6 19.9Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M40.25 29A17 17 0 0 1 7.75 29" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>
<path d="M6.4 24.6L3.8 30.4L11.4 28.1Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
<text x="24" y="28.6" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="900" font-size="12.5" letter-spacing=".3" fill="currentColor">KG</text></svg>`;
const CALC_ICON = `<svg class="cci" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="3" fill="#1b2740" stroke="#7fb2ff" stroke-width="1.4"/>
<rect x="6.6" y="5" width="10.8" height="4.2" rx="1" fill="#7fffb4" opacity=".9"/>
<g fill="#cfe0ff"><circle cx="8.3" cy="12.6" r="1.1"/><circle cx="12" cy="12.6" r="1.1"/><circle cx="8.3" cy="16.3" r="1.1"/><circle cx="12" cy="16.3" r="1.1"/></g>
<rect x="14.6" y="11.4" width="2.6" height="6.2" rx="1.1" fill="#2fd27a"/></svg>`;
window.CALC_KG_ICON = KG_ICON;

const css = `
#tools #tCalc{display:inline-flex;align-items:center;gap:7px;padding:5px 8px 5px 7px;font-size:12px;font-weight:800;letter-spacing:.4px;border-radius:10px;
  border:1px solid #2d4a7a;background:linear-gradient(#152238,#0d1626);color:#cfe0ff;box-shadow:0 6px 20px rgba(0,0,0,.35),0 0 0 1px rgba(127,178,255,.10);backdrop-filter:blur(8px)}
#tools #tCalc:hover{background:linear-gradient(#1b2c48,#111c31);border-color:#5d8fd8}
#tools #tCalc.on{background:#1a2a48;border-color:#7fb2ff;box-shadow:0 0 12px rgba(127,178,255,.4)}
#tools #tCalc .cci{width:20px;height:20px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
#tools #tCalc .kgb{display:inline-flex;align-items:center;gap:2px;font:800 10px "JetBrains Mono",Consolas,monospace;color:#04220f;background:linear-gradient(#5cf59b,#22c463);border-radius:5px;padding:2px 5px 2px 3px;letter-spacing:.4px}
#tools #tCalc .kgb .kgi{width:13px;height:13px;color:#04220f}
#calc{position:fixed;right:14px;top:62px;z-index:38;max-height:calc(100vh - 70px);overflow:auto;width:292px;display:none;flex-direction:column;gap:10px;padding:12px;border-radius:20px;
  background:linear-gradient(160deg,rgba(26,34,54,.94),rgba(9,13,24,.96));border:1px solid rgba(140,170,220,.22);
  box-shadow:0 24px 60px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(14px);color:#e6ecf7;font-family:Inter,system-ui,sans-serif;user-select:none}
#calc.open{display:flex}
#calc .chd{display:flex;align-items:center;gap:8px;cursor:move;padding:0 2px;font:800 11px Inter,system-ui,sans-serif;letter-spacing:1.4px;color:#8b97ad;text-transform:uppercase}
#calc .chd .cci{width:16px;height:16px} #calc .chd .sp{flex:1}
#calc .chd kbd{font:600 9.5px "JetBrains Mono",Consolas,monospace;color:#8b97ad;border:1px solid rgba(140,170,220,.2);border-radius:4px;padding:1px 4px;letter-spacing:0}
#calc .cx{width:24px;height:24px;padding:0;border-radius:7px;border:1px solid transparent;background:transparent;color:#8b97ad;font-size:15px;line-height:1;cursor:pointer}
#calc .cx:hover{background:rgba(255,255,255,.08);color:#fff}
#calc .cdisp{position:relative;padding:10px 12px 9px;border-radius:14px;background:linear-gradient(#060a12,#0b111d);border:1px solid rgba(140,170,220,.14);
  box-shadow:inset 0 2px 10px rgba(0,0,0,.7);text-align:right;min-height:74px;display:flex;flex-direction:column;justify-content:flex-end}
#calc .cexp{font:500 12px "JetBrains Mono",Consolas,monospace;color:#7d8aa3;min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:ltr}
#calc .cval{display:flex;align-items:baseline;justify-content:flex-end;gap:6px;font:600 34px/1.15 "JetBrains Mono",Consolas,monospace;color:#f2f6ff;white-space:nowrap;overflow:hidden;letter-spacing:-.5px}
#calc .cval.sm{font-size:26px} #calc .cval.xs{font-size:19px}
#calc .cunit{display:none;font:800 12px Inter,system-ui,sans-serif;color:#04220f;background:linear-gradient(#5cf59b,#22c463);border-radius:6px;padding:2px 6px;letter-spacing:.5px;align-self:center}
#calc.kgres .cunit{display:inline-block} #calc.kgres .cval span.n{color:#7dffb3;text-shadow:0 0 14px rgba(47,210,122,.45)}
#calc.err .cval span.n{color:#ff7a86}
#calc .ckeys{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
#calc .ckeys button{height:50px;border-radius:12px;border:1px solid rgba(140,170,220,.12);background:linear-gradient(#1e2940,#161f32);color:#e6ecf7;
  font:600 18px Inter,system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.05);transition:transform .06s,background .12s,filter .12s;padding:0}
#calc .ckeys button:hover{filter:brightness(1.18)} #calc .ckeys button:active,#calc .ckeys button.hit{transform:translateY(1px);box-shadow:0 1px 0 rgba(0,0,0,.45);filter:brightness(1.3)}
#calc .ckeys .fn{background:linear-gradient(#2a3348,#20283a);color:#b9c6dc;font-size:15px}
#calc .ckeys .op{background:linear-gradient(#24406e,#1b3157);color:#bcd6ff;font-size:21px;border-color:rgba(127,178,255,.25)}
#calc .ckeys .op.on{background:linear-gradient(#5d8fd8,#3f6fb8);color:#fff}
#calc .ckeys .eq{background:linear-gradient(#4b7fd0,#335fa8);color:#fff;font-size:22px;border-color:rgba(160,200,255,.35)}
#calc .ckeys .z{grid-column:span 2}
#calc .ckeys .kgk{position:relative;overflow:visible;display:grid;place-items:center;color:#fff;border-radius:16px;border:1px solid #9dffc8;
  background:radial-gradient(circle at 35% 25%,#8dffbf 0%,#33d47c 40%,#12a352 75%,#0a7a3b 100%);
  box-shadow:0 4px 0 #075a2b,0 8px 16px rgba(0,0,0,.55),0 0 18px rgba(47,230,130,.6),inset 0 2px 3px rgba(255,255,255,.55),inset 0 -4px 8px rgba(0,60,25,.45);
  transform:translateY(-2px);z-index:1}
#calc .ckeys .kgk:hover{filter:brightness(1.08);box-shadow:0 4px 0 #075a2b,0 8px 16px rgba(0,0,0,.55),0 0 30px rgba(70,255,150,.9),inset 0 2px 3px rgba(255,255,255,.55),inset 0 -4px 8px rgba(0,60,25,.45)}
#calc .ckeys .kgk:active,#calc .ckeys .kgk.hit{transform:translateY(2px);filter:brightness(1.15);box-shadow:0 0 0 #075a2b,0 2px 6px rgba(0,0,0,.5),0 0 26px rgba(70,255,150,.85),inset 0 2px 3px rgba(255,255,255,.5)}
#calc .ckeys .kgk .kgi{width:42px;height:42px;filter:drop-shadow(0 1px 1px rgba(0,50,20,.65))}
#calc .ckeys .kgk:hover .kgi{animation:kgspin 1.1s ease-in-out}
#calc .ckeys .kgk kbd{position:absolute;right:4px;top:3px;font:800 8.5px "JetBrains Mono",Consolas,monospace;color:#04220f;opacity:.75}
@keyframes kgspin{to{transform:rotate(360deg)}}
#calc .khint{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:-3px;font:600 10.5px "JetBrains Mono",Consolas,monospace;color:#7fd8a6}
#calc .khint i{display:inline-block;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#8dffbf,#12a352);box-shadow:0 0 6px rgba(47,230,130,.8)}
#calc:focus{outline:none} #calc:focus-visible{outline:1px solid rgba(127,178,255,.5)}
#calc .cnote{font-size:10px;color:#6c7891;text-align:center;margin-top:-2px}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

const P = document.createElement('div'); P.id = 'calc'; P.tabIndex = -1; P.setAttribute('role','dialog'); P.setAttribute('aria-label','Calculator');
P.innerHTML = `
<div class="chd">${CALC_ICON}<span>Calculator</span><span class="sp"></span><kbd>C</kbd><button class="cx" title="Close (Esc)" aria-label="Close calculator">✕</button></div>
<div class="cdisp"><div class="cexp">&nbsp;</div><div class="cval"><span class="n">0</span><span class="cunit">kg</span></div></div>
<div class="khint"><i></i>green KG key = lb ÷ 2.2</div>
<div class="ckeys">
  <button class="fn" data-k="AC" title="All clear (C when open)">AC</button><button class="fn" data-k="BS" title="Backspace">⌫</button><button class="fn" data-k="NEG" title="Change sign">±</button><button class="op" data-k="/">÷</button>
  <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="op" data-k="*">×</button>
  <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="op" data-k="-">−</button>
  <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="op" data-k="+">+</button>
  <button class="kgk" id="cKG" data-k="KG" title="LB → KG: display ÷ 2.2 (key: K)" aria-label="Convert pounds to kilograms, divide by 2.2">${KG_ICON}</button><button data-k="0">0</button><button data-k=".">.</button><button class="eq" data-k="=">=</button>
</div>
<div class="cnote">lb ÷ 2.2 = kg</div>`;
document.body.appendChild(P);

const $exp = P.querySelector('.cexp'), $val = P.querySelector('.cval'), $n = P.querySelector('.cval .n');
const SYM = { '+':'+', '-':'−', '*':'×', '/':'÷' };
let expr = [], cur = '0', done = false, expLine = '', mode = '';   // mode: '' | 'kg' | 'err'

function fmt(x){
  if (!isFinite(x)) return 'Error';
  if (Math.abs(x) >= 1e15 || (x !== 0 && Math.abs(x) < 1e-9)) return x.toExponential(6).replace(/\.?0+e/,'e');
  return String(parseFloat(x.toPrecision(12)));
}
function evaluate(tokens){            // tokens: [num, op, num, ...] — standard precedence, no eval()
  const t = tokens.slice(); if (t.length % 2 === 0) t.pop();
  const a = [t[0]];
  for (let i=1;i<t.length;i+=2){ const op=t[i], b=t[i+1];
    if (op==='*') a[a.length-1] = a[a.length-1]*b; else if (op==='/') a[a.length-1] = a[a.length-1]/b; else a.push(op, b); }
  let r = a[0]; for (let i=1;i<a.length;i+=2) r = a[i]==='+' ? r + a[i+1] : r - a[i+1];
  return r;
}
const exprText = (tokens)=> tokens.map(v=> typeof v==='number' ? fmt(v) : SYM[v]).join(' ');
function render(){
  const pend = expr.length && cur==='' ? expr[expr.length-1] : null;
  $exp.innerHTML = (done || mode ? expLine : exprText(expr)) || '&nbsp;';
  const shown = cur==='' ? fmt(expr.length ? expr[expr.length-2] ?? 0 : 0) : cur;
  $n.textContent = shown;
  $val.classList.toggle('sm', shown.length > 11 && shown.length <= 15); $val.classList.toggle('xs', shown.length > 15);
  P.classList.toggle('kgres', mode==='kg'); P.classList.toggle('err', mode==='err');
  P.querySelectorAll('.ckeys .op').forEach(b=>b.classList.toggle('on', b.dataset.k===pend));
}
function reset(){ expr=[]; cur='0'; done=false; expLine=''; mode=''; }
function startFresh(){ if (done || mode==='err'){ expr=[]; expLine=''; done=false; } mode=''; }
function press(k){
  if (/^[0-9]$/.test(k)){ startFresh(); if (done) cur='';
    if (cur==='0') cur=k; else if (cur==='-0') cur='-'+k; else if (cur.replace(/[-.]/g,'').length < 15) cur+=k; }
  else if (k==='.'){ startFresh(); if (cur==='') cur='0'; if (!cur.includes('.')) cur+='.'; }
  else if (SYM[k]){
    if (mode==='err'){ reset(); }
    mode=''; if (done){ done=false; expLine=''; }
    if (cur===''){ if (expr.length) expr[expr.length-1]=k; else { expr=[0,k]; } }
    else { expr.push(parseFloat(cur)||0, k); cur=''; } }
  else if (k==='='){
    if (mode==='err'){ reset(); render(); return; }
    if (!expr.length){ render(); return; }
    const t = expr.slice(); if (cur!=='') t.push(parseFloat(cur)||0); else t.pop();
    const r = evaluate(t); expLine = exprText(t) + ' =';
    if (!isFinite(r)){ mode='err'; cur='Error'; expr=[]; done=true; } else { cur=fmt(r); expr=[]; done=true; mode=''; } }
  else if (k==='AC'){ reset(); }
  else if (k==='BS'){ if (mode==='err' || done){ reset(); } else if (cur!==''){ cur=cur.slice(0,-1); if (cur===''||cur==='-') cur = expr.length ? '' : '0'; } else if (expr.length){ expr.pop(); cur=fmt(expr.pop()); } }
  else if (k==='NEG'){ if (mode==='err') return; if (cur===''){ cur='0'; } cur = cur.startsWith('-') ? cur.slice(1) : '-'+cur; if (done){ done=false; expLine=''; } mode=''; }
  else if (k==='KG'){ return kg(); }
  render();
}
// lb → kg: take what's on the display (finishing any pending math first), divide by 2.2, round to 2 decimals.
function kg(){
  if (mode==='err') { reset(); render(); return null; }
  let lb, src;
  if (expr.length && !done){ const t = expr.slice(); if (cur!=='') t.push(parseFloat(cur)); else t.pop(); lb = evaluate(t); src = '(' + exprText(t) + ')'; }
  else { lb = parseFloat(cur); src = cur; }
  if (!isFinite(lb)) { render(); return null; }
  const out = Math.round((lb / LB_PER_KG) * 100) / 100;
  expLine = `${src.startsWith('(') ? src : fmt(lb)} lb ÷ 2.2 =`;
  cur = fmt(out); expr=[]; done=true; mode='kg';
  render();
  const b = P.querySelector('#cKG'); b.classList.add('hit'); setTimeout(()=>b.classList.remove('hit'), 140);
  return out;
}

P.querySelectorAll('.ckeys button').forEach(b=> b.addEventListener('click', ()=>{ press(b.dataset.k); P.focus({preventScroll:true}); }));
P.querySelector('.cx').addEventListener('click', ()=>close());

// drag by header
(function(){ const h = P.querySelector('.chd'); let d=null;
  h.addEventListener('pointerdown', e=>{ if (e.target.closest('button')) return; const r=P.getBoundingClientRect(); d={x:e.clientX-r.left,y:e.clientY-r.top}; h.setPointerCapture(e.pointerId); });
  h.addEventListener('pointermove', e=>{ if(!d) return; const x=Math.max(0,Math.min(innerWidth-P.offsetWidth,e.clientX-d.x)), y=Math.max(0,Math.min(innerHeight-40,e.clientY-d.y));
    P.style.left=x+'px'; P.style.top=y+'px'; P.style.right='auto'; });
  h.addEventListener('pointerup', ()=>{ d=null; }); })();

const tbtn = ()=>document.getElementById('tCalc');
function open(){ P.classList.add('open'); const b=tbtn(); if (b) b.classList.add('on');
  const r=P.getBoundingClientRect();   // if it was dragged off-screen (or window shrank), snap back to default spot
  if (r.right>innerWidth || r.bottom<40 || r.left<0 || r.top>innerHeight-60){ P.style.left=''; P.style.top=''; P.style.right=''; }
  render(); try{ P.focus({preventScroll:true}); }catch(_){ P.focus(); } }
function close(){ P.classList.remove('open'); if (document.activeElement===P) P.blur(); const b=tbtn(); if (b) b.classList.remove('on'); }
function toggle(){ P.classList.contains('open') ? close() : open(); }
const isOpen = ()=>P.classList.contains('open');

function flash(k){ const b = P.querySelector(`.ckeys [data-k="${CSS.escape(k)}"]`); if (b){ b.classList.add('hit'); setTimeout(()=>b.classList.remove('hit'),110); } }
// Keyboard: C toggles open (when closed); while open, digits/operators/Enter/Backspace/K/Esc drive the calculator.
// Never touches D (Drug Box) and ignores keys while typing in inputs or while a Drug Box modal is up.
addEventListener('keydown', e=>{
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
  if (document.querySelector('#dbox.open, #dbd.open')) return;
  const k = e.key;
  if (!isOpen()){ if (k==='c'||k==='C'){ e.preventDefault(); open(); } return; }
  let m = null;
  if (/^[0-9]$/.test(k) || k==='.' || k==='+' || k==='-' || k==='*' || k==='/') m = k;
  else if (k===',') m='.'; else if (k==='x'||k==='X') m='*';
  else if (k==='Enter' || k==='=') m='=';
  else if (k==='Backspace' || k==='Delete') m='BS';
  else if (k==='c'||k==='C') m='AC';
  else if (k==='k'||k==='K') m='KG';
  else if (k==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
  if (!m) return;
  e.preventDefault(); e.stopImmediatePropagation(); flash(m); press(m);
});

function wire(){ const b = tbtn(); if (!b || b.dataset.wired) return; b.dataset.wired='1';
  const ic = b.querySelector('.cic'); if (ic) ic.innerHTML = CALC_ICON; const kb = b.querySelector('.kgb .kgic'); if (kb) kb.innerHTML = KG_ICON;
  b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); toggle(); document.querySelectorAll('#tools .menu').forEach(x=>x.classList.remove('open')); }); }
function boot(){ wire(); if (/(^|[#&])calc=1/.test(location.hash)) open(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
addEventListener('hashchange', ()=>{ if (/(^|[#&])calc=1/.test(location.hash)) open(); });

window.Calc = { open, close, toggle, kg, press, isOpen, value: ()=>parseFloat(cur), display: ()=>$n.textContent, LB_PER_KG };
render();
})();
