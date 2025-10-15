// /js/recipe-page.js — detaljeret opskriftvisning
import { loadAllRecipes, renderRecipeCard, isFav, toggleFav } from '/js/recipes.js';

function getSlug() {
  const url = new URL(location.href);
  // Tillad både ?slug=… og fallback til /…/opskrift/<slug> (hvis rewrites)
  const q = url.searchParams.get('slug');
  if (q) return q;
  const last = (location.pathname.split('/').pop() || '');
  return decodeURIComponent(last.replace(/^opskrift(\.html)?$/i,''));
}

function html(strings, ...vals){ return strings.map((s,i)=>s+(vals[i]??'')).join(''); }

function renderRecipe(r) {
  const root = document.getElementById('recipeRoot');
  if (!root) return;

  const id    = r.id || r.slug || r.key || '';
  const tags  = (r.tags || []).slice(0, 5).map(t =>
    `<span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${t}</span>`
  ).join(' ');

  const stars = Math.round(r.rating || 4);
  const starHtml = '★★★★★'.split('').map((s,i)=>`<span>${i<stars?'★':'☆'}</span>`).join('');
  const favActive = isFav(id);

  root.innerHTML = html`
    <article class="card border bg-white rounded-2xl p-4 md:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold leading-snug">${r.title || 'Uden titel'}</h1>
          ${r.subtitle ? `<p class="mt-2 text-stone-700">${r.subtitle}</p>` : ''}
          <div class="mt-2 flex flex-wrap gap-2">${tags}</div>
          <div class="mt-2 text-sm">${starHtml} <span class="text-stone-500">(${r.votes || 0})</span></div>
        </div>

        <button id="favBtn"
                class="fav-btn ${favActive ? 'is-fav':''}"
                aria-label="Gem som favorit" title="Gem som favorit">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.35-9.5-8.35C1 9.5 2.9 6.5 6 6.5c1.9 0 3.1 1 4 2 0.9-1 2.1-2 4-2 3.1 0 5 3 3.5 6.15C19.5 16.65 12 21 12 21z"/></svg>
        </button>
      </div>

      <div class="mt-6 grid md:grid-cols-2 gap-6">
        <section>
          <h2 class="text-lg font-semibold mb-2">Ingredienser</h2>
          <ul class="list-disc ml-5 space-y-1">
            ${(r.ingredients || []).map(i=>`<li>${i}</li>`).join('')}
          </ul>
        </section>

        <aside>
          <h2 class="text-lg font-semibold mb-2">Noter</h2>
          <div class="prose prose-stone max-w-none text-[15px] leading-relaxed">
            ${(r.notes && Array.isArray(r.notes) ? r.notes.map(n=>`<p>${n}</p>`).join('') : (r.notes || '<p>—</p>'))}
          </div>
        </aside>

        <section class="md:col-span-2">
          <h2 class="text-lg font-semibold mb-2">Sådan gør du</h2>
          <ol class="list-decimal ml-5 space-y-2">
            ${(r.steps || r.method || []).map(s=>`<li>${s}</li>`).join('')}
          </ol>
        </section>
      </div>
    </article>

    <!-- Sponsor midt på siden (ikke ude til højre) -->
    <section id="sponsoredSlot" class="mt-6"></section>

    <section class="mt-8">
      <h2 class="text-xl font-semibold">Relaterede opskrifter</h2>
      <div id="relatedGrid" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"></div>
    </section>
  `;

  // Favorit-knap (login-krav håndteres i recipes.js)
  document.getElementById('favBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const ok = toggleFav(id);
    e.currentTarget.classList.toggle('is-fav', ok);
  });
}

function renderRelated(all, r) {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;
  const firstTag = (r.tags || [])[0];
  const pool = firstTag
    ? all.filter(x => (x.slug||x.id)!==(r.slug||r.id) && (x.tags||[]).includes(firstTag))
    : all.filter(x => (x.slug||x.id)!==(r.slug||r.id));
  grid.innerHTML = pool.slice(0, 8).map(renderRecipeCard).join('');
}

/* === Sponsor/PriceRunner rotator (robust) ===
   Prøver først at dynamic-importe modulet (ESM).
   Hvis du i /js/pricerunner-rotator.js også sætter window.mountPR = mountPR,
   vil fallback’et nedenfor virke uden import. */
async function renderSponsored() {
  const slot = document.getElementById('sponsoredSlot');
  if (!slot) return;

  slot.innerHTML = `
    <div class="card bg-white p-4 border rounded-2xl">
      <div class="text-sm opacity-70 mb-2">Annonce i samarbejde med PriceRunner</div>
      <div id="pr-recipe-slot"></div>
    </div>
  `;

  try {
    // Forsøg ESM import
    const mod = await import('/js/pricerunner-rotator.js');
    if (mod?.mountPR) {
      mod.mountPR('#pr-recipe-slot');
      return;
    }
  } catch (e) {
    console.debug('[sponsor] ESM import fejlede – prøver window.mountPR', e);
  }

  // Fallback hvis rotatoren eksponerer sig globalt
  if (window.mountPR) {
    try { window.mountPR('#pr-recipe-slot'); } catch {}
  }
}

async function mount() {
  const root = document.getElementById('recipeRoot');
  if (!root) return;

  const slug = getSlug();
  root.querySelector('h1')?.replaceWith(
    Object.assign(document.createElement('h1'), {
      className:'text-4xl font-semibold',
      textContent:'Indlæser…'
    })
  );

  try {
    const all = await loadAllRecipes();
    const rec = all.find(x => (x.slug || x.id) === slug);
    if (!rec) {
      root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Kunne ikke finde opskriften.</div>`;
      return;
    }
    renderRecipe(rec);
    renderSponsored();
    renderRelated(all, rec);
  } catch (e) {
    console.error('[recipe-page] fejl', e);
    root.innerHTML = `<div class="card border bg-white rounded-2xl p-4 md:p-6">Noget gik galt ved indlæsning.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', mount);
