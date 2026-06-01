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
  const el=document.getElementById(id);
  el.value=currentDesign[key]??'';                 // seed the input from state once
  el.addEventListener('input',()=>update({[key]:el.value}));
});

/* logo upload */
const logoInput=document.getElementById('logoInput');
const logoStatus=document.getElementById('logoStatus');
const logoName=document.getElementById('logoName');
logoInput.onchange=function(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{logoStatus.style.display='flex';logoName.textContent=f.name;update({logoDataUrl:ev.target.result});};
  r.readAsDataURL(f);
};
function clearLogo(){logoInput.value='';logoStatus.style.display='none';update({logoDataUrl:null});}

/* palette chips */
const tc=document.getElementById('themes');
Object.keys(PAL).forEach(name=>{
  const p=PAL[name];const d=document.createElement('div');
  d.className='chip'+(name===currentDesign.palette?' sel':'');
  d.style.background=p.chip;d.style.color=p.ci;d.style.border='0.5px solid '+p.line+'66';
  d.textContent=name;
  d.onclick=()=>{[...tc.children].forEach(c=>c.classList.remove('sel'));d.classList.add('sel');update({palette:name});};
  tc.appendChild(d);
});

/* rarity chips */
const rc=document.getElementById('rarities');
RARITIES.forEach(r=>{
  const d=document.createElement('div');
  d.className='rchip'+(r.id===currentDesign.rarity?' sel':'');
  d.innerHTML=`<span class="sym">${r.sym}</span> ${r.label}`;
  d.onclick=()=>{[...rc.children].forEach(c=>c.classList.remove('sel'));d.classList.add('sel');update({rarity:r.id});};
  rc.appendChild(d);
});

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

/* ===== boot ===== */
render();resetView();
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(()=>{fitName();fitEvent();});}
