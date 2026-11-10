// Yellow Pelican hard-case Drug Box (ECG Hero) for the selected rhythm.
(function(){
// All drug content comes from window.DRUG_BOX (assets/drug-box.js — owned by Druggy/Diego). This file is UI only.
let DB = window.DRUG_BOX || { drugs:{}, rhythms:{}, roles:{} };
const SECK = { CLASSIFICATION:'classification', DOSAGE:'dosage', INDICATIONS:'indications', CONTRAINDICATIONS:'contraindications', PRECAUTIONS:'precautions', 'SIDE/ADVERSE EFFECTS':'side_adverse_effects' };
const sec = (d,k)=> d[SECK[k]] || [];
const esc = s=>String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const RC = { first:'#2fbf62', next:'#4d9dff', cond:'#ffb84d', sed:'#b48cff', avoid:'#ff5d6c' };
const roleOf = r => [ (DB.roles&&DB.roles[r]) || r, RC[r] || '#9aa5b8' ];
// ONE Pelican case drawing for every Drug Box affordance (lid, toolbar, strip button, Lab column card, menu, empty pane, designer).
// Flat yellow body · embossed ribs · lid seam · black handle + hinge mounts · black latches · feet. Change it here only.
const PELICAN = (label)=>{ const H = label ? 60 : 50, B = H-4;            // body bottom
  return `<svg class="pcase${label?' pc-lbl':''}" viewBox="0 0 64 ${H}" aria-hidden="true">
<path d="M21 13V7.5a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3V13" fill="none" stroke="#141414" stroke-width="4.4" stroke-linecap="round"/>
<rect x="17.5" y="10.5" width="7" height="3.5" rx="1" fill="#141414"/><rect x="39.5" y="10.5" width="7" height="3.5" rx="1" fill="#141414"/>
<rect x="4" y="12" width="56" height="${B-12}" rx="5" fill="#f5c400" stroke="#8f7100" stroke-width="1.3"/>
<path d="M4.6 21.5h54.8" stroke="#5c4800" stroke-width="1.4"/>
${label ? '' : '<path d="M9 26.5h46" stroke="#fff3a6" stroke-opacity=".75" stroke-width="1"/><path d="M9 27.5h46" stroke="#b08c00" stroke-width="1"/>'}
<path d="M9 ${B-5.5}h46" stroke="#fff3a6" stroke-opacity=".75" stroke-width="1"/><path d="M9 ${B-4.5}h46" stroke="#b08c00" stroke-width="1"/>
<path d="M10.5 15v${B-18}M53.5 15v${B-18}" stroke="#fff3a6" stroke-opacity=".75" stroke-width="1"/><path d="M11.5 15v${B-18}M54.5 15v${B-18}" stroke="#b08c00" stroke-width="1"/>
<rect x="14" y="17" width="6" height="9" rx="1.2" fill="#141414"/><rect x="44" y="17" width="6" height="9" rx="1.2" fill="#141414"/>
${label ? '<text x="32" y="36.6" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="900" font-size="10.4" letter-spacing=".6" fill="#141414">DRUG</text><text x="32" y="48" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-weight="900" font-size="10.4" letter-spacing=".6" fill="#141414">BOX</text>' : ''}
<rect x="9" y="${B-0.5}" width="8" height="2.6" rx="1" fill="#a88600"/><rect x="47" y="${B-0.5}" width="8" height="2.6" rx="1" fill="#a88600"/></svg>`; };
const ICON = '<img class="ph-box" src="assets/icons/pharm-hero.png" alt="">', ICON_LABEL = ICON;
window.DRUG_ICON_LABEL = ICON_LABEL;
window.DRUG_ICON = ICON;

const css = `
img.ph-box{width:48px;height:48px;object-fit:contain;background:transparent;display:block}
.dbbtn{display:inline-flex;align-items:center;gap:6px}
.dbbtn .pcase{width:24px;height:19px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
#strip .hdr .dbbtn{border-color:#8a7300!important;background:#1d1a06!important;color:#ffe14a!important}
#strip .hdr .dbbtn:hover{background:#2c2708!important} #strip .hdr .dbbtn.on{background:#3d3409!important;border-color:#f7d000!important}
#rcard .dbcard{display:flex;align-items:center;gap:10px;width:100%;margin:8px 0 2px;padding:7px 10px;border-radius:10px;border:1px solid #8a7300;background:linear-gradient(#2a2507,#1a1704);color:#ffe14a;text-align:left}
#rcard .dbcard:hover{background:linear-gradient(#383009,#221e05)} #rcard .dbcard .pcase{width:36px;height:28px;flex:none}
#rcard .dbcard small{display:block;color:#cbbd76;font-weight:500;font-size:10.5px;margin-top:1px}
#dbox{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(2,4,10,.55);backdrop-filter:blur(2px)}
#dbox.open{display:flex;padding-top:34px}
#dbox .shell{position:relative;width:min(900px,calc(100vw - 40px));max-height:calc(100vh - 80px);display:flex;flex-direction:column;border-radius:22px;padding:14px;
  background:linear-gradient(180deg,#ffe94a 0%,#f7d000 45%,#d8af00 100%);box-shadow:0 30px 70px rgba(0,0,0,.6), inset 0 2px 0 #fff59a, inset 0 -4px 0 #b08f00;
  border:2px solid #9a7c00}
#dbox .shell::before,#dbox .shell::after{content:"";position:absolute;top:0;bottom:0;width:10px;background:linear-gradient(90deg,#c9a400,#ffe34d,#c9a400);opacity:.55}
#dbox .shell::before{left:72px} #dbox .shell::after{right:72px}
#dbox .handle{position:absolute;left:50%;top:-30px;transform:translateX(-50%);width:170px;height:34px;border:9px solid #151515;border-bottom:none;border-radius:16px 16px 0 0}
#dbox .latch{position:absolute;top:-6px;width:34px;height:30px;border-radius:5px;background:linear-gradient(#2a2a2a,#0e0e0e);box-shadow:0 2px 3px rgba(0,0,0,.5);z-index:2}
#dbox .latch::after{content:"";position:absolute;left:8px;right:8px;top:10px;height:3px;background:#3a3a3a;border-radius:2px}
#dbox .latch.l{left:96px} #dbox .latch.r{right:96px}
#dbox .lid{position:relative;z-index:1;display:flex;align-items:center;gap:12px;padding:16px 18px 12px;color:#1a1500}
#dbox .lid .pcase{width:46px;height:36px}
#dbox .lid h3{margin:0;font:900 19px/1.1 Inter,system-ui,sans-serif;letter-spacing:1.5px;text-transform:uppercase}
#dbox .lid .rn{font:700 13px Inter,system-ui,sans-serif;color:#3d3200;margin-top:2px}
#dbox .lid .x{margin-left:auto;background:#151515;color:#ffe14a;border:none;border-radius:8px;padding:7px 12px;font-weight:800}
#dbox .foam{position:relative;z-index:1;overflow:auto;border-radius:14px;padding:14px;background-color:#202226;
  background-image:radial-gradient(rgba(255,255,255,.045) 1.2px,transparent 1.3px);background-size:7px 7px;box-shadow:inset 0 3px 12px rgba(0,0,0,.7);color:#e6ecf7}
#dbox .ctx{font-size:12.5px;line-height:1.45;padding:9px 12px;border-radius:10px;background:#2a2c31;border-left:4px solid #f7d000;margin-bottom:12px}
#dbox .ctx.none{border-left-color:#2fbf62}
#dbox .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
#dbox .tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:24px 8px 9px;border-radius:16px;cursor:pointer;color:#e6ecf7;font:inherit;text-align:center;
  background:radial-gradient(120% 90% at 50% 30%,#1b1d21 0%,#121316 70%);border:1px solid #0a0b0d;box-shadow:inset 0 3px 10px rgba(0,0,0,.9),inset 0 -1px 0 rgba(255,255,255,.04),0 1px 0 rgba(255,255,255,.06);
  transition:transform .15s ease, box-shadow .15s ease, background .15s}
#dbox .tile:hover{transform:translateY(-2px);background:radial-gradient(120% 90% at 50% 30%,#23262b 0%,#15171a 70%);box-shadow:inset 0 3px 10px rgba(0,0,0,.85),0 6px 16px rgba(0,0,0,.45),0 0 0 1px color-mix(in srgb,var(--dc) 55%,transparent)}
#dbox .tile:focus-visible{outline:2px solid #ffe14a;outline-offset:2px}
#dbox .tile.sel{background:radial-gradient(120% 90% at 50% 30%,#2a2a1c 0%,#16160f 75%);box-shadow:inset 0 3px 10px rgba(0,0,0,.8),0 0 0 2px #f7d000,0 0 18px rgba(247,208,0,.35)}
#dbox .tile .ico{width:118px;height:58px;filter:drop-shadow(0 4px 4px rgba(0,0,0,.65));transition:transform .2s}
#dbox .tile:hover .ico,#dbox .tile.sel .ico{transform:rotate(-4deg) scale(1.06)}
#dbox .tile .tn{font:800 12.5px/1.15 Inter,system-ui,sans-serif;color:#fff}
#dbox .tile .ta{font-size:10px;color:#8b97ad;line-height:1.1;min-height:11px}
#dbox .tile .rl{position:absolute;top:6px;left:7px;font:800 8.5px Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.7px;padding:2px 6px;border-radius:999px;background:var(--rc);color:#0a0f1a}
#dbox .tile .gv{position:absolute;top:5px;right:7px;font-size:10px;color:#9fe8b4;font-weight:800}
#dbox .tile .sx{position:absolute;top:5px;right:7px;font-size:12px}
#dbox .tile.avoid .ico{filter:grayscale(.75) brightness(.7) drop-shadow(0 4px 4px rgba(0,0,0,.65))}
#dbox .tile.avoid::after{content:"";position:absolute;left:50%;top:53px;width:62px;height:62px;transform:translate(-50%,-50%);border:4px solid rgba(255,93,108,.85);border-radius:50%;
  background:linear-gradient(45deg,transparent 46%,rgba(255,93,108,.85) 46%,rgba(255,93,108,.85) 54%,transparent 54%);pointer-events:none}
#dbox .tile.avoid .tn{color:#ffb3ba}
#dbox .detail{margin-top:14px;border-radius:14px;padding:12px 14px;background:#15171a;border:1px solid #0b0c0e;border-top:3px solid var(--dc);box-shadow:inset 0 2px 10px rgba(0,0,0,.8);font-size:12.5px;line-height:1.45;animation:dbIn .18s ease}
@keyframes dbIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
#dbox .detail .dh{display:flex;align-items:center;gap:12px}
#dbox .detail .dh .ico{width:150px;height:74px;flex:none;filter:drop-shadow(0 5px 5px rgba(0,0,0,.7))}
#dbox .detail .dh b.n{font-size:17px;color:#fff} #dbox .detail .al{color:#8b97ad;font-size:11.5px}
#dbox .detail .role{display:inline-block;margin-top:3px;font:800 9.5px Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.8px;padding:2px 7px;border-radius:999px;background:var(--rc);color:#0a0f1a}
#dbox .detail .cls{color:#8b97ad;font-size:11px;margin-top:3px}
#dbox .detail .why{margin-top:8px;padding:7px 10px;border-radius:8px;background:#1e2125;border-left:3px solid var(--rc)}
#dbox .detail .k{display:block;margin-top:9px;color:#ffe14a;font:800 9.5px Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:1px}
#dbox .detail ul{margin:3px 0 0;padding-left:16px} #dbox .detail li{margin:1px 0}
#dbox .detail li.hit{color:#fff;font-weight:600} #dbox .detail li.dim{color:#7f8aa0}
#dbox .detail .who{font-size:9.5px;font-weight:800;color:#0a0f1a;background:#8b97ad;border-radius:4px;padding:0 4px;margin-right:4px}
#dbox .detail .who.p{background:#ffb6d0}
#dbox .detail details{margin-top:8px} #dbox .detail summary{cursor:pointer;color:#b8c8ea;font-size:11.5px;font-weight:600}
#dbox .detail .give{margin-top:10px;width:100%;background:#f7d000;color:#1a1500;border:none;font-weight:800;padding:8px;border-radius:8px;cursor:pointer}
#dbox .detail .give:hover{background:#ffe34d} #dbox .detail .give.done{background:#2a5d39;color:#c9ffd9}
#dbox .detail.avoid{background:#1d1214;border-color:#3a1a1f} #dbox .detail.avoid b.n{color:#ffb3ba;text-decoration:line-through;text-decoration-color:#ff5d6c}
#dbox .hint{margin-top:12px;text-align:center;color:#8b97ad;font-size:12px}
#dbox h4{margin:14px 2px 7px;font:800 10.5px Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:1.4px;color:#ffe14a}
#dbox h4.av{color:#ff8a94}
#dbox .other{display:flex;flex-wrap:wrap;gap:6px} #dbox .other span{font-size:11.5px;padding:4px 9px;border-radius:999px;background:#2a2c31;border:1px solid #3a3d44}
#dbox .log{margin-top:12px;font-size:11.5px;color:#9fe8b4;font-family:"JetBrains Mono",Consolas,monospace}
#dbox .foot{position:relative;z-index:1;padding:9px 6px 0;font:700 11px Inter,system-ui,sans-serif;color:#2e2600;text-align:center}
#dtoast{position:fixed;left:50%;transform:translateX(-50%);bottom:250px;z-index:41;display:none;max-width:560px;padding:9px 14px;border-radius:10px;background:#1d1a06;border:1px solid #f7d000;color:#ffe14a;font:600 12.5px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)}
#dtoast.show{display:block} #dtoast b{color:#fff}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const box = document.createElement('div'); box.id='dbox'; document.body.appendChild(box);
const toast = document.createElement('div'); toast.id='dtoast'; document.body.appendChild(toast);
let converting = false, api = null, curId = null, curV = null, given = [], openT = 0, toastT = null, convT = null;

function entry(id){ const r = (DB.rhythms||{})[id]; if (!r) return { none:'No drug-box entry for this rhythm yet — Druggy can add one.', drugs:[] };
  return { none: r.drugIndicated===false ? r.note : null, cond: r.drugIndicated===false ? null : r.note, other: r.also, noConvert: r.noConvert,
    drugs: (r.drugs||[]).map(x=>{ let re=null; try{ re = x.doseMatch ? new RegExp(x.doseMatch) : null; }catch(_){}
      return { d:x.drug, role:x.role, why:x.why||'', dose:re, give:x.administer }; }) }; }
// ---- unique drug icons (UI art only; drug facts stay in drug-box.js) ----
// form: prefill (Abboject-style syringe) · vial · ampule · bag (premix drip) · kit · nasal (prefilled + atomizer)
const LOOK = {
  adenosine:{f:'prefill',c:'#ff4d5a',a:'ADENO'},  amiodarone:{f:'ampule',c:'#ff9a1f',a:'AMIO'},
  epinephrine:{f:'prefill',c:'#ff3d9a',a:'EPI'},   atropine:{f:'prefill',c:'#2fbf62',a:'ATRO'},
  dopamine:{f:'bag',c:'#8c6cff',a:'DOPA'},         glucagon:{f:'kit',c:'#ff7a00',a:'GLUC'},
  calciumchloride:{f:'prefill',c:'#cfd8e6',a:'CaCl'}, midazolam:{f:'vial',c:'#b48cff',a:'VERSED'},
  lidocaine:{f:'prefill',c:'#4d9dff',a:'LIDO'},    metoprolol:{f:'vial',c:'#1fc8e0',a:'METO'},
  diltiazem:{f:'vial',c:'#00c2a0',a:'DILT'},       verapamil:{f:'vial',c:'#9bd14a',a:'VERA'},
  magnesium:{f:'vial',c:'#8fc8ff',a:'MgSO4'},      sodiumbicarbonate:{f:'prefill',c:'#e8eef6',a:'BICARB'},
  dextrose:{f:'prefill',c:'#ffc21a',a:'D50'},      naloxone:{f:'nasal',c:'#22e3ff',a:'NARCAN'},
  albuterol:{f:'ampule',c:'#58d68d',a:'ALB'},      ipratropium:{f:'ampule',c:'#5dade2',a:'ATRV'},
  nitroglycerin:{f:'vial',c:'#ff6b6b',a:'NTG'},    aspirin:{f:'vial',c:'#f5f5f5',a:'ASA'},
  fentanyl:{f:'vial',c:'#e84393',a:'FENT'},        ketamine:{f:'vial',c:'#a29bfe',a:'KET'},
  ondansetron:{f:'vial',c:'#74b9ff',a:'ZOFRAN'},   diphenhydramine:{f:'vial',c:'#fd79a8',a:'BENA'},
  norepinephrine:{f:'bag',c:'#5b7cfa',a:'LEVO'},   digifab:{f:'vial',c:'#7bc47f',a:'DIGI'}
};
const PAL = ['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#38d9a9','#4dabf7','#748ffc','#da77f2','#f783ac','#a9e34b'];
function look(k, d){ if (LOOK[k]) return LOOK[k]; let h=0; for (const ch of k) h=(h*31+ch.charCodeAt(0))>>>0;
  return { f:['vial','ampule','prefill'][h%3], c:PAL[h%PAL.length], a:(d&&d.name||k).replace(/[^A-Za-z]/g,'').slice(0,5).toUpperCase() }; }
let uid = 0;
function drugSVG(k, d, cls='ico'){
  const L = look(k,d), c = L.c, a = esc(L.a), id = 'g'+(++uid), fs = L.a.length>5 ? 7.2 : 8.6;
  const glass = `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="#dfe7f2" stop-opacity=".55"/><stop offset="1" stop-color="#9aa8bb" stop-opacity=".6"/></linearGradient>
    <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6fa"/><stop offset=".5" stop-color="#b9c2cf"/><stop offset="1" stop-color="#7d8796"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>`;
  const lbl = (x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#fbfcfe"/><rect x="${x}" y="${y}" width="6" height="${h}" fill="${c}"/><rect x="${x+w-6}" y="${y}" width="6" height="${h}" fill="${c}"/>
    <text x="${x+w/2}" y="${y+h/2+3}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="${fs}" fill="#15171a">${a}</text>`;
  let body = '';
  if (L.f==='prefill' || L.f==='nasal'){ // horizontal prefilled syringe (glass barrel, colored cap & plunger)
    body = `<rect x="6" y="25" width="14" height="10" rx="2" fill="url(#${id}m)"/><rect x="2" y="22" width="5" height="16" rx="1.5" fill="url(#${id}c)"/>
      <rect x="18" y="20" width="62" height="20" rx="4" fill="url(#${id}g)" stroke="#8592a5" stroke-width=".8"/>
      <rect x="20" y="22.5" width="40" height="15" rx="2" fill="${c}" opacity=".28"/>${lbl(26,23,46,14)}
      <rect x="80" y="23" width="6" height="14" rx="1" fill="url(#${id}c)"/>` +
      (L.f==='nasal' ? `<path d="M86 25 L104 27.5 Q112 30 104 32.5 L86 35Z" fill="#f2f4f8" stroke="#9aa5b8" stroke-width=".8"/><ellipse cx="110" cy="30" rx="4" ry="3.2" fill="${c}"/>`
                     : `<rect x="86" y="25.5" width="16" height="9" rx="2.5" fill="url(#${id}c)"/><path d="M102 28.5h12M102 31.5h12" stroke="#c4ccd8" stroke-width="1"/><path d="M102 30h14" stroke="#e9edf3" stroke-width="1.6" stroke-linecap="round"/>`);
  } else if (L.f==='vial'){
    body = `<g transform="rotate(-8 60 30)"><rect x="38" y="6" width="44" height="10" rx="2.5" fill="url(#${id}c)"/><rect x="41" y="15" width="38" height="5" fill="url(#${id}m)"/>
      <path d="M44 20h32v3q8 3 8 9v20q0 4-4 4H40q-4 0-4-4V32q0-6 8-9z" fill="url(#${id}g)" stroke="#8592a5" stroke-width=".8"/>
      <rect x="38" y="42" width="44" height="12" rx="3" fill="${c}" opacity=".25"/>${lbl(37,30,46,14)}<path d="M41 26v24" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/></g>`;
  } else if (L.f==='ampule'){ // horizontal glass ampule with snap-neck ring
    body = `<path d="M20 18q-6 0-6 6v12q0 6 6 6h52q6 0 10-6l4-3h5q3 0 5-2l4-3h4q4 0 4-2v-2q0-2-4-2h-4l-4-3q-2-2-5-2h-5l-4-3q-4-6-10-6z" fill="url(#${id}g)" stroke="#8592a5" stroke-width=".8"/>
      <rect x="15" y="34" width="66" height="7" rx="3" fill="${c}" opacity=".35"/><rect x="88" y="23.5" width="3" height="13" rx="1" fill="${c}"/>
      ${lbl(22,23,52,14)}<path d="M18 22q20-3 56 0" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" fill="none"/>`;
  } else if (L.f==='bag'){
    body = `<path d="M30 8h60q5 0 5 5v24q0 9-9 12l-6 3H40l-6-3q-9-3-9-12V13q0-5 5-5z" fill="url(#${id}g)" stroke="#8592a5" stroke-width=".8"/>
      <circle cx="60" cy="13" r="2.4" fill="none" stroke="#8592a5" stroke-width="1.2"/><path d="M28 30h64v7q0 8-8 11l-6 3H42l-6-3q-8-3-8-11z" fill="${c}" opacity=".35"/>
      ${lbl(37,19,46,14)}<rect x="52" y="51" width="7" height="7" rx="1" fill="url(#${id}m)"/><rect x="61" y="51" width="7" height="7" rx="1" fill="${c}"/>`;
  } else { // kit (glucagon emergency kit)
    body = `<rect x="16" y="12" width="88" height="38" rx="7" fill="url(#${id}c)" stroke="#000" stroke-opacity=".3"/><rect x="16" y="12" width="88" height="10" rx="7" fill="#fff" opacity=".18"/>
      <path d="M60 12v38" stroke="#000" stroke-opacity=".25" stroke-width="1.2"/>${lbl(23,28,32,14).replace(/font-size="[\d.]+"/,'font-size="7.4"')}
      <rect x="67" y="26" width="30" height="8" rx="2" fill="#fbfcfe"/><rect x="69" y="27.5" width="18" height="5" rx="1" fill="#cfd6e0"/><rect x="87" y="28.5" width="8" height="3" fill="${c}"/>
      <circle cx="82" cy="42" r="4" fill="#fbfcfe"/><rect x="80" y="38" width="4" height="2" fill="${c}"/>`;
  }
  return `<svg class="${cls}" viewBox="0 0 120 60" aria-hidden="true"><defs>${glass}</defs>${body}</svg>`;
}
window.DRUG_ICON_FOR = (k)=>drugSVG(k, (DB.drugs||{})[k]);
let selK = null;
function showToast(h, ms=5200){ toast.innerHTML=h; toast.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>toast.classList.remove('show'), ms); }
function administer(x, btn){
  const g = x.give, e = entry(curId), t = Math.max(0, Math.round((performance.now()-openT)/1000));
  given.push(`${g.label} @${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`);
  btn.classList.add('done'); btn.textContent = '✓ Given (simulated) — '+g.label;
  const conv = g.to && !e.noConvert && api.has(g.to);
  showToast(`💉 <b>${esc(g.label)}</b> given (teaching sim).<br>${esc(g.fx)}${conv?`<br>⏱ Watch the monitor: <b>${esc(g.toTxt||'rhythm changes')}</b>`:''}`, conv?(g.delay||3000)+4500:6000);
  clearTimeout(convT);
  if (conv){ const keep = given.slice(), from = api.title(curId, curV);
    convT = setTimeout(()=>{ close(); converting = true; api.select(g.to, g.toV); converting = false; given = keep; showToast(`Simulated response: <b>${esc(from)}</b> → <b>${esc(api.title(g.to, g.toV))}</b>. Teaching sim — real patients may not respond.`, 6500); }, g.delay||3000); }
  else setTimeout(render, 50);
}
function open(k){ if (!curId) return; if (typeof k==='string'){ const i=(entry(curId).drugs||[]).findIndex(x=>x.d===k); if (i>=0) selK=i; } if (!openT) openT = performance.now(); render(); box.classList.add('open'); sync(); }
function close(){ box.classList.remove('open'); sync(); }
// (Press D) hint: hidden for the rest of this page load once D is used (in-memory; returns on refresh)
let dUsed=false;
function usedD(){ if (dUsed) return; dUsed=true; document.body.classList.add('db-dused'); }
function toggle(){ box.classList.contains('open') ? close() : open(); }
function sync(){ const o = box.classList.contains('open'); if (o) usedD(); document.querySelectorAll('.dbbtn').forEach(b=>b.classList.toggle('on', o)); }
box.addEventListener('pointerdown', e=>{ if (e.target===box) close(); });
addEventListener('keydown', e=>{
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (document.body.classList.contains('dbdesign')) return;
  if (box.classList.contains('open') && e.key==='Escape'){ e.stopImmediatePropagation(); e.preventDefault(); close(); return; }
  if ((e.key==='d'||e.key==='D') && !e.ctrlKey && !e.metaKey){ e.stopImmediatePropagation(); toggle(); usedD(); }
  else if (box.classList.contains('open') && e.key!=='Tab'){ e.stopImmediatePropagation(); }
}, true);
window.DrugBox = {
  init(a){ api = a; },
  onRhythm(id, v){ if (id!==curId){ selK=null; } if (id!==curId && !converting){ given=[]; openT=0; clearTimeout(convT); } curId = id||null; curV = v||null; if (!id) close();
    if (box.classList.contains('open')) render();
    const c = document.querySelector('#rcard .dbslot'); if (c && id){ const e = entry(id); const n = (e.drugs||[]).filter(x=>x.role!=='avoid').length;
      c.innerHTML = `<button class="dbcard dbbtn" title="Open the drug box for this rhythm (D)"><i class="hg l"></i><i class="hg r"></i><i class="lt l"></i><i class="lt r"></i>${ICON}<span><b>Drug Box</b><small>${n?n+' drug'+(n>1?'s':'')+' from your list · tap to open':'No drug indicated · tap for why'}</small></span></button>`;
      c.querySelector('button').onclick = open; sync(); } },
  load(p){ if (!p) return; DB = { ...DB, ...p, drugs:{ ...(DB.drugs||{}), ...(p.drugs||{}) }, rhythms:{ ...(DB.rhythms||{}), ...(p.rhythms||{}) }, roles:{ ...(DB.roles||{}), ...(p.roles||{}) } };
    if (curId) this.onRhythm(curId, curV); },
  data(){ return DB; },
  open, close, toggle, select(k){ open(k); }, resetCase(){ given=[]; openT=0; }
};

// ================= Drug Box v3: filter bar · full reference card · custom boxes =================
const css2 = `
#dbox .shell{width:min(1220px,calc(100vw - 40px));height:calc(100vh - 80px)}
#dbox .shell::before{left:96px} #dbox .shell::after{right:96px}
#dbox .latch.l{left:122px} #dbox .latch.r{right:122px}
#dbox .fbar{position:relative;z-index:1;display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 4px 10px;padding:6px;border-radius:12px;background:#151515;box-shadow:inset 0 2px 6px rgba(0,0,0,.6),0 1px 0 #fff59a}
#dbox .fbar .fl{font:900 10px Inter,system-ui,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#ffe14a;padding:0 6px 0 4px}
#dbox .fbar .fb{border:1px solid #3a3410;background:#23200b;color:#f3e7a8;font:700 12px Inter,system-ui,sans-serif;padding:6px 11px;border-radius:8px;cursor:pointer}
#dbox .fbar .fb:hover{background:#2f2a0c;border-color:#8a7300}
#dbox .fbar .fb.on{background:#f7d000;color:#1a1500;border-color:#f7d000;box-shadow:0 0 0 2px rgba(247,208,0,.25)}
#dbox .fbar .fb[disabled]{opacity:.35;cursor:not-allowed}
#dbox .fbar .fb.cu{background:#2a1f05;border-color:#b98b00}
#dbox .fbar .fb.cu.on{background:#f7d000;color:#1a1500;border-color:#f7d000}
#dbox .fbar .q{margin-left:auto;min-width:170px;flex:0 1 230px;background:#0d0d0d;border:1px solid #3a3410;color:#fff;border-radius:8px;padding:6px 10px;font:500 12.5px Inter,system-ui,sans-serif}
#dbox .fbar .q:focus{outline:none;border-color:#f7d000}
#dbox .fbar .ds{background:#151515;color:#ffe14a;border:1px dashed #8a7300;font:800 11.5px Inter,system-ui,sans-serif;padding:6px 10px;border-radius:8px;cursor:pointer}
#dbox .fbar .ds:hover{background:#221e08}
#dbox .fbody{position:relative;z-index:1;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 410px;gap:12px}
#dbox .fbody .foam{min-height:0}
#dbox .ref{min-height:0;overflow:auto;border-radius:14px;background:#15171a;box-shadow:inset 0 3px 12px rgba(0,0,0,.75);color:#e6ecf7}
#dbox .ref .detail{margin:0;border:none;border-top:3px solid var(--dc);border-radius:14px;box-shadow:none;background:transparent;min-height:100%}
#dbox .ref .empty{padding:40px 22px;text-align:center;color:#8b97ad;font-size:13px;line-height:1.5}
#dbox .ref .empty .pcase{width:70px;height:55px;opacity:.6;display:block;margin:0 auto 10px}
@media (max-width:980px){ #dbox .fbody{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) minmax(0,1fr)} }
#dbox h4 small{color:#8b97ad;font-weight:600;letter-spacing:.4px;text-transform:none;margin-left:6px}
#dbox h4.grp{display:flex;align-items:center;gap:8px;border-bottom:1px dashed #3a3d44;padding-bottom:5px}
#dbox h4 .mchip{font:900 10px Inter,system-ui,sans-serif;background:#f7d000;color:#1a1500;border-radius:6px;padding:2px 7px;letter-spacing:.5px}
#dbox .tile .mc{position:absolute;top:6px;left:7px;font:800 8.5px Inter,system-ui,sans-serif;letter-spacing:.6px;padding:2px 6px;border-radius:999px;background:#3a3d44;color:#dfe5ef}
#dbox .tile .rr{position:absolute;top:6px;right:7px;font:800 8.5px Inter,system-ui,sans-serif;letter-spacing:.5px;padding:2px 6px;border-radius:999px;background:var(--rc);color:#0a0f1a;text-transform:uppercase}
#dbox .tile .tc{font-size:9.5px;color:#9fb0c9;line-height:1.15;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dbox .tiles.browse{grid-template-columns:repeat(auto-fill,minmax(138px,1fr))}
#dbox .tiles.browse .tile .ico{width:104px;height:52px}
#dbox .detail .chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
#dbox .detail .chips span{font:800 9.5px Inter,system-ui,sans-serif;letter-spacing:.5px;padding:2px 7px;border-radius:999px;background:#2a2d33;color:#dfe5ef}
#dbox .detail .chips span.m{background:#f7d000;color:#1a1500}
#dbox .detail .sect{margin-top:10px;padding-top:8px;border-top:1px solid #23262b}
#dbox .detail .sect .k{margin-top:0}
#dbox .detail .sect.ci .k{color:#ff6b78} #dbox .detail .sect.ds .k{color:#7dffa8}
#dbox .detail .sect.cl .k{color:#c9a7ff} #dbox .detail .sect.mo .k{color:#5fe3e3} #dbox .detail .sect.in .k{color:#9ee06a}
#dbox .detail .sect.pr .k{color:#ffb547} #dbox .detail .sect.se .k{color:#ff9a6b} #dbox .detail .sect.sc .k{color:#f5e76a}
#dbox .detail .who{color:#04101c;background:#4aa3df} #dbox .detail .who.p{color:#2a0716;background:#ff8fc0}
#dbox .detail li.ad{color:#c4defa} #dbox .detail li.pd{color:#ffd3e6}
#dbox .detail li.hit.ad,#dbox .detail li.hit.pd{color:#fff;font-weight:600}
#dbox .detail .none{color:#6b7488;font-style:italic;font-size:11.5px}
#dbox .detail .rx{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
#dbox .detail .rx button{font:700 10.5px Inter,system-ui,sans-serif;border-radius:999px;padding:3px 9px;border:1px solid color-mix(in srgb,var(--rc) 60%,transparent);background:color-mix(in srgb,var(--rc) 16%,#15171a);color:#e6ecf7;cursor:pointer}
#dbox .detail .rx button:hover{background:color-mix(in srgb,var(--rc) 30%,#15171a)}
#dbox .detail .rx button.cur{outline:2px solid #f7d000}
#dbox .noq{padding:30px;text-align:center;color:#8b97ad}
#dbox .cuhead{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:10px}
#dbox .cuhead select{background:#0d0d0d;color:#ffe14a;border:1px solid #8a7300;border-radius:8px;padding:6px 8px;font:700 12.5px Inter,system-ui,sans-serif;max-width:260px}
#dbox .cuhead .lg{display:flex;gap:10px;flex-wrap:wrap;margin-left:auto;font-size:10.5px;color:#9aa5b8}
#dbox .cuhead .lg i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;vertical-align:-1px}
#dbox .cta{padding:34px 20px;text-align:center;color:#c9d2e2;line-height:1.5}
#dbox .cta button,#dbox .cuhead button{background:#f7d000;color:#1a1500;border:none;font-weight:800;border-radius:8px;padding:8px 14px;cursor:pointer}
#dbox .cta button:hover,#dbox .cuhead button:hover{background:#ffe34d}
`;
{ const s = document.createElement('style'); s.textContent = css2; document.head.appendChild(s); }

// ================= Pelican hard-case skin (Diego ref photo): flat yellow, embossed ribs, black handle/hinges/latches =================
const css3 = `
#dbox .shell{--py:#f5c400;--rh:rgba(255,250,200,.95);--rs:rgba(120,88,0,.75);
  background:var(--py)!important;border:2px solid #9a7a00;border-radius:18px;padding:14px 26px 12px;
  box-shadow:0 30px 70px rgba(0,0,0,.55),inset 0 -7px 0 rgba(150,112,0,.28),inset 0 0 0 1px rgba(255,240,150,.35)}
/* vertical corner posts = raised ribs down both sides (like the photo's corner columns) */
#dbox .shell::before,#dbox .shell::after{content:"";position:absolute;top:10px;bottom:16px;width:13px;opacity:1;border-radius:5px;background:var(--py);
  box-shadow:inset 3px 0 0 var(--rh),inset -3px 0 0 var(--rs),0 0 0 1px rgba(120,88,0,.25)}
#dbox .shell::before{left:7px} #dbox .shell::after{right:7px;left:auto}
/* handle + hinges: flat black */
#dbox .handle{top:-38px;width:230px;height:42px;border:12px solid #141414;border-bottom:none;border-radius:16px 16px 0 0;box-sizing:border-box;z-index:3}
#dbox .handle::before,#dbox .handle::after{content:"";position:absolute;bottom:-9px;width:34px;height:13px;border-radius:3px;background:#141414}
#dbox .handle::before{left:-23px} #dbox .handle::after{right:-23px}
/* lid: raised rib frame + seam line */
#dbox .lid{height:68px;box-sizing:border-box;padding:10px 16px 14px;margin:0 -2px}
#dbox .lid::before{content:"";position:absolute;inset:3px 0 9px;border-radius:10px;pointer-events:none;z-index:-1;
  box-shadow:inset 3px 3px 0 var(--rh),inset -3px -3px 0 var(--rs),0 0 0 1px rgba(120,88,0,.2)}
#dbox .lid::after{content:"";position:absolute;left:-26px;right:-26px;bottom:0;height:3px;background:#4a3a00;box-shadow:0 2px 0 var(--rh);pointer-events:none}
#dbox .lid .pcase{width:50px;height:39px}
#dbox .lid h3{color:#141414;letter-spacing:2px}
#dbox .lid .rn{color:#4a3c00}
/* latches straddle the lid seam, flanking the handle */
#dbox .latch{top:56px;width:28px;height:30px;border-radius:4px;background:#141414!important;box-shadow:0 2px 0 rgba(0,0,0,.35);z-index:3}
#dbox .latch::after{left:6px;right:6px;top:7px;height:2px;background:#3c3c3c}
#dbox .latch::before{content:"";position:absolute;left:6px;right:6px;bottom:6px;height:2px;border-radius:1px;background:#3c3c3c}
#dbox .latch.l{left:calc(50% - 205px)} #dbox .latch.r{right:calc(50% - 205px)}
@media (max-width:1100px){ #dbox .latch.l{left:calc(50% - 150px)} #dbox .latch.r{right:calc(50% - 150px)} }
#dbox .fbar{margin:10px 2px 10px}
/* bottom rib + feet */
#dbox .foot{margin-top:10px;padding:8px 6px 0;color:#3a2f00;border-top:2px solid var(--rs);box-shadow:inset 0 2px 0 var(--rh)}
#dbox .foot::before,#dbox .foot::after{content:"";position:absolute;bottom:-23px;width:64px;height:9px;border-radius:0 0 5px 5px;background:#b89300}
#dbox .foot::before{left:8%} #dbox .foot::after{right:8%}
#dbox.lyt-dbc .shell::before,#dbox.lyt-dbc .shell::after{bottom:8px}
#dbox .lid > div{min-width:0} #dbox .lid .rn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dbox .lid .x,#dbox .lid .lyt-dbmin{white-space:nowrap;flex:none}
#dbox.lyt-dbc .lid{height:auto;min-height:68px} #dbox.lyt-dbc .latch{display:none}
`;
{ const s = document.createElement('style'); s.textContent = css3; document.head.appendChild(s); }

const LS = 'ecg.drugbox.view.v1';
let VIEW = (()=>{ try{ return JSON.parse(localStorage.getItem(LS))||{}; }catch(_){ return {}; } })();
let mode = VIEW.mode || 'rhythm', q = '', selD = null, slotId = VIEW.slot || null;
const saveView = ()=>{ try{ localStorage.setItem(LS, JSON.stringify({mode, slot:slotId})); }catch(_){} };
const MODES = [['rhythm','♥ This rhythm'],['module','Module'],['alpha','A–Z'],['class','Classification'],['cardiac','Cardiac only'],['custom','★ Custom']];
const drugs = ()=>DB.drugs||{};
const effMode = ()=> (mode==='rhythm' && !curId) ? 'module' : mode;

// classification buckets (UI grouping only — the drug’s own classification list is shown verbatim on its card)
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
  [/fibrinolytic/i, 'Hemostatics'] ];
function bucket(d){ const c = d.classification||[]; for (const s of [c[0]||'', c.join(' ')]) for (const [re,n] of BUCKETS) if (re.test(s)) return n; return 'Other'; }
// rhythms that list a drug (from drug-box.js)
function usesOf(k){ const out=[]; for (const [rid,r] of Object.entries(DB.rhythms||{})) for (const x of (r.drugs||[])) if (x.drug===k) out.push([rid,x.role]); return out; }
function cardiacSet(){ const s=new Set(); for (const r of Object.values(DB.rhythms||{})) for (const x of (r.drugs||[])) if (x.role!=='avoid') s.add(x.drug); return s; }
const rxOf = (k)=> curId ? (entry(curId).drugs||[]).find(x=>x.d===k) || null : null;
const short = (d)=> (d.name||'').replace(/ (Sulfate|Hydrochloride|Bromide|Citrate|Chloride)$/,'');
const match = (k,d)=>{ if (!q) return true; const s=(k+' '+d.name+' '+(d.alias||'')+' '+(d.classification||[]).join(' ')+' '+(d.indications||[]).join(' ')).toLowerCase(); return q.toLowerCase().split(/\s+/).every(w=>s.includes(w)); };

function tileR(x){ // rhythm-mode tile
  const d = drugs()[x.d]; if (!d) return '';
  const [rl, rc] = roleOf(x.role), avoid = x.role==='avoid', L = look(x.d, d);
  const done = x.give && given.some(g=>g.startsWith(x.give.label));
  return `<button class="tile ${avoid?'avoid':''} ${selD===x.d?'sel':''}" data-k="${x.d}" style="--rc:${rc};--dc:${L.c}" title="${esc(d.name)} — ${esc(rl)} · click for the full reference card">
    <span class="rl">${esc(rl)}</span>${done?'<span class="gv">✓ given</span>':(x.give&&!avoid?'<span class="sx" title="Administer sim available">💉</span>':'')}
    ${drugSVG(x.d, d)}<span class="tn">${esc(d.name)}</span><span class="ta">${esc(d.alias||'')}</span></button>`;
}
function tileB(k){ // browse-mode tile
  const d = drugs()[k]; if (!d) return '';
  const L = look(k,d), rx = rxOf(k), [rl, rc] = rx ? roleOf(rx.role) : ['',''];
  return `<button class="tile ${selD===k?'sel':''}" data-k="${k}" style="--dc:${L.c};--rc:${rc||'#9aa5b8'}" title="${esc(d.name)} — click for the full reference card">
    <span class="mc">${d.module?'M'+d.module:'EXTRA'}</span>${rx?`<span class="rr" title="${esc(rl)} — for the selected rhythm">${({first:'1st',next:'2nd',cond:'If cause',sed:'Proc',avoid:'Avoid'})[rx.role]||esc(rl)}</span>`:''}
    ${drugSVG(k, d)}<span class="tn">${esc(d.name)}</span><span class="tc">${esc((d.classification||[]).join(' · '))}</span></button>`;
}
function groups(em){
  const all = Object.entries(drugs()).filter(([k,d])=>match(k,d)), G = new Map();
  const add = (g,k)=>{ if (!G.has(g)) G.set(g,[]); G.get(g).push(k); };
  const byName = (a,b)=>drugs()[a].name.localeCompare(drugs()[b].name);
  if (em==='module'){ all.sort((a,b)=>(a[1].module||99)-(b[1].module||99)||a[1].name.localeCompare(b[1].name)); all.forEach(([k,d])=>add(d.module?'Module '+d.module:'Extra drugs',k)); }
  else if (em==='alpha'){ all.sort((a,b)=>a[1].name.localeCompare(b[1].name)); all.forEach(([k,d])=>add(d.name[0].toUpperCase(),k)); }
  else if (em==='class'){ const ord = BUCKETS.map(b=>b[1]).concat('Other'); all.sort((a,b)=>ord.indexOf(bucket(a[1]))-ord.indexOf(bucket(b[1]))||a[1].name.localeCompare(b[1].name)); all.forEach(([k,d])=>add(bucket(d),k)); }
  else if (em==='cardiac'){ const cs = cardiacSet(); const ord = BUCKETS.map(b=>b[1]).concat('Other');
    all.filter(([k])=>cs.has(k)).sort((a,b)=>ord.indexOf(bucket(a[1]))-ord.indexOf(bucket(b[1]))||a[1].name.localeCompare(b[1].name)).forEach(([k,d])=>add(bucket(d),k)); }
  for (const v of G.values()) if (em!=='module' && em!=='class' && em!=='cardiac') v.sort(byName);
  return G;
}
function full(k){ // the complete reference card for one drug
  const d = drugs()[k]; if (!d) return '';
  const L = look(k,d), rx = rxOf(k), avoid = rx && rx.role==='avoid', [rl, rc] = rx ? roleOf(rx.role) : ['', '#f7d000'];
  const re = rx && rx.dose; const dose = d.dosage||[]; const hit = re && !avoid ? dose.filter(l=>re.test(l.t)) : [];
  const li = (l,c)=>`<li class="${c||''} ${l.who==='Pediatric'?'pd':'ad'}"><span class="who ${l.who==='Pediatric'?'p':''}">${l.who==='Pediatric'?'PEDS':'ADULT'}</span>${esc(l.t)}</li>`;
  const S = (title, arr, cls='')=>`<div class="sect ${cls}"><span class="k">${title}</span>${arr&&arr.length?`<ul>${arr.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<div class="none">None listed on your card.</div>'}</div>`;
  const uses = usesOf(k), order={first:0,next:1,cond:2,sed:3,avoid:9}; uses.sort((a,b)=>(order[a[1]]??5)-(order[b[1]]??5));
  const done = rx && rx.give && given.some(g=>g.startsWith(rx.give.label));
  return `<div class="detail ${avoid?'avoid':''}" style="--rc:${rc};--dc:${L.c}">
    <div class="dh">${drugSVG(k, d)}<div><b class="n">${esc(d.name)}</b>${d.alias?`<br><span class="al">${esc(d.alias)}</span>`:''}
      <div class="chips"><span class="m">${d.module?'MODULE '+d.module:'EXTRA'}</span>${rx?`<span style="background:${rc};color:#0a0f1a">${esc(rl)} · ${esc(api.title(curId,curV))}</span>`:''}</div></div></div>
    ${rx?`<div class="why">${esc(rx.why)}</div>`:''}
    ${rx && rx.give && !avoid ? `<button class="give ${done?'done':''}" data-k="${k}">${done?'✓ Given (simulated) — ':'💉 Administer — '}${esc(rx.give.label)}</button>` : ''}
    ${hit.length?`<div class="sect"><span class="k">Dose for this rhythm — from your list</span><ul>${hit.map(l=>li(l,'hit')).join('')}</ul></div>`:''}
    ${S('Classification', d.classification, 'cl')}
    ${S('Mechanism of action', d.mechanism_of_action, 'mo')}
    <div class="sect ds"><span class="k">Dosage${hit.length?' — all lines':''}</span>${dose.length?`<ul>${dose.map(l=>li(l, hit.includes(l)?'hit':'')).join('')}</ul>`:'<div class="none">None listed on your card.</div>'}</div>
    ${S('Indications', d.indications, 'in')}
    ${S('Contraindications', d.contraindications, 'ci')}
    ${S('Precautions', d.precautions, 'pr')}
    ${S('Side / adverse effects', d.side_adverse_effects, 'se')}
    ${S('Special considerations', d.special_considerations, 'sc')}
    <div class="sect"><span class="k">Rhythms that list it in the box</span>${uses.length?`<div class="rx">${uses.map(([rid,r])=>`<button data-r="${rid}" class="${rid===curId?'cur':''}" style="--rc:${roleOf(r)[1]}" title="${esc(roleOf(r)[0])} — click to load this rhythm">${esc(api.title(rid))}${r==='avoid'?' ⚠':''}</button>`).join('')}</div>`:'<div class="none">Not used for any of the 35 rhythms — reference only.</div>'}</div>
  </div>`;
}
function bodyRhythm(){
  const e = entry(curId), list = e.drugs||[], ok = (x)=>!!drugs()[x.d];
  const order = {first:0,next:1,cond:2,sed:3};
  const use = list.filter(x=>x.role!=='avoid'&&ok(x)).sort((a,b)=>(order[a.role]??9)-(order[b.role]??9)), av = list.filter(x=>x.role==='avoid'&&ok(x));
  if (!selD || !list.some(x=>x.d===selD)) selD = use[0] ? use[0].d : (av[0] ? av[0].d : null);
  return `<div class="ctx ${e.none?'none':''}">${esc(e.none||e.cond||'')}</div>
    ${use.length?`<h4>In the box for ${esc(api.title(curId,curV))} — tap a drug</h4><div class="tiles">${use.map(tileR).join('')}</div>`:''}
    ${av.length?`<h4 class="av">⚠ Don’t reach for these</h4><div class="tiles">${av.map(tileR).join('')}</div>`:''}
    ${e.other?`<h4>Not in the box — do alongside</h4><div class="other">${e.other.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
    ${given.length?`<div class="log">Given this case: ${given.map(g=>esc(g)).join(' · ')}</div>`:''}`;
}
function bodyBrowse(em){
  const G = groups(em); let n = 0; for (const v of G.values()) n += v.length;
  if (selD && !drugs()[selD]) selD = null;
  if (!n) return `<div class="noq">No drugs match “${esc(q)}”.</div>`;
  const lead = em==='cardiac' ? `<div class="ctx">Cardiac only: every drug any of the 35 rhythms puts in the box (1st line, next, cause-specific, or procedure support) — ${n} drugs, grouped by class.${curId?' Role chips show how each fits <b>'+esc(api.title(curId,curV))+'</b>.':''}</div>` : '';
  return lead + [...G].map(([g,ks])=>`<h4 class="grp">${em==='module'&&/^Module/.test(g)?`<span class="mchip">${esc(g.toUpperCase())}</span>`:esc(g)}<small>${ks.length} drug${ks.length>1?'s':''}</small></h4><div class="tiles browse">${ks.map(tileB).join('')}</div>`).join('');
}
function bodyCustom(){
  const K = window.DrugBoxDesigner; if (!K) return '<div class="cta">Designer not loaded.</div>';
  const slots = K.slots(); if (!slots.length) return `<div class="cta"><div style="font-size:15px;font-weight:800;color:#ffe14a">No custom boxes yet</div>Build your own: drag drugs into a lid and base foam, add pouches like “Narcs” or “Arrest,” size and color them, and save as many named boxes as you like.<br><br><button class="dsgo">🛠 Design Drug Box</button></div>`;
  if (!slots.some(s=>s.id===slotId)) slotId = (K.active()||slots[0]).id;
  const slot = slots.find(s=>s.id===slotId);
  const e = curId ? entry(curId) : null, role = {}; if (e) for (const x of (e.drugs||[])) role[x.d] = x.role;
  return `<div class="cuhead"><select class="slotsel" title="Saved custom boxes">${slots.map(s=>`<option value="${s.id}" ${s.id===slotId?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
      <button class="dsgo" title="Edit this box in the designer">✎ Edit in designer</button>
      ${e?`<span class="lg"><span><i style="background:#2fbf62"></i>1st line</span><span><i style="background:#4d9dff"></i>next</span><span><i style="background:#ffb84d"></i>if cause</span><span><i style="background:#b48cff"></i>procedure</span><span><i style="background:#ff5d6c"></i>avoid — for ${esc(api.title(curId,curV))}</span></span>`:''}</div>
    ${K.layoutHTML(slot, { ro:true, role, sel:selD, q })}`;
}
function render(){
  if (!api) return;
  const em = effMode();
  const modeBtns = MODES.map(([m,l])=>`<button class="fb ${m==='custom'?'cu':''} ${em===m?'on':''}" data-m="${m}" ${m==='rhythm'&&!curId?'disabled title="Pick a rhythm first"':''}>${l}</button>`).join('');
  const searchable = em!=='rhythm';
  let main = em==='rhythm' ? bodyRhythm() : em==='custom' ? bodyCustom() : bodyBrowse(em);
  const ref = selD && drugs()[selD] ? full(selD) : `<div class="empty">${ICON}Tap any drug to open its full card — classification, mechanism, every dose line, indications, contraindications, precautions, side effects, and which rhythms use it.</div>`;
  const fs = box.querySelector('.foam'), rs = box.querySelector('.ref'), keepF = fs?fs.scrollTop:0, keepR = rs?rs.scrollTop:0, hadQ = document.activeElement && document.activeElement.classList.contains('q'), caret = hadQ ? document.activeElement.selectionStart : 0;
  box.innerHTML = `<div class="shell"><div class="handle"></div><span class="latch l"></span><span class="latch r"></span>
    <div class="lid">${ICON}<div><h3>Drug Box</h3><div class="rn">${curId?esc(api.title(curId, curV)):'No rhythm selected — browsing the full box'}</div></div><button class="x" title="Close (Esc / D)">Close ✕</button></div>
    <div class="fbar"><span class="fl">Filter</span>${modeBtns}<button class="ds" title="Open the Drug Box designer">🛠 Design Drug Box</button>${searchable?`<input class="q" type="search" placeholder="Search name, class, indication…" value="${esc(q)}">`:''}</div>
    <div class="fbody"><div class="foam">${main}</div><div class="ref">${ref}</div></div></div>`;
  const F = box.querySelector('.foam'); if (renderKeep) { F.scrollTop = keepF; box.querySelector('.ref').scrollTop = refKeep ? keepR : 0; }
  renderKeep = false; refKeep = false;
  box.querySelector('.x').onclick = close;
  box.querySelectorAll('.fb').forEach(b=>b.onclick=()=>{ if (b.disabled) return; mode = b.dataset.m; saveView(); if (mode==='rhythm') selD=null; render(); });
  box.querySelectorAll('.ds,.dsgo').forEach(b=>b.onclick=()=>{ window.DrugBoxDesigner && DrugBoxDesigner.open(em==='custom'?slotId:null); });
  const qi = box.querySelector('.q'); if (qi){ qi.oninput = ()=>{ q = qi.value; renderKeep=false; render(); }; if (hadQ){ qi.focus(); try{ qi.setSelectionRange(caret,caret); }catch(_){} } }
  const ss = box.querySelector('.slotsel'); if (ss) ss.onchange = ()=>{ slotId = ss.value; saveView(); render(); };
  box.querySelectorAll('.foam [data-k]').forEach(b=>b.onclick=(ev)=>{ ev.stopPropagation(); selD = b.dataset.k; renderKeep = true; render(); });
  box.querySelectorAll('.ref .give').forEach(b=>b.onclick=()=>{ if (!b.classList.contains('done')){ administer(rxOf(b.dataset.k), b); renderKeep = true; refKeep = true; } });
  box.querySelectorAll('.ref .rx [data-r]').forEach(b=>b.onclick=()=>{ const k = selD; api.select(b.dataset.r); selD = k; renderKeep = true; refKeep = true; render(); });
}
let renderKeep = false, refKeep = false;
open = function(k, opt){ if (opt && opt.mode) mode = opt.mode;
  if (typeof k==='string' && drugs()[k]) selD = k;
  if (!openT && curId) openT = performance.now(); render(); box.classList.add('open'); sync(); };
window.DrugBox.open = open; window.DrugBox.select = (k)=>open(k);
window.DrugBox.toggle = ()=> box.classList.contains('open') ? close() : open();
window.DrugBox.render = ()=>{ if (box.classList.contains('open')){ renderKeep = true; refKeep = true; render(); } };
window.DrugBox.useSlot = (id)=>{ slotId = id; mode = 'custom'; saveView(); selD = null; open(); };
const _onR = window.DrugBox.onRhythm;
window.DrugBox.onRhythm = function(id, v){ if (id!==curId && mode==='rhythm') selD = null; _onR.call(this, id, v);
  const c = document.querySelector('#rcard .dbslot button'); if (c) c.onclick = ()=>open(null, {mode:'rhythm'}); };
window.DrugBoxKit = { svg:(k,cls)=>drugSVG(k, drugs()[k], cls||'ico'), look:(k)=>look(k, drugs()[k]), esc, db:()=>DB, cardiacSet, bucket, ICON, roleColor:(r)=>roleOf(r)[1], short };

// ================= Pelican everywhere: every Drug Box button/icon uses the same flat yellow case (ribs · lid seam · black handle/hinges/latches) =================
const css4 = `
.dbbtn .pcase,.dbi .pcase,#dbox .pcase,#dbd .pcase{filter:none}
/* toolbar #tDrug — the case drawing IS the button (square, DRUG/BOX on the face) */
#tools #tDrug{position:relative;flex:none;box-sizing:content-box;width:48px;height:45px;padding:0;margin-top:2px;display:block;border:none;border-radius:4px;
  background:transparent!important;box-shadow:none!important;filter:none;transform:none;cursor:pointer}
#tools #tDrug::before,#tools #tDrug::after{content:none!important}
#tools #tDrug .dbface,#tools #tDrug .dbface .pcase{display:block;width:48px;height:45px}
#tools #tDrug:hover .pcase rect[fill="#f5c400"]{fill:#ffd21a}
#tools #tDrug.on .pcase rect[fill="#f5c400"]{fill:#ffd21a;stroke:#141414;stroke-width:2}
#tools #tDrug:focus-visible{outline:1.5px solid #f5c400;outline-offset:2px}
/* strip header DRUG BOX — flat yellow plate, black type, side ribs */
#strip .hdr .dbbtn{background:#f5c400!important;border:1.5px solid #8f7100!important;color:#141414!important;font-weight:900;letter-spacing:.6px;
  box-shadow:inset 2px 0 0 rgba(255,250,200,.9),inset -2px 0 0 rgba(120,88,0,.7),inset 0 -2px 0 rgba(150,112,0,.35)!important;text-shadow:none}
#strip .hdr .dbbtn:hover{background:#ffd21a!important}
#strip .hdr .dbbtn.on{background:#ffd21a!important;border-color:#141414!important}
#strip .hdr .dbbtn .pcase{width:22px;height:17px}
/* Lab column (rhythm card) slot — a mini Pelican case: black handle + hinges on top, lid seam, black latches, ribs */
#rcard .dbcard,body.rhythm #rcard .dbcard{position:relative;display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:18px 0 6px;padding:15px 12px 9px;
  border-radius:9px;border:2px solid #9a7a00!important;background:#f5c400!important;color:#141414;text-align:left;cursor:pointer;
  box-shadow:inset 4px 0 0 rgba(255,250,200,.95),inset -4px 0 0 rgba(120,88,0,.65),inset 0 -5px 0 rgba(150,112,0,.28)!important}
#rcard .dbcard::before{content:"";position:absolute;left:50%;top:-11px;width:62px;height:11px;margin-left:-31px;box-sizing:border-box;
  border:4px solid #141414;border-bottom:none;border-radius:7px 7px 0 0}
#rcard .dbcard::after{content:"";position:absolute;left:0;right:0;top:9px;height:2px;background:#4a3a00;box-shadow:0 1px 0 rgba(255,250,200,.9)}
#rcard .dbcard .lt{position:absolute;top:3px;width:9px;height:13px;border-radius:2px;background:#141414;z-index:1}
#rcard .dbcard .lt::after{content:"";position:absolute;left:2px;right:2px;top:4px;height:1.5px;background:#3c3c3c}
#rcard .dbcard .lt.l{left:22%} #rcard .dbcard .lt.r{right:22%}
#rcard .dbcard .hg{position:absolute;top:-4px;width:12px;height:5px;border-radius:1.5px;background:#141414;z-index:1}
#rcard .dbcard .hg.l{left:calc(50% - 39px)} #rcard .dbcard .hg.r{right:calc(50% - 39px)}
#rcard .dbcard .pcase{width:38px;height:30px;flex:none}
#rcard .dbcard b{font:900 13px Inter,system-ui,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#141414}
#rcard .dbcard small{display:block;color:#3d3200!important;font-weight:600;font-size:10.5px;margin-top:1px}
#rcard .dbcard:hover{background:#ffd21a!important}
#rcard .dbcard.on{border-color:#141414!important}
/* empty reference pane + designer header use the same case at full strength */
#dbox .ref .empty .pcase{opacity:1;width:76px;height:59px}
`;
{ const s = document.createElement('style'); s.textContent = css4; document.head.appendChild(s); }
document.querySelectorAll('.dbface').forEach(e=>e.innerHTML = ICON_LABEL);
document.querySelectorAll('.dbi').forEach(e=>e.innerHTML = ICON);
})();

// preview/deep-link: #r=svt&db=1&dbd=diltiazem&dbm=module opens with that drug selected / filter
const DBD0 = location.hash;
addEventListener('load', ()=>{ const m = DBD0.match(/dbd=(\w+)/), f = DBD0.match(/dbm=(\w+)/), s = DBD0.match(/dbs=([\w-]+)/);
  if (f || s) setTimeout(()=>{ if (s) window.DrugBox.useSlot(s[1]); else window.DrugBox.open(m?m[1]:null, {mode:f[1]}); }, 450);
  else if (m) setTimeout(()=>window.DrugBox.open(m[1]), 400); });
