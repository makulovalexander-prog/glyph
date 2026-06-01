/* ===== Glyph · Tessera Studio — app logic ===== */

/* ---- palettes & rarities ---- */
const PAL={
  Onyx:{bg1:'#16161A',bg2:'#0A0A0C',ink:'#ECEAE3',soft:'#86847C',line:'#C9A876',chip:'#16161A',ci:'#C9A876'},
  Ivory:{bg1:'#F2EEE4',bg2:'#E2DCCE',ink:'#1B1A17',soft:'#736F64',line:'#9A7B3F',chip:'#E2DCCE',ci:'#7A5E2E'},
  Bordeaux:{bg1:'#26121A',bg2:'#150A0F',ink:'#ECD8C6',soft:'#A98C7A',line:'#C9A172',chip:'#26121A',ci:'#D9B488'},
  Verdant:{bg1:'#16221C',bg2:'#0C140F',ink:'#DDE7DD',soft:'#7E948A',line:'#AEC6A4',chip:'#16221C',ci:'#AEC6A4'},
};
const RARITIES=[
  {id:'common',label:'Common',sym:'●'},
  {id:'holo',label:'Holographic',sym:'◆'},
  {id:'reverse',label:'Reverse Holo',sym:'◈'},
  {id:'prismatic',label:'Prismatic',sym:'✦'},
  {id:'gold',label:'Gold Secret',sym:'★'},
];

/* ===== single source of truth ===== */
function genId(){return 'dsn_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}

function createDesign(overrides){
  return Object.assign({
    id:          genId(),       // unique, generated on creation
    venueName:   'HANUMAN',
    logoDataUrl: null,          // null or a data URL
    eventLine:   'Tasting Menu N° 7',
    location:    'Kreuzberg · Berlin',
    date:        '28 May 2026',
    edition:     'No. 247',
    tagline:     'Not a Trend; A Tradition',
    palette:     'Onyx',        // 'Onyx' | 'Ivory' | 'Bordeaux' | 'Verdant'
    rarity:      'holo',        // 'common' | 'holo' | 'reverse' | 'prismatic' | 'gold'
    updatedAt:   Date.now()
  }, overrides||{});
}

let currentDesign = createDesign();

// the ONLY mutation path: write field(s), stamp updatedAt, re-render.
function update(patch){
  Object.assign(currentDesign, patch);
  currentDesign.updatedAt = Date.now();
  render();
}

/* view-only state (not part of the design) */
let flipped=false;

/* ---- palette vars ---- */
function setVar(k,v){document.documentElement.style.setProperty(k,v);}
function applyPalette(){
  const p=PAL[currentDesign.palette];
  setVar('--p-bg1',p.bg1);setVar('--p-bg2',p.bg2);setVar('--p-ink',p.ink);
  setVar('--p-soft',p.soft);setVar('--p-line',p.line);
}

/* ---- auto-fit: venue name ---- */
function fitName(){
  const el=document.getElementById('o-name');
  if(currentDesign.logoDataUrl){el.style.display='none';return;}
  el.style.display='block';
  const maxW=300*0.80;           // usable width inside the card padding
  let size=52;
  // phase 1: shrink the single-line wordmark down to a sensible floor
  el.style.whiteSpace='nowrap';
  el.style.wordBreak='normal';
  el.style.lineHeight='1';
  el.style.letterSpacing=(el.textContent.length>10?'2px':'5px');
  el.style.fontSize=size+'px';
  let guard=0;
  while(el.scrollWidth>maxW && size>14 && guard<100){size-=1;el.style.fontSize=size+'px';guard++;}
  // phase 2: still too wide → let it wrap (breaking long tokens) to at most 2 lines
  if(el.scrollWidth>maxW){
    el.style.whiteSpace='normal';
    el.style.wordBreak='break-word';
    el.style.lineHeight='1.04';
    el.style.letterSpacing='1px';
    let g2=0;
    while(g2<100 && size>9){
      const lines=Math.round(el.scrollHeight/(size*1.06));
      if(lines<=2) break;
      size-=1;el.style.fontSize=size+'px';g2++;
    }
  }
}

/* ---- auto-fit: event line ---- */
function fitEvent(){
  const el=document.getElementById('o-event');
  const raw=(currentDesign.eventLine||'').trim();
  if(!raw){el.style.display='none';return;}
  el.style.display='block';
  el.textContent=raw.toUpperCase();
  el.style.letterSpacing=(raw.length>34?'0.4px':raw.length>22?'1px':'2px');
  // start one notch below the venue name, then shrink to fit a max of two lines
  const lh=1.25;
  let size=16;
  el.style.fontSize=size+'px';
  let guard=0;
  while(guard<100 && size>8){
    el.style.fontSize=size+'px';
    const lines=Math.round(el.scrollHeight/(size*lh));
    if(lines<=2) break;
    size-=1;guard++;
  }
}

/* ---- security seal: procedural guilloché + microtext ---- */
// FNV-1a hash → deterministic seed from the venue string
function seedFrom(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
// small seeded PRNG (mulberry32)
function rng(seed){
  let a=seed>>>0;
  return function(){
    a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
// overlapping sine-rosette contours (spirograph-style), unique per venue.
// Each concentric ring is phase-twisted so neighbours cross → interwoven net.
function guillochePath(seed){
  const r=rng(seed), cx=37, cy=37;
  const k1=4+Math.floor(r()*5);   // primary lobes 4..8
  const k2=9+Math.floor(r()*9);   // fine harmonic  9..17
  const ph1=r()*Math.PI*2, ph2=r()*Math.PI*2;
  const a=1.0+r()*0.9, b=0.4+r()*0.6;
  const twist=0.35+r()*0.5;
  const steps=180;
  let d='', ring=0;
  for(let R=23.5; R>=8.5; R-=2.1){
    const rot1=ph1+ring*twist, rot2=ph2-ring*twist*0.6;
    for(let i=0;i<=steps;i++){
      const t=i/steps*Math.PI*2;
      const rr=R + a*Math.cos(k1*t+rot1) + b*Math.cos(k2*t+rot2);
      const x=cx+rr*Math.cos(t), y=cy+rr*Math.sin(t);
      d+=(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);
    }
    d+='Z'; ring++;
  }
  return d;
}
function escapeXml(s){return (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

// the visible seal SVG: faint guilloché watermark + hairline microtext ring + emblem
function sealSVG(g,venue,date,p){
  const micro=((venue||'GLYPH')+'   ·   '+(date||'')+'   ·   ').toUpperCase();
  const circ=2*Math.PI*31, charW=3.0*0.6+0.45;
  const reps=Math.max(2,Math.ceil(circ/(micro.length*charW))+1);
  const microText=escapeXml(micro.repeat(reps));
  return `<svg viewBox="0 0 74 74" width="74" height="74">
    <defs>
      <clipPath id="sealclip"><circle cx="37" cy="37" r="25.5"/></clipPath>
      <path id="microring" d="M 37,6 a 31,31 0 1,1 -0.01,0" fill="none"/>
    </defs>
    <g clip-path="url(#sealclip)" fill="none" stroke="${p.line}" stroke-width="0.25" opacity="0.16">
      <path d="${g}"/>
    </g>
    <circle cx="37" cy="37" r="35" fill="none" stroke="${p.line}" stroke-width="0.8" opacity="0.6"/>
    <circle cx="37" cy="37" r="28" fill="none" stroke="${p.line}" stroke-width="0.4" opacity="0.35"/>
    <text font-family="Inter,sans-serif" font-size="3.05" letter-spacing="0.45" fill="${p.line}" opacity="0.5">
      <textPath href="#microring" startOffset="0">${microText}</textPath>
    </text>
    <text x="37" y="44" text-anchor="middle" font-family="'Cormorant Garamond',serif" font-size="20" fill="${p.line}">✦</text>
  </svg>`;
}

// render seal + a holo-masked shimmer layer that catches the same fixed light
function renderSeal(){
  const host=document.getElementById('o-seal');
  const venue=currentDesign.venueName||'';
  const date=currentDesign.date||'';
  const p=PAL[currentDesign.palette];
  const g=guillochePath(seedFrom(venue||'GLYPH'));
  host.innerHTML=sealSVG(g,venue,date,p)+'<div class="seal-shimmer"></div>';
  // mask a moving holo gradient to the guilloché lines only → they shimmer on tilt
  const sh=host.querySelector('.seal-shimmer');
  const maskSvg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 74 74'><path d='"+g+"' fill='none' stroke='#fff' stroke-width='0.6' stroke-linejoin='round'/></svg>";
  const uri="url(\"data:image/svg+xml,"+encodeURIComponent(maskSvg)+"\")";
  sh.style.webkitMaskImage=uri; sh.style.maskImage=uri;
}

/* ===== render: reads ONLY from currentDesign, never the DOM inputs ===== */
function render(){
  const d=currentDesign;
  applyPalette();
  document.getElementById('o-name').textContent=(d.venueName||' ').toUpperCase();
  const locEl=document.getElementById('o-loc');
  locEl.textContent=(d.location||'').toUpperCase();
  locEl.style.letterSpacing=(locEl.textContent.length>24?'1.5px':'4px');
  document.getElementById('o-date').textContent=(d.date||'').toUpperCase();
  document.getElementById('o-edition').textContent=d.edition||'';
  document.getElementById('o-tag').textContent=d.tagline||'';
  renderSeal();
  const rsym=document.getElementById('o-rsym');
  rsym.textContent=RARITIES.find(r=>r.id===d.rarity).sym;
  rsym.style.color=PAL[d.palette].line;
  const logo=document.getElementById('o-logo');
  if(d.logoDataUrl){logo.src=d.logoDataUrl;logo.style.display='block';document.getElementById('o-name').style.display='none';}
  else{logo.style.display='none';}
  document.getElementById('card').setAttribute('data-rarity',d.rarity);
  fitName();
  fitEvent();
}

/* ===== controls → currentDesign (each writes its value, then render() via update) ===== */

/* text inputs: id → design field */
const FIELD_MAP={venue:'venueName',event:'eventLine',loc:'location',date:'date',edition:'edition',tag:'tagline'};
Object.entries(FIELD_MAP).forEach(([id,key])=>{
  document.getElementById(id).addEventListener('input',e=>update({[key]:e.target.value}));
});

/* logo upload */
const logoInput=document.getElementById('logoInput');
const logoStatus=document.getElementById('logoStatus');
const logoName=document.getElementById('logoName');
logoInput.onchange=async function(e){
  const f=e.target.files[0];if(!f)return;
  try{
    const dataUrl=await processLogo(f);   // resize ≤400px longest edge + re-encode (WebP→PNG)
    logoStatus.style.display='flex';logoName.textContent=f.name;
    update({logoDataUrl:dataUrl});
  }catch(err){
    toast('Could not process that image.');
  }
};
function clearLogo(){logoInput.value='';logoStatus.style.display='none';update({logoDataUrl:null});}

/* palette chips */
const tc=document.getElementById('themes');
Object.keys(PAL).forEach(name=>{
  const p=PAL[name];const d=document.createElement('div');
  d.className='chip'+(name===currentDesign.palette?' sel':'');
  d.style.background=p.chip;d.style.color=p.ci;d.style.border='0.5px solid '+p.line+'66';
  d.textContent=name;d.dataset.name=name;
  d.onclick=()=>{update({palette:name});syncChipsFromState();};
  tc.appendChild(d);
});

/* rarity chips */
const rc=document.getElementById('rarities');
RARITIES.forEach(r=>{
  const d=document.createElement('div');
  d.className='rchip'+(r.id===currentDesign.rarity?' sel':'');
  d.dataset.id=r.id;
  d.innerHTML=`<span class="sym">${r.sym}</span> ${r.label}`;
  d.onclick=()=>{update({rarity:r.id});syncChipsFromState();};
  rc.appendChild(d);
});

/* ===== logo processing: resize to ≤400px longest edge + re-encode ===== */
function readFileAsDataURL(file){
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});
}
function loadImage(src){
  return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=rej;img.src=src;});
}
async function processLogo(file){
  const img=await loadImage(await readFileAsDataURL(file));
  const max=400;
  let w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
  if(Math.max(w,h)>max){const s=max/Math.max(w,h);w=Math.max(1,Math.round(w*s));h=Math.max(1,Math.round(h*s));}
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(img,0,0,w,h);          // preserves alpha
  let out=canvas.toDataURL('image/webp',0.9);              // WebP if supported…
  if(out.slice(0,15)!=='data:image/webp') out=canvas.toDataURL('image/png'); // …else PNG
  return out;
}

/* ===== persistence: saved-designs library (localStorage) ===== */
const STORE_KEY='glyph.designs.v1';

function loadStore(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    const arr=raw?JSON.parse(raw):[];
    return Array.isArray(arr)?arr:[];
  }catch(e){ return []; }                                   // unavailable/corrupt → empty
}
function writeStore(arr){
  try{
    localStorage.setItem(STORE_KEY,JSON.stringify(arr));
    return true;
  }catch(e){
    const quota=e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014);
    toast(quota?'Storage full — delete a saved design and try again.':'Could not save — storage unavailable.');
    return false;
  }
}
function labelFor(d){return (d&&d.venueName&&d.venueName.trim())?d.venueName.trim():'Untitled';}
function fmtDate(ts){
  if(!ts)return '';
  const d=new Date(ts);
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}

/* upsert the current design by id */
function saveCurrent(){
  const store=loadStore();
  currentDesign.updatedAt=Date.now();
  const snap=Object.assign({},currentDesign);
  const i=store.findIndex(d=>d.id===snap.id);
  if(i>=0) store[i]=snap; else store.push(snap);
  if(writeStore(store)){ toast(labelFor(snap)+' saved'); renderLibrary(); }
}
/* restore a stored design into currentDesign + the editor */
function loadDesign(id){
  const found=loadStore().find(d=>d.id===id);
  if(!found){ toast('That design is no longer there.'); renderLibrary(); return; }
  currentDesign=Object.assign(createDesign(),found);        // fill any missing fields, keep saved id
  syncInputsFromState(); syncChipsFromState(); render(); renderLibrary();
  toast(labelFor(currentDesign)+' loaded');
}
/* clear to a blank design with a fresh id */
function newDesign(){
  currentDesign=createDesign({venueName:'',eventLine:'',location:'',date:'',edition:'',tagline:'',logoDataUrl:null,palette:'Onyx',rarity:'common'});
  syncInputsFromState(); syncChipsFromState(); render(); renderLibrary();
  toast('New blank design');
}
function deleteDesign(id){
  const store=loadStore().filter(d=>d.id!==id);
  if(writeStore(store)){ renderLibrary(); toast('Deleted'); }
}

/* push state → editor inputs (used by load / new) */
function syncInputsFromState(){
  Object.entries(FIELD_MAP).forEach(([id,key])=>{document.getElementById(id).value=currentDesign[key]??'';});
  if(currentDesign.logoDataUrl){logoStatus.style.display='flex';logoName.textContent='Logo attached';}
  else{logoStatus.style.display='none';logoInput.value='';}
}
/* push state → palette/rarity chip selection */
function syncChipsFromState(){
  [...tc.children].forEach(c=>c.classList.toggle('sel',c.dataset.name===currentDesign.palette));
  [...rc.children].forEach(c=>c.classList.toggle('sel',c.dataset.id===currentDesign.rarity));
}

/* render the saved-designs list */
function renderLibrary(){
  const list=document.getElementById('designList');
  const store=loadStore().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  list.innerHTML='';
  if(!store.length){
    const e=document.createElement('div');e.className='lib-empty';e.textContent='No saved designs yet.';
    list.appendChild(e);return;
  }
  store.forEach(d=>{
    const item=document.createElement('div');
    item.className='design-item'+(d.id===currentDesign.id?' active':'');
    const meta=document.createElement('span');meta.className='meta';
    const nm=document.createElement('span');nm.className='nm';nm.textContent=labelFor(d);
    const dt=document.createElement('span');dt.className='dt';dt.textContent=fmtDate(d.updatedAt);
    meta.append(nm,dt);
    const del=document.createElement('button');del.className='del';del.title='Delete';del.textContent='✕';
    item.append(meta,del);
    item.addEventListener('click',()=>loadDesign(d.id));
    del.addEventListener('click',e=>{e.stopPropagation();deleteDesign(d.id);});
    list.appendChild(item);
  });
}

/* small transient message */
let toastTimer=null;
function toast(msg){
  let el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);}
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}

/* ===== 3D interaction (view-only, independent of the design) ===== */
const card=document.getElementById('card');
const scene=document.getElementById('scene');
let dragging=false;
function pointTo(clientX,clientY){
  const r=scene.getBoundingClientRect();
  const px=Math.max(0,Math.min(1,(clientX-r.left)/r.width));
  const py=Math.max(0,Math.min(1,(clientY-r.top)/r.height));
  const ry=(px-0.5)*46 + (flipped?180:0);
  const rx=-(py-0.5)*46;
  card.style.setProperty('--ry',ry+'deg');
  card.style.setProperty('--rx',rx+'deg');
  card.style.setProperty('--mx',(px*100)+'%');
  card.style.setProperty('--my',(py*100)+'%');
  card.style.setProperty('--glare',0.55);
}
scene.addEventListener('pointerdown',e=>{dragging=true;scene.setPointerCapture(e.pointerId);pointTo(e.clientX,e.clientY);});
scene.addEventListener('pointermove',e=>{if(dragging)pointTo(e.clientX,e.clientY);});
scene.addEventListener('pointerup',()=>{dragging=false;resetView();});
scene.addEventListener('pointercancel',()=>{dragging=false;resetView();});
// gentle hover tilt on desktop (non-drag)
scene.addEventListener('mousemove',e=>{if(!dragging && matchMedia('(hover:hover)').matches)pointTo(e.clientX,e.clientY);});
scene.addEventListener('mouseleave',()=>{if(!dragging)resetView();});

function resetView(){
  card.style.setProperty('--rx','8deg');
  card.style.setProperty('--ry',(flipped?194:-14)+'deg');
  card.style.setProperty('--glare',0.22);
}
function flip(){flipped=!flipped;resetView();}
window.resetView=resetView;window.flip=flip;window.clearLogo=clearLogo;
window.saveCurrent=saveCurrent;window.newDesign=newDesign;

/* ===== boot ===== */
syncInputsFromState();
syncChipsFromState();
renderLibrary();
render();resetView();
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{fitName();fitEvent();});}
