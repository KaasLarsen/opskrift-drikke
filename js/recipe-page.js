// /js/recipe-page.js — detaljeret opskriftvisning (faste, absolutte imports)
import { loadAllRecipes, renderRecipeCard, isFav, toggleFav } from '/js/recipes.js';

function getSlug() {
  const url = new URL(location.href);
  return url.searchParams.get('slug') || '';
}

function el(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function renderRecipe(r) {
  const host = document.getElementById('recipeRoot');
  if (!host) return;

  const tags = (r.tags || []).slice(0, 5).map(t =>
    `<span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>`
  ).join(' ');

  const stars = Math.round(r.rating || 4);
  const starHtml = '★★★★★'.split('').map((s,i)=>`<span>${i<stars?'★':'☆'}</span>`).join('');
  const favActive = isFav(r.id || r.slug || r.key || '');

  host.innerHTML = `
    <article class="guide-article card border bg-white rounded-2xl p-4 md:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold leading-snug">${r.title || 'Uden titel'}</h1>
          <div class="mt-2 flex flex-wrap gap-2">${tags}</div>
          <div class="mt-2 text-sm">${starHtml} <span class="text-stone-500">(${r.votes || 0})</span></div>
        </div>
        <button id="favBtn" class="fav-btn ${favActive ? 'is-fav':''}" aria-label="Gem som favorit" title="Gem som favorit">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-9.5-8.35C1 9.5 2.9 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.1 0 5 3 3.5 6.15C19.5 16.65 12 21 12 21z"/></svg>
        </button>
      </div>

      ${r.subtitle ? `<p class="mt-3 text-stone-700">${r.subtitle}</p>` : ''}

      <div class="mt-6 grid md:grid-cols-2 gap-6">
        <section>
          <h2 class="text-lg font-semibold mb-2">Ingredienser</h2>
          <ul class="list-disc ml-5 space-y-1">
            ${(r.ingredients || []).map(i=>`<li>${i}</li>`).join('')}
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-semibold mb-2">Fremgangsmåde</h2>
          <ol class="list-decimal ml-5 space-y-2">
            ${(r.steps || r.method || []).map(s=>`<li>${s}</li>`).join('')}
          </ol>
        </section>
      </div>
    </article>

    <div id="sponsoredSlot" class="mt-6"></div>
    <div class="mt-8">
      <h2 class="text-xl font-semibold">Relaterede opskrifter</h2>
      <div id="relatedGrid" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"></div>
    </div>
  `;

  // Favorit-knap
  const favBtn = document.getElementById('favBtn');
  favBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const ok = toggleFav(r.id || r.slug || r.key || '');
    favBtn.classList.toggle('is-fav', ok);
  });
}

function renderRelated(all, r) {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;
  const key = (r.tags && r.tags[0]) || '';
  const pool = key ? all.filter(x => (x.slug||x.id)!==(r.slug||r.id) && (x.tags||[]).includes(key)) : all;
  grid.innerHTML = pool.slice(0, 8).map(renderRecipeCard).join('');
}

function renderSponsored() {
  const slot = document.getElementById('sponsoredSlot');
  if (!slot) return;
  slot.innerHTML = `
    <div class="card bg-white p-4 border rounded-2xl relative">
      <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
      <div id="pr-recipe-slot"></div>
    </div>
  `;
  // Reuse dit eksisterende rotator-script hvis det er på siden
  if (window.mountPR) { window.mountPR('#pr-recipe-slot'); }
}

async function mount() {
  const slug = getSlug();
  const root = document.getElementById('recipeRoot');
  if (!root) return;

  root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Indlæser…</div>`;

  try {
    const all = await loadAllRecipes();
    const r = all.find(x => (x.slug || x.id) === slug);
    if (!r) {
      root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Kunne ikke finde opskriften.</div>`;
      return;
    }
    renderRecipe(r);
    renderSponsored();
    renderRelated(all, r);
  } catch (e) {
    console.error('[recipe-page] fejl', e);
    root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Noget gik galt ved indlæsning.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', mount);
