// /js/guide-page.js
import { currentUser } from './auth.js';
import { showToast, formatStars } from './app.js';
import { mountPR } from './pricerunner-rotator.js';
import { chooseWidgetKeys } from './pr-widgets-map.js';

// ---- data loader (chunks + fallback) ----
const V = 'guides-v2';
const j = (p)=> fetch(`${p}?${V}`, {cache:'no-cache'}).then(r=> r.ok ? r.json() : []);
async function loadAllGuides(){
  let all = [];
  try{
    const first = await j('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      all = all.concat(first);
      for (let i=2;i<=20;i++){
        try{
          const arr = await j(`/data/guides-${i}.json`);
          if (!Array.isArray(arr) || !arr.length) break;
          all = all.concat(arr);
        }catch{ break; }
      }
    }
  }catch{}
  if (!all.length){ all = await j('/data/guides.json'); }
  return all;
}

// ---- helpers ----
const qs = (id)=> document.getElementById(id);
const slug = new URLSearchParams(location.search).get('slug') || '';

function titleCaseAfterColon(s=''){
  // bevarer dit krav: store bogstaver kun på første ord i sætningen;
  // men efter kolon starter vi ny sætning
  return s.replace(/:\s*([a-zæøå])/gi, (m, ch)=> ': ' + ch.toUpperCase());
}

function renderTOC(sections){
  const wrap = qs('tocWrap');
  const toc  = qs('toc');
  if (!sections.length){ wrap.classList.add('hidden'); return; }
  toc.innerHTML = sections.map(sec => `<a href="#${sec.id}">${sec.title}</a>`).join('');
  wrap.classList.remove('hidden');
}

function renderContentBlocks(blocks){
  const host = qs('guideContent');
  host.innerHTML = blocks.map(b=>{
    if (b.type === 'h2'){
      return `<h2 id="${b.id}" class="text-xl font-medium mt-4">${b.text}</h2>`;
    }
    if (b.type === 'p'){
      return `<p class="mt-2">${b.text}</p>`;
    }
    if (b.type === 'ul'){
      return `<ul class="list-disc ml-6 mt-2">${b.items.map(li=>`<li>${li}</li>`).join('')}</ul>`;
    }
    if (b.type === 'ol'){
      return `<ol class="list-decimal ml-6 mt-2">${b.items.map(li=>`<li>${li}</li>`).join('')}</ol>`;
    }
    return '';
  }).join('');
}

// auto-FAQ: find spørgsmål i tekst og brug næste linje som svar
function buildAutoFAQFromBlocks(blocks){
  const lines = [];
  blocks.forEach(b=>{
    if (b.type==='p'){ lines.push(b.text); }
    if (b.type==='ul' || b.type==='ol'){ lines.push(...b.items); }
  });
  const faqs = [];
  for (let i=0;i<lines.length;i++){
    const line = (lines[i]||'').trim();
    if (/\?\s*$/.test(line) && (lines[i+1]||'').trim()){
      faqs.push({ q: line.replace(/\s*$/,''), a: lines[i+1].trim() });
    }
  }
  // limit 6
  return faqs.slice(0,6);
}

function renderFAQ(guide){
  const wrap = qs('faqWrap');
  const list = qs('faqList');

  let faqs = Array.isArray(guide.faq) ? guide.faq : [];
  if (!faqs.length){
    // lav en rimelig auto-faq, hvis der ikke er nogen
    faqs = buildAutoFAQFromBlocks(guide.blocks || []);
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

// ---- init ----
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

  // title/intro/meta
  const title = titleCaseAfterColon(guide.title || 'Guide');
  document.title = `${title} – opskrift-drikke.dk`;
  tEl.textContent = title;
  bread.textContent = title;
  iEl.textContent = guide.intro || '';
  mEl.textContent = [guide.category, guide.readTime ? `${guide.readTime} min.` : '']
    .filter(Boolean).join(' · ');

  // blocks + TOC
  const blocks = Array.isArray(guide.blocks) ? guide.blocks : [];
  renderContentBlocks(blocks);
  const sections = blocks.filter(b=>b.type==='h2').map(b=>({id:b.id, title:b.text}));
  renderTOC(sections);

  // FAQ
  renderFAQ({ ...guide, blocks });

  // relaterede
  const pool = guides.filter(g => g.slug !== guide.slug && (g.category===guide.category ||
               (g.tags||[]).some(t => (guide.tags||[]).includes(t))));
  relEl.innerHTML = (pool.slice(0,6).map(r=>`
    <li><a class="hover:underline" href="/pages/guide.html?slug=${r.slug}">${r.title}</a></li>
  `).join('')) || '<li class="opacity-70">Ingen relaterede.</li>';

  // PriceRunner-widget per kategori (genbrug maps)
  try{
    const keys = chooseWidgetKeys({ category: guide.category, tags: guide.tags });
    if (keys && keys.length){
      mountPR('#pr-guide-slot', keys[0]);
    }
  }catch(e){ console.warn('PR widget skip', e); }

  // simple kommentar-funktion (lokal)
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
    const arr = loadC();
    arr.push({ ts: Date.now(), text: txt, user: u2.email });
    saveC(arr); renderC(); commentText.value='';
  });
}

document.addEventListener('DOMContentLoaded', init);
