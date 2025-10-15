// /js/favorites.js
import { loadAllRecipes, renderRecipeCard, getFavIds, toggleFav, bindFavoriteClicks } from '/js/recipes.js';

async function mountFavorites(){
  const grid = document.getElementById('favGrid');
  const empty = document.getElementById('emptyState');
  const clearBtn = document.getElementById('clearFavs');
  if(!grid) return;

  const all = await loadAllRecipes();
  const ids = new Set(getFavIds());

  const favs = all.filter(r => ids.has(String(r.id || r.slug || r.key || '')));
  if (favs.length === 0){
    empty.classList.remove('hidden');
    grid.innerHTML = '';
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = favs.map(renderRecipeCard).join('');
  }

  // Fjern fra listen når man “un-liker”
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fav]');
    if(!btn) return;
    const id = btn.getAttribute('data-fav');
    const active = toggleFav(id);
    if(!active){
      const card = btn.closest('a.card') || btn.closest('.card');
      if(card) card.remove();
      if(!grid.querySelector('[data-fav]')){
        empty.classList.remove('hidden');
      }
    }
  });

  // Ryd alle
  clearBtn.addEventListener('click', () => {
    localStorage.setItem('od_favs_v1', '[]');
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  });

  // Sikrer hjertestyles
  bindFavoriteClicks(grid);
}

document.addEventListener('DOMContentLoaded', mountFavorites);
