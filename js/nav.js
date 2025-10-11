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
    }, 120);
  }

  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });
  wrap.addEventListener('mouseenter', open);
  wrap.addEventListener('mouseleave', close);
  document.addEventListener('click', (e)=>{ if (!wrap.contains(e.target)) close(); });
  btn.addEventListener('keydown', (e)=>{ if (e.key==='ArrowDown'){ open(); list.querySelector('a')?.focus(); e.preventDefault(); }});
  list.addEventListener('keydown', (e)=>{ if (e.key==='Escape'){ close(); btn.focus(); }});
  window.addEventListener('scroll', close, { passive:true });
})();
