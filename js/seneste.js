// /js/seneste.js
const wrap = document.getElementById('seneste-list');

function card(r){
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
  if (!wrap) return;
  if (!Array.isArray(list) || !list.length){
    wrap.innerHTML = `<p class="opacity-70">Ingen opskrifter fundet.</p>`;
    return;
  }
  // Seneste først, hvis data har dato; ellers bare top-ny
  const sorted = [...list].sort((a,b)=>{
    const da = +new Date(a.date || a.updated || 0);
    const db = +new Date(b.date || b.updated || 0);
    return db - da;
  });
  wrap.innerHTML = sorted.slice(0, 36).map(card).join('');
}

async function loadJson(){
  try{
    const r = await fetch('/data/recipes.json', { cache:'no-cache' });
    if (!r.ok) throw 0;
    return r.json();
  }catch{return []}
}

async function loadSitemap(){
  try{
    const r = await fetch('/sitemaps/recipes-sitemap.xml', { cache:'no-cache' });
    if (!r.ok) throw 0;
    const xml = await r.text();
    const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map(m=>m[1]);
    return urls.map(u=>{
      const slug = (u.split('slug=')[1] || '').split('&')[0] || u.split('/').pop();
      return { slug, title: decodeURIComponent(slug.replace(/[-_]/g,' ')), image: '/assets/placeholder-recipe.jpg' };
    });
  }catch{return []}
}

document.addEventListener('DOMContentLoaded', async ()=>{
  // 1) global RECIPES hvis sat af recipes.js
  if (Array.isArray(window.RECIPES) && window.RECIPES.length){
    render(window.RECIPES);
    return;
  }
  // 2) /data/recipes.json
  let list = await loadJson();
  if (list.length){ render(list); return; }
  // 3) nød: sitemap
  list = await loadSitemap();
  render(list);
});
