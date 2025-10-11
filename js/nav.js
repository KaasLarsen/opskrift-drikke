// /js/nav.js
(function(){
  const btn  = document.getElementById('catMenuBtn');
  const list = document.getElementById('catMenuList');
  const wrap = document.getElementById('catMenuWrap');
  if (!btn || !list || !wrap) return;

  const open  = () => { list.classList.remove('invisible','opacity-0','pointer-events-none'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { list.classList.add('invisible','opacity-0','pointer-events-none'); btn.setAttribute('aria-expanded','false'); };

  // klik
  btn.addEventListener('click', (e)=>{ e.preventDefault(); 
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  // klik udenfor
  document.addEventListener('click', (e)=>{
    if (!wrap.contains(e.target)) close();
  });

  // tastatur: Esc luk, pil ned fokus første link
  btn.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowDown') {
      open();
      const first = list.querySelector('a'); first?.focus();
      e.preventDefault();
    }
  });
  list.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') { close(); btn.focus(); }
  });

  // hover (desktop følelse)
  wrap.addEventListener('mouseenter', open);
  wrap.addEventListener('mouseleave', close);
})();
