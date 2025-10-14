// Viser standardkort hvis #results stadig er tom lidt efter load
function recipeCard(r){
  const href = `/pages/opskrift.html?slug=${encodeURIComponent(r.slug || r.id || r.title)}`;
  const img  = r.image || r.img || "/assets/placeholder.jpg";
  const title = r.title || r.name || "Opskrift";
  const tag = (r.tags && r.tags[0]) || r.category || "Opskrift";
  return `
  <a href="${href}" class="card overflow-hidden hover:shadow transition block border bg-white">
    <div class="aspect-[4/3] bg-stone-100 overflow-hidden">
      <img src="${img}" alt="${title}" class="w-full h-full object-cover" loading="lazy">
    </div>
    <div class="p-4">
      <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border">${tag}</span>
      <h3 class="text-lg font-semibold mt-2 leading-snug">${title}</h3>
    </div>
  </a>`;
}

function tryFill(){
  const results = document.getElementById('results');
  if (!results) return;
  if (results.childElementCount > 0) return; // dine scripts har allerede fyldt den

  const list = (window.RECIPES && Array.isArray(window.RECIPES) ? window.RECIPES.slice(0,12) : []);
  if (!list.length) return;

  results.innerHTML = list.map(recipeCard).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  // prøv lidt efter de andre scripts har kørt
  setTimeout(tryFill, 300);
});
