// src/utils/favorites.js

// Retorna todos os jogos favoritados do localStorage
export function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

// Adiciona ou remove um jogo da lista de favoritos
export function toggleFavorite(game) {
  const current = getFavorites();
  const exists = current.find((g) => g.id === game.id);

  let updated;
  if (exists) {
    updated = current.filter((g) => g.id !== game.id);
  } else {
    updated = [...current, game];
  }

  localStorage.setItem("favorites", JSON.stringify(updated));
  return updated;
}

// Verifica se um jogo já está nos favoritos
export function isFavorite(gameId) {
  const current = getFavorites();
  return current.some((g) => g.id === gameId);
}
