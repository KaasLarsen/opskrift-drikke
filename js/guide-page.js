// /js/guide-page.js — loader & viser en enkelt guide + PR-widget
const VERSION = 'v3'; // bump for cache-bust

function getSlug() {
  const u = new URL(location.href);
  return u.searchParams.get('slug') || '';
}

async function json(url) {
  const r = await fetch(`${url}?${VERSION}`, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
  return r.json();
}

async function loadAllGuides() {
  // Prøv chunkede filer først
  let all = [];
  try {
    const first = await json('/data/guides-1.json');
    if (Array.isArray(first) && first.length) {
      all = all.concat(first);
      for (let i = 2; i <= 30; i++) {
        try {
          const chunk = await json(`/data/guides-${i}.json`);
          if (!Array.isArray(chunk) || !chunk.length) break;
          all = all.concat(chunk);
        } catch { break; }
      }
    }
  } catch {/* ignorer, vi prøver samlet fil nedenfor */}

  if (!all.length) {
    try { all = await json('/data/guides.json'); }
    catch (e) { console.error('[guide] kunne ikke hente data', e); }
  }
  return all;
}

function setText(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html || '';
}

function renderTOC(toc, contentRoot) {
  const wrap = document.getElementById('tocWrap');
  const nav  = document.getElementById('toc');
  if (!wrap || !nav) return;

  let items = Array.isArray(toc) && toc.length ? toc.slice() : [];

  // Hvis der ikke er en toc i dataen, så generér ud fra H2/H3 i indholdet
  if (!items.length && contentRoot) {
    const hs = contentRoot.querySelectorAll('h2, h3');
    items = [...hs].map(h => {
      if (!h.id) h.id = h.textContent.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
      return { id: h.id, title: h.textContent.trim() };
    });
  }

  if (!items.length) { wrap.classList.add('hidden'); return; }

  nav.innerHTML = items.map(i => `<a href="#${i.id}">${i.title}</a>`).join('');
  wrap.classList.remove('hidden');
}

function renderFAQ(faqArr) {
  const wrap = document.getElementById('faqWrap');
  const list = document.getElementById('faqList');
  if (!wrap || !list) return;
  if (!Array.isArray(faqArr) || !faqArr.length) { wrap.classList.add('hidden'); return; }

  list.innerHTML = faqArr.map(q => `
    <div class="py-3 first:pt-0 last:pb-0">
      <details>
        <summary class="cursor-pointer font-semibold">${q.q || q.question}</summary>
        <div class="mt-2 text-[15px] leading-relaxed">${q.a || q.answer || ''}</div>
      </details>
    </div>
  `).join('');
  wrap.classList.remove('hidden');
}

function renderPRSlot() {
  const slot = document.getElementById('pr-guide-slot');
  if (!slot) return;
  slot.innerHTML = `
    <div class="card bg-white p-4 border rounded-2xl">
      <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
      <div id="pr-guide-inner"></div>
    </div>
  `;
  // Brug din eksisterende rotator, hvis den er indlæst på siden
  if (window.mountPR) {
    window.mountPR('#pr-guide-inner');
  }
}

async function mount() {
  const slug = getSlug();
  const titleEl = document.getElementById('guideTitle');
  if (titleEl) titleEl.textContent = 'Indlæser…';

  try {
    const all = await loadAllGuides();
    const guide = all.find(g => (g.slug || '') === slug);
    if (!guide) {
      setText('guideContent', '<p>Kunne ikke finde guiden.</p>');
      if (titleEl) titleEl.textContent = 'Ikke fundet';
      return;
    }

    // Hero
    setText('breadcrumbTitle', guide.title || 'Guide');
    setText('guideTitle', guide.title || 'Guide');
    setText('guideIntro', guide.intro || '');
    setText('guideMeta', guide.meta || '');

    // Indhold
    const contentHolder = document.getElementById('guideContent');
    if (contentHolder) {
      contentHolder.innerHTML = guide.contentHtml || guide.content || '<p>—</p>';
      // Tving venstrejustering af indlejret HTML fra CMS
      contentHolder.style.textAlign = 'left';
    }

    // TOC + FAQ
    renderTOC(guide.toc || [], contentHolder);
    renderFAQ(guide.faq || []);

    // PR widget
    renderPRSlot();

  } catch (e) {
    console.error('[guide] fejl', e);
    setText('guideTitle', 'Noget gik galt');
    setText('guideContent', '<p>Kunne ikke indlæse guiden.</p>');
  }
}

document.addEventListener('DOMContentLoaded', mount);
