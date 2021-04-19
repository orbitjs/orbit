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

/**
 * This function is similar to Array.prototype.find, but it returns the result
 * of calling the value function rather than an item of the array.
 *
 * @deprecated since v0.17, remove in v0.18
 */
export function firstResult(
  array: any[],
  valueFn: (member: any, index: number) => any
): any {
  let index = -1;
  let length: number = array.length;

  while (++index < length) {
    let result = valueFn(array[index], index);
    if (result) {
      return result;
    }
  }
}
