// /js/top-content.js — Top indhold (manifest-drevet)
// Ingen versionsparam. Henter altid friskt (cache:'no-cache').

async function getManifest() {
  const url = '/pages/topindhold/manifest.json';
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (!Array.isArray(data)) throw new Error('Manifest is not an array');
    return data;
  } catch (err) {
    console.warn('[top-content] Kunne ikke hente manifest.json — bruger fallback', err);
    // Fallback (4 kort), så UI stadig virker hvis filen mangler midlertidigt
    return [
      { title: 'Alt om ingefærshots',         href: '/pages/topindhold/ingefaershot-guide.html',     sub: 'Opskrift, styrke, holdbarhed.' },
      { title: 'Iste uden sukker',            href: '/pages/topindhold/uden-sukker-guide.html',      sub: 'Koldbryg og smagstricks.' },
      { title: 'Matcha – komplet guide',      href: '/pages/topindhold/matcha-komplet-guide.html',   sub: 'Temperatur og teknik.' },
      { title: 'Mælkeskum som en barista',    href: '/pages/topindhold/maelkeskum-barista-guide.html', sub: 'Mikroskum og latte art.' }
    ];
  }
}

function card(item) {
  const t = item.title || 'Top indhold';
  const s = item.sub || '';
  const href = item.href || '#';
  return `
    <a href="${href}" class="block border bg-white rounded-2xl p-5 hover:shadow transition-shadow card">
      <h3 class="font-medium">${t}</h3>
      ${s ? `<p class="text-sm opacity-70 mt-1">${s}</p>` : ''}
    </a>
  `;
}

/**
 * Monter et grid med Top indhold.
 * @param {Object} opts
 * @param {string} opts.gridId     - id på container (på siden)
 * @param {number} [opts.limit=4]  - max kort (Infinity = alle)
 * @param {string} [opts.moreId]   - id på "Se alle"-link (valgfri)
 */
export async function mountTopContent(opts = {}) {
  const { gridId, limit = 4, moreId } = opts;
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const items = await getManifest();
  const view = Number.isFinite(limit) ? items.slice(0, Math.max(0, limit)) : items;
  grid.innerHTML = view.map(card).join('');

  if (moreId) {
    const more = document.getElementById(moreId);
    if (more) {
      // VIGTIGT: absolut, lowercase sti (undgår “download”-adfærd pga. server/dir-listing)
      more.setAttribute('href', '/pages/topindhold/index.html');
      more.removeAttribute('download'); // bare for at være 100% sikker
    }
  }
}

// Auto-mount via data-attribut (valgfrit hook til forsiden)
document.addEventListener('DOMContentLoaded', () => {
  const node = document.querySelector('[data-top-content-grid]');
  if (node) {
    const limit = Number(node.getAttribute('data-limit') || '4');
    const moreId = node.getAttribute('data-more-id') || null;
    mountTopContent({ gridId: node.id, limit, moreId });
  }
});
