// utils.ts

/**
 * Hàm kiểm tra xem 2 mảng có trùng nhau không, không quan tâm đến thứ tự.
 * 
 * @param arr1 Mảng đầu tiên.
 * @param arr2 Mảng thứ hai.
 * @returns Trả về true nếu 2 mảng có các phần tử giống nhau, false nếu không.
 */
export function arraysAreEqual(arr1: any[], arr2: any[]): boolean {
    // Sắp xếp mảng và so sánh
    arr1.sort();
    arr2.sort();
    
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }
  