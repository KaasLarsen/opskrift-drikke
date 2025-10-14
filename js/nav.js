// mobil-toggle + klik-udenfor lukning
(function(){
  const btn  = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

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

  // luk ved escape
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') close();
  });
})();
