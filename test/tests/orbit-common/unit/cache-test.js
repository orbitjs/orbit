import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import KeyMap from 'orbit-common/key-map';
import { queryExpression as oqe } from 'orbit/query/expression';
import {
  RecordNotFoundException,
  ModelNotRegisteredException
} from 'orbit-common/lib/exceptions';
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

let schema, keyMap;

///////////////////////////////////////////////////////////////////////////////

module('OC - Cache', {
  setup() {
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

    keyMap = new KeyMap();
  },

  teardown() {
    schema = null;
    keyMap = null;
  }
});

test('it exists', function(assert) {
  let cache = new Cache({ schema, keyMap });

  assert.ok(cache);
});

test('#patch sets data and #get retrieves it', function(assert) {
  let cache = new Cache({ schema, keyMap });

  const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

  cache.patch(addRecord(earth));

  assert.deepEqual(cache.get('planet/1'), earth, 'objects match in value');
  assert.notStrictEqual(cache.get('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test('#has indicates whether a path exists', function(assert) {
  let cache = new Cache({ schema, keyMap });

  const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

  cache.patch(addRecord(earth));

  assert.equal(cache.has('planet'), true, 'path exists');
  assert.equal(cache.has('planet/1'), true, 'path exists');
  assert.equal(cache.has('planet/1/id'), true, 'path exists');
  assert.equal(cache.has('planet/1/id/bogus'), false, 'path does not exist');
  assert.equal(cache.has('this/path/is/bogus'), false, 'path does not exist');
});

test('#hasDeleted by default just returns the inverse of #has', function(assert) {
  let cache = new Cache({ schema, keyMap });

  const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

  cache.patch(addRecord(earth));

  assert.equal(cache.hasDeleted('planet'), !cache.has('planet'), 'path exists');
  assert.equal(cache.hasDeleted('planet/1'), !cache.has('planet/1'), 'path exists');
  assert.equal(cache.hasDeleted('planet/1/id/bogus'), !cache.has('planet/1/id/bogus'), false, 'path does not exist');
});

test('#length returns the size of data at a path', function(assert) {
  let cache = new Cache({ schema, keyMap });

  assert.equal(cache.length('notthere'), 0, 'returns 0 when an object does not exist at a path');

  cache.patch([
    addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }),
    addRecord({ type: 'planet', id: '2', attributes: { name: 'Mars' } })
  ]);

  assert.equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.patch(replaceAttribute({ type: 'planet', id: '1' }, 'stuff', { a: true, b: true, c: true }));

  assert.equal(cache.length('planet/1/attributes/stuff'), 3, 'returns size of an object at a path');
});

test('#reset clears the cache by default', function(assert) {
  let cache = new Cache({ schema, keyMap });

  cache.patch(addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));

  cache.reset();

  assert.deepEqual(cache.get(), {});
});

test('#reset overrides the cache completely with the value specified', function(assert) {
  let cache = new Cache({ schema, keyMap });

  cache.patch(addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));

  const newData = { planet: { '2': { type: 'planet', id: '2', attributes: { name: 'Mars' } } } };

  cache.reset(newData);

  assert.deepEqual(cache.get(), newData);
});

test('#patch updates the cache and returns an array of inverse ops', function(assert) {
  let cache = new Cache({ schema, keyMap });

  let inverse = cache.patch([
    addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }),
    removeRecord({ type: 'planet', id: '2' })
  ]);

  assert.deepEqual(
    inverse,
    [
      removeRecord({ type: 'planet', id: '1' })
    ],
    'ignores ops that are noops'
  );
});

test('#patch tracks refs and clears them from hasOne relationships when a referenced record is removed', function(assert) {
  let cache = new Cache({ schema, keyMap });

  const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: undefined } } };
  const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
  const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.patch([
    addRecord(jupiter),
    addRecord(io),
    addRecord(europa)
  ]);

  assert.equal(cache.get('moon/m1/relationships/planet/data'), 'planet:p1', 'Jupiter has been assigned to Io');
  assert.equal(cache.get('moon/m2/relationships/planet/data'), 'planet:p1', 'Jupiter has been assigned to Europa');

  cache.patch(removeRecord(jupiter));

  assert.equal(cache.get('planet/p1'), undefined, 'Jupiter is GONE');

  assert.equal(cache.get('moon/m1/relationships/planet/data'), undefined, 'Jupiter has been cleared from Io');
  assert.equal(cache.get('moon/m2/relationships/planet/data'), undefined, 'Jupiter has been cleared from Europa');
});

test('#patch tracks refs and clears them from hasMany relationships when a referenced record is removed', function(assert) {
  let cache = new Cache({ schema, keyMap });

  var io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: null } } };
  var europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };
  var jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: { 'moon:m1': true, 'moon:m2': true } } } };

  cache.patch([
    addRecord(io),
    addRecord(europa),
    addRecord(jupiter)]);

  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m1'), true, 'Jupiter has been assigned to Io');
  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m2'), true, 'Jupiter has been assigned to Europa');

  cache.patch(removeRecord(io));

  assert.equal(cache.get('moon/m1'), null, 'Io is GONE');

  cache.patch(removeRecord(europa));

  assert.equal(cache.get('moon/m2'), null, 'Europa is GONE');

  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m1'), null, 'Io has been cleared from Jupiter');
  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:m2'), null, 'Europa has been cleared from Jupiter');
});

test('#patch adds link to hasMany if record doesn\'t exist', function(assert) {
  let cache = new Cache({ schema, keyMap });

  cache.patch(addToHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

  assert.equal(cache.get('planet/p1/relationships/moons/data/moon:moon1'), true, 'relationship was added');
});

test('#patch does not remove link from hasMany if record doesn\'t exist', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  cache.on('patch', () => {
    ok(false, 'no operations were applied');
  });

  cache.patch(removeFromHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

  assert.equal(cache.get('planet/p1'), undefined, 'planet does not exist');
});

test('#patch adds hasOne if record doesn\'t exist', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  const operation = {
    op: 'replaceHasOne',
    record: { type: 'moon', id: 'moon1' },
    relationship: 'planet',
    relatedRecord: { type: 'planet', id: 'p1' }
  };

  cache.on('patch', (op) => {
    assert.deepEqual(op, operation, 'applied operation');
  });

  cache.patch([operation]);
});

test('#patch adds empty hasOne link even if record doesn\'t exist', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  const operation = {
    op: 'replaceHasOne',
    record: { type: 'moon', id: 'moon1' },
    relationship: 'planet',
    relatedRecord: null
  };

  cache.on('patch', (op) => {
    assert.deepEqual(op, operation, 'applied operation');
  });

  cache.patch([operation]);
});

test('#patch does not add link to hasMany if link already exists', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: { data: { 'moon:m1': true } } } };

  cache.patch(addRecord(jupiter));

  cache.on('patch', () => {
    assert.ok(false, 'no operations were applied');
  });

  cache.patch(addToHasMany(jupiter, 'moons', { type: 'moon', id: 'm1' }));

  assert.ok(true, 'patch completed');
});

test('#patch does not remove relationship from hasMany if relationship doesn\'t exist', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: {} } };

  cache.patch(addRecord(jupiter));

  cache.on('patch', () => {
    ok(false, 'no operations were applied');
  });

  cache.patch(removeFromHasMany(jupiter, 'moons', { type: 'moon', id: 'm1' }));

  assert.ok(true, 'patch completed');
});

test('does not replace hasOne if relationship already exists', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  const europa = { id: 'm1', type: 'moon', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.patch(addRecord(europa));

  cache.on('patch', () => {
    assert.ok(false, 'no operations were applied');
  });

  cache.patch(replaceHasOne(europa, 'planet', { type: 'planet', id: 'p1' }));

  assert.ok(true, 'patch completed');
});

test('does not remove hasOne if relationship doesn\'t exist', function(assert) {
  assert.expect(1);

  let cache = new Cache({ schema, keyMap });

  const europa = { type: 'moon', id: 'm1', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };

  cache.patch(addRecord(europa));

  cache.on('patch', () => {
    assert.ok(false, 'no operations were applied');
  });

  cache.patch(replaceHasOne(europa, 'planet', null));

  assert.ok(true, 'patch completed');
});

test('#patch removing model with a bi-directional hasOne', function(assert) {
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

  let cache = new Cache({ schema: hasOneSchema, keyMap });

  cache.patch([
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

  cache.patch(removeRecord(two));

  assert.equal(cache.get(['one', '1', 'relationships', 'two', 'data']), null, 'ones link to two got removed');
});

test('#patch removes dependent records', function(assert) {
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

  let cache = new Cache({ schema: dependentSchema, keyMap });

  const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: {} } };
  const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
  const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.patch([
    addRecord(jupiter),
    addRecord(io),
    addRecord(europa),
    addToHasMany(jupiter, 'moons', io),
    addToHasMany(jupiter, 'moons', europa)
  ]);

  // Removing the moon should remove the planet should remove the other moon
  cache.patch(removeRecord(io));

  // TODO-investigate why there's still a moon left
  // assert.equal(cache.length('moon'), 0, 'No moons left in store');
  assert.equal(cache.length('planet'), 0, 'No planets left in store');
});

test('#patch does not remove non-dependent records', function() {
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

  let cache = new Cache({ schema: dependentSchema, keyMap });

  const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: {} } };
  const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
  const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

  cache.patch([
    addRecord(jupiter),
    addRecord(io),
    addRecord(europa),
    addToHasMany(jupiter, 'moons', io),
    addToHasMany(jupiter, 'moons', europa)
  ]);

  // Since there are no dependent relationships, no other records will be
  // removed
  cache.patch(removeRecord(io));

  equal(cache.length('moon'), 1, 'One moon left in store');
  equal(cache.length('planet'), 1, 'One planet left in store');
});

test('#query can retrieve an individual record with `record`', function(assert) {
  let cache = new Cache({ schema, keyMap });

  let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
  cache.reset({ planet: { jupiter } });

  assert.deepEqual(
    cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
    jupiter
  );
});

test('#query can perform a simple matching filter', function(assert) {
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

  assert.throws(
    () => cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
    new RecordNotFoundException('Record not found planet:jupiter')
  );
});

test('#query - record - throws ModelNotRegisteredException if record type doesn\'t exist', function(assert) {
  let cache = new Cache({ schema, keyMap });

  assert.throws(
    () => cache.query(oqe('record', { type: 'black-hole', id: 'jupiter' })),
    new ModelNotRegisteredException('black-hole')
  );
});

test('#query - records - finds matching records', function(assert) {
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

  assert.throws(
    () => cache.query(oqe('records', 'black-hole')),
    new ModelNotRegisteredException('black-hole')
  );
});

test('#query - relatedRecords', function(assert) {
  let cache = new Cache({ schema, keyMap });

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
  let cache = new Cache({ schema, keyMap });

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
