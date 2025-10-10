
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  if (!input || !results) return;

  const data = window.__allRecipes || [];

  // build simple category filters
  const cats = [...new Set(data.map(r=>r.category))].slice(0, 10);
  filters.innerHTML = cats.map(c=>`<button class="btn border px-3 py-1.5" data-cat="${c}">${c}</button>`).join('');
  filters.addEventListener('click', (e)=>{
    const b = e.target.closest('[data-cat]'); if (!b) return;
    input.value = b.getAttribute('data-cat');
    input.dispatchEvent(new Event('input'));
  });

  input.addEventListener('input', (e)=>{
    const q = input.value.toLowerCase().trim();
    let list = data;
    if (q) {
      list = data.filter(r => (r.title + ' ' + r.description + ' ' + r.tags.join(' ')).toLowerCase().includes(q));
    }
    results.innerHTML = list.slice(0, 60).map(window.renderRecipeCard || (()=>'' )).join('');
  });
});
