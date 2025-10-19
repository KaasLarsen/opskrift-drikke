// /js/top-content.js — render "Top indhold" fra manifest.json
const TOP_VER = 'v1'; // kan ændres for cache-bust

async function fetchTopContent() {
  const url = `/pages/topindhold/manifest.json?${TOP_VER}`;
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} på ${url}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('Manifest er ikke et array');
  return data;
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

export async function mountTopContent({ gridId = 'topIndexGrid', limit = Infinity } = {}){
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const status = document.getElementById('topStatus');

  try {
    const all = await fetchTopContent();
    const view = isFinite(limit) ? all.slice(0, Math.max(0, limit)) : all;
    if (!view.length) {
      grid.innerHTML = '';
      if (status) status.textContent = 'Ingen elementer i top-indhold endnu.';
      return;
    }
    grid.innerHTML = view.map(cardHTML).join('');
    if (status) status.textContent = '';
  } catch (err) {
    console.error('[top-content] fejl:', err);
    if (status) status.textContent = 'Kunne ikke hente Top indhold (manifest mangler eller er ugyldigt).';
  }
}

// Auto-mount hvis vi er på en side med #topIndexGrid
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('topIndexGrid');
  if (grid) mountTopContent({ gridId: 'topIndexGrid', limit: Infinity });
});
