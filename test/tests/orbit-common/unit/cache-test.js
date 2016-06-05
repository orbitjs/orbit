import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import Network from 'orbit-common/network';
import { queryExpression as oqe } from 'orbit/query/expression';
import {
  RecordNotFoundException,
  ModelNotRegisteredException
} from 'orbit-common/lib/exceptions';
import { identity } from 'orbit-common/lib/identifiers';
import {
  addRecord,
  // replaceRecord,
  removeRecord,
  // replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  // replaceHasMany,
  replaceHasOne
} from 'orbit-common/transform/operators';

let network, cache;

///////////////////////////////////////////////////////////////////////////////

module('OC - Cache', {
  setup() {
    let schema = new Schema({
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
    network = new Network(schema);
  },

  teardown() {
    network = null;
  }
});

test('it exists', function(assert) {
  cache = new Cache(network);

  assert.ok(cache);
});

test('#transform sets data and #get retrieves it', function(assert) {
  cache = new Cache(network);

  const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

  cache.transform(addRecord(earth));

  assert.deepEqual(cache.get('planet/1'), earth, 'objects match in value');
  assert.notStrictEqual(cache.get('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test('#has indicates whether a path exists', function(assert) {
  cache = new Cache(network);

  const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

  cache.transform(addRecord(earth));

  assert.equal(cache.has('planet'), true, 'path exists');
  assert.equal(cache.has('planet/1'), true, 'path exists');
  assert.equal(cache.has('planet/1/id'), true, 'path exists');
  assert.equal(cache.has('planet/1/id/bogus'), false, 'path does not exist');
  assert.equal(cache.has('this/path/is/bogus'), false, 'path does not exist');
});

test('#hasDeleted by default just returns the inverse of #has', function(assert) {
  cache = new Cache(network);

  const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

  cache.transform(addRecord(earth));

  assert.equal(cache.hasDeleted('planet'), !cache.has('planet'), 'path exists');
  assert.equal(cache.hasDeleted('planet/1'), !cache.has('planet/1'), 'path exists');
  assert.equal(cache.hasDeleted('planet/1/id/bogus'), !cache.has('planet/1/id/bogus'), false, 'path does not exist');
});

// TODO
// test('#prepareOperations - for `add` operations, applies a differential if the target path exists', function() {
//   expect(1);
//
//   var planet = { type: 'planet', id: '1', attributes: { name: 'Saturn' } };
//
//   cache = new Cache(schema);
//   cache.reset({ planet: { '1': planet } });
//
//   var op = {
//     op: 'add',
//     path: ['planet', '1'],
//     value: { type: 'planet', id: '1', attributes: { name: 'Earth', hasRings: false } }
//   };
//
//   var result = cache.prepareOperations([op]);
//   deepEqual(result, [{ op: 'replace', path: 'planet/1/attributes/name', value: 'Earth' },
//                     { op: 'add', path: 'planet/1/attributes/hasRings', value: false }]);
// });
//
// test('#prepareOperations - for `replace` operations, applies a differential if the target path exists', function() {
//   expect(1);
//
//   var planet = { type: 'planet', id: '1', attributes: { name: 'Saturn', hasRings: false } };
//
//   cache = new Cache(schema);
//   cache.reset({ planet: { '1': planet } });
//
//   var op = {
//     op: 'replace',
//     path: ['planet', '1', 'hasRings'],
//     value: true
//   };
//
//   var result = cache.prepareOperations([op]);
//   deepEqual(result, [{ op: 'replace', path: 'planet/1/hasRings', value: true }]);
// });

test('#length returns the size of data at a path', function(assert) {
  cache = new Cache(network);

  assert.equal(cache.length('notthere'), 0, 'returns 0 when an object does not exist at a path');

  cache.transform([
    addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }),
    addRecord({ type: 'planet', id: '2', attributes: { name: 'Mars' } })
  ]);

  assert.equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.transform(replaceAttribute({ type: 'planet', id: '1' }, 'stuff', { a: true, b: true, c: true }));

  assert.equal(cache.length('planet/1/attributes/stuff'), 3, 'returns size of an object at a path');
});

test('#reset clears the cache by default', function(assert) {
  cache = new Cache(network);

  cache.transform(addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));

  cache.reset();

  assert.deepEqual(cache.get(), {});
});

test('#reset overrides the cache completely with the value specified', function(assert) {
  cache = new Cache(network);

  cache.transform(addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));

  const newData = { planet: { '2': { type: 'planet', id: '2', attributes: { name: 'Mars' } } } };

  cache.reset(newData);

  assert.deepEqual(cache.get(), newData);
});

test('#transform still succeeds when an operation is a noop', function(assert) {
  cache = new Cache(network);

  cache.transform([
    addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }),
    removeRecord({ type: 'planet', id: '2' })
  ]);

  assert.ok(true, 'noop transform succeeds');
});

test('#transform tracks refs and clears them from hasOne relationships when a referenced record is removed', function(assert) {
  cache = new Cache(network);

  const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: undefined } } };
  const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
  const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.transform([
    addRecord(jupiter),
    addRecord(io),
    addRecord(europa)
  ]);

  assert.equal(cache.get('moon/m1/relationships/planet/data'), 'planet:p1', 'Jupiter has been assigned to Io');
  assert.equal(cache.get('moon/m2/relationships/planet/data'), 'planet:p1', 'Jupiter has been assigned to Europa');

  cache.transform(removeRecord(jupiter));

  assert.equal(cache.get('planet/p1'), undefined, 'Jupiter is GONE');

  assert.equal(cache.get('moon/m1/relationships/planet/data'), undefined, 'Jupiter has been cleared from Io');
  assert.equal(cache.get('moon/m2/relationships/planet/data'), undefined, 'Jupiter has been cleared from Europa');
});

test('#transform tracks refs and clears them from hasMany relationships when a referenced record is removed', function(assert) {
  cache = new Cache(network);

  var io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: null } } };
  var europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };
  var jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: { 'moon:m1': true, 'moon:m2': true } } } };

  cache.transform([
    addRecord(io),
    addRecord(europa),
    addRecord(jupiter)]);

  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m1'), true, 'Jupiter has been assigned to Io');
  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m2'), true, 'Jupiter has been assigned to Europa');

  cache.transform(removeRecord(io));

  assert.equal(cache.get('moon/m1'), null, 'Io is GONE');

  cache.transform(removeRecord(europa));

  assert.equal(cache.get('moon/m2'), null, 'Europa is GONE');

  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m1'), null, 'Io has been cleared from Jupiter');
  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m2'), null, 'Europa has been cleared from Jupiter');
});

test('#transform adds link to hasMany if record doesn\'t exist', function(assert) {
  cache = new Cache(network);

  cache.transform(addToHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:moon1'), true, 'relationship was added');
});

test('#transform does not remove link from hasMany if record doesn\'t exist', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  cache.on('patch', () => {
    ok(false, 'no operations were applied');
  });

  cache.transform(removeFromHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

  assert.equal(cache.get('planet/p1'), undefined, 'planet does not exist');
});

test('#transform adds hasOne if record doesn\'t exist', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  const operation = {
    op: 'replaceHasOne',
    record: { type: 'moon', id: 'moon1' },
    relationship: 'planet',
    relatedRecord: { type: 'planet', id: 'p1' }
  };

  cache.on('patch', (op) => {
    assert.deepEqual(op, operation, 'applied operation');
  });

  cache.transform([operation]);
});

test('#transform adds empty hasOne link even if record doesn\'t exist', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  const operation = {
    op: 'replaceHasOne',
    record: { type: 'moon', id: 'moon1' },
    relationship: 'planet',
    relatedRecord: null
  };

  cache.on('patch', (op) => {
    assert.deepEqual(op, operation, 'applied operation');
  });

  cache.transform([operation]);
});

test('#transform does not add link to hasMany if link already exists', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: { data: { 'moon:m1': true } } } };

  cache.transform(addRecord(jupiter));

  cache.on('patch', () => {
    assert.ok(false, 'no operations were applied');
  });

  cache.transform(addToHasMany(jupiter, 'moons', { type: 'moon', id: 'm1' }));

  assert.ok(true, 'transform completed');
});

test('#transform does not remove relationship from hasMany if relationship doesn\'t exist', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: {} } };

  cache.transform(addRecord(jupiter));

  cache.on('patch', () => {
    ok(false, 'no operations were applied');
  });

  cache.transform(removeFromHasMany(jupiter, 'moons', { type: 'moon', id: 'm1' }));

  assert.ok(true, 'transform completed');
});

test('does not replace hasOne if relationship already exists', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  const europa = { id: 'm1', type: 'moon', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.transform(addRecord(europa));

  cache.on('patch', () => {
    assert.ok(false, 'no operations were applied');
  });

  cache.transform(replaceHasOne(europa, 'planet', { type: 'planet', id: 'p1' }));

  assert.ok(true, 'transform completed');
});

test('does not remove hasOne if relationship doesn\'t exist', function(assert) {
  assert.expect(1);

  cache = new Cache(network);

  const europa = { type: 'moon', id: 'm1', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };

  cache.transform(addRecord(europa));

  cache.on('patch', () => {
    assert.ok(false, 'no operations were applied');
  });

  cache.transform(replaceHasOne(europa, 'planet', null));

  assert.ok(true, 'transform completed');
});

test('#transform removing model with a bi-directional hasOne', function(assert) {
  assert.expect(5);

  const hasOneSchema = new Schema({
    models: {
      one: {
        relationships: {
          two: { type: 'hasOne', model: 'two', inverse: 'one' }
        }
      },
      two: {
        relationships: {
          one: { type: 'hasOne', model: 'one', inverse: 'two' }
        }
      }
    }
  });
  let network = new Network(hasOneSchema);
  cache = new Cache(network);
  cache.transform([
    addRecord({
      id: '1',
      type: 'one',
      relationships: {
        two: { data: null }
      }
    }),
    addRecord({
      id: '2',
      type: 'two',
      relationships: {
        one: { data: 'one:1' }
      }
    })
  ]);

  const one = cache.get(['one', '1']);
  const two = cache.get(['two', '2']);
  assert.ok(one, 'one exists');
  assert.ok(two, 'two exists');
  assert.equal(one.relationships.two.data, 'two:2', 'one links to two');
  assert.equal(two.relationships.one.data, 'one:1', 'two links to one');

  cache.transform(removeRecord(two));

  assert.equal(cache.get(['one', '1', 'relationships', 'two', 'data']), null, 'ones link to two got removed');
});

test('#transform removes dependent records', function(assert) {
  // By making this schema recursively dependent remove we check that recursive
  // works as well.
  const dependentSchema = new Schema({
    models: {
      planet: {
        relationships: {
          moons: { type: 'hasMany', model: 'moon', dependent: 'remove' }
        }
      },
      moon: {
        relationships: {
          planet: { type: 'hasOne', model: 'planet', dependent: 'remove' }
        }
      }
    }
  });
  let network = new Network(dependentSchema);
  cache = new Cache(network);

  const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: {} } };
  const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
  const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.transform([
    addRecord(jupiter),
    addRecord(io),
    addRecord(europa),
    addToHasMany(jupiter, 'moons', io),
    addToHasMany(jupiter, 'moons', europa)
  ]);

  // Removing the moon should remove the planet should remove the other moon
  cache.transform(removeRecord(io));

  // TODO-investigate why there's still a moon left
  // assert.equal(cache.length('moon'), 0, 'No moons left in store');
  assert.equal(cache.length('planet'), 0, 'No planets left in store');
});

test('#transform does not remove non-dependent records', function() {
  const dependentSchema = new Schema({
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
  let network = new Network(dependentSchema);
  cache = new Cache(network);

  const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: {} } };
  const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
  const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.transform([
    addRecord(jupiter),
    addRecord(io),
    addRecord(europa),
    addToHasMany(jupiter, 'moons', io),
    addToHasMany(jupiter, 'moons', europa)
  ]);

  // Since there are no dependent relationships, no other records will be
  // removed
  cache.transform(removeRecord(io));

  equal(cache.length('moon'), 1, 'One moon left in store');
  equal(cache.length('planet'), 1, 'One planet left in store');
});

test('#query can retrieve an individual record with `record`', function(assert) {
  cache = new Cache(network);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
    jupiter
  );
});

test('#query can perform a simple matching filter', function(assert) {
  cache = new Cache(network);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
  let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
  let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

  cache.reset({ planet: { jupiter, earth, venus, mercury } });

  assert.deepEqual(
    cache.query(
      oqe('filter',
          oqe('records', 'planet'),
          oqe('equal', oqe('attribute', 'name'), 'Jupiter'))
    ),
    {
      jupiter
    }
  );
});

test('#query can perform a complex conditional `and` filter', function(assert) {
  cache = new Cache(network);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
  let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
  let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

  cache.reset({ planet: { jupiter, earth, venus, mercury } });

  assert.deepEqual(
    cache.query(
      oqe('filter',
          oqe('records', 'planet'),
          oqe('and',
            oqe('equal', oqe('attribute', 'classification'), 'terrestrial'),
            oqe('equal', oqe('attribute', 'atmosphere'), true)
          ))
    ),
    {
      earth,
      venus
    }
  );
});

test('#query can perform a complex conditional `or` filter', function(assert) {
  cache = new Cache(network);

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
  let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
  let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

  cache.reset({ planet: { jupiter, earth, venus, mercury } });

  assert.deepEqual(
    cache.query(
      oqe('filter',
          oqe('records', 'planet'),
          oqe('or',
              oqe('equal', oqe('attribute', 'classification'), 'gas giant'),
              oqe('equal', oqe('attribute', 'atmosphere'), true)
         ))
    ),
    {
      jupiter,
      earth,
      venus
    }
  );
});

test('#query - record', function(assert) {
  cache = new Cache(network);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
    jupiter
  );
});

test('#query - record - finds record', function(assert) {
  cache = new Cache(network);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
    jupiter
  );
});

test('#query - record - throws RecordNotFoundException if record doesn\'t exist', function(assert) {
  cache = new Cache(network);

  assert.throws(
    () => cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
    new RecordNotFoundException('Record not found planet:jupiter')
  );
});

test('#query - records - finds matching records', function(assert) {
  cache = new Cache(network);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  const callisto = {
    id: 'callisto', type: 'moon',
    attributes: { name: 'Callisto' },
    relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({ planet: { jupiter }, moon: { callisto } });

  assert.deepEqual(
    cache.query(oqe('records', 'planet')),
    { jupiter }
  );
});

test('#query - records - throws ModelNotRegisteredException when model isn\'t registered in schema', function(assert) {
  cache = new Cache(network);

  assert.throws(
    () => cache.query(oqe('records', 'black-hole')),
    new ModelNotRegisteredException('No model registered for black-hole')
  );
});

test('#query - relatedRecords', function(assert) {
  cache = new Cache(network);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  const callisto = {
    id: 'callisto', type: 'moon',
    attributes: { name: 'Callisto' },
    relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({ planet: { jupiter }, moon: { callisto } });

  assert.deepEqual(
    cache.query(oqe('relatedRecords', { type: 'planet', id: 'jupiter' }, 'moons')),
    {
      callisto
    }
  );
});

test('#query - relatedRecord', function(assert) {
  cache = new Cache(network);

  const jupiter = {
    id: 'jupiter', type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:callisto': true } } } };

  const callisto = {
    id: 'callisto', type: 'moon',
    attributes: { name: 'Callisto' },
    relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({ planet: { jupiter }, moon: { callisto } });

  assert.deepEqual(
    cache.query(oqe('relatedRecord', { type: 'moon', id: 'callisto' }, 'planet')),
    {
      jupiter
    }
  );
});

test('#rollback', function(assert) {
  cache = new Cache(network);

  const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
  const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
  const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
  const recordD = { id: 'neptune', type: 'planet', attributes: { name: 'Neptune' } };
  const recordE = { id: 'uranus', type: 'planet', attributes: { name: 'Uranus' } };

  const addRecordATransform = cache.transform(addRecord(recordA));
  cache.transform(addRecord(recordB));
  cache.transform(addRecord(recordC));
  cache.transform([
    addRecord(recordD),
    addRecord(recordE)
  ]);

  const rollbackOperations = [];
  cache.on('patch', (operation) => rollbackOperations.push(operation));

  cache.rollback(addRecordATransform.id);

  assert.deepEqual(
    rollbackOperations,
    [
      { op: 'removeRecord', record: identity(recordE) },
      { op: 'removeRecord', record: identity(recordD) },
      { op: 'removeRecord', record: identity(recordC) },
      { op: 'removeRecord', record: identity(recordB) }
    ],
    'emits inverse operations in correct order'
  );

  equal(cache.transformLog.head(), addRecordATransform.id, 'rolls back transform log');
});
