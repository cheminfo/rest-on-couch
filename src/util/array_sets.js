'use strict';

/**
 *
 * @template T
 * @param A {Array<T>} - First array
 * @param B {Array<T>} - Second array
 * @returns {Array<T>} - Union of A and B
 */
function union(A, B) {
  return Array.from(new Set(A).union(new Set(B)));
}

/**
 *
 * @template T
 * @param A {Array<T>} - First array
 * @param B {Array<T>} - Second array
 * @returns {Array<T>} - All the elements in A which are not in B without any duplicates
 */
function difference(A, B) {
  return Array.from(new Set(A).difference(new Set(B)));
}

/**
 *
 * @template T
 * @param A {Array<T>} - First array
 * @param B {Array<T>} - Second array
 * @returns {Array<T>} - Intersection between A and B, removing the duplicates.
 */
function intersection(A, B) {
  return Array.from(new Set(A).intersection(new Set(B)));
}

module.exports = { union, difference, intersection };
