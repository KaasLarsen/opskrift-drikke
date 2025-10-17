// /js/nav.js — mobilmenu der virker med partial header
(function(){
  function wire(){
    const btn  = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return false;

    const open  = () => { menu.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); document.body.classList.add('menu-open'); };
    const close = () => { menu.classList.add('hidden');    btn.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); };

    btn.addEventListener('click', (e)=>{ e.preventDefault(); (btn.getAttribute('aria-expanded')==='true') ? close() : open(); });

    // klik-udenfor lukker
    document.addEventListener('click', (e)=>{
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });

    // data-close knapper inde i panelet
    menu.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));

    // ESC lukker
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') close(); });

    // Mobil login knap peger på /login (og lukker menu)
    const authMobile = document.getElementById('authBtnMobile');
    if (authMobile){
      authMobile.addEventListener('click', ()=> { close(); });
    }
    return true;
  }

  // Prøv nu
  if (!wire()){
    // prøv igen når DOM er klar
    document.addEventListener('DOMContentLoaded', wire);
    // og når header-partialen er indsat
    const host = document.getElementById('header');
    if (host){
      const mo = new MutationObserver(() => wire());
      mo.observe(host, { childList:true, subtree:true });
    }
  }
})();
