// /js/app.js
// Fælles helpers som andre moduler bruger:
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

// Indsæt partials og sørg for at tilhørende JS auto-loader
async function mountPartial(targetId, url){
  const el = document.getElementById(targetId);
  if (!el) return;
  try{
    const html = await fetch(url, {cache:'no-cache'}).then(r=>r.text());
    el.innerHTML = html;

    // Efter header er indsat: auto-load nav + auth og bind tema-knap
    if (targetId === 'header'){
      // loader kun én gang selvom kaldt flere gange
      import('/js/nav.js').catch(()=>{});
      import('/js/auth.js').catch(()=>{});

      const themeBtn = el.querySelector('#themeToggle');
      themeBtn?.addEventListener('click', toggleTheme);
    }
  }catch(e){
    console.error('Kunne ikke indlæse partial', url, e);
  }
}

// Lys/mørk tema toggle (simpel)
function toggleTheme(){
  const k='od_theme';
  const cur = localStorage.getItem(k) || 'light';
  const next = cur === 'light' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', next==='dark');
  localStorage.setItem(k, next);
}
(function bootTheme(){
  const pref = localStorage.getItem('od_theme') || 'light';
  if (pref === 'dark') document.documentElement.classList.add('dark');
})();

// Kør ved DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  await mountPartial('header', '/partials/header.html');
  await mountPartial('footer', '/partials/footer.html');
  // evt. andre ting der skal ske globalt…
});
