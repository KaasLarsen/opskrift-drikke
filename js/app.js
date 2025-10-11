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
