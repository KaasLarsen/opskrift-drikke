// /js/recipe-page.js
import { loadAllRecipes, toggleFavorite, getFavorites } from './recipes.js';
import { formatStars, showToast } from './app.js';
import { currentUser } from './auth.js';

function qs(id){ return document.getElementById(id); }

function getSlug(){
  const p = new URLSearchParams(location.search);
  return (p.get('slug') || '').trim();
}

function findBySlug(data, slug){
  const s2 = decodeURIComponent(slug).toLowerCase();
  return data.find(x => (x.slug||'').toLowerCase() === s2) || null;
}

function renderList(list, el, ordered=false){
  if (!Array.isArray(list) || !el) return;
  el.innerHTML = list.map(item => ordered
    ? `<li>${item}</li>`
    : `<li>${item}</li>`
  ).join('');
}

function updateFavUI(btn, isFav){
  if (!btn) return;
  const svg = btn.querySelector('svg');
  const label = btn.querySelector('span');
  if (isFav){
    btn.classList.add('bg-rose-50','border-rose-300');
    svg?.classList.remove('opacity-30');
    if (label) label.textContent = 'Gemt';
  } else {
    btn.classList.remove('bg-rose-50','border-rose-300');
    svg?.classList.add('opacity-30');
    if (label) label.textContent = 'Gem';
  }
}

// lokale kommentarer pr. slug
function commentsKey(slug){ return `od_comments_${slug}`; }
function loadComments(slug){
  try { return JSON.parse(localStorage.getItem(commentsKey(slug))||'[]'); } catch { return []; }
}
function saveComments(slug, list){
  localStorage.setItem(commentsKey(slug), JSON.stringify(list.slice(-200)));
}

function addComment(slug, entry){
  const list = loadComments(slug);
  list.push(entry);
  saveComments(slug, list);
  return list;
}

function renderComments(slug, wrap){
  const list = loadComments(slug).sort((a,b)=>b.ts-a.ts);
  wrap.innerHTML = list.length
    ? list.map(c => `
        <div class="border rounded-2xl p-3">
          <div class="text-sm opacity-70">${new Date(c.ts).toLocaleString('da-DK')}</div>
          <div class="mt-1">${c.text}</div>
          <div class="text-sm opacity-70 mt-1">${c.user||'Anonym'}</div>
        </div>
      `).join('')
    : '<p class="opacity-70">Ingen kommentarer endnu.</p>';
}

function pickRelated(all, recipe, limit=6){
  const tagSet = new Set(recipe.tags || []);
  const sameCat = (r) => (r.category === recipe.category) && r.slug !== recipe.slug;
  const overlap = (r) => r.slug !== recipe.slug && (r.tags||[]).some(t => tagSet.has(t));
  const pool = all.filter(r => sameCat(r) || overlap(r));
  return pool.slice(0, limit);
}

async function init(){
  const slug = getSlug();
  const titleEl = qs('recipeTitle');
  const bread   = qs('breadcrumbTitle');
  const ratingStars = qs('ratingStars');
  const userRating  = qs('userRating');
  const metaInfo = qs('metaInfo');
  const favBtn = qs('favBtn');
  const ingredientsEl = qs('ingredients');
  const stepsEl       = qs('steps');
  const relatedList   = qs('relatedList');
  const commentList   = qs('commentList');
  const commentText   = qs('commentText');
  const commentSubmit = qs('commentSubmit');
  const commentHint   = qs('commentHint');

  if (!slug){
    titleEl.textContent = 'Slug mangler i URL';
    return;
  }

  let data = [];
  try {
    data = await loadAllRecipes();
  } catch (e){
    titleEl.textContent = 'Kunne ikke indlæse opskrifter';
    console.error(e);
    return;
  }

  const recipe = findBySlug(data, slug);
  if (!recipe){
    titleEl.textContent = 'Opskrift ikke fundet';
    return;
  }

  // meta
  document.title = recipe.title + ' – opskrift-drikke.dk';
  bread.textContent = recipe.title;
  titleEl.textContent = recipe.title;
  metaInfo.textContent = `${recipe.category} · ${recipe.time} min · ${recipe.servings || '1-2 glas'}`;

  // rating (vis)
  ratingStars.innerHTML = `${formatStars(recipe.rating)} <span class="text-sm opacity-70">(${recipe.reviews})</span>`;

  // rating (brugerens egen – klikbare 5 stjerner)
  userRating.innerHTML = Array.from({length:5}).map((_,i)=>`
    <button data-star="${i+1}" class="p-1" title="${i+1} stjerne">
      <svg class="w-5 h-5 opacity-50"><use href="/assets/icons.svg#star"/></svg>
    </button>
  `).join('');
  userRating.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-star]');
    if (!b) return;
    const u = currentUser();
    if (!u){ showToast('Du skal være logget ind for at bedømme'); return; }
    const n = +b.getAttribute('data-star');
    // lille local feedback
    [...userRating.querySelectorAll('svg')].forEach((svg, idx)=>{
      svg.classList.toggle('opacity-50', idx >= n);
    });
    showToast(`Tak for din bedømmelse (${n}★)`);
  });

  // ingredienser + steps
  renderList(recipe.ingredients || [], ingredientsEl);
  renderList(recipe.steps || [], stepsEl, true);

  // favorit
  const isFav = getFavorites().includes(recipe.slug);
  updateFavUI(favBtn, isFav);
  favBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const u = currentUser();
    if (!u){ showToast('Du skal være logget ind for at gemme'); return; }
    const ok = toggleFavorite(recipe.slug);

    // emit til “Ugens mest gemte”
    window.dispatchEvent(new CustomEvent('favorite:toggled', {
      detail: { slug: recipe.slug, ok, ts: Date.now() }
    }));

    updateFavUI(favBtn, ok);
    showToast(ok ? 'Gemt i favoritter' : 'Fjernet fra favoritter');
  });

  // kommentarer
  const u = currentUser();
  if (!u){
    commentHint.textContent = 'Du skal være logget ind.';
  } else {
    commentHint.textContent = `Logget ind som ${u.email}`;
  }
  renderComments(recipe.slug, commentList);
  commentSubmit.addEventListener('click', ()=>{
    const u = currentUser();
    if (!u){ showToast('Du skal være logget ind for at kommentere'); return; }
    const txt = (commentText.value||'').trim();
    if (!txt){ showToast('Skriv en kommentar først'); return; }
    const entry = { text: txt, ts: Date.now(), user: u.email };
    addComment(recipe.slug, entry);
    renderComments(recipe.slug, commentList);
    commentText.value = '';

    // valgfri hook til “Ugens brugeranmeldelse” (hvis weekly.js er på siden)
    window.dispatchEvent(new CustomEvent('comment:added', {
      detail: { slug: recipe.slug, text: txt, ts: entry.ts, userEmail: u.email }
    }));
  });

  // relaterede
  const rel = pickRelated(data, recipe, 6);
  relatedList.innerHTML = rel.length
    ? rel.map(r => `<li><a class="hover:underline" href="/pages/opskrift.html?slug=${r.slug}">${r.title}</a></li>`).join('')
    : '<li class="opacity-70">Ingen relaterede fundet.</li>';
}

document.addEventListener('DOMContentLoaded', init);
