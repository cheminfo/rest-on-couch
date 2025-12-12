/**
 *
 * @param A {Array<any>} - First array
 * @param B {Array<any>} - Second array
 * @returns {Array<any>} - Union of A and B
 */
export function union(A, B) {
  return Array.from(new Set(A).union(new Set(B)));
}

/**
 *
 * @param A {Array<any>} - First array
 * @param B {Array<any>} - Second array
 * @returns {Array<any>} - All the elements in A which are not in B without any duplicates
 */
export function difference(A, B) {
  return Array.from(new Set(A).difference(new Set(B)));
}

/**
 *
 * @param A {Array<any>} - First array
 * @param B {Array<any>} - Second array
 * @returns {Array<any>} - Intersection between A and B, removing the duplicates.
 */
export function intersection(A, B) {
  return Array.from(new Set(A).intersection(new Set(B)));
}
