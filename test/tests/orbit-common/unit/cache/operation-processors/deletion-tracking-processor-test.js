import 'tests/test-helper';
import Schema from 'orbit-common/schema';
import DeletionTrackingProcessor from 'orbit-common/cache/operation-processors/deletion-tracking-processor';
import { uuid } from 'orbit/lib/uuid';
import Cache from 'orbit-common/cache';
import Orbit from 'orbit/main';
import { Promise } from 'rsvp';

let schema, cache, processor;

const schemaDefinition = {
  models: {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon', inverse: 'planet', actsAsSet: true },
        races: { type: 'hasMany', model: 'race', inverse: 'planets' },
        next: { type: 'hasOne', model: 'planet', inverse: 'previous' },
        previous: { type: 'hasOne', model: 'planet', inverse: 'next' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
      }
    },
    race: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planets: { type: 'hasMany', model: 'planet', inverse: 'races' }
      }
    }
  }
};

module('OC - OperationProcessors - DeletionTrackingProcessor', {
  setup() {
    schema = new Schema(schemaDefinition);
    cache = new Cache(schema, { processors: [DeletionTrackingProcessor] });
    processor = cache._processors[0];
  },

  teardown() {
    schema = null;
    cache = null;
    processor = null;
  }
});

test('tracks deletions and makes them queryable through `hasDeleted`', function(assert) {
  const saturn = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' }, relationships: { moons: { 'titan': true } } };
  const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: { 'europa': true } } };

  assert.ok(typeof cache.hasDeleted === 'function', 'adds `hasDeleted` method to cache');

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter }
  });

  assert.equal(cache.hasDeleted('planet/saturn'), false, 'Saturn has not been deleted yet');

  cache.transform(t => t.removeRecord(saturn));

  assert.equal(cache.hasDeleted('planet/saturn'), true, 'Saturn has been deleted');
  assert.equal(cache.hasDeleted('planet/jupiter'), false, 'Jupiter has not been deleted');

  cache.reset();

  assert.equal(cache.hasDeleted('planet/saturn'), false, 'Resets deletion tracking when cache is reset');
});
