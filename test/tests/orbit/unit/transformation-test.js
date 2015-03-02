import Orbit from 'orbit/main';
import Transformation from 'orbit/transformation';
import Operation from 'orbit/operation';
import { Promise, all } from 'rsvp';

///////////////////////////////////////////////////////////////////////////////

var target;

module("Orbit - Transformation", {
  setup: function() {
    Orbit.Promise = Promise;

    target = {
      _transform: function() {
      }
    };
  },

  teardown: function() {
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  var transformation = new Transformation(target);
  ok(transformation);
});
