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
  el.innerHTML = list.map(item => ordered ? `<li>${item}</li>` : `<li>${item}</li>`).join('');
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

// --- PriceRunner widget (failsafe + kompatibel med begge mappings) ---
async function safeMountPRWidget(recipe){
  try {
    const rotator = await import('/js/pricerunner-rotator.js');
    const mapping = await import('/js/pr-widgets-map.js');

    // vælg funktion fra mapping filen – støt både chooseWidgetKeys (array) og chooseWidgetKeyFrom (single)
    let key = null;
    if (typeof mapping.chooseWidgetKeys === 'function') {
      const keys = mapping.chooseWidgetKeys(recipe) || [];
      key = Array.isArray(keys) && keys.length ? keys[0] : null;
    } else if (typeof mapping.chooseWidgetKeyFrom === 'function') {
      key = mapping.chooseWidgetKeyFrom(recipe.category, recipe.tags || []);
    }

    if (!key) {
      console.warn('PR: ingen widget-key fundet for', recipe.category, recipe.tags);
      return; // ingen widget – men siden virker stadig
    }

    // sørg for at slotten findes
    const slotSel = '#pr-recipe-slot';
    if (!document.querySelector(slotSel)) {
      const aside = document.querySelector('aside.md\\:col-span-1') || document.querySelector('aside');
      if (aside) {
        const holder = document.createElement('div');
        holder.className = 'card bg-white p-6 mt-6';
        holder.innerHTML = '<h3 class="text-lg font-medium">Anbefalet udstyr</h3><div id="pr-recipe-slot" class="mt-2"></div>';
        aside.appendChild(holder);
      }
    }

    console.log('PR: mount key =', key, 'for category=', recipe.category, 'tags=', recipe.tags);
    rotator.mountPRByKey('#pr-recipe-slot', key);

    // valgfri: fallback tekst hvis PriceRunner-scriptet blokeres (cookies/CSP)
    setTimeout(() => {
      const slot = document.querySelector('#pr-recipe-slot');
      if (slot && !slot.querySelector('iframe') && !slot.querySelector('[id^="prw-"] iframe')) {
        // ingen iframe dukkede op → vis mild fallback
        const note = document.createElement('div');
        note.className = 'text-sm opacity-70 mt-2';
        note.textContent = 'Annonce – kunne ikke indlæse tilbud lige nu.';
        // undgå duplikater
        if (!slot.querySelector('.pr-fallback-note')) {
          note.classList.add('pr-fallback-note');
          slot.appendChild(note);
        }
      }
    }, 4000);
  } catch (err) {
    console.warn('PriceRunner-widget blev sprunget over (valgfri):', err);
  }
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
    window.dispatchEvent(new CustomEvent('favorite:toggled', {
      detail: { slug: recipe.slug, ok, ts: Date.now() }
    }));
    updateFavUI(favBtn, ok);
    showToast(ok ? 'Gemt i favoritter' : 'Fjernet fra favoritter');
  });

  // kommentarer
  const u = currentUser();
  commentHint.textContent = u ? `Logget ind som ${u.email}` : 'Du skal være logget ind.';
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
  });

  // relaterede
  const rel = pickRelated(data, recipe, 6);
  relatedList.innerHTML = rel.length
    ? rel.map(r => `<li><a class="hover:underline" href="/pages/opskrift.html?slug=${r.slug}">${r.title}</a></li>`).join('')
    : '<li class="opacity-70">Ingen relaterede fundet.</li>';

  // PriceRunner (valgfri – stopper ikke siden hvis noget fejler)
  await safeMountPRWidget(recipe);
}

document.addEventListener('DOMContentLoaded', init);
