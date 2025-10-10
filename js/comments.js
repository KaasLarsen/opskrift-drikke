
import { currentUser } from '/js/auth.js';

function key(slug){ return 'od_comments_' + slug; }

export function getComments(slug){
  try { return JSON.parse(localStorage.getItem(key(slug)) || '[]'); } catch(e){ return []; }
}
export function addComment(slug, email, text){
  const list = getComments(slug);
  list.push({email, text, ts: Date.now()});
  localStorage.setItem(key(slug), JSON.stringify(list));
}

document.addEventListener('DOMContentLoaded', () => {
  const area = document.getElementById('commentText');
  const btn = document.getElementById('commentSubmit');
  const listWrap = document.getElementById('commentList');
  if (!btn || !area || !listWrap) return;

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');

  function render(){
    const list = getComments(slug).slice().reverse();
    listWrap.innerHTML = list.map(c=>`<div class="p-3 rounded-2xl border bg-white">
      <div class="text-xs opacity-70">${new Date(c.ts).toLocaleString()}</div>
      <div class="mt-1 text-sm"><strong>${c.email}</strong>: ${c.text}</div>
    </div>`).join('') || '<p class="text-sm opacity-70">ingen kommentarer endnu.</p>';
  }
  render();

  btn.addEventListener('click', ()=>{
    const u = currentUser();
    if (!u) { alert('log ind for at kommentere'); return; }
    const text = area.value.trim();
    if (!text) return;
    addComment(slug, u.email, text);
    area.value='';
    render();
  });
});
