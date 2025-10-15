// /js/guide-page.js — robust guidevisning + PR-rotator + relateret indhold
const VERSION = 'v7';

// --------------------------------------------------
// Utils
// --------------------------------------------------
function getSlug() {
  const u = new URL(location.href);
  return u.searchParams.get('slug') || '';
}
function setHTML(id, html){ const el = document.getElementById(id); if (el) el.innerHTML = html || ''; }
function setText(id, txt){ const el = document.getElementById(id); if (el) el.textContent = txt || ''; }
async function j(url){
  const r = await fetch(`${url}?${VERSION}`, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
  return r.json();
}

// --------------------------------------------------
// Data: guides (chunk + fallback) med cache
// --------------------------------------------------
let __ALL_GUIDES_CACHE = null;

async function loadAllGuides(){
  if (__ALL_GUIDES_CACHE) return __ALL_GUIDES_CACHE;

  let all = [];
  try{
    const first = await j('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      all = all.concat(first);
      for (let i = 2; i <= 40; i++){
        try{
          const more = await j(`/data/guides-${i}.json`);
          if (!Array.isArray(more) || !more.length) break;
          all = all.concat(more);
        }catch{ break; }
      }
    }
  }catch{}

  if (!all.length){
    try { all = await j('/data/guides.json'); }
    catch(e){ console.error('[guide] data-fejl', e); all = []; }
  }

  __ALL_GUIDES_CACHE = all;
  return all;
}

// --------------------------------------------------
// Render helpers
// --------------------------------------------------
function pickContent(g){
  if (g.contentHtml) return g.contentHtml;
  if (g.html)        return g.html;
  if (g.bodyHtml)    return g.bodyHtml;
  if (g.content)     return g.content;
  if (g.body)        return g.body;
  if (Array.isArray(g.sections) && g.sections.length){
    return g.sections.map(s => {
      const id = (s.heading||'').toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
      return `<h2 id="${id}">${s.heading||''}</h2>${s.html||s.text||''}`;
    }).join('');
  }
  return '<p>—</p>';
}

function renderTOC(g, contentRoot){
  const wrap = document.getElementById('tocWrap');
  const nav  = document.getElementById('toc');
  if (!wrap || !nav) return;

  let items = Array.isArray(g.toc) ? g.toc.slice() : [];
  if (!items.length && contentRoot){
    const hs = contentRoot.querySelectorAll('h2, h3');
    items = [...hs].map(h => {
      if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
      return { id: h.id, title: h.textContent.trim() };
    });
  }
  if (!items.length){ wrap.classList.add('hidden'); return; }

  nav.innerHTML = items.map(i => `<a href="#${i.id}">${i.title}</a>`).join('');
  wrap.classList.remove('hidden');
}

function renderFAQ(faq){
  const wrap = document.getElementById('faqWrap');
  const list = document.getElementById('faqList');
  if (!wrap || !list) return;
  if (!Array.isArray(faq) || !faq.length){ wrap.classList.add('hidden'); return; }
  list.innerHTML = faq.map(q => `
    <div class="py-3 first:pt-0 last:pb-0">
      <details>
        <summary class="cursor-pointer font-semibold">${q.q || q.question}</summary>
        <div class="mt-2 text-[15px] leading-relaxed">${q.a || q.answer || ''}</div>
      </details>
    </div>
  `).join('');
  wrap.classList.remove('hidden');
}

async function renderPRSlot(){
  const outer = document.getElementById('pr-guide-slot');
  if (!outer) return;
  outer.innerHTML = `
    <div class="card bg-white p-4 border rounded-2xl">
      <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
      <div id="pr-guide-inner"></div>
    </div>
  `;
  if (window.mountPR) { window.mountPR('#pr-guide-inner'); return; }
  try{
    const mod = await import('/js/pricerunner-rotator.js');
    if (mod && typeof mod.mountPR === 'function') mod.mountPR('#pr-guide-inner');
    else if (window.mountPR) window.mountPR('#pr-guide-inner');
  }catch(e){ console.warn('[guide] PR-rotator kunne ikke loades', e); }
}

// --------------------------------------------------
// Relaterede opskrifter (under indhold)
// --------------------------------------------------
async function renderRelatedRecipes(guide){
  let existing = document.getElementById('relatedRecipes');
  if (!existing){
    const mainCol = document.getElementById('guideMainCol');
    if (!mainCol) return;
    const sec = document.createElement('section');
    sec.className = 'card bg-white p-6 mt-6';
    sec.innerHTML = `
      <h2 class="text-xl font-medium">Relaterede opskrifter</h2>
      <div id="relatedRecipes" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"></div>
    `;
    mainCol.appendChild(sec);
    existing = sec.querySelector('#relatedRecipes');
  }
  try{
    const recipesMod = await import('/js/recipes.js');
    const all = await recipesMod.loadAllRecipes();
    const gtags = new Set((guide.tags||[]).map(t => String(t).toLowerCase()));
    let pool = all;
    if (gtags.size){
      pool = all.filter(r => (r.tags||[]).some(t => gtags.has(String(t).toLowerCase())));
    }
    if (pool.length < 8){
      const byTitle = String(guide.title||'').toLowerCase().split(/\s+/).filter(Boolean);
      pool = all.filter(r => byTitle.some(w => String(r.title||'').toLowerCase().includes(w))).concat(pool);
    }
    const seen = new Set(); const pick = [];
    for (const r of pool){
      const k = r.slug || r.id; if (!k || seen.has(k)) continue;
      seen.add(k); pick.push(r);
      if (pick.length >= 8) break;
    }
    existing.innerHTML = pick.map(recipesMod.renderRecipeCard).join('');
  }catch(e){
    console.warn('[guide] relaterede opskrifter fejl', e);
  }
}

// --------------------------------------------------
// Relaterede guides (højre kolonne)
// --------------------------------------------------
function pickRelatedGuides(all, current, limit = 6){
  const curSlug = current.slug || current.id;
  const curCat  = (current.category || '').toLowerCase();
  const curTags = new Set((current.tags || []).map(t => String(t).toLowerCase()));

  const scored = all
    .filter(g => (g.slug || g.id) !== curSlug)
    .map(g => {
      let s = 0;
      if ((g.category || '').toLowerCase() === curCat && curCat) s += 3;
      for (const t of (g.tags || [])) {
        if (curTags.has(String(t).toLowerCase())) s += 2;
      }
      const wt  = new Set(String((current.title||'') + ' ' + (current.subtitle||'')).toLowerCase().split(/\W+/));
      const wt2 = new Set(String((g.title||'')      + ' ' + (g.subtitle||'')).toLowerCase().split(/\W+/));
      let overlap = 0; for (const w of wt) if (w.length>3 && wt2.has(w)) overlap++;
      s += Math.min(2, overlap);
      return { g, s };
    })
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.g);

  return scored.length ? scored : all.filter(g => (g.slug||g.id)!==curSlug).slice(0, limit);
}

async function renderRelatedGuides(current){
  const box = document.getElementById('relatedGuides');
  if (!box) return;
  const all = await loadAllGuides();
  const picks = pickRelatedGuides(all, current);

  box.innerHTML = picks.map(g => `
    <li>
      <a class="block p-3 rounded-xl border hover:bg-stone-50"
         href="/pages/guide?slug=${encodeURIComponent(g.slug || g.id)}">
        <div class="text-sm font-medium">${g.title || 'Guide'}</div>
        ${g.category ? `<div class="text-xs opacity-60 mt-0.5">${g.category}</div>` : ''}
      </a>
    </li>
  `).join('') || `<div class="text-sm opacity-60">Ingen relaterede guides lige nu.</div>`;
}

// --------------------------------------------------
// Mount
// --------------------------------------------------
async function mount(){
  setText('guideTitle','Indlæser…');
  const slug = getSlug();

  try{
    const all   = await loadAllGuides();
    const guide = all.find(g => (g.slug||'') === slug);

    if (!guide){
      setText('guideTitle','Ikke fundet');
      setHTML('guideContent','<p>Kunne ikke finde guiden.</p>');
      return;
    }

    setText('breadcrumbTitle', guide.title || 'Guide');
    setText('guideTitle',      guide.title || 'Guide');
    setText('guideIntro',      guide.intro || '');
    setHTML('guideMeta',       guide.meta  || '');

    // Indhold (venstrejustér fail-safe)
    const holder = document.getElementById('guideContent');
    if (holder){
      holder.innerHTML = pickContent(guide);
      holder.style.textAlign = 'left';
      holder.querySelectorAll('*').forEach(n => { if (!n.style.textAlign) n.style.textAlign = 'left'; });
    }

    renderTOC(guide, holder);
    renderFAQ(guide.faq || []);
    await renderPRSlot();
    await renderRelatedRecipes(guide);
    await renderRelatedGuides(guide);   // <-- VIGTIG: fylder højre-boksen

  }catch(e){
    console.error('[guide] fejl', e);
    setText('guideTitle','Noget gik galt');
    setHTML('guideContent','<p>Kunne ikke indlæse guiden.</p>');
  }
}

document.addEventListener('DOMContentLoaded', mount);
