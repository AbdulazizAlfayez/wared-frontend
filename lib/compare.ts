// Compare utility functions for localStorage persistence

const STORAGE_KEY = "compareCarIds";
const MAX_COMPARE = 4;

/**
 * Get all compare car IDs from localStorage
 */
export function getCompareIds(): string[] {
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
 * Check if a car ID is in compare list
 */
export function isCompared(id: string): boolean {
  const ids = getCompareIds();
  return ids.includes(id);
}

/**
 * Toggle a car ID in compare list
 * Returns: { success: boolean, newState: boolean, message?: string }
 */
export function toggleCompare(id: string): { success: boolean; newState: boolean; message?: string } {
  const ids = getCompareIds();
  const index = ids.indexOf(id);
  
  if (index === -1) {
    // Adding to compare
    if (ids.length >= MAX_COMPARE) {
      return { 
        success: false, 
        newState: false, 
        message: `You can compare up to ${MAX_COMPARE} cars.` 
      };
    }
    ids.push(id);
    saveCompareIds(ids);
    return { success: true, newState: true };
  } else {
    // Removing from compare
    ids.splice(index, 1);
    saveCompareIds(ids);
    return { success: true, newState: false };
  }
}

/**
 * Add a car ID to compare list
 */
export function addToCompare(id: string): { success: boolean; message?: string } {
  if (isCompared(id)) {
    return { success: true };
  }
  
  const ids = getCompareIds();
  if (ids.length >= MAX_COMPARE) {
    return { 
      success: false, 
      message: `You can compare up to ${MAX_COMPARE} cars.` 
    };
  }
  
  ids.push(id);
  saveCompareIds(ids);
  return { success: true };
}

/**
 * Remove a car ID from compare list
 */
export function removeFromCompare(id: string): void {
  const ids = getCompareIds();
  const index = ids.indexOf(id);
  if (index !== -1) {
    ids.splice(index, 1);
    saveCompareIds(ids);
  }
}

/**
 * Clear all compare selections
 */
export function clearCompare(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("compareUpdated"));
  }
}

/**
 * Get compare count
 */
export function getCompareCount(): number {
  return getCompareIds().length;
}

/**
 * Check if can compare (2-4 cars selected)
 */
export function canCompare(): boolean {
  const count = getCompareCount();
  return count >= 2 && count <= MAX_COMPARE;
}

/**
 * Save compare IDs and dispatch event
 */
function saveCompareIds(ids: string[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("compareUpdated"));
  }
}

export const MAX_COMPARE_LIMIT = MAX_COMPARE;
