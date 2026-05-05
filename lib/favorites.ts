// Favorites utility functions for localStorage persistence

const STORAGE_KEY = "favoriteCarIds";

/**
 * Get all favorite car IDs from localStorage
 */
export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Check if a car ID is in favorites
 */
export function isFavorite(id: string): boolean {
  const ids = getFavoriteIds();
  return ids.includes(id);
}

/**
 * Toggle a car ID in favorites (add if not present, remove if present)
 * Returns the new favorited state
 */
export function toggleFavorite(id: string): boolean {
  const ids = getFavoriteIds();
  const index = ids.indexOf(id);
  
  let newState: boolean;
  if (index === -1) {
    // Add to favorites
    ids.push(id);
    newState = true;
  } else {
    // Remove from favorites
    ids.splice(index, 1);
    newState = false;
  }
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new Event("favoritesUpdated"));
  }
  
  return newState;
}

/**
 * Add a car ID to favorites
 */
export function addFavorite(id: string): void {
  if (!isFavorite(id)) {
    toggleFavorite(id);
  }
}

/**
 * Remove a car ID from favorites
 */
export function removeFavorite(id: string): void {
  if (isFavorite(id)) {
    toggleFavorite(id);
  }
}

/**
 * Clear all favorites
 */
export function clearFavorites(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("favoritesUpdated"));
  }
}
