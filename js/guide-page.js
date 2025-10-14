// /js/guide-page.js
import { currentUser } from './auth.js';
import { showToast } from './app.js';
import { mountPR } from './pricerunner-rotator.js';
import { chooseWidgetKeys } from './pr-widgets-map.js';

console.log('guide-page.js loaded');

const qs  = (id)=> document.getElementById(id);
const slug = new URLSearchParams(location.search).get('slug') || '';

async function fetchJson(path){
  const r = await fetch(path, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} @ ${path}`);
  return r.json();
}

async function loadAllGuides(){
  let all = [];
  try{
    const first = await fetchJson('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      all = all.concat(first);
      for (let i=2;i<=20;i++){
        try{
          const arr = await fetchJson(`/data/guides-${i}.json`);
          if (!Array.isArray(arr) || !arr.length) break;
          all = all.concat(arr);
        }catch{ break; }
      }
    }
  }catch{}
  if (!all.length){
    try { all = await fetchJson('/data/guides.json'); } catch {}
  }
  return all;
}

function titleCaseAfterColon(s=''){
  return s.replace(/:\s*([a-zæøå])/gi, (_,ch)=>': '+ch.toUpperCase());
}

/* ---------- normalisering til blocks ---------- */
function normalizeBlocks(guide){
  if (Array.isArray(guide.blocks) && guide.blocks.length) return guide.blocks;

  if (Array.isArray(guide.sections) && guide.sections.length){
    const out = [];
    guide.sections.forEach((sec, idx)=>{
      const id = sec.id || `sec-${idx}`;
      const title = sec.title || sec.heading || 'Afsnit';
      out.push({ type:'h2', id, text:title });

      const paras = [];
      if (Array.isArray(sec.paragraphs)) paras.push(...sec.paragraphs);
      if (typeof sec.body === 'string')  paras.push(sec.body);
      if (typeof sec.text === 'string')  paras.push(sec.text);
      paras.filter(Boolean).forEach(p=> out.push({ type:'p', text:p }));

      const bullets = sec.bullets || sec.list || [];
      if (Array.isArray(bullets) && bullets.length){
        out.push({ type:'ul', items: bullets });
      }
    });
    return out;
  }

  if (typeof guide.content === 'string' && guide.content.trim()){
    return textToBlocks(guide.content);
  }
  if (Array.isArray(guide.body) && guide.body.length){
    return arrayToBlocks(guide.body);
  }
  if (Array.isArray(guide.paragraphs) && guide.paragraphs.length){
    return arrayToBlocks(guide.paragraphs);
  }
  if (typeof guide.text === 'string' && guide.text.trim()){
    return textToBlocks(guide.text);
  }
  return [];
}

function arrayToBlocks(arr){
  const out = [];
  arr.forEach((t,i)=>{
    const s = String(t||'').trim();
    if (!s) return;
    if (/^-\s+/.test(s)){
      const items = s.split('\n').map(x=>x.replace(/^\-\s+/, '').trim()).filter(Boolean);
      out.push({ type:'ul', items });
    } else {
      out.push({ type:'p', text:s });
    }
  });
  return promoteHeadings(out);
}

function textToBlocks(text){
  const lines = text.split(/\r?\n/);
  const out = [];
  let buf = [];
  const flush = ()=>{ const t = buf.join(' ').trim(); if (t) out.push({ type:'p', text:t }); buf=[]; };

  for (let i=0;i<lines.length;i++){
    const l = lines[i].trim();
    if (!l){ flush(); continue; }
    if (/[:：]\s*$/.test(l)){ flush(); out.push({ type:'h2', id:`sec-${i}`, text:l.replace(/[:：]\s*$/,'') }); continue; }
    if (/^\-\s+/.test(l)){
      flush();
      const items = [l];
      for (let j=i+1;j<lines.length && /^\-\s+/.test(lines[j].trim()); j++, i=j){ items.push(lines[j]); }
      out.push({ type:'ul', items: items.map(x=>x.replace(/^\-\s+/, '').trim()) });
      continue;
    }
    buf.push(l);
  }
  flush();
  return promoteHeadings(out);
}

function promoteHeadings(blocks){
  const out = [];
  blocks.forEach((b, idx)=>{
    if (b.type==='p' && /[:：]\s*$/.test(b.text)){
      out.push({ type:'h2', id:`sec-${idx}`, text:b.text.replace(/[:：]\s*$/,'') });
    } else {
      out.push(b);
    }
  });
  return out;
}

/* ---------- render ---------- */
function renderTOC(blocks){
  const wrap = qs('tocWrap');
  const toc  = qs('toc');
  const sections = blocks.filter(b=>b.type==='h2');
  if (!sections.length){ wrap.classList.add('hidden'); return; }
  toc.innerHTML = sections.map(sec => `<a href="#${sec.id}">${sec.text}</a>`).join('');
  wrap.classList.remove('hidden');
}

function renderBlocks(blocks){
  const host = qs('guideContent');
  host.innerHTML = blocks.map(b=>{
    if (b.type==='h2') return `<h2 id="${b.id}" class="text-xl font-medium mt-4">${b.text}</h2>`;
    if (b.type==='p')  return `<p class="mt-2">${b.text}</p>`;
    if (b.type==='ul') return `<ul class="list-disc ml-6 mt-2">${(b.items||[]).map(li=>`<li>${li}</li>`).join('')}</ul>`;
    if (b.type==='ol') return `<ol class="list-decimal ml-6 mt-2">${(b.items||[]).map(li=>`<li>${li}</li>`).join('')}</ol>`;
    return '';
  }).join('');
}

/* ---------- FAQ: find “ofte stillede spørgsmål / FAQ” eller heuristik ---------- */
function renderFAQ(guide, blocks){
  const wrap = qs('faqWrap');
  const list = qs('faqList');

  let faqs = Array.isArray(guide.faq) ? guide.faq.slice() : [];

  if (!faqs.length){
    // 1) forsøg: dedikeret sektion
    const h2Idx = blocks.findIndex(b =>
      b.type==='h2' && /^(ofte\s+stillede\s+spørgsmål|faq)$/i.test((b.text||'').trim())
    );
    if (h2Idx >= 0){
      const tail = [];
      for (let i=h2Idx+1;i<blocks.length;i++){
        if (blocks[i].type==='h2') break;
        tail.push(blocks[i]);
      }
      faqs = faqs.concat(extractQAPairs(tail));
    }
  }

  // 2) fallback: hele dokumentet
  if (!faqs.length){
    faqs = extractQAPairs(blocks).slice(0,6);
  }

  if (!faqs.length){
    list.innerHTML = '<p class="opacity-70">Ingen spørgsmål endnu.</p>';
    wrap.classList.remove('hidden');
    return;
  }

  list.innerHTML = faqs.map(f=>`
    <div class="py-3">
      <div class="font-medium">${f.q}</div>
      <div class="mt-1 opacity-80">${f.a}</div>
    </div>
  `).join('');
  wrap.classList.remove('hidden');
}

// robust Q/A-udtræk: finder linjer der ender med ? inde i p/ul/ol og tager næste blok/linje som svar
function extractQAPairs(blocks){
  const flat = [];
  blocks.forEach(b=>{
    if (b.type==='p'){
      // split på hårde break + sætninger der slutter med ? for at undgå “Q+A i samme afsnit”
      const pieces = (b.text||'')
        .split(/\n+/)
        .flatMap(s => s.split(/(?<=\?)\s+(?=[A-ZÆØÅa-zæøå])/)) // split efter '?'
        .map(x=>x.trim()).filter(Boolean);
      pieces.forEach(p => flat.push({ kind:'p', text:p }));
    } else if (b.type==='ul' || b.type==='ol'){
      (b.items||[]).forEach(it => flat.push({ kind:'p', text:String(it||'').trim() }));
    } else if (b.type==='h2'){
      flat.push({ kind:'h2', text:b.text||'' });
    }
  });

  const faqs = [];
  for (let i=0;i<flat.length;i++){
    const cur = flat[i];
    if (cur.kind==='p' && /\?\s*$/.test(cur.text)){
      // saml svar op til næste spørgsmål/h2
      let answer = '';
      for (let j=i+1;j<flat.length;j++){
        if (flat[j].kind==='h2') break;
        if (flat[j].kind==='p' && /\?\s*$/.test(flat[j].text)) break;
        if (flat[j].kind==='p'){
          if (answer) answer += ' ';
          answer += flat[j].text;
        }
        i = j;
      }
      if (answer) faqs.push({ q: cur.text, a: answer });
    }
  }
  return faqs;
}

/* ---------- init ---------- */
async function init(){
  const tEl   = qs('guideTitle');
  const iEl   = qs('guideIntro');
  const mEl   = qs('guideMeta');
  const bread = qs('breadcrumbTitle');
  const relEl = qs('relatedGuides');

  if (!slug){ tEl.textContent='Slug mangler i URL'; return; }

  let guides = [];
  try { guides = await loadAllGuides(); }
  catch(e){ tEl.textContent='Kunne ikke indlæse guide'; console.error(e); return; }

  const guide = guides.find(g => (g.slug||'') === slug);
  if (!guide){ tEl.textContent='Guide ikke fundet'; return; }

  const title = titleCaseAfterColon(guide.title || 'Guide');
  document.title = `${title} – opskrift-drikke.dk`;
  tEl.textContent = title;
  bread.textContent = title;
  iEl.textContent = guide.intro || '';
  mEl.textContent = [guide.category, guide.readTime ? `${guide.readTime} min.` : ''].filter(Boolean).join(' · ');

  const blocks = normalizeBlocks(guide);
  renderBlocks(blocks);
  renderTOC(blocks);
  renderFAQ(guide, blocks);

  // relaterede guides
  const pool = guides.filter(g =>
    g.slug !== guide.slug && (g.category===guide.category ||
    (g.tags||[]).some(t => (guide.tags||[]).includes(t)))
  );
  relEl.innerHTML = (pool.slice(0,6).map(r=>`
    <li><a class="hover:underline" href="/pages/guide.html?slug=${r.slug}">${r.title}</a></li>
  `).join('')) || '<li class="opacity-70">Ingen relaterede.</li>';

  // PriceRunner widget pr. kategori
  try{
    const keys = chooseWidgetKeys({ category: guide.category, tags: guide.tags });
    if (keys && keys.length){ mountPR('#pr-guide-slot', keys[0]); }
  }catch(e){ console.warn('PR widget skip', e); }

  /* ----- lokale kommentarer ----- */
  const commentList   = qs('commentList');
  const commentText   = qs('commentText');
  const commentSubmit = qs('commentSubmit');
  const commentHint   = qs('commentHint');

  const cKey = (s)=> `od_guide_comments_${s}`;
  const loadC = ()=> { try{return JSON.parse(localStorage.getItem(cKey(slug))||'[]');}catch{return [];} };
  const saveC = (arr)=> localStorage.setItem(cKey(slug), JSON.stringify(arr.slice(-200)));
  const renderC = ()=> {
    const list = loadC().sort((a,b)=>b.ts-a.ts);
    commentList.innerHTML = list.length
      ? list.map(c=>`
          <div class="border rounded-2xl p-3">
            <div class="text-sm opacity-70">${new Date(c.ts).toLocaleString('da-DK')}</div>
            <div class="mt-1">${c.text}</div>
            <div class="text-sm opacity-70 mt-1">${c.user||'Anonym'}</div>
          </div>`).join('')
      : '<p class="opacity-70">Ingen kommentarer endnu.</p>';
  };

  const u = currentUser();
  commentHint.textContent = u ? `Logget ind som ${u.email}` : 'Du skal være logget ind.';
  renderC();
  commentSubmit?.addEventListener('click', ()=>{
    const u2 = currentUser();
    if (!u2){ showToast('Du skal være logget ind for at kommentere'); return; }
    const txt = (commentText.value||'').trim();
    if (!txt){ showToast('Skriv en kommentar først'); return; }
    const arr = loadC(); arr.push({ ts: Date.now(), text: txt, user: u2.email });
    saveC(arr); renderC(); commentText.value='';
  });
}

document.addEventListener('DOMContentLoaded', init);
