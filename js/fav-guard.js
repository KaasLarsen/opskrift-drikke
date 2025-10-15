// /js/fav-guard.js
const USER_KEY = 'od_user_email';

function isLoggedIn() {
  return !!localStorage.getItem(USER_KEY);
}

function returnUrl() {
  try {
    return location.pathname + location.search + location.hash;
  } catch {
    return '/';
  }
}

// Marker alle hjerter som kræver login (kun visuelt, klik er stadig fanget)
function markHearts() {
  const hearts = document.querySelectorAll('[data-fav]');
  hearts.forEach(btn => {
    btn.classList.add('fav-requires-auth');
    btn.setAttribute('aria-label', 'Gem som favorit (kræver login)');
  });
}

// Fang klik på ALLE hjerter
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-fav]');
  if (!btn) return;

  if (!isLoggedIn()) {
    // stop “toggleFav” i dine andre scripts
    e.preventDefault();
    e.stopPropagation();

    // Lille, pæn prompt – brug alert for simpelt fallback
    const ok = confirm('Du skal være logget ind for at gemme favoritter.\n\nVil du logge ind nu?');
    if (ok) {
      const u = new URL('/login.html', location.origin);
      u.searchParams.set('return', returnUrl());
      window.location.href = u.toString();
    }
    return;
  }

  // Hvis logget ind, gør ingenting her – dine eksisterende handlers tager over.
});

// Når DOM er klar: markér hjerter hvis man IKKE er logget ind
document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) markHearts();
});
