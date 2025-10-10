
import { loadAllRecipes, toggleFavorite, getFavorites } from './recipes.js';
import { formatStars } from './app.js';
import { currentUser } from './auth.js';

function ratingKey(slug, email){ return `od_rating_${slug}_${email||'anon'}`; }

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const data = await loadAllRecipes();
  const r = data.find(x=>x.slug===slug) || data[0];
  if (!r) return;

  document.getElementById('breadcrumbTitle').textContent = r.title;
  document.getElementById('recipeTitle').textContent = r.title;
  document.title = r.title + ' – opskrift-drikke.dk';
  let md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', r.description);
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
    const u = currentUser();
    if (!u) { alert('Log ind for at gemme opskrifter'); return; }
    const ok = toggleFavorite(r.slug);
    favBtn.classList.toggle('bg-rose-50', ok);
  });

  // user rating UI
  const ur = document.getElementById('userRating');
  let user = currentUser();
  const saved = localStorage.getItem(ratingKey(r.slug, user?.email));
  let my = saved ? Number(saved) : 0;

  function renderUserStars(val){
    let html='';
    for(let i=1;i<=5;i++){
      html += `<svg data-star="${i}" class="w-5 h-5 ${i<=val?'':'opacity-30'}"><use href="/assets/icons.svg#star"/></svg>`;
    }
    ur.innerHTML = html;
  }
  renderUserStars(my);
  ur.addEventListener('click', (e)=>{
    const s = e.target.closest('[data-star]'); if(!s) return;
    user = currentUser();
    if(!user){ alert('Log ind for at bedømme'); return; }
    const val = Number(s.getAttribute('data-star'));
    localStorage.setItem(ratingKey(r.slug, user.email), String(val));
    my = val;
    renderUserStars(my);
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
  ensureCanonicalAndBreadcrumbs(r);
});


// Canonical + BreadcrumbList for recipe
function ensureCanonicalAndBreadcrumbs(r){
  // canonical
  let link = document.querySelector("link[rel='canonical']");
  const url = location.origin + location.pathname + location.search;
  if (!link){
    link = document.createElement('link');
    link.setAttribute('rel','canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);

  // breadcrumbs JSON-LD
  const catUrl = location.origin + `/kategori/${r.category}.html`;
  const ld = {
    "@context":"https://schema.org",
    "@type":"BreadcrumbList",
    "itemListElement":[
      {"@type":"ListItem","position":1,"name":"Forside","item": location.origin + "/index.html"},
      {"@type":"ListItem","position":2,"name":"Opskrifter","item": location.origin + "/opskrifter/index.html"},
      {"@type":"ListItem","position":3,"name": r.category, "item": catUrl},
      {"@type":"ListItem","position":4,"name": r.title, "item": url}
    ]
  };
  const s = document.createElement('script');
  s.type='application/ld+json'; s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
  ensureCanonicalAndBreadcrumbs(r);
}
