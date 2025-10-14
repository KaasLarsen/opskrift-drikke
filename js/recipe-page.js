// Stabil visning af en enkelt opskrift
import { loadAllRecipes } from '/js/recipes.js';

const $ = (s) => document.querySelector(s);

function getSlugFromUrl() {
  const u = new URL(location.href);
  // Tillad både /pages/opskrift?slug=... og /pages/opskrift.html?slug=...
  return u.searchParams.get('slug') || '';
}

function renderRecipe(r) {
  const host = $('#recipe');
  if (!host) return;

  const tags = (r.tags || []).map(t =>
    `<span class="px-2 py-0.5 border rounded-full text-xs mr-1">#${t}</span>`
  ).join('');

  const rating = Math.max(0, Math.min(5, Math.round(r.rating || 0)));
  const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);

  host.innerHTML = `
    <article class="prose prose-stone max-w-none">
      <h1 class="!mb-2">${r.title || 'Ukendt opskrift'}</h1>
      ${tags ? `<p class="!mt-0">${tags}</p>` : ''}
      ${r.description ? `<p class="text-stone-600">${r.description}</p>` : ''}

      ${Array.isArray(r.ingredients) && r.ingredients.length ? `
        <h2>Ingredienser</h2>
        <ul>${r.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
      ` : ''}

      ${Array.isArray(r.steps) && r.steps.length ? `
        <h2>Sådan gør du</h2>
        <ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      ` : ''}

      <p class="text-sm text-stone-500 mt-4">Bedømmelse: ${stars}</p>
    </article>
  `;
}

async function mount() {
  const shell = $('#recipe');
  if (!shell) return;

  try {
    const slug = getSlugFromUrl();
    if (!slug) { shell.textContent = 'Mangler slug i URL.'; return; }

    const all = await loadAllRecipes();
    // slug kan være med/uden case/diakritik – match tolerant
    const hit = all.find(r => (r.slug || '').toString() === slug)
            || all.find(r => (r.slug || '').toString().toLowerCase() === slug.toLowerCase());

    if (!hit) {
      shell.innerHTML = `
        <div class="p-4 border rounded-2xl bg-white">
          Kunne ikke finde opskriften: <code>${slug}</code>.
          <div class="text-sm text-stone-500 mt-2">Tjek at slug findes i dine datafiler.</div>
        </div>`;
      return;
    }
    renderRecipe(hit);
  } catch (err) {
    console.error('recipe-page error', err);
    shell.textContent = 'Kunne ikke indlæse opskrift.';
  }
}

document.addEventListener('DOMContentLoaded', mount);
