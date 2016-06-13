/**
  Like the Lodash _.every function, this function takes an array and a
  predicate function and returns true or false depending on whether the
  predicate is true for every item in the array.

  @param {Array} array - array to iterate through
  @param {function} predicate - function that returns true or false
  @returns {boolean} determination of whether every predicate call was true
 */
function every(array, predicate) {
  let index = -1;
  let length = array.length;

  while (++index < length) {
    if (!predicate(array[index], index)) {
      return false;
    }
  }

  return true;
}

/**
  Like the Lodash _.some function, this function takes an array and a predicate
  function and returns true or false depending on whether the predicate is true
  for any of the items in the array.

  @param {Array} array - array to iterate through
  @param {function} predicate - function that returns true or false
  @returns {boolean} determination of whether any predicate call was true
 */
function some(array, predicate) {
  let index = -1;
  let length = array.length;

  while (++index < length) {
    if (predicate(array[index], index)) {
      return true;
    }
  }

  return false;
}

/**
  This function is similar to Array.prototype.find, but it returns the result
  of calling the value function rather than an item of the array.

  @param {Array} array - array to iterate through
  @param {function} valueFn - function that returns true or false
  @returns {*} the first result of valueFn that returned true or undefined
 */
function firstResult(array, valueFn) {
  let index = -1;
  let length = array.length;

  while (++index < length) {
    let result = valueFn(array[index], index);
    if (result) {
      return result;
    }
  }
}

export { every, some, firstResult };
