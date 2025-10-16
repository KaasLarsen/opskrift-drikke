// mobil-toggle + klik-udenfor lukning (venter på at headeren findes)
(function(){
  function wireMobileMenu(){
    const btn  = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return false;

    const close = ()=> {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    };
    const open  = ()=> {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    };

    btn.addEventListener('click', ()=>{
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      isOpen ? close() : open();
    });

    document.addEventListener('click', (e)=>{
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });

    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') close();
    });

    return true;
  }

  // prøv med det samme
  if (!wireMobileMenu()) {
    // ...men hvis headeren ikke er klar endnu, prøv igen når DOM er klar
    document.addEventListener('DOMContentLoaded', wireMobileMenu);

    // ...og prøv igen efter header partial er indlæst (via app.js)
    const headerHost = document.getElementById('header');
    if (headerHost) {
      const mo = new MutationObserver(() => wireMobileMenu());
      mo.observe(headerHost, { childList: true, subtree: true });
    }
  }
})();
