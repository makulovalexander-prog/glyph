/* ===== Glyph Studio — Tessera platform ===== */

/* ===== themes: a venue's full visual identity (data → one engine renders it) =====
   A theme defines colour roles, typefaces, background treatment, frame style,
   whether the hero-art slot is active, and which rarity treatments are enabled.
   Presets are starting points; each design embeds its own (editable) theme copy. */
const SERIF="'Cormorant Garamond',Georgia,serif", SANS="'Inter',system-ui,sans-serif";
const ALLR=['common','holo','reverse','prismatic','gold'];
const THEME_PRESETS={
  hanuman:{ preset:'hanuman', name:'Hanuman',
    colors:{bg:'#FFD400',surface:'#F2B500',ink:'#1A1206',soft:'#7A2A12',accent:'#E4002B',accent2:'#1A1206',line:'#1A1206'},
    fonts:{display:"'Anton','Inter Tight',sans-serif",body:SANS,tagStyle:'normal'},
    background:'halftone', frame:{weight:3,radius:6,frameless:false}, heroArt:true,
    rarities:['common','holo','prismatic','gold'] },
  bandol:{ preset:'bandol', name:'Bandol',
    colors:{bg:'#F4F1EA',surface:'#ECE7DB',ink:'#1B1A17',soft:'#5C5849',accent:'#8C6E33',accent2:'#9A7B3F',line:'#CBBBA1'},
    fonts:{display:SERIF,body:SANS,tagStyle:'italic'},
    background:'solid', frame:{weight:0.5,radius:3,frameless:false}, heroArt:false,
    rarities:['common','holo'] },
  onyx:{ preset:'onyx', name:'Onyx',
    colors:{bg:'#16161A',surface:'#0A0A0C',ink:'#ECEAE3',soft:'#86847C',accent:'#C9A876',accent2:'#C9A876',line:'#C9A876'},
    fonts:{display:SERIF,body:SANS,tagStyle:'italic'},
    background:'gradient', frame:{weight:1,radius:11,frameless:false}, heroArt:false, rarities:ALLR },
  ivory:{ preset:'ivory', name:'Ivory',
    colors:{bg:'#F2EEE4',surface:'#E2DCCE',ink:'#1B1A17',soft:'#5C5849',accent:'#8C6E33',accent2:'#9A7B3F',line:'#8C6E33'},
    fonts:{display:SERIF,body:SANS,tagStyle:'italic'},
    background:'gradient', frame:{weight:1,radius:11,frameless:false}, heroArt:false, rarities:ALLR },
  bordeaux:{ preset:'bordeaux', name:'Bordeaux',
    colors:{bg:'#26121A',surface:'#150A0F',ink:'#ECD8C6',soft:'#A98C7A',accent:'#C9A172',accent2:'#D9B488',line:'#C9A172'},
    fonts:{display:SERIF,body:SANS,tagStyle:'italic'},
    background:'gradient', frame:{weight:1,radius:11,frameless:false}, heroArt:false, rarities:ALLR },
  verdant:{ preset:'verdant', name:'Verdant',
    colors:{bg:'#16221C',surface:'#0C140F',ink:'#DDE7DD',soft:'#7E948A',accent:'#AEC6A4',accent2:'#AEC6A4',line:'#AEC6A4'},
    fonts:{display:SERIF,body:SANS,tagStyle:'italic'},
    background:'gradient', frame:{weight:1,radius:11,frameless:false}, heroArt:false, rarities:ALLR },
};
const THEME_ORDER=['hanuman','bandol','onyx','ivory','bordeaux','verdant'];
function themeCopy(id){ return JSON.parse(JSON.stringify(THEME_PRESETS[id]||THEME_PRESETS.onyx)); }
function paletteToPreset(pal){ return ({Onyx:'onyx',Ivory:'ivory',Bordeaux:'bordeaux',Verdant:'verdant'})[pal]||'onyx'; }
// resolve a design's theme (migrating legacy `palette` strings on the fly)
function getTheme(d){
  if(d && d.theme && d.theme.colors) return d.theme;
  if(d && typeof d.palette==='string') return themeCopy(paletteToPreset(d.palette));
  return themeCopy('onyx');
}

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
    heroArtUrl:  null,             // optional central illustration (above bg, below text)
    eventLine:   'Tasting Menu N° 7',
    location:    'Kreuzberg · Berlin',
    date:        '28 May 2026',
    edition:     'No. 247',
    tagline:     'Not a Trend; A Tradition',
    theme:       themeCopy('onyx'),
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
let editorCard, editorScene, editorCtl, logoInput, logoStatus, logoName, heroInput, heroStatus, heroName, tc, rc;

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
      <div class="f-hero-art"><img class="o-hero" alt=""/></div>
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
  const t=getTheme(d), c=t.colors;
  // colour roles → CSS vars (the front-face CSS reads these)
  cardEl.style.setProperty('--p-bg1',c.bg);
  cardEl.style.setProperty('--p-bg2',c.surface||c.bg);
  cardEl.style.setProperty('--p-ink',c.ink);
  cardEl.style.setProperty('--p-soft',c.soft);
  cardEl.style.setProperty('--p-line',c.line);
  cardEl.style.setProperty('--p-accent',c.accent||c.line);
  cardEl.style.setProperty('--p-accent2',c.accent2||c.accent||c.line);
  // typefaces
  cardEl.style.setProperty('--p-display',t.fonts.display||SERIF);
  cardEl.style.setProperty('--p-body',t.fonts.body||SANS);
  cardEl.style.setProperty('--p-tag-style',t.fonts.tagStyle||'italic');
  // frame
  cardEl.style.setProperty('--p-frame-w',(t.frame.frameless?0:(t.frame.weight||1))+'px');
  cardEl.style.setProperty('--p-frame-r',(t.frame.radius!=null?t.frame.radius:11)+'px');
  cardEl.setAttribute('data-bg', t.background||'gradient');
  cardEl.toggleAttribute('data-frameless', !!t.frame.frameless);
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
  rsym.style.color=c.accent||c.line;
  // logo (broken → wordmark fallback)
  const logo=q('.o-logo');
  if(d.logoDataUrl){
    logo.onerror=()=>{ logo.onerror=null; logo.removeAttribute('src'); logo.style.display='none'; nameEl.style.display=''; fitNameIn(cardEl, Object.assign({},d,{logoDataUrl:null})); };
    logo.src=d.logoDataUrl; logo.style.display='block'; nameEl.style.display='none';
  }else{ logo.onerror=null; logo.style.display='none'; nameEl.style.display=''; }
  // hero art (only when the theme enables the slot AND an image is set)
  const hero=q('.o-hero'), heroWrap=q('.f-hero-art');
  if(t.heroArt && d.heroArtUrl){
    hero.onerror=()=>{ hero.onerror=null; hero.removeAttribute('src'); heroWrap.style.display='none'; };
    hero.src=d.heroArtUrl; heroWrap.style.display='';
  }else{ hero.onerror=null; hero.removeAttribute('src'); heroWrap.style.display='none'; }
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
  // hierarchy invariant: the event line is never larger than the venue name (fitNameIn ran first)
  let size=16;
  if(!d.logoDataUrl){
    const ns=parseFloat(cardEl.querySelector('.o-name').style.fontSize)||52;
    size=Math.min(16, Math.max(8, Math.round(ns)-2));
  }
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
function sealSVG(g,venue,date,col){
  const micro=((venue||'GLYPH')+'   ·   '+(date||'')+'   ·   ').toUpperCase();
  const circ=2*Math.PI*31, charW=3.0*0.6+0.45;
  const reps=Math.max(2,Math.ceil(circ/(micro.length*charW))+1);
  const microText=escapeXml(micro.repeat(reps));
  return `<svg viewBox="0 0 74 74" width="74" height="74">
    <defs>
      <clipPath id="sealclip"><circle cx="37" cy="37" r="25.5"/></clipPath>
      <path id="microring" d="M 37,6 a 31,31 0 1,1 -0.01,0" fill="none"/>
    </defs>
    <g clip-path="url(#sealclip)" fill="none" stroke="${col}" stroke-width="0.25" opacity="0.16">
      <path d="${g}"/>
    </g>
    <circle cx="37" cy="37" r="35" fill="none" stroke="${col}" stroke-width="0.8" opacity="0.55"/>
    <circle cx="37" cy="37" r="28" fill="none" stroke="${col}" stroke-width="0.4" opacity="0.32"/>
    <text font-family="Inter,sans-serif" font-size="3.05" letter-spacing="0.45" fill="${col}" opacity="0.5">
      <textPath href="#microring" startOffset="0">${microText}</textPath>
    </text>
    <text x="37" y="44" text-anchor="middle" font-family="'Cormorant Garamond',serif" font-size="20" fill="${col}" opacity="0.85">✦</text>
  </svg>`;
}
// The guilloché seal is Glyph's constant mark — same structure on every theme,
// drawn in the card's ink so it always reads. withShimmer adds the holo-masked layer.
function renderSealInto(host, d, withShimmer){
  const venue=d.venueName||'', date=d.date||'', sealCol=getTheme(d).colors.ink;
  const g=guillochePath(seedFrom(venue||'GLYPH'));
  host.innerHTML=sealSVG(g,venue,date,sealCol)+(withShimmer?'<div class="seal-shimmer"></div>':'');
  if(withShimmer){
    const sh=host.querySelector('.seal-shimmer');
    const maskSvg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 74 74'><path d='"+g+"' fill='none' stroke='#fff' stroke-width='0.6' stroke-linejoin='round'/></svg>";
    const uri="url(\"data:image/svg+xml,"+encodeURIComponent(maskSvg)+"\")";
    sh.style.webkitMaskImage=uri; sh.style.maskImage=uri;
  }
}

/* ===== 3D interaction — attached per interactive card (editor + focus only) ===== */
function attachInteraction(cardEl, sceneEl){
  let flipped=false, dragging=false, hovering=false;
  let rect=null, lastX=0, lastY=0, rafId=0;
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const canHover=()=>matchMedia('(hover:hover)').matches;

  function refreshRect(){ rect=sceneEl.getBoundingClientRect(); }   // cached; not read per move
  function updateWillChange(){ cardEl.style.willChange=(dragging||hovering)?'transform':'auto'; }

  // coalesce pointer events → apply the latest position once per animation frame
  function queue(x,y){ lastX=x; lastY=y; if(!rafId) rafId=requestAnimationFrame(apply); }
  function apply(){
    rafId=0;
    if(!rect) refreshRect();
    const px=clamp01((lastX-rect.left)/rect.width), py=clamp01((lastY-rect.top)/rect.height);
    cardEl.style.setProperty('--ry',((px-0.5)*46+(flipped?180:0))+'deg');
    cardEl.style.setProperty('--rx',(-(py-0.5)*46)+'deg');
    cardEl.style.setProperty('--mx',(px*100)+'%');
    cardEl.style.setProperty('--my',(py*100)+'%');
    cardEl.style.setProperty('--glare',0.55);
  }
  function reset(){
    if(rafId){ cancelAnimationFrame(rafId); rafId=0; }
    cardEl.style.setProperty('--rx','8deg');
    cardEl.style.setProperty('--ry',(flipped?194:-14)+'deg');
    cardEl.style.setProperty('--mx','50%');     // recenter the light; eases back via the @property transition
    cardEl.style.setProperty('--my','50%');
    cardEl.style.setProperty('--glare',0.22);
  }

  const onDown=e=>{ dragging=true; refreshRect(); updateWillChange(); sceneEl.setPointerCapture(e.pointerId); queue(e.clientX,e.clientY); };
  const onMove=e=>{ if(dragging||hovering) queue(e.clientX,e.clientY); };
  const onUp=()=>{ if(!dragging)return; dragging=false; updateWillChange(); reset(); };
  const onCancel=()=>{ dragging=false; updateWillChange(); reset(); };
  const onEnter=()=>{ if(!dragging && canHover()){ hovering=true; refreshRect(); updateWillChange(); } };
  const onLeave=()=>{ hovering=false; updateWillChange(); if(!dragging) reset(); };
  const onViewportChange=()=>{ if(dragging||hovering) refreshRect(); };  // re-cache instead of per-move

  sceneEl.addEventListener('pointerdown',onDown);
  sceneEl.addEventListener('pointermove',onMove);
  sceneEl.addEventListener('pointerup',onUp);
  sceneEl.addEventListener('pointercancel',onCancel);
  sceneEl.addEventListener('pointerenter',onEnter);
  sceneEl.addEventListener('pointerleave',onLeave);
  addEventListener('resize',onViewportChange);
  addEventListener('scroll',onViewportChange,{passive:true});

  reset(); updateWillChange();
  return {
    flip(){ flipped=!flipped; reset(); },
    reset,
    destroy(){
      if(rafId) cancelAnimationFrame(rafId);
      sceneEl.removeEventListener('pointerdown',onDown);
      sceneEl.removeEventListener('pointermove',onMove);
      sceneEl.removeEventListener('pointerup',onUp);
      sceneEl.removeEventListener('pointercancel',onCancel);
      sceneEl.removeEventListener('pointerenter',onEnter);
      sceneEl.removeEventListener('pointerleave',onLeave);
      removeEventListener('resize',onViewportChange);
      removeEventListener('scroll',onViewportChange);
    }
  };
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
  let w=img.naturalWidth||img.width||0, h=img.naturalHeight||img.height||0;
  if(!w||!h){ w=h=max; }   // SVG / unknown intrinsic size → rasterise at a sane default
  if(Math.max(w,h)>max){const s=max/Math.max(w,h);w=Math.max(1,Math.round(w*s));h=Math.max(1,Math.round(h*s));}
  const canvas=document.createElement('canvas');
  canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(img,0,0,w,h);            // rasterise (also neutralises any SVG markup/scripts)
  let out=canvas.toDataURL('image/webp',0.9);                // throws SecurityError if tainted → caller catches
  if(out.slice(0,15)!=='data:image/webp') out=canvas.toDataURL('image/png');
  return out;
}

/* ===== persistence: saved-designs store (localStorage, with in-memory fallback) ===== */
const STORE_KEY='glyph.designs.v1';
let STORAGE_OK=true;     // resolved in boot; false in Safari private mode / disabled storage
let memStore=null;       // session-only fallback when localStorage can't be used

function storageAvailable(){
  try{ const k='glyph.__test'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; }
  catch(e){ return false; }
}
function loadStore(){
  if(!STORAGE_OK) return memStore?memStore.slice():[];
  try{const raw=localStorage.getItem(STORE_KEY);const arr=raw?JSON.parse(raw):[];return Array.isArray(arr)?arr:[];}
  catch(e){ STORAGE_OK=false; return memStore?memStore.slice():[]; }
}
function writeStore(arr){
  if(STORAGE_OK){
    try{localStorage.setItem(STORE_KEY,JSON.stringify(arr));return true;}
    catch(e){
      const quota=e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22||e.code===1014);
      if(quota){ toast('Storage full — delete a venue and try again.'); return false; }
      STORAGE_OK=false;          // availability error → drop to the in-memory store
    }
  }
  memStore=arr.slice();          // persists for this session only
  return true;
}
function labelFor(d){return (d&&d.venueName&&d.venueName.trim())?d.venueName.trim():'Untitled';}

/* ===== showcase seeds (first-run demo collection) ===== */
const SEED_KEY='glyph.seeded.v1';
function seedDesigns(){
  const base=Date.now();
  const defs=[
    {id:'seed_hanuman', venueName:'Hanuman',            eventLine:'Tasting Menu',         location:'Kreuzberg · Berlin', date:'28 May 2026', edition:'No. 247', tagline:'Not a Trend; A Tradition', theme:themeCopy('hanuman'), heroArtUrl:'hero-hanuman.svg', rarity:'holo'},
    {id:'seed_bandol',  venueName:'Bandol sur mer',     eventLine:'À la carte',           location:'Mitte · Berlin',     date:'12 Jun 2026', edition:'No. 031', tagline:'Petite, by the sea',       theme:themeCopy('bandol'),  rarity:'common'},
    {id:'seed_coro',    venueName:'Coro Wine & Vinyls', eventLine:'Vinyl & Natural Wine', location:'Neukölln · Berlin',  date:'05 Jul 2026', edition:'No. 112', tagline:'Spin slow, pour low',      theme:themeCopy('verdant'), rarity:'prismatic'},
    {id:'seed_ernst',   venueName:'Ernst',              eventLine:"Chef's Counter",       location:'Wedding · Berlin',   date:'19 Sep 2026', edition:'No. 008', tagline:'Ten seats, one night',     theme:themeCopy('onyx'),    rarity:'gold'}
  ];
  return defs.map((d,i)=>Object.assign(createDesign(), d, {isSeed:true, logoDataUrl:null, updatedAt:base-i*1000}));
}
// first run only: if we've never seeded and the store is empty, populate the demo set.
// (uses a separate flag so emptying the store yourself never re-seeds.)
function maybeSeedOnFirstRun(){
  let seeded=false;
  try{ seeded=!!localStorage.getItem(SEED_KEY); }catch(e){ seeded=false; }
  if(seeded) return;
  if(loadStore().length===0) writeStore(seedDesigns());   // writeStore falls back to memory if needed
  try{ localStorage.setItem(SEED_KEY,'1'); }catch(e){}
}
// explicit restore — confirm only when it would discard real data
function resetToSamples(){
  const apply=()=>{ if(writeStore(seedDesigns())){ try{localStorage.setItem(SEED_KEY,'1');}catch(e){} refreshStoreUI(); toast('Reset to samples'); } };
  if(loadStore().length===0){ apply(); return; }
  dialog('Replace your collection with the demo samples? This removes the other designs saved here.',
    [{label:'Reset',value:'ok',primary:true},{label:'Cancel',value:null}]).then(c=>{ if(c==='ok') apply(); });
}

/* upsert the current editor design */
function saveCurrent(){
  const store=loadStore();
  currentDesign.updatedAt=Date.now();
  const snap=Object.assign({},currentDesign);
  const i=store.findIndex(d=>d.id===snap.id);
  if(i>=0) store[i]=snap; else store.push(snap);
  if(writeStore(store)){ toast(labelFor(snap)+' saved ✓'); refreshStoreUI(); }
}
/* restore a stored design into the editor */
function loadDesign(id){
  const found=loadStore().find(d=>d.id===id);
  if(!found){ toast('That venue is no longer there.'); refreshStoreUI(); return; }
  currentDesign=Object.assign(createDesign(),found);
  if(!found.theme || !found.theme.colors) currentDesign.theme=themeCopy(paletteToPreset(found.palette)); // migrate legacy palette
  syncInputsFromState(); syncChipsFromState(); paintEditor();
  setView('editor');
  toast(labelFor(currentDesign)+' opened');
}
/* clear to a blank design with a fresh id */
function newDesign(){
  currentDesign=createDesign({venueName:'',eventLine:'',location:'',date:'',edition:'',tagline:'',logoDataUrl:null,heroArtUrl:null,theme:themeCopy('onyx'),rarity:'common'});
  syncInputsFromState(); syncChipsFromState(); paintEditor();
  setView('editor');
  toast('New blank design');
}
/* duplicate a stored design under a new id */
function duplicateDesign(id){
  const d=loadStore().find(x=>x.id===id); if(!d) return;
  const copy=Object.assign({},d,{id:genId(),updatedAt:Date.now(),venueName:labelFor(d)+' copy'});
  const store=loadStore(); store.push(copy);
  if(writeStore(store)){ refreshStoreUI(); toast('Duplicated ✓'); }
}
function deleteDesign(id){
  const store=loadStore();
  const idx=store.findIndex(d=>d.id===id);
  if(idx<0) return;
  const removed=store[idx];
  store.splice(idx,1);
  if(writeStore(store)){ refreshStoreUI(); toast('Deleted', {actionLabel:'Undo', onAction:()=>restoreDesign(removed)}); }
}
function restoreDesign(d){
  const store=loadStore();
  if(!store.some(x=>x.id===d.id)) store.push(d);
  if(writeStore(store)){ refreshStoreUI(); toast('Restored ✓'); }
}

/* push state → editor inputs / chips (used by load / new) */
function syncInputsFromState(){
  const F={venue:'venueName',event:'eventLine',loc:'location',date:'date',edition:'edition',tag:'tagline'};
  Object.entries(F).forEach(([id,key])=>{document.getElementById(id).value=currentDesign[key]??'';});
  if(currentDesign.logoDataUrl){logoStatus.style.display='flex';logoName.textContent='Logo attached';}
  else{logoStatus.style.display='none';logoInput.value='';}
  // hero-art slot (only shown when the active theme enables it)
  const heroOn=getTheme(currentDesign).heroArt;
  document.getElementById('heroField').hidden=!heroOn;
  if(heroOn && currentDesign.heroArtUrl){heroStatus.style.display='flex';heroName.textContent='Hero art attached';}
  else{heroStatus.style.display='none';heroInput.value='';}
}
function syncChipsFromState(){
  const t=getTheme(currentDesign);
  [...tc.children].forEach(c=>{const sel=c.dataset.preset===t.preset;c.classList.toggle('sel',sel);c.setAttribute('aria-pressed',sel);});
  const enabled=t.rarities||ALLR;
  [...rc.children].forEach(c=>{
    const sel=c.dataset.id===currentDesign.rarity, on=enabled.includes(c.dataset.id);
    c.classList.toggle('sel',sel); c.classList.toggle('disabled',!on);
    c.setAttribute('aria-pressed',sel); c.setAttribute('aria-disabled',String(!on));
  });
}

/* ===== import / export (back up + move collections between devices) ===== */
function readFileAsText(file){
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(file);});
}
function dateStamp(){const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'design';}
function downloadJSON(filename,obj){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function envelope(designs){return {type:'glyph.collection',version:1,exportedAt:Date.now(),designs};}

function exportCollection(){
  const designs=loadStore();
  if(!designs.length){ toast('No saved venues to export.'); return; }
  downloadJSON('glyph-collection-'+dateStamp()+'.json', envelope(designs));
  toast('Exported '+designs.length+' venue'+(designs.length===1?'':'s')+' ✓');
}
function exportCurrent(){
  downloadJSON('glyph-'+slug(labelFor(currentDesign))+'.json', envelope([currentDesign]));
  toast(labelFor(currentDesign)+' exported ✓');
}

/* normalise + validate one design from untrusted JSON (forgiving but type-safe) */
function asStr(v){return typeof v==='string'?v:(v==null?'':String(v));}
function okImageRef(s){ return typeof s==='string' && (s.slice(0,5)==='data:' || /^[\w][\w./-]*\.(svg|png|webp|jpe?g|gif)$/i.test(s)); }
// build a clean theme from untrusted JSON (merge over a known-good base; block CSS injection in font names)
function sanitizeTheme(raw){
  const base=themeCopy('onyx');
  if(!raw || typeof raw!=='object') return base;
  const hex=v=>(typeof v==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(v))?v:null;
  const font=v=>(typeof v==='string'&&/^[\w\s,'"().-]{1,120}$/.test(v))?v:null;
  if(typeof raw.preset==='string') base.preset=raw.preset.slice(0,24);
  if(typeof raw.name==='string') base.name=raw.name.slice(0,40);
  if(raw.colors&&typeof raw.colors==='object') for(const k of ['bg','surface','ink','soft','accent','accent2','line']){ const h=hex(raw.colors[k]); if(h) base.colors[k]=h; }
  if(raw.fonts&&typeof raw.fonts==='object'){ const df=font(raw.fonts.display),bf=font(raw.fonts.body); if(df)base.fonts.display=df; if(bf)base.fonts.body=bf; if(raw.fonts.tagStyle==='normal'||raw.fonts.tagStyle==='italic')base.fonts.tagStyle=raw.fonts.tagStyle; }
  if(['solid','gradient','halftone'].includes(raw.background)) base.background=raw.background;
  if(raw.frame&&typeof raw.frame==='object'){ if(typeof raw.frame.weight==='number')base.frame.weight=Math.max(0,Math.min(8,raw.frame.weight)); if(typeof raw.frame.radius==='number')base.frame.radius=Math.max(0,Math.min(40,raw.frame.radius)); base.frame.frameless=!!raw.frame.frameless; }
  base.heroArt=!!raw.heroArt;
  if(Array.isArray(raw.rarities)){ const ok=raw.rarities.filter(r=>RARITIES.some(x=>x.id===r)); if(ok.length) base.rarities=ok; }
  return base;
}
function coerceDesign(raw){
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return null;
  const d=Object.assign(createDesign(), {
    id:          (typeof raw.id==='string' && raw.id) ? raw.id : genId(),
    venueName:   asStr(raw.venueName),
    logoDataUrl: (typeof raw.logoDataUrl==='string' && raw.logoDataUrl.slice(0,5)==='data:') ? raw.logoDataUrl : null,
    heroArtUrl:  okImageRef(raw.heroArtUrl) ? raw.heroArtUrl : null,
    eventLine:   asStr(raw.eventLine),
    location:    asStr(raw.location),
    date:        asStr(raw.date),
    edition:     asStr(raw.edition),
    tagline:     asStr(raw.tagline),
    theme:       (raw.theme && typeof raw.theme==='object' && raw.theme.colors) ? sanitizeTheme(raw.theme) : themeCopy(paletteToPreset(raw.palette)),
    rarity:      RARITIES.some(r=>r.id===raw.rarity) ? raw.rarity : 'common',
    updatedAt:   typeof raw.updatedAt==='number' ? raw.updatedAt : Date.now()
  });
  if(raw.isSeed===true) d.isSeed=true;
  return d;
}
/* accept an envelope {designs:[…]}, a bare array […], or a single design object */
function extractDesigns(parsed){
  let arr;
  if(Array.isArray(parsed)) arr=parsed;
  else if(parsed && Array.isArray(parsed.designs)) arr=parsed.designs;
  else if(parsed && typeof parsed==='object' && ('venueName' in parsed || 'palette' in parsed || 'id' in parsed)) arr=[parsed];
  else return null;                                  // unrecognised shape
  return arr.map(coerceDesign).filter(Boolean);      // [] = recognised but nothing valid
}

async function importFile(file){
  let text;
  try{ text=await readFileAsText(file); }
  catch(e){ toast('Could not read that file.'); return; }
  let parsed;
  try{ parsed=JSON.parse(text); }
  catch(e){ toast('That file is not valid JSON.'); return; }
  const incoming=extractDesigns(parsed);
  if(incoming===null){ toast('Unrecognised file — not a Glyph export.'); return; }
  if(!incoming.length){ toast('No valid designs found in that file.'); return; }

  const store=loadStore();
  const ids=new Set(store.map(d=>d.id));
  const conflicts=incoming.filter(d=>ids.has(d.id));
  let mode='add';
  if(conflicts.length){
    const choice=await dialog(
      conflicts.length+' of these '+(conflicts.length===1?'designs already exists':'designs already exist')+' here. Overwrite them, or keep both copies?',
      [{label:'Overwrite',value:'overwrite',primary:true},{label:'Keep both',value:'copy'},{label:'Cancel',value:null}]
    );
    if(choice==null){ toast('Import cancelled.'); return; }
    mode=choice;
  }
  let added=0,overwritten=0,copied=0;
  incoming.forEach(d=>{
    const idx=store.findIndex(s=>s.id===d.id);
    if(idx<0){ store.push(d); added++; }
    else if(mode==='overwrite'){ store[idx]=d; overwritten++; }
    else { store.push(Object.assign({},d,{id:genId(),updatedAt:Date.now()})); copied++; }
  });
  if(writeStore(store)){
    refreshStoreUI();
    const parts=[]; if(added)parts.push(added+' added'); if(overwritten)parts.push(overwritten+' overwritten'); if(copied)parts.push(copied+' copied');
    toast('Imported — '+(parts.join(', ')||'nothing'));
  }
}

/* generic modal → resolves to the chosen button value (or null on dismiss) */
function dialog(message, buttons){
  return new Promise(resolve=>{
    const ov=document.createElement('div'); ov.className='dialog-overlay';
    const box=document.createElement('div'); box.className='dialog';
    const msg=document.createElement('div'); msg.className='dialog-msg'; msg.textContent=message;
    const row=document.createElement('div'); row.className='dialog-actions';
    let done=false;
    const finish=v=>{ if(done)return; done=true; document.removeEventListener('keydown',onKey); ov.remove(); resolve(v); };
    function onKey(e){ if(e.key==='Escape') finish(null); }
    buttons.forEach(b=>{
      const btn=document.createElement('button'); btn.className='sbtn'+(b.primary?' primary':''); btn.textContent=b.label;
      btn.addEventListener('click',()=>finish(b.value));
      row.appendChild(btn);
    });
    box.append(msg,row); ov.appendChild(box); document.body.appendChild(ov);
    ov.addEventListener('click',e=>{ if(e.target===ov) finish(null); });
    document.addEventListener('keydown',onKey);
  });
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
let galleryObserver=null;
function renderGallery(){
  updateCount();
  const grid=document.getElementById('galleryGrid');
  const empty=document.getElementById('galleryEmpty');
  const store=loadStore().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  grid.innerHTML='';
  empty.hidden = store.length>0;
  if(galleryObserver){ galleryObserver.disconnect(); galleryObserver=null; }

  // lazily paint a thumbnail (seal generation + auto-fit) only as it nears the viewport
  const lazy = 'IntersectionObserver' in window;
  if(lazy){
    galleryObserver=new IntersectionObserver((entries,obs)=>{
      entries.forEach(en=>{
        if(!en.isIntersecting) return;
        const t=en.target;
        if(t._design){ paintCard(t._card, t._design, {holo:false}); t._design=null; }  // paint once
        obs.unobserve(t);
      });
    }, {rootMargin:'300px 0px', threshold:0.01});
  }
  store.forEach(d=>{
    const {tile,card}=makeTile(d);                 // structure + labels show immediately
    grid.appendChild(tile);
    if(lazy){ tile._card=card; tile._design=d; galleryObserver.observe(tile); }
    else paintCard(card,d,{holo:false});           // fallback: paint all up front
  });
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
  if(d.isSeed){ const badge=document.createElement('span'); badge.className='tile-badge'; badge.textContent='Sample'; thumb.appendChild(badge); }
  thumb.addEventListener('click',()=>openFocus(d.id));

  const meta=document.createElement('div'); meta.className='tile-meta';
  const nm=document.createElement('span'); nm.className='tile-name'; nm.textContent=labelFor(d);
  const R=RARITIES.find(r=>r.id===d.rarity)||RARITIES[0];
  const sym=document.createElement('span'); sym.className='tile-sym'; sym.textContent=R.sym; sym.title=R.label;
  sym.style.color=getTheme(d).colors.accent;
  meta.append(nm,sym);

  const actions=document.createElement('div'); actions.className='tile-actions';
  actions.append(
    mkBtn('Open','tile-btn',()=>loadDesign(d.id)),
    mkBtn('Duplicate','tile-btn',()=>duplicateDesign(d.id)),
    mkBtn('Delete','tile-btn danger',()=>deleteDesign(d.id))   // immediate + Undo toast
  );

  tile.append(thumb,meta,actions);
  return {tile,card};
}
function mkBtn(label,cls,onClick){
  const b=document.createElement('button'); b.className=cls; b.textContent=label;
  b.addEventListener('click',e=>{e.stopPropagation();onClick();});
  return b;
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
  if(focusCtl&&focusCtl.destroy) focusCtl.destroy();      // tear down any previous instance first
  focusCtl=attachInteraction(card, scene);
}
function closeFocus(){
  if(focusCtl&&focusCtl.destroy) focusCtl.destroy();      // remove listeners + cancel rAF
  document.getElementById('focusOverlay').hidden=true;
  document.getElementById('focusScene').innerHTML='';     // unmount → drop the holo layers
  focusCtl=null; focusId=null;
}

/* ===== transient toast (optional action button, e.g. Undo) ===== */
let toastTimer=null;
function toast(msg, opts){
  opts=opts||{};
  let el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el);}
  el.innerHTML='';
  const span=document.createElement('span'); span.className='toast-msg'; span.textContent=msg; el.appendChild(span);
  if(opts.actionLabel){
    const btn=document.createElement('button'); btn.type='button'; btn.className='toast-action'; btn.textContent=opts.actionLabel;
    btn.addEventListener('click',()=>{ clearTimeout(toastTimer); el.classList.remove('show'); if(opts.onAction) opts.onAction(); });
    el.appendChild(btn);
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'), opts.actionLabel?5200:2200);
}

function clearLogo(){logoInput.value='';logoStatus.style.display='none';update({logoDataUrl:null});}
function clearHero(){heroInput.value='';heroStatus.style.display='none';update({heroArtUrl:null});}

/* expose handlers used by inline HTML */
window.clearLogo=clearLogo;window.clearHero=clearHero;window.saveCurrent=saveCurrent;window.newDesign=newDesign;
window.exportCurrent=exportCurrent;window.resetToSamples=resetToSamples;
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
    if(f.type && !/^image\//.test(f.type)){ toast('Not an image file — choose a PNG, JPG, or WebP.'); logoInput.value=''; return; }
    if(f.size > 40*1024*1024){ toast('That image is too large (max 40 MB).'); logoInput.value=''; return; }
    try{
      const dataUrl=await processLogo(f);   // resize ≤400px + re-encode BEFORE storing
      logoStatus.style.display='flex';logoName.textContent=f.name;
      update({logoDataUrl:dataUrl});
    }catch(err){ toast('Could not read that image — try another file.'); logoInput.value=''; }
  };

  // hero-art upload (same pipeline as the logo: validate → resize → store)
  heroInput=document.getElementById('heroInput');
  heroStatus=document.getElementById('heroStatus');
  heroName=document.getElementById('heroName');
  heroInput.onchange=async function(e){
    const f=e.target.files[0];if(!f)return;
    if(f.type && !/^image\//.test(f.type)){ toast('Not an image file — choose a PNG or SVG.'); heroInput.value=''; return; }
    if(f.size > 40*1024*1024){ toast('That image is too large (max 40 MB).'); heroInput.value=''; return; }
    try{
      const dataUrl=await processLogo(f);
      heroStatus.style.display='flex';heroName.textContent=f.name;
      update({heroArtUrl:dataUrl});
    }catch(err){ toast('Could not read that image — try another file.'); heroInput.value=''; }
  };

  // theme chips (apply a preset; each design embeds its own editable copy)
  tc=document.getElementById('themes');
  THEME_ORDER.forEach(id=>{
    const t=THEME_PRESETS[id];const d=document.createElement('div');
    d.className='chip'+(currentDesign.theme&&currentDesign.theme.preset===id?' sel':'');
    d.style.background=t.colors.bg;d.style.color=t.colors.ink;d.style.border='0.5px solid '+t.colors.line;
    d.textContent=t.name;d.dataset.preset=id;
    d.tabIndex=0; d.setAttribute('role','button'); d.setAttribute('aria-label','Theme '+t.name);
    d.onclick=()=>{
      const nt=themeCopy(id);
      const patch={theme:nt};
      if(!nt.rarities.includes(currentDesign.rarity)) patch.rarity=nt.rarities[0];  // clamp to an enabled rarity
      update(patch); syncInputsFromState(); syncChipsFromState();
    };
    d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); d.click(); } });
    tc.appendChild(d);
  });
  // rarity chips
  rc=document.getElementById('rarities');
  RARITIES.forEach(r=>{
    const d=document.createElement('div');
    d.className='rchip'+(r.id===currentDesign.rarity?' sel':'');
    d.dataset.id=r.id;
    d.innerHTML=`<span class="sym">${r.sym}</span> ${r.label}`;
    d.tabIndex=0; d.setAttribute('role','button'); d.setAttribute('aria-label',r.label);
    d.onclick=()=>{ if(!getTheme(currentDesign).rarities.includes(r.id)) return; update({rarity:r.id});syncChipsFromState(); };
    d.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); d.click(); } });
    rc.appendChild(d);
  });

  // tabs
  document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>setView(t.dataset.view)));

  // focus overlay controls
  document.getElementById('focusClose').addEventListener('click',closeFocus);
  document.getElementById('focusFlip').addEventListener('click',()=>focusCtl&&focusCtl.flip());
  document.getElementById('focusOpen').addEventListener('click',()=>{ if(focusId){const id=focusId;closeFocus();loadDesign(id);} });
  document.getElementById('focusOverlay').addEventListener('click',e=>{ if(e.target.id==='focusOverlay') closeFocus(); });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    if(!document.getElementById('focusOverlay').hidden) closeFocus();
    else if(!menu.hidden) menu.hidden=true;
  });

  // import / export collection
  document.getElementById('importBtn').addEventListener('click',()=>document.getElementById('importInput').click());
  document.getElementById('importInput').addEventListener('change',e=>{ const f=e.target.files[0]; if(f) importFile(f); e.target.value=''; });
  document.getElementById('exportAllBtn').addEventListener('click',exportCollection);

  // overflow / settings menu
  const menu=document.getElementById('menu');
  document.getElementById('menuBtn').addEventListener('click',e=>{e.stopPropagation();menu.hidden=!menu.hidden;});
  document.addEventListener('click',e=>{ if(!menu.hidden && !e.target.closest('.overflow')) menu.hidden=true; });
  document.getElementById('resetSamplesBtn').addEventListener('click',()=>{ menu.hidden=true; resetToSamples(); });

  // empty-state primary CTA
  const emptyCreate=document.getElementById('emptyCreateBtn');
  if(emptyCreate) emptyCreate.addEventListener('click',()=>setView('editor'));

  // storage availability (Safari private mode / disabled) → in-memory fallback + one-time notice
  STORAGE_OK=storageAvailable();
  if(!STORAGE_OK){ memStore=[]; setTimeout(()=>toast('Saving is off here — designs last this session only. Export to keep them.'),700); }

  // first-run demo collection
  maybeSeedOnFirstRun();

  // initial paint
  syncInputsFromState();
  syncChipsFromState();
  updateCount();
  paintEditor();
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{fitNameIn(editorCard,currentDesign);fitEventIn(editorCard,currentDesign);});}
})();
