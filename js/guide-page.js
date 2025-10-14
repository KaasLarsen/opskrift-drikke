// /js/guide-page.js
import { currentUser } from './auth.js';
import { showToast } from './app.js';
import { mountPR } from './pricerunner-rotator.js';
import { chooseWidgetKeys } from './pr-widgets-map.js';

const V = 'guides-v3';
const get = (p)=> fetch(`${p}?${V}`, {cache:'no-cache'}).then(r=> r.ok ? r.json() : []);

const qs  = (id)=> document.getElementById(id);
const slug = new URLSearchParams(location.search).get('slug') || '';

async function loadAllGuides(){
  let all = [];
  try{
    const first = await get('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      all = all.concat(first);
      for (let i=2;i<=20;i++){
        try{
          const arr = await get(`/data/guides-${i}.json`);
          if (!Array.isArray(arr) || !arr.length) break;
          all = all.concat(arr);
        }catch{ break; }
      }
    }
  }catch{}
  if (!all.length){
    try { all = await get('/data/guides.json'); } catch {}
  }
  return all;
}

// ---- utils ----
function titleCaseAfterColon(s=''){
  return s.replace(/:\s*([a-zæøå])/gi, (_,ch)=>': '+ch.toUpperCase());
}

// normalize forskellige datastrukturer til "blocks"
function normalizeBlocks(guide){
  if (Array.isArray(guide.blocks) && guide.blocks.length){
    return guide.blocks; // forventet format
  }

  // format: sections: [{title, body, bullets:[], paragraphs:[]}]
  if (Array.isArray(guide.sections) && guide.sections.length){
    const out = [];
    guide.sections.forEach((sec, idx)=>{
      const id = (sec.id || `sec-${idx}`);
      const title = sec.title || sec.heading || 'Afsnit';
      out.push({ type:'h2', id, text:title });

      const paras = [];
      if (Array.isArray(sec.paragraphs)) paras.push(...sec.paragraphs);
      if (typeof sec.body === 'string') paras.push(sec.body);
      if (typeof sec.text === 'string') paras.push(sec.text);

      paras.filter(Boolean).forEach(p => out.push({ type:'p', text:p }));

      const bullets = sec.bullets || sec.list || [];
      if (Array.isArray(bullets) && bullets.length){
        out.push({ type:'ul', items: bullets });
      }
    });
    return out;
  }

  // format: content (string med linjeskift eller markdown)
  if (typeof guide.content === 'string' && guide.content.trim()){
    return textToBlocks(guide.content);
  }

  // format: body (array af strenge) / text / paragraphs
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
    // linjer der starter med "- " bliver til liste
    if (/^-\s+/.test(s)){
      const items = s.split('\n').map(x=>x.replace(/^\-\s+/, '').trim()).filter(Boolean);
      out.push({ type:'ul', items });
    } else {
      out.push({ type:'p', text:s });
    }
  });
  // lav simple overskrifter hvis vi spotter "Afsnit: ..."
  return promoteHeadings(out);
}

function textToBlocks(text){
  // grov markdown-ish → h2 på linjer der slutter med ":", resten afsnit
  const lines = text.split(/\r?\n/);
  const out = [];
  let buffer = [];
  function flush(){
    const t = buffer.join(' ').trim();
    if (t) out.push({ type:'p', text:t });
    buffer = [];
  }
  lines.forEach((line, i)=>{
    const l = line.trim();
    if (!l){ flush(); return; }
    if (/[:：]\s*$/.test(l)){ flush(); out.push({ type:'h2', id:`sec-${i}`, text:l.replace(/[:：]\s*$/,'') }); }
    else if (/^\-\s+/.test(l)){ // liste
      flush();
      const items = [l, ...collectFollowingList(lines, i+1)].map(x=>x.replace(/^\-\s+/, '').trim());
      out.push({ type:'ul', items });
    } else {
      buffer.push(l);
    }
  });
  flush();
  return promoteHeadings(out);
}

function collectFollowingList(lines, start){
  const got = [];
  for (let i=start;i<lines.length;i++){
    if (/^\-\s+/.test(lines[i].trim())) got.push(lines[i]);
    else break;
  }
  return got;
}

// hvis første sætning i et afsnit ligner en overskrift (slutter med ":"),
// del den ud som h2
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
    if (b.type==='h2'){
      return `<h2 id="${b.id}" class="text-xl font-medium mt-4">${b.text}</h2>`;
    }
    if (b.type==='p'){
      return `<p class="mt-2">${b.text}</p>`;
    }
    if (b.type==='ul'){
      return `<ul class="list-disc ml-6 mt-2">${b.items.map(li=>`<li>${li}</li>`).join('')}</ul>`;
    }
    if (b.type==='ol'){
      return `<ol class="list-decimal ml-6 mt-2">${b.items.map(li=>`<li>${li}</li>`).join('')}</ol>`;
    }
    return '';
  }).join('');
}

// lav FAQ ud fra guide.faq eller ud fra spørgsmål i tekst
function renderFAQ(guide, blocks){
  const wrap = qs('faqWrap');
  const list = qs('faqList');

  let faqs = Array.isArray(guide.faq) ? guide.faq : [];
  if (!faqs.length){
    const lines = [];
    blocks.forEach(b=>{
      if (b.type==='p') lines.push(b.text);
      if (b.type==='ul' || b.type==='ol') lines.push(...b.items);
    });
    for (let i=0;i<lines.length;i++){
      const q = (lines[i]||'').trim();
      const a = (lines[i+1]||'').trim();
      if (/\?\s*$/.test(q) && a){ faqs.push({q, a}); }
    }
    faqs = faqs.slice(0,6);
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
  mEl.textContent = [guide.category, guide.readTime ? `${guide.readTime} min.` : '']
    .filter(Boolean).join(' · ');

  const blocks = normalizeBlocks(guide);
  renderBlocks(blocks);
  renderTOC(blocks);
  renderFAQ(guide, blocks);

  // relaterede guides
  const pool = guides.filter(g => g.slug !== guide.slug && (g.category===guide.category ||
              (g.tags||[]).some(t => (guide.tags||[]).includes(t))));
  relEl.innerHTML = (pool.slice(0,6).map(r=>`
    <li><a class="hover:underline" href="/pages/guide.html?slug=${r.slug}">${r.title}</a></li>
  `).join('')) || '<li class="opacity-70">Ingen relaterede.</li>';

  // PR-widget pr. kategori
  try{
    const keys = chooseWidgetKeys({ category: guide.category, tags: guide.tags });
    if (keys && keys.length){ mountPR('#pr-guide-slot', keys[0]); }
  }catch(e){ console.warn('PR widget skip', e); }

  // kommentarer (lokalt)
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
