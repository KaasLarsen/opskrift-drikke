// /js/nav.js
(function(){
  const btn  = document.getElementById('catMenuBtn');
  const list = document.getElementById('catMenuList');
  const wrap = document.getElementById('catMenuWrap');
  if (!btn || !list || !wrap) return;

  let hideTimer = null;

  function open(){
    clearTimeout(hideTimer);
    list.classList.remove('pointer-events-none','opacity-0','translate-y-1');
    btn.setAttribute('aria-expanded','true');
  }
  function close(){
    clearTimeout(hideTimer);
    hideTimer = setTimeout(()=>{
      list.classList.add('pointer-events-none','opacity-0','translate-y-1');
      btn.setAttribute('aria-expanded','false');
    }, 120); // lille “grace period” mod flicker
  }

  // Klik (mobil/desktop)
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  // Hover uden flicker: åbn på enter, luk lidt forsinket på leave
  wrap.addEventListener('mouseenter', open);
  wrap.addEventListener('mouseleave', close);

  // Klik udenfor lukker
  document.addEventListener('click', (e)=>{
    if (!wrap.contains(e.target)) close();
  });

  // Tastatur
  btn.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowDown'){ open(); list.querySelector('a')?.focus(); e.preventDefault(); }
  });
  list.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape'){ close(); btn.focus(); }
  });

  // Luk ved scroll
  window.addEventListener('scroll', close, { passive:true });
})();
