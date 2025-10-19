// /js/top-content.js — Top indhold fra manifest + hårdfør link-normalisering

function toAbsoluteTopUrl(href) {
  if (!href) return '/pages/topindhold/index.html';
  try {
    // Gør relative til absolut i forhold til origin
    const u = new URL(href, window.location.origin);

    // Tving korrekt mappe og lowercase mappe-navn
    // (Linux servere er case-sensitive; "Topindhold" fejler)
    // Vi beholder selve filnavnet som angivet (case kan være vigtigt lokalt)
    const parts = u.pathname.split('/').filter(Boolean);
    // find index for "topindhold" mappe (uanset case)
    const i = parts.findIndex(p => p.toLowerCase() === 'topindhold');
    if (i >= 0) {
      parts[i] = 'topindhold';
      // rekombinér
      u.pathname = '/' + parts.join('/');
    }

    // Hvis linket peger på mappen /pages/topindhold/ (slutter med /),
    // tilføj index.html for at undgå directory-redirects der kan trigge download
    if (u.pathname.match(/\/pages\/topindhold\/?$/)) {
      u.pathname = '/pages/topindhold/index.html';
    }

    // Sørg for at det er samme origin (ellers kan nogle browsere downloade)
    if (u.origin !== window.location.origin) {
      // Hvis du VIL tillade eksterne, returnér u.toString() her i stedet.
      return '/pages/topindhold/index.html';
    }

    return u.pathname + u.search + u.hash;
  } catch {
    return '/pages/topindhold/index.html';
  }
}

async function getManifest() {
  const url = '/pages/topindhold/manifest.json';
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (!Array.isArray(data)) throw new Error('Manifest er ikke et array');
    // Normalisér hrefs direkte i data
    return data.map(item => ({
      ...item,
      href: toAbsoluteTopUrl(item.href)
    }));
  } catch (err) {
    console.warn('[top-content] manifest fejlede – fallback bruges', err);
    return [
      { title: 'Alt om ingefærshots',       href: toAbsoluteTopUrl('/pages/topindhold/ingefaershot-guide.html'),      sub: 'Opskrift, styrke, holdbarhed.' },
      { title: 'Iste uden sukker',          href: toAbsoluteTopUrl('/pages/topindhold/uden-sukker-guide.html'),       sub: 'Koldbryg og smagstricks.' },
      { title: 'Matcha – komplet guide',    href: toAbsoluteTopUrl('/pages/topindhold/matcha-komplet-guide.html'),    sub: 'Temperatur og teknik.' },
      { title: 'Mælkeskum som en barista',  href: toAbsoluteTopUrl('/pages/topindhold/maelkeskum-barista-guide.html'), sub: 'Mikroskum og latte art.' }
    ];
  }
}

function card(item) {
  const t = item.title || 'Top indhold';
  const s = item.sub || '';
  const href = toAbsoluteTopUrl(item.href);
  return `
    <a href="${href}" class="block border bg-white rounded-2xl p-5 hover:shadow transition-shadow card" data-top-link>
      <h3 class="font-medium">${t}</h3>
      ${s ? `<p class="text-sm opacity-70 mt-1">${s}</p>` : ''}
    </a>
  `;
}

function hardenLinks(scopeEl) {
  // Fjern evt. download-attributter og normalisér href
  scopeEl.querySelectorAll('a[data-top-link], a#topMoreLink, a[data-top-more]').forEach(a => {
    a.removeAttribute('download');
    a.setAttribute('rel', 'noopener'); // sikkerhed
    const fixed = toAbsoluteTopUrl(a.getAttribute('href'));
    a.setAttribute('href', fixed);
  });

  // Klik-sikring: force navigation via location.assign (omgår enkelte edge-cases)
  scopeEl.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-top-link], a#topMoreLink, a[data-top-more]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (!href) return;
    // Hvis samme origin og .html, så brug JS-navigation
    try {
      const u = new URL(href, location.origin);
      if (u.origin === location.origin && u.pathname.endsWith('.html')) {
        e.preventDefault();
        window.location.assign(u.pathname + u.search + u.hash);
      }
    } catch { /* no-op */ }
  });
}

/**
 * Monter Top indhold
 * @param {Object} opts
 * @param {string} opts.gridId
 * @param {number} [opts.limit=4]
 * @param {string} [opts.moreId] - id på "Se alle"-link (valgfri)
 */
export async function mountTopContent(opts = {}) {
  const { gridId, limit = 4, moreId } = opts;
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const items = await getManifest();
  const view = Number.isFinite(limit) ? items.slice(0, Math.max(0, limit)) : items;
  grid.innerHTML = view.map(card).join('');

  // more-link
  if (moreId) {
    const more = document.getElementById(moreId);
    if (more) {
      more.setAttribute('href', toAbsoluteTopUrl('/pages/topindhold/index.html'));
      more.setAttribute('data-top-more', 'true');
      more.removeAttribute('download');
    }
  }

  hardenLinks(grid.parentElement || document);
}

// Auto-mount hvis data-attribut bruges
document.addEventListener('DOMContentLoaded', () => {
  const node = document.querySelector('[data-top-content-grid]');
  if (node) {
    const limit = Number(node.getAttribute('data-limit') || '4');
    const moreId = node.getAttribute('data-more-id') || null;
    mountTopContent({ gridId: node.id, limit, moreId });
  }
});
