import { verifyLocalStorageContainsRecord, verifyLocalStorageIsEmpty } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import MemorySource from 'orbit-common/memory-source';
import LocalStorageSource from 'orbit-common/local-storage-source';
import { all, Promise } from 'rsvp';
import {
  addRecordOperation
} from 'orbit-common/lib/operations';

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

test('it exists', function() {
  ok(source);
});

test('its prototype chain is correct', function() {
  ok(source instanceof Source,       'instanceof Source');
  ok(source instanceof MemorySource, 'instanceof MemorySource');
});

test('#transform - can update the cache AND local storage', function() {
  expect(4);

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  equal(source.cache.length('planet'), 0, 'source should be empty');

  stop();
  source.transform(addRecordOperation(planet))
    .then(function() {
      start();
      equal(source.cache.length('planet'), 1, 'source should be empty');
      deepEqual(source.cache.get(['planet', planet.id]), planet, 'planet matches');
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});

test('it can use a custom local storage namespace for storing data', function() {
  expect(1);

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  source.namespace = 'planets';

  stop();
  source.transform(addRecordOperation(planet))
    .then(function() {
      start();
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});

test('autosave can be disabled to delay writing to local storage', function() {
  expect(4);

  let planet = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  source.disableAutosave();

  equal(source.cache.length('planet'), 0, 'source should be empty');

  stop();
  source.transform(addRecordOperation(planet))
    .then(function() {
      start();
      equal(source.cache.length('planet'), 1, 'source should contain one record');
      verifyLocalStorageIsEmpty(source.namespace);

      source.enableAutosave();
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});
