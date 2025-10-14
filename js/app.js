// /js/app.js
async function mountPartial(id, url){
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(url, { cache: "no-cache" });
  if(!res.ok) throw new Error(`${url} ${res.status}`);
  el.innerHTML = await res.text();
}

function wireMobileMenu(){
  const btn   = document.getElementById('mobileMenuBtn');
  const panel = document.getElementById('mobileMenu');
  if(!btn || !panel) return;

  const open  = () => { panel.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.add('hidden');    btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', open);
  panel.addEventListener('click', (e) => { if (e.target.matches('[data-close]')) close(); });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  // mobil login -> klikker desktop-knappen
  const authDesktop = document.getElementById('authBtn');
  const authMobile  = document.getElementById('authBtnMobile');
  if (authDesktop && authMobile) authMobile.addEventListener('click', () => authDesktop.click());
}

document.addEventListener('DOMContentLoaded', async () => {
  try{
    await Promise.all([
      mountPartial('header', '/partials/header.html'),
      mountPartial('footer', '/partials/footer.html'),
    ]);
  } catch(err){
    console.error('Partial mount failed:', err);
  }
  wireMobileMenu();
});
