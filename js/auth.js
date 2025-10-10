
export const AUTH_KEY = 'od_auth_users';
export const SESSION_KEY = 'od_session';

function hash(s){ return btoa(unescape(encodeURIComponent(s))); }

export function currentUser(){
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return s;
  } catch(e){ return null; }
}

export function register(email, pass){
  let users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
  if (users.find(u=>u.email===email)) return {ok:false, msg:'Konto findes allerede'};
  users.push({email, pass:hash(pass), createdAt: Date.now()});
  localStorage.setItem(AUTH_KEY, JSON.stringify(users));
  return {ok:true};
}

export function login(email, pass){
  let users = JSON.parse(localStorage.getItem(AUTH_KEY) || '[]');
  const user = users.find(u=>u.email===email && u.pass===hash(pass));
  if (!user) return {ok:false, msg:'Forkert login'};
  localStorage.setItem(SESSION_KEY, JSON.stringify({email:user.email}));
  return {ok:true};
}

export function logout(){
  localStorage.removeItem(SESSION_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('loginBtn');
  if (lb) {
    lb.addEventListener('click', () => {
      const email = document.getElementById('email').value.trim();
      const pass = document.getElementById('password').value;
      const res = login(email, pass);
      if (res.ok) location.href = '/index.html';
      else alert(res.msg);
    });
  }
  const rb = document.getElementById('registerBtn');
  if (rb) {
    rb.addEventListener('click', () => {
      const email = document.getElementById('rEmail').value.trim();
      const pass = document.getElementById('rPassword').value;
      const res = register(email, pass);
      if (res.ok) location.href = '/pages/login.html';
      else alert(res.msg);
    });
  }
});
