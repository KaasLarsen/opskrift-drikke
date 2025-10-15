// /js/guide-page.js — robust guidevisning + PriceRunner-rotator (dynamic import)
const VERSION = 'v5'; // bump for cache-bust

function getSlug() {
  const u = new URL(location.href);
  return u.searchParams.get('slug') || '';
}

async function j(url){
  const r = await fetch(`${url}?${VERSION}`, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
  return r.json();
}

async function loadAllGuides(){
  // Prøv chunks
  let all = [];
  try{
    const first = await j('/data/guides-1.json');
    if (Array.isArray(first) && first.length){
      all = all.concat(first);
      for(let i=2;i<=40;i++){
        try{
          const more = await j(`/data/guides-${i}.json`);
          if (!Array.isArray(more) || !more.length) break;
          all = all.concat(more);
        }catch{ break; }
      }
    }
  }catch{}
  // Fallback samlet
  if (!all.length){
    try{ all = await j('/data/guides.json'); }catch(e){ console.error('[guide] data-fejl', e); }
  }
  return all;
}

function setHTML(id, html){ const el=document.getElementById(id); if(el) el.innerHTML = html || ''; }
function setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent = txt || ''; }

function pickContent(g){
  // gør visning tolerant ift. feltnavne
  if (g.contentHtml) return g.contentHtml;
  if (g.html)        return g.html;
  if (g.bodyHtml)    return g.bodyHtml;
  if (g.content)     return g.content;
  if (g.body)        return g.body;
  if (Array.isArray(g.sections) && g.sections.length){
    return g.sections.map(s => `<h2 id="${(s.heading||'').toLowerCase().replace(/\s+/g,'-')}">${s.heading||''}</h2>${s.html||s.text||''}`).join('');
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
      return { id:h.id, title:h.textContent.trim() };
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
  // 1) Hvis rotatoren allerede er global (ikke typisk for ES modules)
  if (window.mountPR) { window.mountPR('#pr-guide-inner'); return; }
  // 2) Dynamic import af modulet og kald dets export
  try{
    const mod = await import('/js/pricerunner-rotator.js');
    if (mod && typeof mod.mountPR === 'function'){
      mod.mountPR('#pr-guide-inner');
    } else if (window.mountPR){
      window.mountPR('#pr-guide-inner');
    }
  }catch(e){
    console.warn('[guide] kunne ikke loade PriceRunner-rotator', e);
  }
}

async function mount(){
  const slug = getSlug();
  setText('guideTitle','Indlæser…');

  try{
    const all   = await loadAllGuides();
    const guide = all.find(g => (g.slug||'') === slug);
    if (!guide){
      setText('guideTitle','Ikke fundet');
      setHTML('guideContent','<p>Kunne ikke finde guiden.</p>');
      return;
    }

    // Hero
    setText('breadcrumbTitle', guide.title || 'Guide');
    setText('guideTitle',      guide.title || 'Guide');
    setText('guideIntro',      guide.intro || '');
    setHTML('guideMeta',       guide.meta  || '');

    // Indhold
    const contentHtml = pickContent(guide);
    const holder = document.getElementById('guideContent');
    if (holder){
      holder.innerHTML = contentHtml;
      holder.style.textAlign = 'left';
      holder.querySelectorAll('*').forEach(n => n.style.textAlign = n.style.textAlign || 'left');
    }

    renderTOC(guide, holder);
    renderFAQ(guide.faq || []);

    // PriceRunner
    await renderPRSlot();

  }catch(e){
    console.error('[guide] fejl', e);
    setText('guideTitle','Noget gik galt');
    setHTML('guideContent','<p>Kunne ikke indlæse guiden.</p>');
  }
}

document.addEventListener('DOMContentLoaded', mount);
