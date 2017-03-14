import {
  addRecord,
  // replaceRecord,
  removeRecord,
  // replaceKey,
  // replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  // replaceHasMany,
  replaceHasOne,
  KeyMap,
  queryExpression as oqe,
  RecordNotFoundException,
  Schema
} from '@orbit/core';
import Cache from '../src/cache';
import './test-helper';

const { module, test } = QUnit;

module('Cache', function(hooks) {
  let schema, keyMap;
  
  hooks.beforeEach(function() {
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
  });

  hooks.afterEach(function() {
    schema = null;
    keyMap = null;
  });

  test('it exists', function(assert) {
    let cache = new Cache({ schema });

    assert.ok(cache);
  });

  test('#patch sets data and #records retrieves it', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' } };

    cache.patch(addRecord(earth));

    assert.strictEqual(cache.records('planet').get('1'), earth, 'objects strictly match');
  });

  test('#reset clears the cache by default', function(assert) {
    let cache = new Cache({ schema, keyMap });

    cache.patch(addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));

    assert.equal(cache.records('planet').length, 1);

    cache.reset();

    assert.equal(cache.records('planet').length, 0);
  });

  test('#reset overrides the cache completely with data from another cache', function(assert) {
    let cache1 = new Cache({ schema, keyMap });
    let cache2 = new Cache({ schema, keyMap });

    cache1.patch(addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));
    cache2.patch(addRecord({ type: 'planet', id: '1', attributes: { name: 'Jupiter' } }));

    cache1.reset(cache2);

    assert.strictEqual(cache1.records('planet').get('1').attributes.name, 'Jupiter');
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

    assert.equal(cache.records('moon').get('m1').relationships.planet.data, 'planet:p1', 'Jupiter has been assigned to Io');
    assert.equal(cache.records('moon').get('m2').relationships.planet.data, 'planet:p1', 'Jupiter has been assigned to Europa');

    cache.patch(removeRecord(jupiter));

    assert.equal(cache.records('planet').get('p1'), undefined, 'Jupiter is GONE');

    assert.equal(cache.records('moon').get('m1').relationships.planet.data, undefined, 'Jupiter has been cleared from Io');
    assert.equal(cache.records('moon').get('m2').relationships.planet.data, undefined, 'Jupiter has been cleared from Europa');
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

    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m1'], true, 'Jupiter has been assigned to Io');
    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m2'], true, 'Jupiter has been assigned to Europa');

    cache.patch(removeRecord(io));

    assert.equal(cache.records('moon').get('m1'), null, 'Io is GONE');

    cache.patch(removeRecord(europa));

    assert.equal(cache.records('moon').get('m2'), null, 'Europa is GONE');

    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m1'], null, 'Io has been cleared from Jupiter');
    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m2'], null, 'Europa has been cleared from Jupiter');
  });

  test('#patch adds link to hasMany if record doesn\'t exist', function(assert) {
    let cache = new Cache({ schema, keyMap });

    cache.patch(addToHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'm1' }));

    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m1'], true, 'relationship was added');
  });

  test('#patch does not remove link from hasMany if record doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    cache.on('patch', () => {
      ok(false, 'no operations were applied');
    });

    cache.patch(removeFromHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

    assert.equal(cache.records('planet').get('p1'), undefined, 'planet does not exist');
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

    const one = cache.records('one').get('1');
    const two = cache.records('two').get('2');
    assert.ok(one, 'one exists');
    assert.ok(two, 'two exists');
    assert.equal(one.relationships.two.data, 'two:2', 'one links to two');
    assert.equal(two.relationships.one.data, 'one:1', 'two links to one');

    cache.patch(removeRecord(two));

    assert.equal(cache.records('one').get('1').relationships.two.data, null, 'ones link to two got removed');
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
    // assert.equal(cache.records('moon').length, 0, 'No moons left in store');
    assert.equal(cache.records('planet').length, 0, 'No planets left in store');
  });

  test('#patch does not remove non-dependent records', function(assert) {
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

    assert.equal(cache.records('moon').length, 1, 'One moon left in store');
    assert.equal(cache.records('planet').length, 1, 'One planet left in store');
  });

  test('#query can retrieve an individual record with `record`', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    cache.patch([addRecord(jupiter)]);

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

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

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

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

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

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

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


  test('#query can sort by an attribute', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(
        oqe('sort',
          oqe('records', 'planet'),
          [{ field: oqe('attribute', 'name'), order: 'ascending' }]
        )
      ),
      [
        earth,
        jupiter,
        mercury,
        venus
      ]
    );
  });

  test('#query can filter and sort by attributes', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(
        oqe('sort',
          oqe('filter',
              oqe('records', 'planet'),
              oqe('equal', oqe('attribute', 'classification'), 'terrestrial')),
          [{ field: oqe('attribute', 'name'), order: 'ascending' }]
        )
      ),
      [
        earth,
        mercury,
        venus
      ]
    );
  });

  test('#query can sort by an attribute in descending order', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(
        oqe('sort',
          oqe('records', 'planet'),
          [{ field: oqe('attribute', 'name'), order: 'descending' }]
        )
      ),
      [
        venus,
        mercury,
        jupiter,
        earth
      ]
    );
  });

  test('#query can sort by according to multiple criteria', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch([
      addRecord(jupiter),
      addRecord(earth),
      addRecord(venus),
      addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(
        oqe('sort',
          oqe('records', 'planet'),
          [
            { field: oqe('attribute', 'classification'), order: 'ascending' },
            { field: oqe('attribute', 'name'), order: 'ascending' }
          ]
        )
      ),
      [
        jupiter,
        earth,
        mercury,
        venus
      ]
    );
  });

  test('#query - record', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = {
      id: 'jupiter', type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: { 'moon:callisto': true } } } };

    cache.patch([
      addRecord(jupiter)
    ]);

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

    cache.patch([
      addRecord(jupiter)
    ]);

    assert.deepEqual(
      cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test('#query - record - throws RecordNotFoundException if record doesn\'t exist', function(assert) {
    let cache = new Cache({ schema, keyMap });

    assert.throws(
      () => cache.query(oqe('record', { type: 'planet', id: 'jupiter' })),
      RecordNotFoundException
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

    cache.patch([
      addRecord(jupiter),
      addRecord(callisto)
    ]);

    assert.deepEqual(
      cache.query(oqe('records', 'planet')),
      { jupiter }
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

    cache.patch([
      addRecord(jupiter),
      addRecord(callisto)
    ]);

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

    cache.patch([
      addRecord(jupiter),
      addRecord(callisto)
    ]);

    assert.deepEqual(
      cache.query(oqe('relatedRecord', { type: 'moon', id: 'callisto' }, 'planet')),
      jupiter
    );
  });
});
