import { verifyLocalStorageContainsRecord, verifyLocalStorageIsEmpty } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Source from 'orbit/source';
import Schema from 'orbit-common/schema';
import LocalStorageSource from 'orbit-common/local-storage-source';
import { all, Promise } from 'rsvp';

let schema, source;

///////////////////////////////////////////////////////////////////////////////

module('OC - LocalStorageSource', {
  setup: function() {
    schema = new Schema({
      models: {
        planet: {}
      }
    });

    source = new LocalStorageSource({ schema: schema, autoload: false });
  },

  teardown: function() {
    window.localStorage.removeItem(source.namespace);
    schema = source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('its prototype chain is correct', function(assert) {
  assert.ok(source instanceof Source, 'instanceof Source');
});

test('#transform - can update the cache AND local storage', function(assert) {
  assert.expect(4);

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  assert.equal(source.cache.length('planet'), 0, 'source should be empty');

  return source.transform(t => t.addRecord(planet))
    .then(function() {
      assert.equal(source.cache.length('planet'), 1, 'source should be empty');
      assert.deepEqual(source.cache.get(['planet', planet.id]), planet, 'planet matches');
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});

test('it can use a custom local storage namespace for storing data', function(assert) {
  assert.expect(1);

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  source.namespace = 'planets';

  return source.transform(t => t.addRecord(planet))
    .then(function() {
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});

test('autosave can be disabled to delay writing to local storage', function(assert) {
  assert.expect(4);

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  source.disableAutosave();

  assert.equal(source.cache.length('planet'), 0, 'source should be empty');

  return source.transform(t => t.addRecord(planet))
    .then(function() {
      assert.equal(source.cache.length('planet'), 1, 'source should contain one record');
      verifyLocalStorageIsEmpty(source.namespace);

      source.enableAutosave();
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});
