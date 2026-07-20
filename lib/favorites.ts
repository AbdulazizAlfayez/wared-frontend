/**
 * Favorites — API-backed with localStorage cache for instant UI.
 *
 * Heart clicks call POST /api/imported-cars/{id}/favorite/ (toggle).
 * localStorage mirrors the server state for instant reads between pages.
 * On auth change the cache is rebuilt from the server.
 */

import { api } from "./api";

const STORAGE_KEY = "favoriteCarIds";

function readCache(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("favoritesUpdated"));
}

/** Check if a listing is favorited (instant, from cache). */
export function isFavorite(id: string): boolean {
  return readCache().includes(id);
}

/** Get all cached favorite IDs. */
export function getFavoriteIds(): string[] {
  return readCache();
}

/**
 * Toggle a listing's favorite state.
 * Updates cache optimistically, then calls the API.
 * Returns the new favorited state.
 */
export function toggleFavorite(id: string): boolean {
  const ids = readCache();
  const index = ids.indexOf(id);
  let newState: boolean;

  if (index === -1) {
    ids.push(id);
    newState = true;
  } else {
    ids.splice(index, 1);
    newState = false;
  }

  // Optimistic cache update
  writeCache(ids);

  // Fire-and-forget API call (toggle endpoint)
  api.post(`/api/imported-cars/${id}/favorite/`).catch(() => {
    // Revert on failure
    const reverted = readCache();
    if (newState) {
      // Was added, remove it
      const i = reverted.indexOf(id);
      if (i !== -1) reverted.splice(i, 1);
    } else {
      // Was removed, add it back
      if (!reverted.includes(id)) reverted.push(id);
    }
    writeCache(reverted);
  });

  return newState;
}

/** Sync cache from the server (call on login / page load). */
export async function syncFavoritesFromServer(): Promise<void> {
  try {
    const data = await api.get<{ results: { id: number }[] }>("/api/favorites/?page_size=100");
    const ids = (data.results ?? []).map((item) => String(item.id));
    writeCache(ids);
  } catch {
    // Not authenticated or endpoint error — clear cache
    writeCache([]);
  }
}

export function addFavorite(id: string): void {
  if (!isFavorite(id)) toggleFavorite(id);
}

export function removeFavorite(id: string): void {
  if (isFavorite(id)) toggleFavorite(id);
}

export function clearFavorites(): void {
  writeCache([]);
}
