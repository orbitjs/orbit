import Schema from 'orbit-common/schema';
import DeletionTrackingProcessor from 'orbit-common/operation-processors/deletion-tracking-processor';
import { uuid } from 'orbit/lib/uuid';
import Operation from 'orbit/operation';
import Cache from 'orbit-common/cache';
import Orbit from 'orbit/main';
import { Promise } from 'rsvp';

var schema,
    cache,
    processor;

var schemaDefinition = {
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
  setup: function() {
    Orbit.Promise = Promise;

    schema = new Schema(schemaDefinition);
    cache = new Cache(schema, { processors: [DeletionTrackingProcessor] });
    processor = cache._processors[0];
  },

  teardown: function() {
    schema = null;
    cache = null;
    processor = null;
  }
});

test('tracks deletions and makes them queryable through `hasDeleted`', function() {
  var saturn = { id: 'saturn', name: 'Saturn', relationships: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: 'Jupiter', relationships: { moons: { 'europa': true } } };

  ok(typeof cache.hasDeleted === 'function', 'adds `hasDeleted` method to cache');

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter }
  });

  equal(cache.hasDeleted('planet/saturn'), false, 'Saturn has not been deleted yet');

  cache.transform([{ op: 'remove', path: 'planet/saturn' }]);

  equal(cache.hasDeleted('planet/saturn'), true, 'Saturn has been deleted');
  equal(cache.hasDeleted('planet/jupiter'), false, 'Jupiter has not been deleted');

  cache.reset();

  equal(cache.hasDeleted('planet/saturn'), false, 'Resets deletion tracking when cache is reset');
});
