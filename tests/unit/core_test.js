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

test("#clone creates a deep clone of an object's own properties", function() {
  var obj = {
    a: 1,
    b: '2',
    c: ["3", {d: "4", e: ["5", "6"]}, 7],
    f: new Date(),
    g: /123/g
  };

  var copy = Orbit.clone(obj);

  deepEqual(obj, copy, 'clone is deeply equal to original');
  notStrictEqual(obj, copy, 'clone is not strictly equal to original');
});

