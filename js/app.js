// /js/app.js  (NO <script> TAGS IN THIS FILE)

// === Global AdSense bootstrap (indsættes automatisk på alle sider) ===
(function ensureAdSense() {
  try {
    const CLIENT = 'ca-pub-7373148222153531';

    // 1) Meta-tag til Auto ads (tilføjes hvis mangler)
    const META_NAME = 'google-adsense-account';
    let meta = document.querySelector(`meta[name="${META_NAME}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', META_NAME);
      meta.setAttribute('content', CLIENT);
      document.head.appendChild(meta);
      // console.debug('[AdSense] Meta added');
    }

    // 2) Loader-script (tilføjes hvis mangler)
    const LOADER_ID = 'adsense-loader';
    if (!document.getElementById(LOADER_ID)) {
      const s = document.createElement('script');
      s.id = LOADER_ID;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      document.head.appendChild(s);
      // console.debug('[AdSense] Loader appended');
    }
  } catch (e) {
    console.warn('[AdSense] Kunne ikke initialisere:', e);
  }
})();

// Load a partial and resolve when inserted
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

/* Shared auth handler: any element with [data-auth] */
function wireAuth() {
  const targets = document.querySelectorAll('[data-auth]');
  const onClick = (e) => {
    e.preventDefault();
    const desktop = document.getElementById('authBtn');
    if (desktop) { desktop.click(); return; }
    if (typeof window.openAuth === 'function') { window.openAuth(); return; }
    window.location.href = '/login';
  };
  targets.forEach(el => {
    el.removeEventListener('click', onClick);
    el.addEventListener('click', onClick);
  });
}

/* Mobile menu */
function wireMobileMenu() {
  const btn   = document.getElementById('mobileMenuBtn');
  const panel = document.getElementById('mobileMenu');
  if (!btn || !panel) return;

  const closeBtn = panel.querySelector('[data-close]');
  const open  = () => { panel.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { panel.classList.add('hidden');    btn.setAttribute('aria-expanded','false'); };

  btn.addEventListener('click', (e) => { e.preventDefault(); open(); });
  closeBtn?.addEventListener('click', (e) => { e.preventDefault(); close(); });
  panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Make mobile login trigger desktop flow or fallback to /login
  const authMobile = document.getElementById('authBtnMobile');
  if (authMobile) {
    authMobile.addEventListener('click', (e) => {
      e.preventDefault();
      const desktop = document.getElementById('authBtn');
      if (desktop) desktop.click(); else window.location.href = '/login';
      close();
    });
  }
}

/* Categories dropdown (desktop) */
function wireCategories() {
  const d = document.querySelector('#navCategories');
  if (!d) return;
  d.querySelectorAll('a').forEach(a => a.addEventListener('click', () => d.removeAttribute('open')));
}

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    mountPartial('header', '/partials/header.html'),
    mountPartial('footer', '/partials/footer.html'),
  ]);
  wireMobileMenu();
  wireCategories();
  wireAuth();
});
