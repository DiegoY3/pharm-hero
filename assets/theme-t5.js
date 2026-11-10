/* ECG Hero — T5 theme helpers: Drug Box colored section headers, dose emphasis, Rush chart reflow (auto-height boxes, 2 columns under 1400px). */
(function(){
function deco(){
  const DZ = /(\d+(?:\.\d+)?(?:\s?[-–]\s?\d+(?:\.\d+)?)?\s?(?:mg\/kg|J\/kg|mcg\/kg\/min|mcg|mg|J|kg|mL)\b)/g;
  const wrap = root => { if (!root) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const ns = []; while (w.nextNode()) ns.push(w.currentNode);
    ns.forEach(n=>{ if (n.parentNode.closest('em.dz,script,style,select,option,svg')) return; if (!DZ.test(n.nodeValue)) return; DZ.lastIndex = 0;
      const s = document.createElement('span'); s.className = 'tz'; s.innerHTML = n.nodeValue.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(DZ,'<em class="dz">$1</em>'); n.replaceWith(s); }); };
  const Q = document.getElementById('quiz');
  const sec = (el, txt, col) => { if (!el || (el.previousElementSibling && el.previousElementSibling.classList.contains('tsec'))) return; const h = document.createElement('div'); h.className = 'tsec'; h.textContent = txt; h.style.color = 'var(--' + col + ')'; el.before(h); };
  if (Q && Q.classList.contains('rush')){
    sec(Q.querySelector('.pt'),'Patient','mo'); sec(Q.querySelector('.now'),'Do this now','sc'); sec(Q.querySelector('.clk'),'Code clock','ds'); sec(Q.querySelector('.acts'),'Actions','pr'); sec(Q.querySelector('.log'),'Timeline','cl');
    ['.now','.acts','.log','.pt'].forEach(s=>wrap(Q.querySelector(s))); }
  // Rush chart: reflow boxes to auto height + panel width
  const C = document.getElementById('ruChart');
  if (C){ const cv = C.querySelector('.cv'); const nds = [...C.querySelectorAll('.nd')]; if (cv && nds.length){
    if (!nds[0].dataset.r){ const lefts = nds.map(d=>d.offsetLeft), mn = Math.min(...lefts), mx = Math.max(...lefts);
      nds.forEach(d=>{ d.dataset.r = Math.round((d.offsetTop - 8)/58); d.dataset.cc = Math.round((d.offsetLeft - mn)/Math.max(1,(mx-mn))*2);
        [...d.childNodes].forEach(n=>{ if (n.nodeType===3 && n.nodeValue.includes('/')){ const sp=document.createElement('span'); sp.className='tz'; sp.innerHTML=n.nodeValue.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\//g,'/<wbr>'); n.replaceWith(sp); } }); }); }
    const W = C.clientWidth - 28, cw = W/3, rows = {}; nds.forEach(d=>{ (rows[d.dataset.r] = rows[d.dataset.r]||[]).push(d); });
    const two = window.innerWidth < 1400 || W < 420;
    if (two){ const half = W/2, occ = {}; nds.forEach(d=>{ const c = +d.dataset.cc; if (c!==1) (occ[d.dataset.r] = occ[d.dataset.r]||{})[c===0?'L':'R'] = 1; });
      nds.forEach(d=>{ const c = +d.dataset.cc, o = occ[d.dataset.r]; const side = c===0 ? 0 : c===2 ? 1 : (o && o.L ? 1 : 0); d.style.width = (half - 8) + 'px'; d.style.left = (6 + side*half + 2) + 'px'; d.style.paddingLeft = d.style.paddingRight = '7px'; }); }
    else nds.forEach(d=>{ d.style.width = (cw - 6) + 'px'; d.style.left = (6 + (+d.dataset.cc)*cw + 3) + 'px'; d.style.paddingLeft = d.style.paddingRight = '6px'; });
    let y = 10; Object.keys(rows).map(Number).sort((a,b)=>a-b).forEach(r=>{ const h = Math.max(...rows[r].map(d=>d.offsetHeight)); rows[r].forEach(d=>{ const t = y + 'px'; if (d.style.top !== t) d.style.top = t; }); y += h + 16; });
    cv.style.height = y + 'px'; cv.style.width = W + 16 + 'px'; const svg = cv.querySelector('svg'); svg.setAttribute('width', W+16); svg.setAttribute('height', y);
    const pl = C.querySelector('#ruPl'), R = window.ScenarioRush && ScenarioRush.state();
    if (R && pl){ pl.setAttribute('points', R.path.map(id=>{ const e = C.querySelector(`.nd[data-n="${id}"]`); return e ? (e.offsetLeft+e.offsetWidth/2)+','+(e.offsetTop+e.offsetHeight/2) : ''; }).filter(Boolean).join(' ')); } } }
  if (Q && Q.classList.contains('af')){
    const det = Q.querySelector('.det'); wrap(det); Q.querySelectorAll('.nd').forEach(wrap);
    const map = [[/dose|drug|energy/i,'ds'],[/indicat|when/i,'in'],[/contra|avoid|caution/i,'ci'],[/note|pearl|tip/i,'pr'],[/class/i,'cl'],[/mechan|action/i,'mo'],[/side|adverse/i,'se']];
    Q.querySelectorAll('.det .k').forEach((k,i)=>{ const m = map.find(([re])=>re.test(k.textContent)); k.style.color = 'var(--' + (m ? m[1] : ['sc','mo','ds','pr'][i%4]) + ')'; }); }
}
let q = 0, busy = false;
function run(){ q = 0; try { deco(); } catch(e){ console.warn('t5 deco', e && e.message); } }
window.T5Theme = { refresh: run };
const sched = ()=>{ if (!q) q = requestAnimationFrame(run); };
const mo = new MutationObserver(recs=>{ for (const r of recs){ const t = r.target; if (!t.closest || !t.closest('#quiz.rush,#quiz.af,#ruChart')) continue;
  for (const n of r.addedNodes) if (n.nodeType===1 && !(n.matches && n.matches('em.dz,span.tz,.tsec'))) return sched(); } });
function boot(){ mo.observe(document.body, { childList:true, subtree:true });
  addEventListener('resize', ()=>{ sched(); if (window.AclsFlow && document.body.classList.contains('mode-acls')) try { AclsFlow.render(); } catch(e){} });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>{ if (window.AclsFlow && document.body.classList.contains('mode-acls')) try { AclsFlow.render(); } catch(e){} sched(); }); sched(); }
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot); else boot();
})();
