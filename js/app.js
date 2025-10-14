// /js/app.js
async function mountPartial(id, url){
  const el = document.getElementById(id);
  if (!el) return;
  try{
    const res = await fetch(url, { cache: "no-cache" });
    if(!res.ok) throw new Error(`${url} ${res.status}`);
    el.innerHTML = await res.text();
  }catch(err){
    console.error("Partial mount failed:", url, err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  mountPartial('header', '/partials/header.html');
  mountPartial('footer', '/partials/footer.html');
});
function wireMobileMenu(){
  const btn   = document.getElementById('mobileMenuBtn');
  const panel = document.getElementById('mobileMenu');
  if(!btn || !panel) return;

  const open  = () => { panel.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.add('hidden');    btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', open);
  panel.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) close();
  });
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  // Del auth-handler mellem desktop & mobil hvis du allerede har login-logik
  const authDesktop = document.getElementById('authBtn');
  const authMobile  = document.getElementById('authBtnMobile');
  if (authDesktop && authMobile) {
    authMobile.addEventListener('click', () => authDesktop.click());
  }
}

/* Kald wireMobileMenu() når header-partial er indsat */
(async function mountApp(){
  // ... din eksisterende kode der loader header/footer ...
  // når headeren er på plads:
  wireMobileMenu();
})();
