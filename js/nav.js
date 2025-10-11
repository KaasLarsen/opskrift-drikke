// /js/nav.js
(function(){
  // Find elementer i den nyindsatte header
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

  // Klik (mobil/desktop)
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  // Klik udenfor
  document.addEventListener('click', (e)=>{
    if (!wrap.contains(e.target)) close();
  });

  // Tastatur
  btn.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowDown'){
      open(); list.querySelector('a')?.focus(); e.preventDefault();
    }
  });
  list.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape'){ close(); btn.focus(); }
  });

  // Luk ved scroll (valgfrit)
  window.addEventListener('scroll', close, { passive:true });
})();
