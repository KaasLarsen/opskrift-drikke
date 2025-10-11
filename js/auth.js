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

// Modal (bruges automatisk i header)
export function ensureAuthUI(){
  if (document.getElementById('loginModal')) return;
  const m = document.createElement('div');
  m.id = 'loginModal';
  m.className = 'fixed inset-0 hidden items-center justify-center bg-black/40 z-50';
  m.innerHTML = `
    <div class="bg-white rounded-2xl p-6 w-[min(96vw,420px)]">
      <h2 class="text-xl font-semibold">Log ind eller opret bruger</h2>
      <p class="text-sm opacity-80 mt-1">Skriv din e-mail. Første gang opretter vi dig automatisk.</p>
      <input id="loginEmail" type="email" class="mt-4 w-full border rounded-2xl p-3" placeholder="din@email.dk" />
      <label class="mt-3 flex items-center gap-2 text-sm"><input id="rememberMe" type="checkbox"/> Husk mig</label>
      <div class="mt-4 flex gap-2 justify-end">
        <button id="loginCancel" class="border px-3 py-1.5 rounded-2xl">Annuller</button>
        <button id="loginSubmit" class="border px-3 py-1.5 rounded-2xl bg-stone-900 text-white">Fortsæt</button>
      </div>
    </div>`;
  document.body.appendChild(m);

  const open = () => m.classList.remove('hidden');
  const close = () => m.classList.add('hidden');
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

  // header knapper (hvis de findes)
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
}

// mount modal + init login side, hvis til stede
document.addEventListener('DOMContentLoaded', () => {
  ensureAuthUI();

  // login-siden (virker som “opret bruger” også)
  const form = document.getElementById('loginForm');
  if (form){
    const emailEl = document.getElementById('loginEmailPage');
    const rememberEl = document.getElementById('rememberMePage');
    const out = document.getElementById('loginState');

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = (emailEl.value||'').trim();
      const remember = rememberEl.checked;
      if (!email || !/\S+@\S+\.\S+/.test(email)) { out.textContent = 'Skriv en gyldig e-mail.'; return; }
      const user = { email, name: email.split('@')[0] };
      saveUser(user, remember);
      out.textContent = 'Du er nu logget ind.';
      window.dispatchEvent(new CustomEvent('auth:changed', { detail:{ user }}));
      setTimeout(()=>{ location.href = '/'; }, 600);
    });
  }
});
