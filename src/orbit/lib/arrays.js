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
