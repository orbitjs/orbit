import Orbit from 'orbit/core';

module("Unit - Core", {
  setup: function() {

  }
});

test("it exists", function() {
  ok(Orbit);
});

test("capitalize capitalizes the first letter of a word", function() {
  equal(Orbit.capitalize("cauliflower"), "Cauliflower", "capitalize capitalizes the first letter of a word");
  equal(Orbit.capitalize("aSAP"), "ASAP", "capitalize doesn't touch the rest of the word");
})