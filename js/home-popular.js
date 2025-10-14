// /js/home-popular.js
const PICKS = [
  { tag:"Gløgg",    title:"Den klassiske gløgg",            desc:"Varm, krydret og nem at lykkes med.",        slug:"gloegg-klassisk-0001",        img:"/assets/recipes/gloegg-klassisk.jpg",        alt:"Den klassiske gløgg" },
  { tag:"Kaffe",    title:"Iskaffe med espresso & mælk",    desc:"Cremet og forfriskende – perfekt hverdag.",  slug:"iskaffe-espresso-milk-023",   img:"/assets/recipes/iskaffe-espresso.jpg",       alt:"Iskaffe med espresso & mælk" },
  { tag:"Smoothie", title:"Jordbær–banan smoothie",          desc:"Sød, mild og hele familiens favorit.",       slug:"smoothie-jordbaer-banan-101", img:"/assets/recipes/smoothie-jordbaer-banan.jpg",alt:"Jordbær–banan smoothie" },
  { tag:"Juice",    title:"Grøn morgen-juice",               desc:"Sprød, frisk og fuld af grønt.",             slug:"gron-morgen-juice-077",       img:"/assets/recipes/gron-juice.jpg",             alt:"Grøn morgen-juice" }
];

const $ = (s, r=document) => r.querySelector(s);
const card = (p) => `
<a href="/pages/opskrift.html?slug=${encodeURIComponent(p.slug)}" class="card overflow-hidden hover:shadow transition block border bg-white">
  <div class="aspect-[4/3] bg-stone-100 overflow-hidden">
    <img src="${p.img}" alt="${p.alt}" class="w-full h-full object-cover" loading="lazy">
  </div>
  <div class="p-4">
    <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${p.tag}</span>
    <h3 class="text-lg font-semibold mt-2 leading-snug">${p.title}</h3>
    <p class="text-sm text-stone-600 mt-1">${p.desc}</p>
  </div>
</a>`;

document.addEventListener('DOMContentLoaded', ()=>{
  const mount = $('#popularRecipes');
  if (mount) mount.innerHTML = PICKS.map(card).join('');
});
