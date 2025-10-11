// /js/auth.js
const LS_USER = 'od_user';
const SS_USER = 'od_user_sess';

function saveUser(user, remember){
  const payload = JSON.stringify(user);
  try {
    if (remember) localStorage.setItem(LS_USER, payload);
    else sessionStorage.setItem(SS_USER, payload);
  } catch {}
}

export function logout(){
  localStorage.removeItem(LS_USER);
  sessionStorage.removeItem(SS_USER);
  window.dispatchEvent(new CustomEvent('auth:changed', { detail:{ user:null }}));
}

export function currentUser(){
  try {
    const p = localStorage.getItem(LS_USER) || sessionStorage.getItem(SS_USER);
    return p ? JSON.parse(p) : null;
  } catch { return null; }
}

export function ensureAuthUI(){
  // inject modal once
  if (document.getElementById('loginModal')) return;
  const m = document.createElement('div');
  m.id = 'loginModal';
  m.className = 'fixed inset-0 hidden items-center justify-center bg-black/40 z-50';
  m.innerHTML = `
    <div class="bg-white rounded-2xl p-6 w-[min(96vw,420px)]">
      <h2 class="text-xl font-semibold">Log ind</h2>
      <p class="text-sm opacity-80 mt-1">Skriv din e-mail for at fortsætte.</p>
      <input id="loginEmail" type="email" class="mt-4 w-full border rounded-2xl p-3" placeholder="din@email.dk" />
      <label class="mt-3 flex items-center gap-2 text-sm"><input id="rememberMe" type="checkbox"/> Husk mig</label>
      <div class="mt-4 flex gap-2 justify-end">
        <button id="loginCancel" class="border px-3 py-1.5 rounded-2xl">Annuller</button>
        <button id="loginSubmit" class="border px-3 py-1.5 rounded-2xl bg-stone-900 text-white">Log ind</button>
      </div>
    </div>`;
  document.body.appendChild(m);

  const open = () => m.classList.remove('hidden');
  const close = () => m.classList.add('hidden');

  // expose openLogin so header kan åbne modal
  window.__openLogin = open;

  m.addEventListener('click', (e)=>{ if (e.target === m) close(); });
  m.querySelector('#loginCancel').addEventListener('click', close);
  m.querySelector('#loginSubmit').addEventListener('click', ()=>{
    const email = (document.getElementById('loginEmail').value||'').trim();
    const remember = document.getElementById('rememberMe').checked;
    if (!email || !/\S+@\S+\.\S+/.test(email)) { alert('Skriv en gyldig e-mail.'); return; }
    const user = { email, name: email.split('@')[0] };
    saveUser(user, remember);
    window.dispatchEvent(new CustomEvent('auth:changed', { detail:{ user }}));
    close();
  });
}

// Mount: skift login/logout i header hvis der findes knapper
document.addEventListener('DOMContentLoaded', () => {
  ensureAuthUI();
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const nameSpot = document.getElementById('userName');

  const sync = () => {
    const u = currentUser();
    if (nameSpot) nameSpot.textContent = u ? u.name : '';
    if (loginBtn) loginBtn.classList.toggle('hidden', !!u);
    if (logoutBtn) logoutBtn.classList.toggle('hidden', !u);
  };
  loginBtn?.addEventListener('click', () => window.__openLogin?.());
  logoutBtn?.addEventListener('click', logout);
  window.addEventListener('auth:changed', sync);
  sync();
});
