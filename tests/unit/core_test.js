import Orbit from 'orbit/core';

module("Unit - Core", {
  setup: function() {
  }
});

test("it exists", function() {
  ok(Orbit);
});

test("#idField defines a default id field", function() {
  equal(Orbit.idField, '__id', 'default internal id field');
});

test("#generateId generates unique ids", function() {
  notEqual(Orbit.generateId(), Orbit.generateId(), 'a weak test to ensure uniqueness');
});

test("#capitalize capitalizes the first letter of a word", function() {
  equal(Orbit.capitalize('cauliflower'), 'Cauliflower', 'capitalize capitalizes the first letter of a word');
  equal(Orbit.capitalize('aSAP'), 'ASAP', 'capitalize doesn\'t touch the rest of the word');
});

test("#arrayToOptions converts an array to an options hash", function() {
  deepEqual(Orbit.arrayToOptions(), {}, 'no args return empty hash');
  deepEqual(Orbit.arrayToOptions([]), {}, 'empty array returns empty hash');
  deepEqual(Orbit.arrayToOptions(['a', 'b']), {a: true, b: true}, 'items in array are converted to items in hash');
});
