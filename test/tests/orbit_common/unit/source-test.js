import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import { all, Promise } from 'rsvp';

var source;

module("OC - Source", {
  setup: function() {
    Orbit.Promise = Promise;

    var schema = new Schema({
      models: {
        planet: {}
      }
    });

    source = new Source(schema, {autoload: false});
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("Source.created", function() {
  expect(1);

  var schema = new Schema({
    models: {
      planet: {}
    }
  });

  var created = sinon.spy(Source, 'created');

  var newSource = new Source(schema);
  ok(created.calledWith(newSource), 'Called Source.created with source');

  created.restore();
});
