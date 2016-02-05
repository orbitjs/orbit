import Orbit from 'orbit/main';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import { equalOps, op } from 'tests/test-helper';
import { Promise, on } from 'rsvp';
import {
  queryExpression as oqe
} from 'orbit/query/expression';
import {
  addRecordOperation
} from 'orbit-common/lib/operations';
import Transform from 'orbit/transform';

var schema,
    cache;

///////////////////////////////////////////////////////////////////////////////

module('OC - Cache', {
  setup: function() {
    Orbit.Promise = Promise;
    schema = new Schema({
      models: {
        planet: {
          relationships: {
            moons: { type: 'hasMany', model: 'moon' }
          }
        },
        moon: {
          relationships: {
            planet: { type: 'hasOne', model: 'planet' }
          }
        }
      }
    });
  },

  teardown: function() {
    schema = null;
  }
});

test('it exists', function() {
  cache = new Cache(schema);

  ok(cache);
});

test('is sparse by default', function(assert) {
  cache = new Cache(schema);

  assert.equal(cache.sparse, true, 'sparse is true');
  assert.equal(cache.get('planet'), undefined, 'no data is initialized');
});

test('non-sparse caches will initialize data for all models in a schema', function(assert) {
  cache = new Cache(schema, { sparse: false });

  assert.equal(cache.sparse, false, 'sparse is false');
  assert.deepEqual(cache.get('planet'), {}, 'data is initialized');
});

test('#transform sets data and #get retrieves it', function() {
  cache = new Cache(schema);

  var earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
  cache.transform([{ op: 'add', path: 'planet/1', value: earth }]);
  deepEqual(cache.get('planet/1'), earth, 'objects match in value');
  notStrictEqual(cache.get('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test('#has indicates whether a path exists', function() {
  cache = new Cache(schema);

  var earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
  cache.transform([{ op: 'add', path: 'planet/1', value: earth }]);
  equal(cache.has('planet'), true, 'path exists');
  equal(cache.has('planet/1'), true, 'path exists');
  equal(cache.has('planet/1/id'), true, 'path exists');
  equal(cache.has('planet/1/id/bogus'), false, 'path does not exist');
  equal(cache.has('this/path/is/bogus'), false, 'path does not exist');
});

test('#hasDeleted by default just returns the inverse of #has', function() {
  cache = new Cache(schema);

  var earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
  cache.transform([{ op: 'add', path: 'planet/1', value: earth }]);
  equal(cache.hasDeleted('planet'), !cache.has('planet'), 'path exists');
  equal(cache.hasDeleted('planet/1'), !cache.has('planet/1'), 'path exists');
  equal(cache.hasDeleted('planet/1/id/bogus'), !cache.has('planet/1/id/bogus'), false, 'path does not exist');
});

test('#prepareOperations - for `add` operations, applies a differential if the target path exists', function() {
  expect(1);

  var planet = { type: 'planet', id: '1', attributes: { name: 'Saturn' } };

  cache = new Cache(schema);
  cache.reset({ planet: { '1': planet } });

  var op = {
    op: 'add',
    path: ['planet', '1'],
    value: { type: 'planet', id: '1', attributes: { name: 'Earth', hasRings: false } }
  };

  var result = cache.prepareOperations([op]);
  equalOps(result, [{ op: 'replace', path: 'planet/1/attributes/name', value: 'Earth' },
                    { op: 'add', path: 'planet/1/attributes/hasRings', value: false }]);
});

test('#prepareOperations - for `replace` operations, applies a differential if the target path exists', function() {
  expect(1);

  var planet = { type: 'planet', id: '1', attributes: { name: 'Saturn', hasRings: false } };

  cache = new Cache(schema);
  cache.reset({ planet: { '1': planet } });

  var op = {
    op: 'replace',
    path: ['planet', '1', 'hasRings'],
    value: true
  };

  var result = cache.prepareOperations([op]);
  equalOps(result, [{ op: 'replace', path: 'planet/1/hasRings', value: true }]);
});

test('#length returns the size of data at a path', function() {
  cache = new Cache(schema);

  equal(cache.length('notthere'), 0, 'returns 0 when an object does not exist at a path');

  cache.transform([{ op: 'add', path: 'planet/1', value: { type: 'planet', id: '1', attributes: { name: 'Earth' } } },
                   { op: 'add', path: 'planet/2', value: { type: 'planet', id: '2', attributes: { name: 'Mars' } } }]);

  equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.transform([{ op: 'add', path: 'planet/1/stuff', value: ['a', 'b', 'c'] }]);

  equal(cache.length('planet/1/stuff'), 3, 'returns size of an array at a path');
});

test('#reset clears the cache by default', function() {
  cache = new Cache(schema);

  cache.transform([{ op: 'add', path: 'planet/1', value: { type: 'planet', id: '1', attributes: { name: 'Earth' } } }]);
  cache.reset();
  deepEqual(cache.get(), {});
});

test('#reset overrides the cache completely with the value specified', function() {
  cache = new Cache(schema);

  cache.transform([{ op: 'add', path: 'planet/1', value: { type: 'planet', id: '1', attributes: { name: 'Earth' } } }]);

  var newData = { planet: { '2': { name: 'Mars' } } };
  cache.reset(newData);
  deepEqual(cache.get(), newData);
});


test('#get will get missing data from a `fallback` cache if one has been set', function(assert) {
  assert.expect(1);

  var fallbackCache = new Cache(schema);
  var mars = { name: 'Mars' };
  fallbackCache.reset({ planet: { '2': mars } });

  cache = new Cache(schema, { fallback: fallbackCache });

  assert.deepEqual(cache.get('planet/2'), mars, 'data retrieved from fallback');
});

test('#rollback', function(assert) {
  const addRecordAOp = addRecordOperation({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } });
  const addRecordBOp = addRecordOperation({ id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } });
  const addRecordCOp = addRecordOperation({ id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } });
  const addRecordDOp = addRecordOperation({ id: 'neptune', type: 'planet', attributes: { name: 'Neptune' } });
  const addRecordEOp = addRecordOperation({ id: 'uranus', type: 'planet', attributes: { name: 'Uranus' } });

  const addRecordATransform = new Transform([addRecordAOp]);
  const addRecordBTransform = new Transform([addRecordBOp]);
  const addRecordCTransform = new Transform([addRecordCOp]);
  const addRecordsDETransform = new Transform([addRecordDOp, addRecordEOp]);

  const removeRecordAOp = op('remove', 'planet/jupiter');
  const removeRecordBOp = op('remove', 'planet/saturn');
  const removeRecordCOp = op('remove', 'planet/pluto');
  const removeRecordDOp = op('remove', 'planet/neptune');
  const removeRecordEOp = op('remove', 'planet/uranus');

  cache = new Cache(schema);

  cache.transform(addRecordATransform);
  cache.transform(addRecordBTransform);
  cache.transform(addRecordCTransform);
  cache.transform(addRecordsDETransform);

  const rollbackOperations = [];
  cache.on('patch', (operation) => rollbackOperations.push(operation));

  cache.rollback(addRecordATransform.id);

  equalOps(
    rollbackOperations,
    [
      removeRecordEOp,
      removeRecordDOp,
      removeRecordCOp,
      removeRecordBOp
    ],
    'emits inverse operations in correct order'
  );

  equal(cache._transformLog.head(), addRecordATransform.id, 'rolls back transform log');
});
