// /js/home-results-fallback.js
const $ = (s, r=document) => r.querySelector(s);
const resultsEl = $('#results');

function recipeCard(r){
  const href = `/pages/opskrift.html?slug=${encodeURIComponent(r.slug || r.id || '')}`;
  const img  = r.image || r.img || '/assets/placeholder-recipe.jpg';
  const tag  = r.tag || r.category || r.type || 'Opskrift';
  const title = r.title || r.name || 'Opskrift';
  const desc  = r.desc || r.subtitle || r.intro || '';
  return `
  <a href="${href}" class="card overflow-hidden hover:shadow transition block border bg-white">
    <div class="aspect-[4/3] bg-stone-100 overflow-hidden">
      <img src="${img}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
    </div>
    <div class="p-4">
      <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${tag}</span>
      <h3 class="text-lg font-semibold mt-2 leading-snug">${title}</h3>
      ${desc ? `<p class="text-sm text-stone-600 mt-1">${desc}</p>` : ``}
    </div>
  </a>`;
}

function render(list){
  if (!resultsEl) return;
  if (!Array.isArray(list) || !list.length){
    resultsEl.innerHTML = `<p class="opacity-70">Ingen opskrifter at vise.</p>`;
    return;
  }
  resultsEl.innerHTML = list.slice(0, 12).map(recipeCard).join('');
}

async function fromJson(){
  try{
    const r = await fetch('/data/recipes.json', { cache: 'no-cache' });
    if (!r.ok) throw 0;
    return r.json();
  }catch{return []}
}

async function fromSitemap(){
  try{
    const r = await fetch('/sitemaps/recipes-sitemap.xml', { cache:'no-cache' });
    if (!r.ok) throw 0;
    const xml = await r.text();
    const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map(m=>m[1]);
    // lav minimale kort-data
    return urls.slice(0, 20).map(u=>{
      const slug = (u.split('slug=')[1] || '').split('&')[0] || u.split('/').pop();
      return { slug, title: decodeURIComponent(slug.replace(/[-_]/g,' ')), image: '/assets/placeholder-recipe.jpg' };
    });
  }catch{return []}
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!resultsEl) return;
  // hvis søgescript allerede har fyldt noget, rør ikke ved det
  if (resultsEl.children.length > 0) return;

  // 1) global RECIPES
  if (Array.isArray(window.RECIPES) && window.RECIPES.length){
    render(window.RECIPES);
    return;
  }

  // 2) prøv /data/recipes.json
  let list = await fromJson();
  if (list.length){ render(list); return; }

  // 3) nød: sitemap
  list = await fromSitemap();
  render(list);
});
