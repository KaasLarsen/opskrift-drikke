
import { loadAllRecipes, toggleFavorite, getFavorites } from '/js/recipes.js';
import { formatStars } from '/js/app.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const data = await loadAllRecipes();
  const r = data.find(x=>x.slug===slug) || data[0];
  if (!r) return;

  document.getElementById('breadcrumbTitle').textContent = r.title;
  document.getElementById('recipeTitle').textContent = r.title;
  document.getElementById('ratingStars').innerHTML = formatStars(r.rating);
  document.getElementById('metaInfo').textContent = `${r.category} · ${r.time} min · ${r.servings} glas`;

  // ingredients
  document.getElementById('ingredients').innerHTML = r.ingredients.map(i=>`<li>${i}</li>`).join('');
  // steps
  document.getElementById('steps').innerHTML = r.steps.map(s=>`<li>${s}</li>`).join('');

  // related
  const related = data.filter(x=>x.category===r.category && x.slug!==r.slug).slice(0,5);
  document.getElementById('relatedList').innerHTML = related.map(x=>`<a href="/pages/opskrift.html?slug=${x.slug}" class="block hover:underline">${x.title}</a>`).join('');

  // favorite
  const favBtn = document.getElementById('favBtn');
  const favs = getFavorites();
  if (favs.includes(r.slug)){ favBtn.classList.add('bg-rose-50'); }
  favBtn.addEventListener('click', ()=>{
    const ok = toggleFavorite(r.slug);
    favBtn.classList.toggle('bg-rose-50', ok);
  });

  // schema.org (Recipe)
  const ld = {
    "@context":"https://schema.org",
    "@type":"Recipe",
    "name": r.title,
    "description": r.description,
    "recipeIngredient": r.ingredients,
    "recipeInstructions": r.steps.map(s=>({"@type":"HowToStep","text":s})),
    "prepTime": `PT${Math.max(1, Math.round(r.time*0.4))}M`,
    "cookTime": `PT${Math.max(1, Math.round(r.time*0.6))}M`,
    "totalTime": `PT${r.time}M`,
    "recipeYield": `${r.servings} glas`,
    "author": {"@type":"Person","name":"Opskrift-drikke.dk"},
    "aggregateRating": {"@type":"AggregateRating","ratingValue": r.rating, "reviewCount": r.reviews}
  };
  const s = document.createElement('script');
  s.type='application/ld+json'; s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
});
