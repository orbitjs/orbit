/**
 * Like the Lodash _.every function, this function takes an array and a
 * predicate function and returns true or false depending on whether the
 * predicate is true for every item in the array.
 */
export function every(
  array: any[],
  predicate: (member: any, index: number) => boolean
): boolean {
  let index = -1;
  let length: number = array.length;

  while (++index < length) {
    if (!predicate(array[index], index)) {
      return false;
    }
  }

  return true;
}

/**
 * Like the Lodash _.some function, this function takes an array and a predicate
 * function and returns true or false depending on whether the predicate is true
 * for any of the items in the array.
 */
export function some(
  array: any[],
  predicate: (member: any, index: number) => boolean
): boolean {
  let index = -1;
  let length: number = array.length;

  while (++index < length) {
    if (predicate(array[index], index)) {
      return true;
    }
  }

  return false;
}
