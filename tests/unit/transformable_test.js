import Transformable from 'orbit/transformable';

var transformable;

module("Unit - Transformable", {
  setup: function() {
    transformable = {};
    Transformable.extend(transformable);
  },

  teardown: function() {
    transformable = null;
  }
});

test("it exists", function() {
  ok(transformable);
});
