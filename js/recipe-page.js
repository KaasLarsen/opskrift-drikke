// Pæn opskriftvisning + relaterede kort (samme kortstil som forsiden)
import { loadAllRecipes, renderRecipeCard } from '/js/recipes.js';

const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function getSlug() {
  const u = new URL(location.href);
  return u.searchParams.get('slug') || '';
}

function stars(rating = 0) {
  const val = Math.max(0, Math.min(5, Math.round(rating)));
  return '★★★★★'.slice(0, val) + '☆☆☆☆☆'.slice(0, 5 - val);
}

function chip(text, href = null) {
  const cls = 'inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50';
  return href ? `<a class="${cls}" href="${href}">${text}</a>` : `<span class="${cls}">${text}</span>`;
}

function renderShell(r) {
  document.title = `${r.title} – opskrift-drikke.dk`;
  $('#crumbTitle').textContent = r.title || 'Opskrift';
  $('#title').textContent = r.title || 'Ukendt opskrift';

  // meta (rating + evt. tid/portioner hvis findes)
  const metaBits = [];
  if (r.rating != null) metaBits.push(`Bedømmelse: ${stars(r.rating)}`);
  if (r.servings) metaBits.push(`${r.servings} personer`);
  if (r.time)     metaBits.push(`${r.time}`);
  $('#meta').innerHTML = metaBits.map(m => `<span class="px-2 py-0.5 rounded-full border bg-white">${m}</span>`).join('');

  // intro
  $('#intro').innerHTML = `
    ${r.description ? `<p class="text-stone-700">${r.description}</p>` : '<p class="text-stone-500">Ingen beskrivelse.</p>'}
  `;

  // ingredienser
  $('#ingredients').innerHTML = (r.ingredients || [])
    .map(i => `<li>${i}</li>`).join('');

  // steps
  $('#steps').innerHTML = (r.steps || [])
    .map(s => `<li>${s}</li>`).join('');

  // rating-box
  $('#rating').innerHTML = `
    <div class="font-medium">Bedømmelse</div>
    <div class="mt-1 text-lg tracking-wide">${stars(r.rating)} <span class="text-sm text-stone-500 align-middle">(${r.reviews || 0})</span></div>
  `;

  // tags
  const t = (r.tags || []).slice(0, 10);
  $('#tags').innerHTML = t.length
    ? t.map(tag => chip(tag, `/pages/tag.html?tag=${encodeURIComponent(tag)}`)).join('')
    : '<span class="text-sm text-stone-500">Ingen tags</span>';
}

function pickRelated(all, current, max = 8) {
  const set = new Set((current.tags || []).map(t => t.toLowerCase()));
  const pool = all.filter(x => x.slug !== current.slug && (x.tags || []).some(t => set.has(t.toLowerCase())));
  const take = (pool.length ? pool : all.filter(x => x.slug !== current.slug)).slice(0, max);
  return take;
}

async function mount() {
  const slug = getSlug();
  const hostRelated = $('#related');
  const prSlot = $('#pr-recipe-slot');

  try {
    const all = await loadAllRecipes();

    const r = all.find(x => (x.slug || '').toString() === slug)
         || all.find(x => (x.slug || '').toString().toLowerCase() === slug.toLowerCase());

    if (!r) {
      $('#title').textContent = 'Opskrift ikke fundet';
      $('#intro').innerHTML = `<div class="text-stone-600">Kunne ikke finde <code>${slug}</code>.</div>`;
      return;
    }

    renderShell(r);

    // Relaterede kort (samme kort-render som forsiden → ens look)
    const related = pickRelated(all, r, 8);
    hostRelated.innerHTML = related.map(renderRecipeCard).join('');

    // Sponsor: brug din rotator hvis den findes, ellers bare et link
    if (window.mountPR) {
      // Brug separat slot-id for opskrift-siden
      window.mountPR('#pr-recipe-slot');
    } else if (prSlot) {
      prSlot.innerHTML = `
        <a class="block p-3 border rounded-xl hover:bg-stone-50" href="https://www.pricerunner.dk/" rel="nofollow">
          <div class="text-sm">Sammenlign priser på udstyr</div>
          <div class="text-xs text-stone-500">Annonce • PriceRunner</div>
        </a>`;
    }
  } catch (e) {
    console.error(e);
    $('#intro').innerHTML = `<div class="text-red-600">Fejl under indlæsning.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', mount);
