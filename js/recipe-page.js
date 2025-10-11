// /js/recipe-page.js
import { loadAllRecipes } from './recipes.js';
import { currentUser } from './auth.js';
import { formatStars, showToast } from './app.js';

function getSlug(){
  const p = new URLSearchParams(location.search);
  return (p.get('slug') || '').trim();
}
function findBySlug(data, slug){
  const s2 = decodeURIComponent(slug).toLowerCase();
  return data.find(x => (x.slug||'').toLowerCase() === s2) || null;
}

async function init(){
  const titleEl = document.getElementById('recipeTitle');
  const breadcrumb = document.getElementById('breadcrumbTitle');
  const ingredientsEl = document.getElementById('ingredients');
  const stepsEl = document.getElementById('steps');
  const metaInfo = document.getElementById('metaInfo');
  const favBtn = document.getElementById('favBtn');
  const ratingStars = document.getElementById('ratingStars');

  const slug = getSlug();
  if (!slug){
    titleEl.textContent = 'Opskrift mangler slug i url';
    document.getElementById('recipeError')?.classList.remove('hidden');
    return;
  }

  let data;
  try {
    data = await loadAllRecipes();
  } catch (e) {
    titleEl.textContent = 'Kunne ikke indlæse opskrifter (data mangler)';
    document.getElementById('recipeError')?.classList.remove('hidden');
    return;
  }

  const r = findBySlug(data, slug);
  if (!r){
    titleEl.textContent = 'Opskrift ikke fundet';
    document.getElementById('recipeError')?.classList.remove('hidden');
    return;
  }

  // udfyld side
  titleEl.textContent = r.title;
  document.title = r.title + ' – opskrift-drikke.dk';
  breadcrumb.textContent = r.title;

  ratingStars.innerHTML = `${formatStars(r.rating)}<span class="ml-1 opacity-70">(${r.reviews})</span>`;
  metaInfo.textContent = `${r.category} · ${r.time} min · ${r.servings} personer`;

  ingredientsEl.innerHTML = r.ingredients.map(i=>`<li>${i}</li>`).join('');
  stepsEl.innerHTML = r.steps.map(s=>`<li>${s}</li>`).join('');

  // favorit (kræver login)
  const favs = JSON.parse(localStorage.getItem('od_favs')||'[]');
  if (favs.includes(r.slug)) favBtn.classList.add('bg-rose-50','border-rose-300');
  favBtn.addEventListener('click', ()=>{
    const u = currentUser();
    if (!u){ showToast('Du skal være logget ind for at gemme'); return; }
    const i = favs.indexOf(r.slug);
    if (i>=0){ favs.splice(i,1); favBtn.classList.remove('bg-rose-50','border-rose-300'); }
    else { favs.push(r.slug); favBtn.classList.add('bg-rose-50','border-rose-300'); }
    localStorage.setItem('od_favs', JSON.stringify(favs));
  });

  // relaterede
  const rel = data.filter(x=>x.category===r.category && x.slug!==r.slug).slice(0,6);
  const relatedList = document.getElementById('relatedList');
  relatedList.innerHTML = rel.map(x=>`<li><a class="hover:underline" href="/pages/opskrift.html?slug=${x.slug}">${x.title}</a></li>`).join('');
}

document.addEventListener('DOMContentLoaded', init);
