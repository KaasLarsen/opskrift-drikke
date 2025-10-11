// /js/nav.js
(function(){
  // Vent på at header er indlæst (den hentes som partial)
  function ready(cb, tries=50){
    const el = document.getElementById('catMenuWrap');
    if (el) return cb();
    if (tries <= 0) return;
    setTimeout(()=>ready(cb, tries-1), 100);
  }

  ready(() => {
    const btn  = document.getElementById('catMenuBtn');
    const list = document.getElementById('catMenuList');
    const wrap = document.getElementById('catMenuWrap');
    if (!btn || !list || !wrap) return;

    const open = () => {
      list.classList.remove('invisible','opacity-0','pointer-events-none');
      btn.setAttribute('aria-expanded','true');
    };
    const close = () => {
      list.classList.add('invisible','opacity-0','pointer-events-none');
      btn.setAttribute('aria-expanded','false');
    };

    // Klik (mobil)
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      isOpen ? close() : open();
    });

    // Klik udenfor lukker
    document.addEventListener('click', (e)=>{
      if (!wrap.contains(e.target)) close();
    });

    // Tastatur
    btn.addEventListener('keydown', (e)=>{
      if (e.key === 'ArrowDown'){
        open();
        list.querySelector('a')?.focus();
        e.preventDefault();
      }
    });
    list.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape'){ close(); btn.focus(); }
    });

    // Luk dropdown ved scroll
    window.addEventListener('scroll', close, { passive:true });
  });
})();
