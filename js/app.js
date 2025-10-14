// /js/app.js
export function showToast(msg='OK'){
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-3 py-1.5 rounded-2xl z-[9999]';
  document.body.appendChild(t); setTimeout(()=>t.remove(),1400);
}
export function formatStars(rating=5){
  const full = Math.round(rating);
  return Array.from({length:5}).map((_,i)=>
    `<svg class="w-4 h-4 ${i<full?'':'opacity-30'}"><use href="/assets/icons.svg#star"/></svg>`
  ).join('');
}

async function mountPartial(targetId, url){
  const el = document.getElementById(targetId);
  if (!el) return;
  try{
    const html = await fetch(url, {cache:'no-cache'}).then(r=>r.text());
    el.innerHTML = html;

    if (targetId === 'header'){
      // auto-load nav + auth når header er på plads
      import('/js/nav.js').catch(()=>{});
      import('/js/auth.js').catch(()=>{});
    }
  }catch(e){ console.error('Kunne ikke indlæse partial', url, e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  await mountPartial('header', '/partials/header.html');
  await mountPartial('footer', '/partials/footer.html');
});
<script>
  // Vælg selv URLs + billeder + tags. (Opdatér href til jeres opskrifts-URL)
  const POPULAR = [
    {
      title: "Den klassiske gløgg",
      tag: "Gløgg",
      href: "/pages/opskrift.html?slug=gloegg-klassisk-0001",
      img: "/assets/recipes/gloegg-klassisk.jpg",
      blurb: "Varm, krydret og nem at lykkes med."
    },
    {
      title: "Iskaffe med espresso & mælk",
      tag: "Kaffe",
      href: "/pages/opskrift.html?slug=iskaffe-espresso-milk-023",
      img: "/assets/recipes/iskaffe-espresso.jpg",
      blurb: "Cremet og forfriskende – perfekt hverdagshack."
    },
    {
      title: "Jordbær–banan smoothie",
      tag: "Smoothie",
      href: "/pages/opskrift.html?slug=smoothie-jordbaer-banan-101",
      img: "/assets/recipes/smoothie-jordbaer-banan.jpg",
      blurb: "Sød, mild og hele familiens favorit."
    },
    {
      title: "Grøn morgen-juice",
      tag: "Juice",
      href: "/pages/opskrift.html?slug=gron-morgen-juice-077",
      img: "/assets/recipes/gron-juice.jpg",
      blurb: "Sprød, frisk og fuld af grønt."
    },
  ];

  const $wrap = document.getElementById('popularRecipes');
  if ($wrap){
    $wrap.innerHTML = POPULAR.map(card => `
      <a href="${card.href}" class="card overflow-hidden hover:shadow transition">
        <div class="aspect-[4/3] bg-stone-100 overflow-hidden">
          <img src="${card.img}" alt="${card.title}" class="w-full h-full object-cover">
        </div>
        <div class="p-4">
          <span class="inline-flex text-[11px] px-2 py-0.5 rounded-full border
                         border-orange-200 text-orange-700 bg-orange-50">${card.tag}</span>
          <h3 class="text-lg font-semibold mt-2 leading-snug">${card.title}</h3>
          <p class="text-sm text-stone-600 mt-1">${card.blurb}</p>
        </div>
      </a>
    `).join('');
  }
</script>
