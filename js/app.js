<script type="module">
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

/* Fælles auth-handler: klik på ALLE elementer med [data-auth] */
function wireAuth() {
  const authTargets = document.querySelectorAll('[data-auth]');
  const clickAuth = (e) => {
    e.preventDefault();
    // 1) Hvis der findes en fælles desktop-knap (#authBtn), trig den
    const desktop = document.getElementById('authBtn');
    if (desktop) {
      desktop.click();
      return;
    }
    // 2) Hvis der findes en global auth-funktion (din app), kald den
    if (typeof window.openAuth === 'function') {
      window.openAuth();
      return;
    }
    // 3) Fallback: gå til /login
    window.location.href = '/login';
  };
  authTargets.forEach(el => {
    el.removeEventListener('click', clickAuth); // undgå dobbel-binding ved side-skift
    el.addEventListener('click', clickAuth);
  });
}

/* Mobilmenu */
function wireMobileMenu() {
  const btn   = document.getElementById('mobileMenuBtn');
  const panel = document.getElementById('mobileMenu');
  const closeBtn = panel?.querySelector('[data-close]');

  if (!btn || !panel) return;

  const open  = () => { panel.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.add('hidden');    btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  closeBtn?.addEventListener('click', (e) => { e.preventDefault(); close(); });

  // Luk hvis man klikker på overlayet
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* Kategori-dropdown (desktop) med <details> — sikrer klik virker og ikke “forsvinder” */
function wireCategories() {
  const d = document.querySelector('#navCategories');
  if (!d) return;
  // Luk, når man klikker et link
  d.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      d.removeAttribute('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Sørg for at ALLE sider loader den samme header/footer:
  await Promise.all([
    mountPartial('header', '/partials/header.html'),
    mountPartial('footer', '/partials/footer.html'),
  ]);

  // Når partials er på plads, wire alt
  wireMobileMenu();
  wireCategories();
  wireAuth();
});
</script>
