import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import { all, Promise } from 'rsvp';

var schema;

module('OC - Source', {
  setup: function() {
    schema = new Schema({
      models: {
        planet: {}
      }
    });
  },

  teardown: function() {
    schema = null;
  }
});

test('can be created with a schema', function(assert) {
  const source = new Source({ schema: schema });
  assert.ok(source, 'source exists');
});
