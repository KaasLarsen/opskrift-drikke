// /js/guide-page.js — robust guide-detaljevisning
// Løser "står bare Indlæser..." ved at håndtere flere datastier + slug-parsing

/* -------------------- Utils -------------------- */
const JSON_OPTS = { cache: 'no-cache' };

function html(strings, ...vals){ return strings.map((s,i)=>s+(vals[i]??'')).join(''); }

function byId(id){ return document.getElementById(id); }

function safeText(v){ return (v==null ? '' : String(v)); }

/** slug kan komme som ?slug=..., eller via /pages/guide/<slug> (+ fejl som dobbelt-?) */
function getSlug(){
  const url = new URL(location.href);
  let slug = url.searchParams.get('slug');
  if (!slug){
    const last = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!/guide(\.html)?$/.test(last)) slug = decodeURIComponent(last);
  }
  // ryd “?something” som nogen gange bliver vedhæftet slug ved fejl
  if (slug && slug.includes('?')) slug = slug.split('?')[0];
  return slug ? decodeURIComponent(slug) : '';
}

/* -------------------- Data load (chunked + fallback) -------------------- */
let ALL_GUIDES_CACHE = null;

const GUIDE_SOURCES = [
  // primær: chunkede under /data
  ...Array.from({length: 30}, (_,i)=>`/data/guides-${i+1}.json`),
  // fallback samlet
  '/data/guides.json',
  // ekstra fallback hvis data ligger i roden
  ...Array.from({length: 30}, (_,i)=>`/guides-${i+1}.json`),
  '/guides.json'
];

async function fetchJson(url){
  try{
    const r = await fetch(url, JSON_OPTS);
    if (!r.ok) throw new Error(`${url} ${r.status}`);
    const j = await r.json();
    if (!Array.isArray(j)) throw new Error(`${url} not array`);
    return j;
  }catch(e){
    // Stille fejl, men log til konsollen for debugging
    console.debug('[guide-page] skip', url, e.message);
    return [];
  }
}

async function loadAllGuides(){
  if (ALL_GUIDES_CACHE) return ALL_GUIDES_CACHE;

  // Hent alle kilder (parallel), saml/dedupe på slug/id
  const parts = await Promise.all(GUIDE_SOURCES.map(fetchJson));
  const seen = new Set();
  const out = [];
  for (const arr of parts){
    for (const g of arr){
      const key = String(g.slug || g.id || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(g);
    }
  }
  ALL_GUIDES_CACHE = out;
  if (!out.length) console.error('[guide-page] Ingen guides fundet fra nogen sti.');
  return out;
}

/* -------------------- Rendering -------------------- */

function renderTOC(){
  const wrap = byId('tocWrap');
  const nav  = byId('toc');
  const root = byId('guideContent');
  if (!wrap || !nav || !root) return;

  const hs = root.querySelectorAll('h2, h3');
  if (!hs.length){ wrap.classList.add('hidden'); return; }

  const items = [];
  hs.forEach((h, idx) => {
    if (!h.id) h.id = `h-${idx+1}`;
    const lvl = h.tagName.toLowerCase();
    items.push(`<a href="#${h.id}" class="${lvl==='h3'?'pl-4':''}">${h.textContent}</a>`);
  });
  nav.innerHTML = items.join('');
  wrap.classList.remove('hidden');
}

function asHtmlContent(g){
  // Prioritet: html -> content(array/string) -> body -> blocks -> notes
  if (g.html) return String(g.html);
  if (Array.isArray(g.content)) return g.content.map(p => `<p>${p}</p>`).join('');
  if (typeof g.content === 'string') return g.content;
  if (g.body) return String(g.body);
  if (Array.isArray(g.blocks)) return g.blocks.map(p => `<p>${p}</p>`).join('');
  if (g.notes) return `<p>${g.notes}</p>`;
  return '<p>—</p>';
}

function renderFAQ(g){
  const wrap = byId('faqWrap');
  const list = byId('faqList');
  if (!wrap || !list) return;
  const faq = g.faq || g.FAQ || [];
  if (!Array.isArray(faq) || !faq.length){ wrap.classList.add('hidden'); return; }

  list.innerHTML = faq.map(item => {
    const q = safeText(item.q || item.question || '');
    const a = safeText(item.a || item.answer   || '');
    return `<div class="py-3">
      <details>
        <summary class="cursor-pointer font-medium">${q}</summary>
        <div class="mt-1 text-[15px] leading-relaxed">${a}</div>
      </details>
    </div>`;
  }).join('');
  wrap.classList.remove('hidden');
}

function renderRelated(all, g){
  const ul = byId('relatedGuides');
  if (!ul) return;
  const t0 = (g.tags || [])[0];
  const pool = t0
    ? all.filter(x => (x.slug||x.id)!==(g.slug||g.id) && (x.tags||[]).includes(t0))
    : all.filter(x => (x.slug||x.id)!==(g.slug||g.id));
  ul.innerHTML = pool.slice(0,8).map(x => `
    <li><a class="hover:underline text-orange-600" href="/pages/guide?slug=${encodeURIComponent(x.slug||x.id)}">${x.title}</a></li>
  `).join('');
}

function renderPR(){
  // PriceRunner-slot under indhold — bruger din eksisterende rotator hvis den findes
  const slot = byId('pr-guide-slot');
  if (!slot) return;
  slot.innerHTML = `<div id="pr-guide-slot-inner"></div>`;
  if (window.mountPR) window.mountPR('#pr-guide-slot-inner');
}

function renderGuide(g){
  // Hero
  byId('guideTitle').textContent = g.title || 'Guide';
  byId('guideIntro').textContent = g.intro || g.subtitle || '';
  const meta = [];
  if (g.category) meta.push(g.category);
  if (g.updated || g.date) meta.push(`Opdateret: ${g.updated || g.date}`);
  byId('guideMeta').textContent = meta.join(' • ');
  byId('breadcrumbTitle').textContent = g.title || 'Guide';

  // Indhold i kort
  const contentRoot = byId('guideContent');
  contentRoot.innerHTML = asHtmlContent(g);

  // TOC ud fra H2/H3 i indholdet
  renderTOC();
  // FAQ (hvis tilgængelig)
  renderFAQ(g);
  // Relaterede
  loadAllGuides().then(all => renderRelated(all, g));
  // PriceRunner
  renderPR();
}

/* -------------------- Mount -------------------- */
async function mountGuidePage(){
  const slug = getSlug();
  const titleEl = byId('guideTitle');
  if (titleEl) titleEl.textContent = 'Indlæser…';

  try{
    const all = await loadAllGuides();
    const g = all.find(x => (x.slug || x.id) === slug);
    if (!g){
      byId('guideMainCol').innerHTML = `
        <div class="card bg-white p-6">
          <h2 class="text-xl font-semibold mb-2">Kunne ikke finde guiden</h2>
          <p class="opacity-80">Tjek at linket er korrekt: <code class="bg-stone-100 px-1 rounded">${slug || '(mangler slug)'}</code></p>
        </div>`;
      return;
    }
    renderGuide(g);
  }catch(err){
    console.error('[guide-page] fejl ved indlæsning', err);
    byId('guideMainCol').innerHTML = `
      <div class="card bg-white p-6">
        <h2 class="text-xl font-semibold mb-2">Noget gik galt</h2>
        <p class="opacity-80">Kunne ikke indlæse guiden. Prøv at opdatere siden.</p>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', mountGuidePage);
