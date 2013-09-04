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

test("it defines the required actions", function() {
  ['insertObject', 'replaceObject', 'setProperty', 'removeObject'].forEach(function(action) {
    ok(transformable[action], "has the required action " + action);
  });
});
