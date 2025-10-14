// Hårdt udvalgte favoritter (skift bare slug, titel, billede)
const POPULAR = [
  {
    slug: "gloegg-klassisk-0001",
    title: "Den klassiske gløgg",
    tag: "Gløgg",
    img: "/assets/recipes/gloegg-klassisk.jpg",
    blurb: "Varm, krydret og nem at lykkes med."
  },
  {
    slug: "iskaffe-espresso-milk-023",
    title: "Iskaffe med espresso & mælk",
    tag: "Kaffe",
    img: "/assets/recipes/iskaffe-espresso.jpg",
    blurb: "Cremet og forfriskende hverdagshack."
  },
  {
    slug: "smoothie-jordbaer-banan-101",
    title: "Jordbær–banan smoothie",
    tag: "Smoothie",
    img: "/assets/recipes/smoothie-jordbaer-banan.jpg",
    blurb: "Sød, mild og hele familiens favorit."
  },
  {
    slug: "gron-morgen-juice-077",
    title: "Grøn morgen-juice",
    tag: "Juice",
    img: "/assets/recipes/gron-juice.jpg",
    blurb: "Sprød, frisk og fuld af grønt."
  }
];

function cardHtml(item){
  return `
    <a href="/pages/opskrift.html?slug=${item.slug}" class="card overflow-hidden hover:shadow transition block border bg-white">
      <div class="aspect-[4/3] bg-stone-100 overflow-hidden">
        <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover">
      </div>
      <div class="p-4">
        <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-orange-200 text-orange-700 bg-orange-50">${item.tag}</span>
        <h3 class="text-lg font-semibold mt-2 leading-snug">${item.title}</h3>
        <p class="text-sm text-stone-600 mt-1">${item.blurb}</p>
      </div>
    </a>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("popularRecipes");
  if (!root) return;
  root.innerHTML = POPULAR.map(cardHtml).join("");
});
