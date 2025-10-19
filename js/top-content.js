// /js/top-content.js — render "Top indhold" fra manifest.json (med badge + stjerner)
const TOP_VER = 'v3'; // bump for cache-bust når du ændrer manifestet

async function fetchTopContent() {
  const url = `/pages/topindhold/manifest.json?${encodeURIComponent(TOP_VER)}`;
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status} på ${url}`);
  const data = await r.json();
  if (!Array.isArray(data)) throw new Error('Manifest er ikke et array');
  return data;
}

/**
 * Laver et pænt top-kort.
 * Manifest-felter (valgfri): title, href, sub, icon
 */
function cardHTML(item) {
  const t = (item?.title || 'Top indhold').toString();
  const s = (item?.sub || '').toString();
  const href = (item?.href || '#').toString();
  const icon = (item?.icon || '').toString();

  return `
    <a href="${href}" class="block relative border bg-white rounded-2xl p-5 transition-shadow hover:shadow-md card focus:outline-none focus:ring-2 focus:ring-orange-300">
      <!-- Badge øverst -->
      <span class="absolute -top-2 -right-2 select-none" style="pointer-events:none">
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] leading-none bg-orange-50 border-orange-200 text-orange-700 shadow-sm">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M12 17.3l-4.12 2.45 1.1-4.72L5.9 11l4.84-.41L12 6l1.26 4.59 4.84.41-3.08 4.03 1.1 4.72z"/>
          </svg>
          Top
        </span>
      </span>

      ${icon ? `
        <div class="mb-3">
          <img src="${icon}" alt="" class="w-10 h-10 rounded-xl border bg-white object-cover"/>
        </div>` : ''}

      <h3 class="font-semibold text-stone-900">${t}</h3>
      ${s ? `<p class="text-sm opacity-75 mt-1">${s}</p>` : ''}

      <!-- Dekorative stjerner i bunden -->
      <div class="mt-3 text-amber-500 opacity-90" aria-hidden="true">
        <span>★</span><span>★</span><span>★</span><span>★</span><span class="opacity-40">★</span>
      </div>
    </a>
  `;
}

/**
 * Render grid med Top indhold.
 * @param {Object} opts
 * @param {string} opts.gridId               - ID på grid-containeren
 * @param {number} [opts.limit=Infinity]     - Max antal kort (Infinity = alle)
 * @param {string} [opts.statusId]           - ID på status/fejl <div> (valgfri)
 */
export async function mountTopContent({ gridId = 'topIndexGrid', limit = Infinity, statusId } = {}) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  // ✅ HÅRD GUARD: undgå dobbeltrender selv hvis funktionen kaldes to gange
  if (grid.dataset.tcMounted === '1') return;
  grid.dataset.tcMounted = '1';

  const status = statusId ? document.getElementById(statusId) : null;
  if (status) status.textContent = 'Indlæser…';

  try {
    const all = await fetchTopContent();
    const view = isFinite(limit) ? all.slice(0, Math.max(0, limit)) : all;

    grid.innerHTML = view.map(cardHTML).join('');
    if (status) status.textContent = '';
  } catch (err) {
    console.error('[top-content] fejl:', err);
    grid.innerHTML = '';
    if (status) status.textContent = 'Kunne ikke hente Top indhold (manifest mangler eller er ugyldigt).';
  }
}

// ❌ INTET auto-mount her! (det skabte dubletter nogle steder)
