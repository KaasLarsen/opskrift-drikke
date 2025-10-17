// /js/nav.js — mobilmenu der virker selv når headeren er loadet dynamisk
(function(){
  function wireMenu(){
    const btn  = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return false;

    const close = ()=> {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    };
    const open = ()=> {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    };

    // toggle ved klik
    btn.addEventListener('click', ()=>{
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      isOpen ? close() : open();
    });

    // klik udenfor
    document.addEventListener('click', (e)=>{
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    });

    // klik på data-close elementer
    menu.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', close);
    });

    // luk ved escape
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') close();
    });

    return true;
  }

  // prøv straks
  if (!wireMenu()) {
    // prøv igen når DOM er klar
    document.addEventListener('DOMContentLoaded', wireMenu);

    // prøv igen når headeren er indlæst via app.js
    const headerHost = document.getElementById('header');
    if (headerHost) {
      const observer = new MutationObserver(() => wireMenu());
      observer.observe(headerHost, { childList: true, subtree: true });
    }
  }
})();
