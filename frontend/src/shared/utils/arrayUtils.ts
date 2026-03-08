/**
 * Array utility functions
 * @module shared/utils/arrayUtils
 */

/**
 * Check if two arrays have the same elements (order independent)
 * @param arr1 First array
 * @param arr2 Second array
 * @returns true if arrays have same elements
 */
export function arraysAreEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  
  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
}

/**
 * Remove duplicates from an array
 * @param arr Input array
 * @returns Array with unique elements
 */
export function uniqueArray<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Group array elements by a key
 * @param arr Input array
 * @param key Key to group by
 * @returns Object with grouped elements
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
