/* ===== Glyph Studio — Tessera platform ===== */

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

/* ===== single source of truth (the design currently in the editor) ===== */
function genId(){return 'dsn_'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}

function createDesign(overrides){
  return Object.assign({
    id:          genId(),
    venueName:   'HANUMAN',
    logoDataUrl: null,
    eventLine:   'Tasting Menu N° 7',
    location:    'Kreuzberg · Berlin',
    date:        '28 May 2026',
    edition:     'No. 247',
    tagline:     'Not a Trend; A Tradition',
    palette:     'Onyx',
    rarity:      'holo',
    updatedAt:   Date.now()
  }, overrides||{});
}
let currentDesign = createDesign();

// the ONLY mutation path for editor field edits: write, stamp, repaint editor card.
function update(patch){
  Object.assign(currentDesign, patch);
  currentDesign.updatedAt = Date.now();
  paintEditor();
}

/* module-level DOM refs (assigned in boot) */
let editorCard, editorScene, editorCtl, logoInput, logoStatus, logoName, tc, rc;

/* ===== card template — shared by editor, gallery thumbnails, and focus ===== */
// holo:false → omit the GPU-heavy mix-blend layers (thumbnails).  back:false → front only.
function cardMarkup(opts){
  opts=opts||{};
  const holo=opts.holo!==false, back=opts.back!==false;
  const holoFront=holo?`
      <div class="holo holo-rainbow"></div>
      <div class="holo holo-prism"></div>
      <div class="holo holo-gold"></div>
      <div class="holo holo-sparkle"></div>
      <div class="holo holo-glare"></div>`:'';
  const front=`
    <div class="face front">
      <div class="f-tex"></div>
      <div class="f-matte"></div>
      <div class="f-frame"></div>
      <div class="f-frame2"></div>
      <div class="f-top">
        <span class="f-presence">Tessera</span>
        <span class="f-edition o-edition"></span>
      </div>
      <div class="f-rule"></div>
      <div class="f-hero">
        <img class="f-logo o-logo" style="display:none" alt=""/>
        <div class="f-namewrap">
          <div class="f-name o-name"></div>
          <div class="f-event o-event"></div>
        </div>
      </div>
      <div class="f-loc o-loc"></div>
      <div class="f-rule"></div>
      <div class="f-seal o-seal"></div>
      <div class="f-date o-date"></div>
      <div class="f-tag o-tag"></div>
      <div class="f-rarity o-rsym"></div>${holoFront}
    </div>`;
  const backFace=back?`
    <div class="face back">
      <div class="b-guilloche"></div>
      <div class="b-frame"></div>
      <div class="b-emblem"><span>✦</span></div>
      <div class="b-word">GLYPH</div>
      <div class="b-sub">Verified Presence</div>
      <div class="b-foot">Collect the real world · Berlin</div>${holo?`
      <div class="holo holo-rainbow"></div>
      <div class="holo holo-sparkle"></div>
      <div class="holo holo-glare"></div>`:''}
    </div>`:'';
  return front+backFace;
}

/* paint a design into a .card element. opts.holo controls the seal shimmer too. */
function paintCard(cardEl, d, opts){
  opts=opts||{};
  const p=PAL[d.palette]||PAL.Onyx;
  cardEl.style.setProperty('--p-bg1',p.bg1);
  cardEl.style.setProperty('--p-bg2',p.bg2);
  cardEl.style.setProperty('--p-ink',p.ink);
  cardEl.style.setProperty('--p-soft',p.soft);
  cardEl.style.setProperty('--p-line',p.line);
  cardEl.setAttribute('data-rarity', d.rarity||'common');
  const q=s=>cardEl.querySelector(s);
  q('.o-edition').textContent=d.edition||'';
  const locEl=q('.o-loc');
  locEl.textContent=(d.location||'').toUpperCase();
  locEl.style.letterSpacing=((d.location||'').length>24?'1.5px':'4px');
  q('.o-date').textContent=(d.date||'').toUpperCase();
  q('.o-tag').textContent=d.tagline||'';
  const nameEl=q('.o-name');
  nameEl.textContent=(d.venueName||' ').toUpperCase();
  const rsym=q('.o-rsym');
  rsym.textContent=(RARITIES.find(r=>r.id===d.rarity)||RARITIES[0]).sym;
  rsym.style.color=p.line;
  const logo=q('.o-logo');
  if(d.logoDataUrl){logo.src=d.logoDataUrl;logo.style.display='block';nameEl.style.display='none';}
  else{logo.style.display='none';nameEl.style.display='';}
  renderSealInto(q('.o-seal'), d, !!opts.holo);
  fitNameIn(cardEl, d);
  fitEventIn(cardEl, d);
}

function paintEditor(){ paintCard(editorCard, currentDesign, {holo:true}); }

/* ---- auto-fit: venue name (scoped to a card) ---- */
function fitNameIn(cardEl, d){
  const el=cardEl.querySelector('.o-name');
  if(d.logoDataUrl){el.style.display='none';return;}
  el.style.display='block';
  const maxW=300*0.80;
  let size=52;
  el.style.whiteSpace='nowrap';el.style.wordBreak='normal';el.style.lineHeight='1';
  el.style.letterSpacing=(el.textContent.length>10?'2px':'5px');
  el.style.fontSize=size+'px';
  let guard=0;
  while(el.scrollWidth>maxW && size>14 && guard<100){size-=1;el.style.fontSize=size+'px';guard++;}
  if(el.scrollWidth>maxW){
    el.style.whiteSpace='normal';el.style.wordBreak='break-word';el.style.lineHeight='1.04';el.style.letterSpacing='1px';
    let g2=0;
    while(g2<100 && size>9){const lines=Math.round(el.scrollHeight/(size*1.06));if(lines<=2)break;size-=1;el.style.fontSize=size+'px';g2++;}
  }
}
/* ---- auto-fit: event line (scoped to a card) ---- */
function fitEventIn(cardEl, d){
  const el=cardEl.querySelector('.o-event');
  const raw=(d.eventLine||'').trim();
  if(!raw){el.style.display='none';return;}
  el.style.display='block';
  el.textContent=raw.toUpperCase();
  el.style.letterSpacing=(raw.length>34?'0.4px':raw.length>22?'1px':'2px');
  const lh=1.25;
  let size=16;
  el.style.fontSize=size+'px';
  let guard=0;
  while(guard<100 && size>8){el.style.fontSize=size+'px';const lines=Math.round(el.scrollHeight/(size*lh));if(lines<=2)break;size-=1;guard++;}
}

/* ===== security seal: procedural guilloché + microtext ===== */
function seedFrom(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function rng(seed){
  let a=seed>>>0;
  return function(){
    a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function guillochePath(seed){
  const r=rng(seed), cx=37, cy=37;
  const k1=4+Math.floor(r()*5);
  const k2=9+Math.floor(r()*9);
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
// withShimmer adds the holo-masked layer (skip it for static thumbnails)
function renderSealInto(host, d, withShimmer){
  const venue=d.venueName||'', date=d.date||'', p=PAL[d.palette]||PAL.Onyx;
  const g=guillochePath(seedFrom(venue||'GLYPH'));
  host.innerHTML=sealSVG(g,venue,date,p)+(withShimmer?'<div class="seal-shimmer"></div>':'');
  if(withShimmer){
    const sh=host.querySelector('.seal-shimmer');
    const maskSvg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 74 74'><path d='"+g+"' fill='none' stroke='#fff' stroke-width='0.6' stroke-linejoin='round'/></svg>";
    const uri="url(\"data:image/svg+xml,"+encodeURIComponent(maskSvg)+"\")";
    sh.style.webkitMaskImage=uri; sh.style.maskImage=uri;
  }
}

/* ===== 3D interaction — attached per interactive card (editor + focus only) ===== */
function attachInteraction(cardEl, sceneEl){
  let flipped=false, dragging=false;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  function pointTo(cx,cy){
    const r=sceneEl.getBoundingClientRect();
    const px=clamp01((cx-r.left)/r.width), py=clamp01((cy-r.top)/r.height);
    cardEl.style.setProperty('--ry',((px-0.5)*46+(flipped?180:0))+'deg');
    cardEl.style.setProperty('--rx',(-(py-0.5)*46)+'deg');
    cardEl.style.setProperty('--mx',(px*100)+'%');
    cardEl.style.setProperty('--my',(py*100)+'%');
    cardEl.style.setProperty('--glare',0.55);
  }
  function reset(){
    cardEl.style.setProperty('--rx','8deg');
    cardEl.style.setProperty('--ry',(flipped?194:-14)+'deg');
    cardEl.style.setProperty('--glare',0.22);
  }
  sceneEl.addEventListener('pointerdown',e=>{dragging=true;sceneEl.setPointerCapture(e.pointerId);pointTo(e.clientX,e.clientY);});
  sceneEl.addEventListener('pointermove',e=>{if(dragging)pointTo(e.clientX,e.clientY);});
  sceneEl.addEventListener('pointerup',()=>{dragging=false;reset();});
  sceneEl.addEventListener('pointercancel',()=>{dragging=false;reset();});
  sceneEl.addEventListener('mousemove',e=>{if(!dragging && matchMedia('(hover:hover)').matches)pointTo(e.clientX,e.clientY);});
  sceneEl.addEventListener('mouseleave',()=>{if(!dragging)reset();});
  reset();
  return {flip(){flipped=!flipped;reset();}, reset};
}

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
  canvas.getContext('2d').drawImage(img,0,0,w,h);
  let out=canvas.toDataURL('image/webp',0.9);
  if(out.slice(0,15)!=='data:image/webp') out=canvas.toDataURL('image/png');
  return out;
}

/* ===== persistence: saved-designs store (localStorage) ===== */
const STORE_KEY='glyph.designs.v1';
function loadStore(){
  try{const raw=localStorage.getItem(STORE_KEY);const arr=raw?JSON.parse(raw):[];return Array.isArray(arr)?arr:[];}
  catch(e){ return []; }
}
function writeStore(arr){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(arr));return true;}
  catch(e){
    const quota=e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014);
    toast(quota?'Storage full — delete a venue and try again.':'Could not save — storage unavailable.');
    return false;
  }
}
function labelFor(d){return (d&&d.venueName&&d.venueName.trim())?d.venueName.trim():'Untitled';}

/* upsert the current editor design */
function saveCurrent(){
  const store=loadStore();
  currentDesign.updatedAt=Date.now();
  const snap=Object.assign({},currentDesign);
  const i=store.findIndex(d=>d.id===snap.id);
  if(i>=0) store[i]=snap; else store.push(snap);
  if(writeStore(store)){ toast(labelFor(snap)+' saved'); refreshStoreUI(); }
}
/* restore a stored design into the editor */
function loadDesign(id){
  const found=loadStore().find(d=>d.id===id);
  if(!found){ toast('That venue is no longer there.'); refreshStoreUI(); return; }
  currentDesign=Object.assign(createDesign(),found);
  syncInputsFromState(); syncChipsFromState(); paintEditor();
  setView('editor');
  toast(labelFor(currentDesign)+' opened');
}
/* clear to a blank design with a fresh id */
function newDesign(){
  currentDesign=createDesign({venueName:'',eventLine:'',location:'',date:'',edition:'',tagline:'',logoDataUrl:null,palette:'Onyx',rarity:'common'});
  syncInputsFromState(); syncChipsFromState(); paintEditor();
  setView('editor');
  toast('New blank design');
}
/* duplicate a stored design under a new id */
function duplicateDesign(id){
  const d=loadStore().find(x=>x.id===id); if(!d) return;
  const copy=Object.assign({},d,{id:genId(),updatedAt:Date.now(),venueName:labelFor(d)+' copy'});
  const store=loadStore(); store.push(copy);
  if(writeStore(store)){ refreshStoreUI(); toast('Duplicated'); }
}
function deleteDesign(id){
  const store=loadStore().filter(d=>d.id!==id);
  if(writeStore(store)){ refreshStoreUI(); toast('Deleted'); }
}

/* push state → editor inputs / chips (used by load / new) */
function syncInputsFromState(){
  const F={venue:'venueName',event:'eventLine',loc:'location',date:'date',edition:'edition',tag:'tagline'};
  Object.entries(F).forEach(([id,key])=>{document.getElementById(id).value=currentDesign[key]??'';});
  if(currentDesign.logoDataUrl){logoStatus.style.display='flex';logoName.textContent='Logo attached';}
  else{logoStatus.style.display='none';logoInput.value='';}
}
function syncChipsFromState(){
  [...tc.children].forEach(c=>c.classList.toggle('sel',c.dataset.name===currentDesign.palette));
  [...rc.children].forEach(c=>c.classList.toggle('sel',c.dataset.id===currentDesign.rarity));
}

/* ===== views & header count ===== */
let currentView='editor';
function setView(name){
  currentView=name;
  document.getElementById('editorView').hidden = name!=='editor';
  document.getElementById('galleryView').hidden = name!=='gallery';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===name));
  if(name==='gallery') renderGallery();
}
function updateCount(){
  const n=loadStore().length;
  document.getElementById('venueCount').textContent = n+' '+(n===1?'venue':'venues');
}
function refreshStoreUI(){ updateCount(); if(currentView==='gallery') renderGallery(); }

/* ===== gallery (lightweight static thumbnails) ===== */
function renderGallery(){
  updateCount();
  const grid=document.getElementById('galleryGrid');
  const empty=document.getElementById('galleryEmpty');
  const store=loadStore().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  grid.innerHTML='';
  empty.hidden = store.length>0;
  const pending=[];
  store.forEach(d=>{ const {tile,card}=makeTile(d); grid.appendChild(tile); pending.push([card,d]); });
  // paint after they're in the (now visible) DOM so auto-fit can measure
  pending.forEach(([card,d])=>paintCard(card,d,{holo:false}));
}
function makeTile(d){
  const tile=document.createElement('div');
  tile.className='tile'+(d.id===currentDesign.id?' current':'');

  const thumb=document.createElement('button');
  thumb.className='thumb'; thumb.title='Open in 3D';
  const card=document.createElement('div');
  card.className='card thumb-card';
  card.innerHTML=cardMarkup({holo:false,back:false});   // static front face only
  thumb.appendChild(card);
  thumb.addEventListener('click',()=>openFocus(d.id));

  const meta=document.createElement('div'); meta.className='tile-meta';
  const nm=document.createElement('span'); nm.className='tile-name'; nm.textContent=labelFor(d);
  const R=RARITIES.find(r=>r.id===d.rarity)||RARITIES[0];
  const sym=document.createElement('span'); sym.className='tile-sym'; sym.textContent=R.sym; sym.title=R.label;
  sym.style.color=(PAL[d.palette]||PAL.Onyx).line;
  meta.append(nm,sym);

  const actions=document.createElement('div'); actions.className='tile-actions';
  actions.append(
    mkBtn('Open','tile-btn',()=>loadDesign(d.id)),
    mkBtn('Duplicate','tile-btn',()=>duplicateDesign(d.id)),
    mkBtn('Delete','tile-btn danger',()=>confirmDelete(tile,d.id))
  );

  tile.append(thumb,meta,actions);
  return {tile,card};
}
function mkBtn(label,cls,onClick){
  const b=document.createElement('button'); b.className=cls; b.textContent=label;
  b.addEventListener('click',e=>{e.stopPropagation();onClick();});
  return b;
}
function confirmDelete(tile,id){
  const actions=tile.querySelector('.tile-actions');
  actions.classList.add('confirming');
  actions.innerHTML='';
  const msg=document.createElement('span'); msg.className='confirm-msg'; msg.textContent='Delete?';
  actions.append(
    msg,
    mkBtn('Yes','tile-btn danger',()=>deleteDesign(id)),
    mkBtn('No','tile-btn',()=>renderGallery())
  );
}

/* ===== focus: one full-3D holographic card at a time ===== */
let focusCtl=null, focusId=null;
function openFocus(id){
  const d=loadStore().find(x=>x.id===id); if(!d) return;
  focusId=id;
  const scene=document.getElementById('focusScene');
  scene.innerHTML='<div class="card" id="focusCard"></div>';
  const card=document.getElementById('focusCard');
  card.innerHTML=cardMarkup({holo:true});
  document.getElementById('focusName').textContent=labelFor(d);
  document.getElementById('focusOverlay').hidden=false;   // visible BEFORE paint so fit measures
  paintCard(card, d, {holo:true});
  focusCtl=attachInteraction(card, scene);
}
function closeFocus(){
  document.getElementById('focusOverlay').hidden=true;
  document.getElementById('focusScene').innerHTML='';     // unmount → drop the holo layers
  focusCtl=null; focusId=null;
}

/* ===== transient toast ===== */
let toastTimer=null;
function toast(msg){
  let el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);}
  el.textContent=msg;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);
}

function clearLogo(){logoInput.value='';logoStatus.style.display='none';update({logoDataUrl:null});}

/* expose handlers used by inline HTML */
window.clearLogo=clearLogo;window.saveCurrent=saveCurrent;window.newDesign=newDesign;
window.flip=()=>editorCtl&&editorCtl.flip();
window.resetView=()=>editorCtl&&editorCtl.reset();

/* ===== boot ===== */
(function boot(){
  // editor card
  editorScene=document.getElementById('scene');
  editorScene.innerHTML='<div class="card" id="card"></div>';
  editorCard=document.getElementById('card');
  editorCard.innerHTML=cardMarkup({holo:true});
  editorCtl=attachInteraction(editorCard, editorScene);

  // text inputs → state
  const F={venue:'venueName',event:'eventLine',loc:'location',date:'date',edition:'edition',tag:'tagline'};
  Object.entries(F).forEach(([id,key])=>{
    document.getElementById(id).addEventListener('input',e=>update({[key]:e.target.value}));
  });

  // logo upload
  logoInput=document.getElementById('logoInput');
  logoStatus=document.getElementById('logoStatus');
  logoName=document.getElementById('logoName');
  logoInput.onchange=async function(e){
    const f=e.target.files[0];if(!f)return;
    try{
      const dataUrl=await processLogo(f);
      logoStatus.style.display='flex';logoName.textContent=f.name;
      update({logoDataUrl:dataUrl});
    }catch(err){ toast('Could not process that image.'); }
  };

  // palette chips
  tc=document.getElementById('themes');
  Object.keys(PAL).forEach(name=>{
    const p=PAL[name];const d=document.createElement('div');
    d.className='chip'+(name===currentDesign.palette?' sel':'');
    d.style.background=p.chip;d.style.color=p.ci;d.style.border='0.5px solid '+p.line+'66';
    d.textContent=name;d.dataset.name=name;
    d.onclick=()=>{update({palette:name});syncChipsFromState();};
    tc.appendChild(d);
  });
  // rarity chips
  rc=document.getElementById('rarities');
  RARITIES.forEach(r=>{
    const d=document.createElement('div');
    d.className='rchip'+(r.id===currentDesign.rarity?' sel':'');
    d.dataset.id=r.id;
    d.innerHTML=`<span class="sym">${r.sym}</span> ${r.label}`;
    d.onclick=()=>{update({rarity:r.id});syncChipsFromState();};
    rc.appendChild(d);
  });

  // tabs
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>setView(t.dataset.view)));

  // focus overlay controls
  document.getElementById('focusClose').addEventListener('click',closeFocus);
  document.getElementById('focusFlip').addEventListener('click',()=>focusCtl&&focusCtl.flip());
  document.getElementById('focusOpen').addEventListener('click',()=>{ if(focusId){const id=focusId;closeFocus();loadDesign(id);} });
  document.getElementById('focusOverlay').addEventListener('click',e=>{ if(e.target.id==='focusOverlay') closeFocus(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape' && !document.getElementById('focusOverlay').hidden) closeFocus(); });

  // initial paint
  syncInputsFromState();
  syncChipsFromState();
  updateCount();
  paintEditor();
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{fitNameIn(editorCard,currentDesign);fitEventIn(editorCard,currentDesign);});}
})();
