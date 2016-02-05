import { equalOps } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import Operation from 'orbit/operation';
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

test('calls Source.created when a source has been created', function() {
  expect(1);

  var created = sinon.spy(Source, 'created');

  var source = new Source({ schema: schema });
  ok(created.calledWith(source), 'Called Source.created with source');

  created.restore();
});

test('will be created without a cache by default', function() {
  var source = new Source({ schema: schema });
  equal(source.cache, null);
});

test('implements Transformable', function() {
  var source = new Source({ schema: schema });
  ok(typeof source.transform === 'function', 'implements `transform`');
});

test('implements Queryable', function() {
  var source = new Source({ schema: schema });
  ok(typeof source.query === 'function', 'implements `query`');
});
