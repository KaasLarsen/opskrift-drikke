// /js/top-content.js — stabil rendering af "Top indhold" fra manifest.json
const TOP_VER = 'v1'; // cache-bust hvis du ændrer manifestet

async function fetchTopContent() {
  const url = `/pages/topindhold/manifest.json?${TOP_VER}`;
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    const arr = await r.json();
    if (!Array.isArray(arr)) throw new Error('Bad JSON');
    return arr;
  } catch (e) {
    console.warn('[top-content] manifest mangler – bruger fallback', e);
    // Fallback, så sektionen virker selv uden filen (kan ændres frit)
    return [
      { title: 'Alt om ingefærshots', href: '/pages/topindhold/ingefaershot-guide.html', sub: 'Opskrift, styrke, holdbarhed.' },
      { title: 'Iste uden sukker', href: '/pages/topindhold/uden-sukker-guide.html', sub: 'Koldbryg og smagstricks.' },
      { title: 'Matcha – komplet guide', href: '/pages/topindhold/matcha-komplet-guide.html', sub: 'Temperatur og teknik.' },
      { title: 'Mælkeskum som en barista', href: '/pages/topindhold/maelkeskum-barista-guide.html', sub: 'Mikroskum og latte art.' }
    ];
  }
}

function cardHTML(item){
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
 * Renderer en grid af top-indhold.
 * @param {Object} opts
 * @param {string} opts.gridId        - ID på grid-containeren
 * @param {number} [opts.limit=4]     - Max antal kort (Infinity = alle)
 * @param {string} [opts.moreId]      - ID på "Se alle" link (valgfri)
 */
export async function mountTopContent(opts){
  const { gridId, limit = 4, moreId } = opts || {};
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const all = await fetchTopContent();
  const view = !isFinite(limit) ? all : all.slice(0, Math.max(0, limit));
  grid.innerHTML = view.map(cardHTML).join('');

  if (moreId) {
    const more = document.getElementById(moreId);
    if (more) more.href = '/pages/topindhold/index.html';
  }
}

// Auto-mount hvis vi finder data-attributter (valgfrit)
document.addEventListener('DOMContentLoaded', () => {
  const node = document.querySelector('[data-top-content-grid]');
  if (node) {
    const limit = Number(node.getAttribute('data-limit') || '4');
    const moreId = node.getAttribute('data-more-id') || null;
    mountTopContent({ gridId: node.id, limit, moreId });
  }
});
