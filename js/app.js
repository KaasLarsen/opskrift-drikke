// /js/app.js

// Loader en partial og returnerer en Promise når den er indsat
function mountPartial(id, url) {
  return new Promise(async (resolve) => {
    const el = document.getElementById(id);
    if (!el) return resolve();
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${url} ${res.status}`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error("Partial mount failed:", url, err);
    } finally {
      resolve();
    }
  });
}

function wireMobileMenu() {
  const btn   = document.getElementById('mobileMenuBtn');
  const panel = document.getElementById('mobileMenu');
  if (!btn || !panel) return;

  const open  = () => { panel.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.add('hidden');    btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  });

  // Luk på overlay-klik, knap med data-close eller Escape
  panel.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Login-knap på mobil triggere desktop-login hvis den findes – ellers /login
  const authDesktop = document.getElementById('authBtn');
  const authMobile  = document.getElementById('authBtnMobile');
  if (authMobile) {
    authMobile.addEventListener('click', (e) => {
      e.preventDefault();
      if (authDesktop) {
        authDesktop.click();       // deler samme auth-flow
      } else {
        window.location.href = '/login'; // fallback
      }
      close();
    });
  }
}

// Når DOM er klar: montér header/footer, og først derefter wire menuen
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    mountPartial('header', '/partials/header.html'),
    mountPartial('footer', '/partials/footer.html'),
  ]);
  wireMobileMenu();
});
