// Drug Box designer — build your own Pelican case: lid + base foam, snap grid, custom pouches, saved slots.
// UI/layout only; every drug fact still comes from window.DRUG_BOX (assets/drug-box.js, owned by Druggy).
(function(){
const K = window.DrugBoxKit; if (!K) return;
const esc = K.esc, COLS = 16, ROWS = 6, DC = 44, VC = 44, LSK = 'ecg.drugbox.slots.v1';
const SW = ['#f7d000','#ff5d6c','#ff9a1f','#2fbf62','#4d9dff','#b48cff','#ff4fa3','#22d3ee','#c9d2e2','#2b2f36'];
const WN = { lid:'LID · top foam', base:'BASE · bottom foam' };
const uid = ()=>Math.random().toString(36).slice(2,9);
const D = ()=>K.db().drugs||{};
const lum = (h)=>{ const n=parseInt((h||'#888').slice(1),16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255; };
const ink = (h)=> lum(h)>0.55 ? '#141414' : '#ffffff';

// ---------- storage: many named slots ----------
let store = (()=>{ try{ const s = JSON.parse(localStorage.getItem(LSK)); if (s && Array.isArray(s.slots)) return s; }catch(_){} return { slots:[], active:null }; })();
function persist(){ try{ localStorage.setItem(LSK, JSON.stringify(store)); flash('Saved ✓'); }catch(_){ flash('⚠ Could not save (storage blocked)'); }
  window.DrugBox && DrugBox.render && DrugBox.render(); }
const cur = ()=> store.slots.find(s=>s.id===store.active) || store.slots[0] || null;

// ---------- presets ----------
const P = (x,y,w,h,label,color,drugs)=>({ id:uid(), x,y,w,h,label,color, drugs:drugs.filter(k=>D()[k]) });
const I = (k,x,y)=>({ id:uid(), k, x, y });
function preset(kind){
  const w = { lid:{pouches:[],items:[]}, base:{pouches:[],items:[]} };
  if (kind==='module'){ const by = {}; for (const [k,d] of Object.entries(D())) (by[d.module||0] = by[d.module||0]||[]).push(k);
    for (const v of Object.values(by)) v.sort((a,b)=>D()[a].name.localeCompare(D()[b].name));
    const col = ['#8b97ad','#4d9dff','#ff9a1f','#ff5d6c','#2fbf62','#b48cff','#22d3ee'];
    w.lid.pouches = [P(0,0,8,3,'Module 1',col[1],by[1]||[]), P(8,0,8,3,'Module 2',col[2],by[2]||[]), P(0,3,16,3,'Module 3',col[3],by[3]||[])];
    w.base.pouches = [P(0,0,8,3,'Module 4',col[4],by[4]||[]), P(8,0,8,3,'Module 5',col[5],by[5]||[]), P(0,3,16,3,'Module 6',col[6],(by[6]||[]).concat(by[0]||[]))];
  } else if (kind==='cardiac'){
    w.lid.pouches = [P(0,0,9,3,'Tachy','#ff5d6c',['adenosine','diltiazem','verapamil','metoprolol','amiodarone','lidocaine']),
                     P(9,0,7,3,'Brady','#4d9dff',['atropine','epinephrine','dopamine']),
                     P(4,3,8,3,'ACS','#ff9a1f',['aspirin','nitroglycerin','morphine','fentanyl'])];
    w.lid.items = [I('magnesium',0,4), I('calciumchloride',12,4), I('sodiumbicarbonate',14,4)].filter(x=>D()[x.k]);
    w.base.pouches = [P(0,0,8,3,'Arrest','#f7d000',['epinephrine','amiodarone','lidocaine','magnesium']),
                      P(8,0,8,3,'H’s & T’s','#2fbf62',['sodiumbicarbonate','calciumchloride','dextrose','naloxone']),
                      P(0,3,9,3,'Pacing / cardioversion sedation','#b48cff',['midazolam','etomidate','ketamine']),
                      P(9,3,7,3,'Narcs','#2b2f36',['fentanyl','morphine','midazolam','diazepam','ketamine'])];
  }
  return w;
}
function newSlot(name, kind){ const s = { id:'s'+uid(), name, updated:Date.now(), ...preset(kind) }; store.slots.push(s); store.active = s.id; persist(); return s; }

// ---------- layout renderer (shared by the designer and the read-only Custom view) ----------
const css = `
.dbl{--c:${DC}px;display:flex;flex-direction:column;align-items:flex-start;gap:0}
.dbl .win{position:relative;padding:20px 8px 8px;border-radius:14px;background:linear-gradient(#ffe94a,#e2bb00);box-shadow:inset 0 2px 0 #fff59a,inset 0 -3px 0 #b08f00;border:1.5px solid #9a7c00}
.dbl .wl{position:absolute;left:12px;top:3px;font:900 10px Inter,system-ui,sans-serif;letter-spacing:1.4px;color:#2e2600;text-transform:uppercase}
.dbl .wl b{font-weight:600;letter-spacing:.3px;text-transform:none;color:#5a4a00;margin-left:6px}
.dbl .grid{position:relative;width:calc(var(--c) * ${COLS});height:calc(var(--c) * ${ROWS});border-radius:9px;overflow:hidden;background-color:#202226;
  background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px),radial-gradient(rgba(255,255,255,.045) 1.2px,transparent 1.3px);
  background-size:var(--c) var(--c),var(--c) var(--c),7px 7px;box-shadow:inset 0 3px 12px rgba(0,0,0,.75)}
.dbl .grid[data-w="lid"]{background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px),radial-gradient(circle,#2c2f35 0 30%,transparent 33%);background-size:var(--c) var(--c),var(--c) var(--c),calc(var(--c)/2) calc(var(--c)/2)}
.dbl.ro .grid{background-image:radial-gradient(rgba(255,255,255,.05) 1.2px,transparent 1.3px);background-size:7px 7px}
.dbl.ro .grid[data-w="lid"]{background-image:radial-gradient(circle,#2a2d33 0 30%,transparent 33%);background-size:calc(var(--c)/2) calc(var(--c)/2)}
.dbl .hinge{align-self:stretch;height:14px;margin:0 30px;display:flex;justify-content:space-around;align-items:center;background:linear-gradient(#141414,#2a2a2a 50%,#141414);border-radius:4px}
.dbl .hinge i{width:46px;height:9px;border-radius:3px;background:linear-gradient(#5a5a5a,#1d1d1d)}
.dbl .itm,.dbl .pouch{position:absolute;box-sizing:border-box}
.dbl .itm{width:calc(var(--c)*2 - 4px);height:calc(var(--c)*2 - 4px);margin:2px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;
  background:radial-gradient(120% 90% at 50% 30%,#1b1d21 0%,#111214 70%);box-shadow:inset 0 3px 9px rgba(0,0,0,.9),0 1px 0 rgba(255,255,255,.06);color:#fff;font:800 9.5px/1.1 Inter,system-ui,sans-serif;text-align:center;padding:2px}
.dbl .itm svg{width:calc(var(--c)*1.75);height:calc(var(--c)*.88);filter:drop-shadow(0 3px 3px rgba(0,0,0,.6))}
.dbl .pouch{border-radius:11px;padding:0;display:flex;flex-direction:column;margin:2px;width:calc(var(--w) * var(--c) - 4px);height:calc(var(--h) * var(--c) - 4px);
  border:2px solid color-mix(in srgb,var(--pc) 70%,#000);background-color:color-mix(in srgb,var(--pc) 20%,#16181b);
  background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 6px),repeating-linear-gradient(-45deg,rgba(0,0,0,.18) 0 2px,transparent 2px 6px);box-shadow:0 4px 10px rgba(0,0,0,.55)}
.dbl .ph{position:relative;flex:none;height:22px;display:flex;align-items:center;gap:4px;padding:0 5px;background:var(--pc);color:var(--pi);border-radius:8px 8px 0 0;font:900 11px Inter,system-ui,sans-serif;letter-spacing:.6px;text-transform:uppercase}
.dbl .ph::after{content:"";position:absolute;left:4px;right:4px;bottom:-4px;height:3px;background:repeating-linear-gradient(90deg,#c8ccd2 0 3px,#3a3d42 3px 6px);border-radius:2px;opacity:.85}
.dbl .ph .pl{flex:1;min-width:0;background:transparent;border:none;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;padding:0;outline:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dbl .ph .pl:focus{background:rgba(0,0,0,.18);border-radius:4px;padding:0 3px}
.dbl .ph .pn{font-size:9px;opacity:.75}
.dbl .ph .grip{cursor:grab;opacity:.8;font-size:13px;padding:0 1px} .dbl.ro .ph .grip{display:none}
.dbl .ph button{border:none;background:rgba(0,0,0,.18);color:inherit;border-radius:5px;font-size:10px;line-height:1;padding:3px 5px;cursor:pointer}
.dbl .ph button:hover{background:rgba(0,0,0,.35)}
.dbl .pb{flex:1;min-height:0;overflow:auto;display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;padding:8px 4px 4px}
.dbl .pb:empty::before{content:"drop drugs here";margin:auto;color:rgba(255,255,255,.35);font:600 10px Inter,system-ui,sans-serif;font-style:italic}
.dbl.ro .pb:empty::before{content:"empty"}
.dbl .chip{width:64px;height:48px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,11,13,.72);box-shadow:inset 0 2px 5px rgba(0,0,0,.8);color:#fff;font:800 8.5px/1.05 Inter,system-ui,sans-serif;text-align:center;cursor:pointer;overflow:hidden}
.dbl .chip svg{width:58px;height:29px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}
.dbl .chip span,.dbl .itm span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}
.dbl:not(.ro) .chip,.dbl:not(.ro) .itm{cursor:grab}
.dbl .rs{position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;background:linear-gradient(135deg,transparent 50%,var(--pc) 50%);border-radius:0 0 9px 0}
.dbl .chip:hover,.dbl .itm:hover{outline:1px solid #ffe14a}
.dbl .sel{outline:2px solid #f7d000!important;box-shadow:0 0 14px rgba(247,208,0,.5),inset 0 2px 5px rgba(0,0,0,.8)}
.dbl .r-first{box-shadow:0 0 0 2px #2fbf62,0 0 12px rgba(47,191,98,.6)} .dbl .r-next{box-shadow:0 0 0 2px #4d9dff} .dbl .r-cond{box-shadow:0 0 0 2px #ffb84d} .dbl .r-sed{box-shadow:0 0 0 2px #b48cff}
.dbl .r-avoid{box-shadow:0 0 0 2px #ff5d6c} .dbl .r-avoid svg{filter:grayscale(.8) brightness(.6)} .dbl .r-avoid span{color:#ffb3ba;text-decoration:line-through}
.dbl .dim{opacity:.22}
.dbl .snap{position:absolute;pointer-events:none;border:2px dashed #2fbf62;background:rgba(47,191,98,.14);border-radius:10px;z-index:5}
.dbl .snap.bad{border-color:#ff5d6c;background:rgba(255,93,108,.14)}
.dbl .pouch.drop{outline:3px solid #2fbf62;outline-offset:1px}
.dbl .pouch.lift,.dbl .itm.lift{opacity:.35}
#dbd{position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;background:rgba(2,4,10,.62);backdrop-filter:blur(2px);font-family:Inter,system-ui,sans-serif}
#dbd.open{display:flex}
#dbd .dshell{position:relative;display:flex;flex-direction:column;gap:10px;max-width:calc(100vw - 24px);max-height:calc(100dvh - 24px);overflow:auto;padding:12px 14px 12px;border-radius:20px;
  background:linear-gradient(180deg,#3a3a3a,#1b1b1b);border:2px solid #000;box-shadow:0 30px 70px rgba(0,0,0,.7),inset 0 1px 0 #555}
#dbd .dtop{display:flex;flex-wrap:wrap;align-items:center;gap:7px;color:#ffe14a}
#dbd .dtop .pcase{width:38px;height:30px}
#dbd .dtop h3{margin:0 6px 0 0;font:900 16px Inter,system-ui,sans-serif;letter-spacing:1.4px;text-transform:uppercase}
#dbd select,#dbd input[type=text],#dbd input[type=search],#dbd input[type=number]{background:#0d0d0d;color:#fff;border:1px solid #5a4c00;border-radius:7px;padding:6px 8px;font:600 12.5px Inter,system-ui,sans-serif}
#dbd .sname{width:190px;font-weight:800!important;color:#ffe14a!important}
#dbd .b{background:#2a2a2a;color:#f0f0f0;border:1px solid #4a4a4a;border-radius:7px;padding:6px 10px;font:700 12px Inter,system-ui,sans-serif;cursor:pointer;white-space:nowrap}
#dbd .b:hover{background:#363636} #dbd .b.y{background:#f7d000;color:#1a1500;border-color:#f7d000} #dbd .b.y:hover{background:#ffe34d}
#dbd .b.r:hover{background:#5a1d24;border-color:#ff5d6c}
#dbd .sv{font:700 11px Inter,system-ui,sans-serif;color:#9fe8b4;min-width:70px;transition:opacity .4s}
#dbd .sp{flex:1}
#dbd .newm{position:relative} #dbd .newm .mm{display:none;position:absolute;top:calc(100% + 4px);left:0;z-index:3;background:#151515;border:1px solid #5a4c00;border-radius:9px;padding:5px;min-width:220px;box-shadow:0 10px 25px rgba(0,0,0,.6)}
#dbd .newm.open .mm{display:block}
#dbd .mm button{display:block;width:100%;text-align:left;background:none;border:none;color:#eee;padding:7px 9px;border-radius:6px;font:600 12px Inter,system-ui,sans-serif;cursor:pointer}
#dbd .mm button small{display:block;color:#8b97ad;font-weight:500}
#dbd .mm button:hover{background:#2a2508;color:#ffe14a}
#dbd .dmain{display:flex;gap:12px;align-items:flex-start}
#dbd .dpal{width:268px;flex:none;align-self:stretch;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:#141414;border:1px solid #333;color:#ddd;min-height:0}
#dbd .dpal h5{margin:2px 0 0;font:900 10px Inter,system-ui,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#ffe14a}
#dbd .seg{display:flex;border:1px solid #4a4a4a;border-radius:7px;overflow:hidden} #dbd .seg button{flex:1;background:#222;color:#ccc;border:none;padding:5px;font:700 11px Inter,system-ui,sans-serif;cursor:pointer}
#dbd .seg button.on{background:#f7d000;color:#1a1500}
#dbd .tip{font-size:10.5px;color:#8b97ad;line-height:1.4}
#dbd .plist{flex:1;min-height:120px;max-height:330px;overflow:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding:4px;border-radius:9px;background:#0d0d0d;box-shadow:inset 0 2px 6px rgba(0,0,0,.8)}
#dbd .pchip{display:flex;flex-direction:column;align-items:center;padding:4px 2px;border-radius:8px;background:#1b1d21;cursor:grab;color:#fff;font:800 8.5px/1.1 Inter,system-ui,sans-serif;text-align:center;user-select:none;position:relative;touch-action:none}
#dbd .pchip:hover{background:#26292e;outline:1px solid #8a7300}
#dbd .pchip svg{width:100%;max-width:68px;height:34px}
#dbd .pchip span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dbd .pchip .n{position:absolute;top:2px;right:3px;font-size:8px;background:#f7d000;color:#1a1500;border-radius:5px;padding:0 3px}
#dbd .trash{border:2px dashed #5a2a30;border-radius:10px;padding:10px;text-align:center;color:#ff8a94;font:700 11.5px Inter,system-ui,sans-serif}
#dbd .trash.hot{background:rgba(255,93,108,.18);border-color:#ff5d6c}
#dbd .pop{position:fixed;z-index:50;display:none;width:230px;padding:10px;border-radius:12px;background:#151515;border:1px solid #5a4c00;box-shadow:0 14px 30px rgba(0,0,0,.65);color:#eee;font:600 11.5px Inter,system-ui,sans-serif}
#dbd .pop.open{display:block} #dbd .pop h6{margin:0 0 6px;font:900 10px Inter,system-ui,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#ffe14a}
#dbd .pop .sws{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px} #dbd .pop .sws button{width:22px;height:22px;border-radius:6px;border:2px solid #000;cursor:pointer}
#dbd .pop .sws button.on{outline:2px solid #fff}
#dbd .pop .sws input{width:30px;height:24px;padding:0;border:none;background:none}
#dbd .pop .row{display:flex;align-items:center;gap:6px;margin:6px 0} #dbd .pop .row input{width:52px}
#dbd .pop .row .b{flex:1}
.dghost{position:fixed;z-index:70;pointer-events:none;transform:translate(-50%,-50%) rotate(-5deg);filter:drop-shadow(0 8px 10px rgba(0,0,0,.6));opacity:.95}
.dghost svg{width:96px;height:48px;display:block}
.dghost span{display:block;text-align:center;font:800 10px Inter,system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000}
body.dbdragging, body.dbdragging *{cursor:grabbing!important;user-select:none!important}
`;
{ const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }

function chipHTML(k, cls, attrs){ const d = D()[k]; if (!d) return '';
  return `<div class="chip ${cls}" ${attrs} title="${esc(d.name)}${d.alias?' ('+esc(d.alias)+')':''}">${K.svg(k,'')}<span>${esc(K.short(d))}</span></div>`; }
function marks(k, o){ const c = []; if (o.role && o.role[k]) c.push('r-'+o.role[k]); if (o.sel===k) c.push('sel');
  if (o.q){ const d = D()[k]; const s = (k+' '+d.name+' '+(d.alias||'')).toLowerCase(); if (!o.q.toLowerCase().split(/\s+/).every(w=>s.includes(w))) c.push('dim'); } return c.join(' '); }
function winHTML(slot, w, o){
  const W = slot[w] || {pouches:[],items:[]};
  const pouches = W.pouches.map(p=>{ const pi = ink(p.color);
    return `<div class="pouch" data-pid="${p.id}" data-w="${w}" style="left:${p.x*o.C}px;top:${p.y*o.C}px;--w:${p.w};--h:${p.h};--pc:${p.color};--pi:${pi}">
      <div class="ph"><span class="grip" title="Drag to move">⠿</span>${o.ro?`<span class="pl" title="${esc(p.label)}">${esc(p.label||'Pouch')}</span>`:`<input class="pl" maxlength="28" value="${esc(p.label)}" placeholder="Name this pouch" title="Type a label (e.g. Narcs)">`}<span class="pn">${p.drugs.length}</span>${o.ro?'':'<button class="pg" title="Color · size · empty · delete">⚙</button><button class="px" title="Delete pouch (drugs go with it)">✕</button>'}</div>
      <div class="pb">${p.drugs.map((k,i)=>chipHTML(k, marks(k,o), o.ro?`data-k="${k}"`:`data-dk="${k}" data-from="${p.id}" data-i="${i}"`)).join('')}</div>${o.ro?'':'<span class="rs" title="Drag to resize (snaps to the grid)"></span>'}</div>`; }).join('');
  const items = W.items.map(it=>{ const d = D()[it.k]; if (!d) return '';
    return `<div class="itm ${marks(it.k,o)}" ${o.ro?`data-k="${it.k}"`:`data-dk="${it.k}" data-iid="${it.id}"`} style="left:${it.x*o.C}px;top:${it.y*o.C}px" title="${esc(d.name)}">${K.svg(it.k,'')}<span>${esc(K.short(d))}</span></div>`; }).join('');
  const n = W.pouches.reduce((a,p)=>a+p.drugs.length,0) + W.items.length;
  return `<div class="win"><div class="wl">${WN[w]}<b>${W.pouches.length} pouch${W.pouches.length===1?'':'es'} · ${n} drug${n===1?'':'s'}</b></div><div class="grid" data-w="${w}">${pouches}${items}</div></div>`;
}
function layoutHTML(slot, o={}){ o = { C: o.ro ? VC : DC, ...o };
  return `<div class="dbl ${o.ro?'ro':''}" style="--c:${o.C}px">${winHTML(slot,'lid',o)}<div class="hinge"><i></i><i></i><i></i></div>${winHTML(slot,'base',o)}</div>`; }

// ---------- designer modal ----------
const M = document.createElement('div'); M.id = 'dbd'; document.body.appendChild(M);
let addTo = 'lid', palQ = '', palF = 'all', flashT = null, popFor = null;
function flash(t){ const e = M.querySelector('.sv'); if (!e) return; e.textContent = t; e.style.opacity = 1; clearTimeout(flashT); flashT = setTimeout(()=>{ e.style.opacity = 0; }, 1400); }
function touch(){ const s = cur(); if (s) s.updated = Date.now(); persist(); }
function counts(s){ const c = {}; for (const w of ['lid','base']){ for (const p of s[w].pouches) for (const k of p.drugs) c[k]=(c[k]||0)+1; for (const it of s[w].items) c[it.k]=(c[it.k]||0)+1; } return c; }
function palette(s){
  const cs = K.cardiacSet(), c = counts(s);
  let ks = Object.keys(D()).sort((a,b)=>D()[a].name.localeCompare(D()[b].name));
  if (palF==='cardiac') ks = ks.filter(k=>cs.has(k)); else if (/^m\d$/.test(palF)) ks = ks.filter(k=>String(D()[k].module)===palF.slice(1));
  if (palQ) ks = ks.filter(k=>{ const d=D()[k]; const t=(k+' '+d.name+' '+(d.alias||'')+' '+(d.classification||[]).join(' ')).toLowerCase(); return palQ.toLowerCase().split(/\s+/).every(w=>t.includes(w)); });
  return ks.map(k=>`<div class="pchip" data-dk="${k}" title="${esc(D()[k].name)} — drag into the box, or click to seat it loose in the ${addTo}">${c[k]?`<span class="n">×${c[k]}</span>`:''}${K.svg(k,'')}<span>${esc(K.short(D()[k]))}</span></div>`).join('') || '<div class="tip" style="grid-column:1/-1;padding:10px">No drugs match.</div>';
}
function renderD(){
  if (!store.slots.length) newSlot('Cardiac kit (example)', 'cardiac');
  const s = cur(); store.active = s.id;
  const mods = [...new Set(Object.values(D()).map(d=>d.module).filter(Boolean))].sort();
  M.innerHTML = `<div class="dshell">
    <div class="dtop">${K.ICON}<h3>Design Drug Box</h3>
      <select class="slot" title="Saved boxes (slots)">${store.slots.map(x=>`<option value="${x.id}" ${x.id===s.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
      <input type="text" class="sname" maxlength="40" value="${esc(s.name)}" title="Name this box">
      <span class="newm"><button class="b nb">＋ New box ▾</button><div class="mm">
        <button data-p="empty">Empty box<small>Blank lid + base foam</small></button>
        <button data-p="module">By module<small>6 pouches, Module 1–6 from your list</small></button>
        <button data-p="cardiac">Cardiac kit<small>Tachy · Brady · ACS · Arrest · H’s & T’s · Narcs</small></button></div></span>
      <button class="b dup" title="Copy this box into a new slot">⧉ Duplicate</button>
      <button class="b r del" title="Delete this saved box">🗑 Delete</button>
      <span class="sv"></span><span class="sp"></span>
      <button class="b y use" title="Open this box in the Drug Box (Custom filter)">Open in Drug Box ▸</button>
      <button class="b done" title="Close the designer (Esc)">Done ✕</button></div>
    <div class="dmain"><div class="dleft">${layoutHTML(s,{ro:false})}</div>
      <div class="dpal">
        <h5>Pouches</h5>
        <div style="display:flex;gap:6px;align-items:center"><button class="b y addp" style="flex:1">＋ Add pouch</button><div class="seg tgt"><button data-w="lid" class="${addTo==='lid'?'on':''}">Lid</button><button data-w="base" class="${addTo==='base'?'on':''}">Base</button></div></div>
        <div class="tip">⠿ drag a pouch to move it · ◢ drag its corner to resize (snaps to squares) · click its name to relabel · ⚙ for color & exact size.</div>
        <h5>Drugs</h5>
        <div style="display:flex;gap:5px"><input type="search" class="pq" placeholder="Search…" value="${esc(palQ)}" style="flex:1;min-width:0">
          <select class="pf"><option value="all">All</option><option value="cardiac" ${palF==='cardiac'?'selected':''}>Cardiac</option>${mods.map(m=>`<option value="m${m}" ${palF==='m'+m?'selected':''}>Module ${m}</option>`).join('')}</select></div>
        <div class="plist">${palette(s)}</div>
        <div class="tip">Drag a drug onto a pouch to put it inside, or onto bare foam to seat it loose (2×2). Click a drug to drop it in the first free spot.</div>
        <div class="trash">🗑 Drag here to take out of the box</div>
      </div></div>
    <div class="pop"></div></div>`;
  bind(); }
function rerenderLeft(){ const s = cur(); M.querySelector('.dleft').innerHTML = layoutHTML(s,{ro:false}); M.querySelector('.plist').innerHTML = palette(s); bindLeft(); }
function bind(){
  const s = cur();
  M.querySelector('.slot').onchange = e=>{ store.active = e.target.value; closePop(); persist(); renderD(); };
  const nm = M.querySelector('.sname'); nm.oninput = ()=>{ s.name = nm.value || 'Untitled box'; const o = M.querySelector(`.slot option[value="${s.id}"]`); if (o) o.textContent = s.name; };
  nm.onchange = touch;
  const nw = M.querySelector('.newm'); M.querySelector('.nb').onclick = (e)=>{ e.stopPropagation(); nw.classList.toggle('open'); };
  nw.querySelectorAll('.mm button').forEach(b=>b.onclick=()=>{ nw.classList.remove('open'); const kind=b.dataset.p;
    newSlot((kind==='module'?'By module':kind==='cardiac'?'Cardiac kit':'My Drug Box')+' '+(store.slots.length+1), kind); renderD(); M.querySelector('.sname').select(); });
  M.querySelector('.dup').onclick = ()=>{ const c = JSON.parse(JSON.stringify(s)); c.id='s'+uid(); c.name = s.name+' (copy)'; store.slots.push(c); store.active=c.id; persist(); renderD(); };
  M.querySelector('.del').onclick = ()=>{ if (!confirm(`Delete the saved box “${s.name}”? This can’t be undone.`)) return; store.slots = store.slots.filter(x=>x.id!==s.id); store.active = store.slots[0]?store.slots[0].id:null;
    if (!store.slots.length){ newSlot('My Drug Box 1','empty'); } persist(); renderD(); };
  M.querySelector('.use').onclick = ()=>{ const id = s.id; close(); window.DrugBox && DrugBox.useSlot(id); };
  M.querySelector('.done').onclick = close;
  M.querySelectorAll('.tgt button').forEach(b=>b.onclick=()=>{ addTo=b.dataset.w; M.querySelectorAll('.tgt button').forEach(x=>x.classList.toggle('on',x===b)); });
  M.querySelector('.addp').onclick = ()=>{ const W = s[addTo]; const n = W.pouches.length+1;
    for (const [w,h] of [[4,3],[4,2],[3,2],[2,2]]){ const spot = free(addTo, w, h); if (spot){ W.pouches.push({ id:uid(), x:spot[0], y:spot[1], w, h, label:'Pouch '+n, color:SW[(n+3)%SW.length], drugs:[] }); touch(); rerenderLeft();
        const inp = M.querySelector(`.pouch[data-pid="${W.pouches[W.pouches.length-1].id}"] .pl`); if (inp){ inp.focus(); inp.select(); } return; } }
    flash('⚠ No room — resize or move something'); };
  const pq = M.querySelector('.pq'); pq.oninput = ()=>{ palQ = pq.value; M.querySelector('.plist').innerHTML = palette(s); bindPal(); };
  M.querySelector('.pf').onchange = (e)=>{ palF = e.target.value; M.querySelector('.plist').innerHTML = palette(s); bindPal(); };
  bindLeft(); }
function bindPal(){ M.querySelectorAll('.pchip').forEach(el=>el.onpointerdown = e=>beginDrag(e, { type:'drug', k:el.dataset.dk, src:null, el })); }
function bindLeft(){
  const s = cur(); bindPal();
  M.querySelectorAll('.dleft .pouch').forEach(pe=>{ const w = pe.dataset.w, p = s[w].pouches.find(x=>x.id===pe.dataset.pid); if (!p) return;
    const lab = pe.querySelector('.pl'); lab.oninput = ()=>{ p.label = lab.value; }; lab.onchange = touch; lab.onkeydown = e=>{ if (e.key==='Enter') lab.blur(); };
    pe.querySelector('.grip').onpointerdown = e=>beginDrag(e, { type:'pouch', w, p, el:pe });
    pe.querySelector('.ph').onpointerdown = e=>{ if (e.target.closest('input,button')) return; beginDrag(e, { type:'pouch', w, p, el:pe }); };
    pe.querySelector('.rs').onpointerdown = e=>beginDrag(e, { type:'resize', w, p, el:pe });
    pe.querySelector('.px').onclick = ()=>{ if (p.drugs.length && !confirm(`Delete pouch “${p.label||'Pouch'}” and the ${p.drugs.length} drug(s) in it?`)) return; s[w].pouches = s[w].pouches.filter(x=>x!==p); closePop(); touch(); rerenderLeft(); };
    pe.querySelector('.pg').onclick = (e)=>{ e.stopPropagation(); openPop(w, p, e.currentTarget); };
    pe.querySelectorAll('.chip').forEach(ch=>ch.onpointerdown = e=>beginDrag(e, { type:'drug', k:ch.dataset.dk, src:{ w, p, i:+ch.dataset.i }, el:ch })); });
  M.querySelectorAll('.dleft .itm').forEach(ie=>{ const g = ie.closest('.grid').dataset.w, it = s[g].items.find(x=>x.id===ie.dataset.iid);
    ie.onpointerdown = e=>beginDrag(e, { type:'drug', k:it.k, src:{ w:g, it }, el:ie }); }); }

// ---------- pouch settings popover ----------
function openPop(w, p, btn){ popFor = { w, p }; const pop = M.querySelector('.pop'), r = btn.getBoundingClientRect();
  pop.innerHTML = `<h6>Pouch · ${esc(p.label||'Pouch')}</h6>
    <div class="sws">${SW.map(c=>`<button data-c="${c}" class="${c===p.color?'on':''}" style="background:${c}" title="${c}"></button>`).join('')}<input type="color" value="${p.color}" title="Any color"></div>
    <div class="row">Size <input type="number" class="pw" min="2" max="${COLS}" value="${p.w}"> × <input type="number" class="ph2" min="2" max="${ROWS}" value="${p.h}"> squares</div>
    <div class="row"><button class="b pe">Empty it</button><button class="b r pd">Delete</button></div>`;
  pop.style.left = Math.min(innerWidth-245, r.left)+'px'; pop.style.top = Math.min(innerHeight-170, r.bottom+6)+'px'; pop.classList.add('open');
  const setC = c=>{ p.color = c; touch(); rerenderLeft(); pop.querySelectorAll('.sws button').forEach(b=>b.classList.toggle('on', b.dataset.c===c)); };
  pop.querySelectorAll('.sws button').forEach(b=>b.onclick=()=>setC(b.dataset.c));
  pop.querySelector('input[type=color]').oninput = e=>{ p.color = e.target.value; rerenderLeft(); }; pop.querySelector('input[type=color]').onchange = touch;
  const sz = ()=>{ const nw = Math.max(2, Math.min(COLS-p.x, +pop.querySelector('.pw').value||p.w)), nh = Math.max(2, Math.min(ROWS-p.y, +pop.querySelector('.ph2').value||p.h));
    if (fits(w, p.x, p.y, nw, nh, p.id)){ p.w = nw; p.h = nh; touch(); rerenderLeft(); } else { flash('⚠ Blocked — something is in the way'); }
    pop.querySelector('.pw').value = p.w; pop.querySelector('.ph2').value = p.h; };
  pop.querySelector('.pw').onchange = sz; pop.querySelector('.ph2').onchange = sz;
  pop.querySelector('.pe').onclick = ()=>{ p.drugs = []; touch(); rerenderLeft(); };
  pop.querySelector('.pd').onclick = ()=>{ const s = cur(); s[w].pouches = s[w].pouches.filter(x=>x!==p); closePop(); touch(); rerenderLeft(); }; }
function closePop(){ const pop = M.querySelector('.pop'); if (pop) pop.classList.remove('open'); popFor = null; }

// ---------- grid geometry ----------
const ov = (a,b)=> a.x < b.x+b.w && b.x < a.x+a.w && a.y < b.y+b.h && b.y < a.y+a.h;
function fits(w, x, y, ww, hh, skip){ if (x<0||y<0||x+ww>COLS||y+hh>ROWS) return false; const W = cur()[w], r = {x,y,w:ww,h:hh};
  for (const p of W.pouches) if (p.id!==skip && ov(r,p)) return false;
  for (const it of W.items) if (it.id!==skip && ov(r,{x:it.x,y:it.y,w:2,h:2})) return false; return true; }
function free(w, ww, hh){ for (let y=0;y<=ROWS-hh;y++) for (let x=0;x<=COLS-ww;x++) if (fits(w,x,y,ww,hh)) return [x,y]; return null; }

// ---------- pointer drag engine (snap-to-grid) ----------
let drag = null;
function beginDrag(e, d){ if (e.button!==0) return; e.preventDefault(); e.stopPropagation(); closePop();
  drag = { ...d, sx:e.clientX, sy:e.clientY, moved:false, tgt:null };
  if (d.type==='pouch'){ const r = d.el.getBoundingClientRect(); drag.ox = Math.floor((e.clientX - r.left)/DC); drag.oy = Math.floor((e.clientY - r.top)/DC); }
  addEventListener('pointermove', onMove); addEventListener('pointerup', onUp, { once:true }); }
function gridAt(x,y){ for (const g of M.querySelectorAll('.dleft .grid')){ const r = g.getBoundingClientRect(); if (x>=r.left && x<r.right && y>=r.top && y<r.bottom) return [g, r]; } return null; }
function snapBox(g, x, y, w, h, ok){ let s = g.querySelector('.snap'); if (!s){ s = document.createElement('div'); s.className='snap'; g.appendChild(s); }
  s.style.cssText = `left:${x*DC+2}px;top:${y*DC+2}px;width:${w*DC-4}px;height:${h*DC-4}px`; s.classList.toggle('bad', !ok); }
function clearHints(){ M.querySelectorAll('.snap').forEach(x=>x.remove()); M.querySelectorAll('.pouch.drop').forEach(x=>x.classList.remove('drop')); const t = M.querySelector('.trash'); if (t) t.classList.remove('hot'); }
function onMove(e){ if (!drag) return; const x = e.clientX, y = e.clientY;
  if (!drag.moved){ if (Math.hypot(x-drag.sx, y-drag.sy) < 5) return; drag.moved = true; document.body.classList.add('dbdragging');
    if (drag.type==='drug'){ const d = D()[drag.k]; drag.gh = document.createElement('div'); drag.gh.className='dghost'; drag.gh.innerHTML = K.svg(drag.k,'')+`<span>${esc(K.short(d))}</span>`; document.body.appendChild(drag.gh); if (drag.src) drag.el.classList.add('lift'); }
    else if (drag.type==='pouch') drag.el.classList.add('lift'); }
  clearHints(); drag.tgt = null;
  if (drag.gh){ drag.gh.style.left = x+'px'; drag.gh.style.top = y+'px'; }
  const hit = document.elementFromPoint(x, y), G = gridAt(x, y);
  if (drag.type==='drug'){
    const pe = hit && hit.closest('.dleft .pouch');
    if (pe){ const w = pe.dataset.w, p = cur()[w].pouches.find(q=>q.id===pe.dataset.pid); if (p && !(drag.src && drag.src.p===p)){ pe.classList.add('drop'); drag.tgt = { kind:'pouch', p }; } return; }
    if (G){ const [g, r] = G, w = g.dataset.w; const gx = Math.max(0, Math.min(COLS-2, Math.round((x-r.left)/DC - 1))), gy = Math.max(0, Math.min(ROWS-2, Math.round((y-r.top)/DC - 1)));
      const ok = fits(w, gx, gy, 2, 2, drag.src && drag.src.it ? drag.src.it.id : null); snapBox(g, gx, gy, 2, 2, ok); if (ok) drag.tgt = { kind:'grid', w, x:gx, y:gy }; return; }
    if (hit && hit.closest('.dpal') && drag.src){ M.querySelector('.trash').classList.add('hot'); drag.tgt = { kind:'trash' }; }
  } else if (drag.type==='pouch'){ if (!G) return; const [g, r] = G, w = g.dataset.w, p = drag.p;
    const gx = Math.max(0, Math.min(COLS-p.w, Math.floor((x-r.left)/DC) - drag.ox)), gy = Math.max(0, Math.min(ROWS-p.h, Math.floor((y-r.top)/DC) - drag.oy));
    const ok = fits(w, gx, gy, p.w, p.h, p.id); snapBox(g, gx, gy, p.w, p.h, ok); if (ok) drag.tgt = { w, x:gx, y:gy };
  } else if (drag.type==='resize'){ const g = M.querySelector(`.dleft .grid[data-w="${drag.w}"]`), r = g.getBoundingClientRect(), p = drag.p;
    const nw = Math.max(2, Math.min(COLS-p.x, Math.round((x-r.left)/DC) - p.x)), nh = Math.max(2, Math.min(ROWS-p.y, Math.round((y-r.top)/DC) - p.y));
    const ok = fits(drag.w, p.x, p.y, nw, nh, p.id); snapBox(g, p.x, p.y, nw, nh, ok); if (ok){ drag.tgt = { w:nw, h:nh }; drag.el.style.setProperty('--w', nw); drag.el.style.setProperty('--h', nh); } }
}
function onUp(){ removeEventListener('pointermove', onMove); document.body.classList.remove('dbdragging'); if (drag && drag.gh) drag.gh.remove(); clearHints();
  const d = drag; drag = null; if (!d) return; const s = cur();
  if (!d.moved){ if (d.type==='drug' && !d.src){ const sp = free(addTo, 2, 2); if (sp){ s[addTo].items.push({ id:uid(), k:d.k, x:sp[0], y:sp[1] }); touch(); flash(`Added to ${addTo}`); }
      else flash(`⚠ No 2×2 spot free in the ${addTo} — drop it into a pouch`); rerenderLeft(); } return; }
  const t = d.tgt;
  if (d.type==='drug'){
    if (!t){ rerenderLeft(); return; }
    const takeOut = ()=>{ if (!d.src) return; if (d.src.p) d.src.p.drugs.splice(d.src.i, 1); else if (d.src.it) s[d.src.w].items = s[d.src.w].items.filter(x=>x!==d.src.it); };
    if (t.kind==='pouch'){ takeOut(); t.p.drugs.push(d.k); }
    else if (t.kind==='grid'){ if (d.src && d.src.it && d.src.w===t.w){ d.src.it.x = t.x; d.src.it.y = t.y; } else { takeOut(); s[t.w].items.push({ id:uid(), k:d.k, x:t.x, y:t.y }); } }
    else if (t.kind==='trash') takeOut();
  } else if (d.type==='pouch'){ if (t){ if (t.w!==d.w){ s[d.w].pouches = s[d.w].pouches.filter(x=>x!==d.p); s[t.w].pouches.push(d.p); } d.p.x = t.x; d.p.y = t.y; } }
  else if (d.type==='resize'){ if (t){ d.p.w = t.w; d.p.h = t.h; } }
  touch(); rerenderLeft(); }

function open(id){ if (id && store.slots.some(s=>s.id===id)) store.active = id; renderD(); M.classList.add('open'); document.body.classList.add('dbdesign'); }
function close(){ closePop(); M.classList.remove('open'); document.body.classList.remove('dbdesign'); persist(); }
M.addEventListener('pointerdown', e=>{ if (e.target===M) close(); if (!e.target.closest('.pop') && !e.target.closest('.pg')) closePop(); if (!e.target.closest('.newm')){ const n = M.querySelector('.newm'); if (n) n.classList.remove('open'); } });
addEventListener('keydown', e=>{ if (!M.classList.contains('open')) return;
  if (e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); if (popFor) closePop(); else if (document.activeElement && /INPUT|SELECT/.test(document.activeElement.tagName)) document.activeElement.blur(); else close(); return; }
  if (!(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) e.stopImmediatePropagation(); }, true);

window.DrugBoxDesigner = { open, close, layoutHTML, slots:()=>store.slots, active:()=>cur(), store:()=>store };
// preview deep link: #dbdesign=1
addEventListener('load', ()=>{ if (/dbdesign=1/.test(location.hash)) setTimeout(()=>open(), 450); });
})();
