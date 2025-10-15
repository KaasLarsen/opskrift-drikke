// /js/login.js
const KEY = 'od_user_email';

function getReturnUrl(){
  try{
    const u = new URLSearchParams(location.search);
    return u.get('return') || document.referrer || '/';
  }catch{ return '/'; }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const msg  = document.getElementById('msg');
  const emailInput = document.getElementById('email');

  // Prefill hvis vi har en bruger
  const existing = localStorage.getItem(KEY);
  if (existing) emailInput.value = existing;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;
    localStorage.setItem(KEY, email);
    msg.textContent = 'Du er logget ind – omdirigerer...';
    setTimeout(() => { window.location.href = getReturnUrl(); }, 400);
  });
});
