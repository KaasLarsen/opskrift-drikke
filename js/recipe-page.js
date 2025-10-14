// recipe-page.js — stabil opskriftvisning uden eksterne afhængigheder
import { loadAllRecipes } from '/js/recipes.js';

const $ = (s)=>document.querySelector(s);

function render(r){
  const host = $('#recipe');
  if (!host) return;
  host.innerHTML = `
    <article class="prose prose-stone max-w-none">
      <h1>${r.title}</h1>
      <p class="text-stone-600">${r.description || ''}</p>
      ${(r.tags?.length ? `<p>${r.tags.map(t=>`<span class="px-2 py-0.5 border rounded-full mr-1">#${t}</span>`).join('')}</p>`:'')}
      ${Array.isArray(r.ingredients) ? `<h2>Ingredienser</h2><ul>${r.ingredients.map(i=>`<li>${i}</li>`).join('')}</ul>` : ''}
      ${Array.isArray(r.steps) ? `<h2>Sådan gør du</h2><ol>${r.steps.map(s=>`<li>${s}</li>`).join('')}</ol>` : ''}
    </article>
  `;
}

async function mount(){
  const slug = new URL(location.href).searchParams.get('slug');
  const shell = $('#recipe');
  if (!shell) return;

  try{
    const all = await loadAllRecipes();
    const r = all.find(x => x.slug === slug);
    if (!r) { shell.textContent = 'Opskrift ikke fundet.'; return; }
    render(r);
  }catch(err){
    shell.textContent = 'Kunne ikke indlæse opskrift.';
  }
}
document.addEventListener('DOMContentLoaded', mount);
