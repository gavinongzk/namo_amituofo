// Predefined color palette for categories
const CATEGORY_COLORS = [
  'bg-blue-200 text-blue-700',
  'bg-orange-200 text-orange-700', 
  'bg-green-200 text-green-700',
  'bg-purple-200 text-purple-700',
  'bg-pink-200 text-pink-700',
  'bg-indigo-200 text-indigo-700',
  'bg-teal-200 text-teal-700',
  'bg-red-200 text-red-700',
  'bg-yellow-200 text-yellow-700',
  'bg-cyan-200 text-cyan-700',
  'bg-lime-200 text-lime-700',
  'bg-emerald-200 text-emerald-700',
  'bg-violet-200 text-violet-700',
  'bg-rose-200 text-rose-700',
  'bg-amber-200 text-amber-700',
  'bg-sky-200 text-sky-700',
  'bg-fuchsia-200 text-fuchsia-700',
  'bg-slate-200 text-slate-700',
  'bg-gray-200 text-gray-700',
  'bg-zinc-200 text-zinc-700',
];

// Background-only colors for components that only need background
const CATEGORY_BG_COLORS = [
  'bg-blue-200',
  'bg-orange-200',
  'bg-green-200',
  'bg-purple-200',
  'bg-pink-200',
  'bg-indigo-200',
  'bg-teal-200',
  'bg-red-200',
  'bg-yellow-200',
  'bg-cyan-200',
  'bg-lime-200',
  'bg-emerald-200',
  'bg-violet-200',
  'bg-rose-200',
  'bg-amber-200',
  'bg-sky-200',
  'bg-fuchsia-200',
  'bg-slate-200',
  'bg-gray-200',
  'bg-zinc-200',
];

/**
 * Assigns a color to a category based on its name
 * Uses a hash function to ensure consistent color assignment
 */
export function assignCategoryColor(categoryName: string): string {
  // Simple hash function for consistent color assignment
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}

/**
 * Assigns a background-only color to a category based on its name
 */
export function assignCategoryBgColor(categoryName: string): string {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % CATEGORY_BG_COLORS.length;
  return CATEGORY_BG_COLORS[index];
}

/**
 * Gets the color for a category, either from stored color or assigns a new one
 */
export function getCategoryColor(categoryName: string, storedColor?: string): string {
  if (storedColor) {
    return storedColor;
  }
  return assignCategoryColor(categoryName);
}

/**
 * Gets the background color for a category, either from stored color or assigns a new one
 */
export function getCategoryBgColor(categoryName: string, storedColor?: string): string {
  if (storedColor) {
    // Extract background color from full color string
    const bgMatch = storedColor.match(/bg-\w+-\d+/);
    if (bgMatch) {
      return bgMatch[0];
    }
  }
  return assignCategoryBgColor(categoryName);
} 