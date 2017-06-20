import {
  KeyMap,
  RecordNotFoundException,
  Schema,
  TransformBuilder
} from '@orbit/data';
import Cache from '../src/cache';
import { arrayMembershipMatches } from './test-helper';

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

    cache.patch(t => t.addRecord(earth));

    assert.strictEqual(cache.records('planet').get('1'), earth, 'objects strictly match');
  });

  test('#reset clears the cache by default', function(assert) {
    assert.expect(3);

    let cache = new Cache({ schema, keyMap });

    cache.patch(t => t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));

    assert.equal(cache.records('planet').length, 1);

    cache.on('reset', () => {
      assert.ok(true, 'reset event emitted');
    });

    cache.reset();

    assert.equal(cache.records('planet').length, 0);
  });

  test('#reset overrides the cache completely with data from another cache', function(assert) {
    let cache1 = new Cache({ schema, keyMap });
    let cache2 = new Cache({ schema, keyMap });

    cache1.patch(t => t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }));
    cache2.patch(t => t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Jupiter' } }));

    cache1.reset(cache2);

    assert.strictEqual(cache1.records('planet').get('1').attributes.name, 'Jupiter');
  });

  test('#patch updates the cache and returns an array of inverse ops', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let inverse = cache.patch(t => [
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } }),
      t.removeRecord({ type: 'planet', id: '2' })
    ]);

    assert.deepEqual(
      inverse,
      [
        { op: 'removeRecord', record: { type: 'planet', id: '1' } }
      ],
      'ignores ops that are noops'
    );
  });

  test('#patch tracks refs and clears them from hasOne relationships when a referenced record is removed', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: undefined } } };
    const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
    const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa)
    ]);

    assert.equal(cache.records('moon').get('m1').relationships.planet.data, 'planet:p1', 'Jupiter has been assigned to Io');
    assert.equal(cache.records('moon').get('m2').relationships.planet.data, 'planet:p1', 'Jupiter has been assigned to Europa');

    cache.patch(t => t.removeRecord(jupiter));

    assert.equal(cache.records('planet').get('p1'), undefined, 'Jupiter is GONE');

    assert.equal(cache.records('moon').get('m1').relationships.planet.data, undefined, 'Jupiter has been cleared from Io');
    assert.equal(cache.records('moon').get('m2').relationships.planet.data, undefined, 'Jupiter has been cleared from Europa');
  });

  test('#patch tracks refs and clears them from hasMany relationships when a referenced record is removed', function(assert) {
    let cache = new Cache({ schema, keyMap });

    var io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: null } } };
    var europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };
    var jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: { 'moon:m1': true, 'moon:m2': true } } } };

    cache.patch(t => [
      t.addRecord(io),
      t.addRecord(europa),
      t.addRecord(jupiter)]);

    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m1'], true, 'Jupiter has been assigned to Io');
    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m2'], true, 'Jupiter has been assigned to Europa');

    cache.patch(t => t.removeRecord(io));

    assert.equal(cache.records('moon').get('m1'), null, 'Io is GONE');

    cache.patch(t => t.removeRecord(europa));

    assert.equal(cache.records('moon').get('m2'), null, 'Europa is GONE');

    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m1'], null, 'Io has been cleared from Jupiter');
    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m2'], null, 'Europa has been cleared from Jupiter');
  });

  test('#patch adds link to hasMany if record doesn\'t exist', function(assert) {
    let cache = new Cache({ schema, keyMap });

    cache.patch(t => t.addToHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'm1' }));

    assert.equal(cache.records('planet').get('p1').relationships.moons.data['moon:m1'], true, 'relationship was added');
  });

  test('#patch does not remove link from hasMany if record doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.removeFromHasMany({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

    assert.equal(cache.records('planet').get('p1'), undefined, 'planet does not exist');
  });

  test('#patch adds hasOne if record doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const tb = new TransformBuilder();
    const operation = tb.replaceHasOne(
      { type: 'moon', id: 'moon1' },
      'planet',
      { type: 'planet', id: 'p1' });

    cache.on('patch', (op) => {
      assert.deepEqual(op, operation, 'applied operation');
    });

    cache.patch([operation]);
  });

  test('#patch adds empty hasOne link even if record doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const tb = new TransformBuilder();
    const operation = tb.replaceHasOne(
      { type: 'moon', id: 'moon1' },
      'planet',
      null);

    cache.on('patch', (op) => {
      assert.deepEqual(op, operation, 'applied operation');
    });

    cache.patch([operation]);
  });

  test('#patch does not add link to hasMany if link already exists', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: { data: { 'moon:m1': true } } } };

    cache.patch(t => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.addToHasMany(jupiter, 'moons', { type: 'moon', id: 'm1' }));

    assert.ok(true, 'patch completed');
  });

  test('#patch does not remove relationship from hasMany if relationship doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' } };

    cache.patch(t => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.removeFromHasMany(jupiter, 'moons', { type: 'moon', id: 'm1' }));

    assert.ok(true, 'patch completed');
  });

  test('does not replace hasOne if relationship already exists', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const europa = { id: 'm1', type: 'moon', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

    cache.patch(t => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.replaceHasOne(europa, 'planet', { type: 'planet', id: 'p1' }));

    assert.ok(true, 'patch completed');
  });

  test('does not remove hasOne if relationship doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const europa = { type: 'moon', id: 'm1', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };

    cache.patch(t => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.replaceHasOne(europa, 'planet', null));

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

    cache.patch(t => [
      t.addRecord({
        id: '1',
        type: 'one',
        relationships: {
          two: { data: null }
        }
      }),
      t.addRecord({
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

    cache.patch(t => t.removeRecord(two));

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

    const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' } };
    const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
    const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa),
      t.addToHasMany(jupiter, 'moons', io),
      t.addToHasMany(jupiter, 'moons', europa)
    ]);

    // Removing the moon should remove the planet should remove the other moon
    cache.patch(t => t.removeRecord(io));

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

    const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' } };
    const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: 'planet:p1' } } };
    const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: 'planet:p1' } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa),
      t.addToHasMany(jupiter, 'moons', io),
      t.addToHasMany(jupiter, 'moons', europa)
    ]);

    // Since there are no dependent relationships, no other records will be
    // removed
    cache.patch(t => t.removeRecord(io));

    assert.equal(cache.records('moon').length, 1, 'One moon left in store');
    assert.equal(cache.records('planet').length, 1, 'One planet left in store');
  });

  test('#patch merges records when "replacing" and will not stomp on attributes and relationships that are not replaced', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = new TransformBuilder();

    cache.patch(t => [
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' }, relationships: { moons: { data: { 'moon:m1': true } } } })
    ]);

    let inverse = cache.patch(t => [
      t.replaceRecord({ type: 'planet', id: '1', attributes: { classification: 'terrestrial' } })
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: '1' })),
      { type: 'planet', id: '1', attributes: { name: 'Earth', classification: 'terrestrial' }, relationships: { moons: { data: { 'moon:m1': true } } } },
      'records have been merged'
    );

    assert.deepEqual(
      inverse,
      [
        tb.replaceRecord({ type: 'planet', id: '1', attributes: { classification: null } })
      ],
      'ignores ops that are noops'
    );
  });

  test('#patch merges records when "replacing" and _will_ replace specified attributes and relationships', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = new TransformBuilder();

    cache.patch([
      tb.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' }, relationships: { moons: { data: { 'moon:m1': true } } } })
    ]);

    let inverse = cache.patch([
      tb.replaceRecord({ type: 'planet', id: '1', attributes: { name: 'Jupiter', classification: 'terrestrial' }, relationships: { moons: { data: { 'moon:m2': true } } } })
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: '1' })),
      { type: 'planet', id: '1', attributes: { name: 'Jupiter', classification: 'terrestrial' }, relationships: { moons: { data: { 'moon:m2': true } } } },
      'records have been merged'
    );

    assert.deepEqual(
      inverse,
      [
        tb.replaceRecord({ type: 'planet', id: '1', attributes: { name: 'Earth', classification: null }, relationships: { moons: { data: { 'moon:m1': true } } } })
      ],
      'ignores ops that are noops'
    );
  });

  test('#query can retrieve an individual record with `record`', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    cache.patch(t => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test('#query can perform a simple matching filter', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = new TransformBuilder();

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('planet')
                        .filter({ attribute: 'name', value: 'Jupiter' })),
      [ jupiter ]
    );
  });

  test('#query can perform a complex filter', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('planet')
                        .filter({ attribute: 'atmosphere', value: true },
                                { attribute: 'classification', value: 'terrestrial'})),
      [
        earth,
        venus
      ]
    );
  });

  test('#query can sort by an attribute', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', classification: 'terrestrial', atmosphere: false } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecords('planet')
                        .sort('name')),
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

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecords('planet')
                        .filter({ attribute: 'atmosphere', value: true },
                                { attribute: 'classification', value: 'terrestrial'})
                        .sort('name')),
      [
        earth,
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

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecords('planet')
                        .sort('-name')),
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

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecords('planet')
                        .sort('classification', 'name')),
      [
        jupiter,
        earth,
        mercury,
        venus
      ]
    );
  });

  test('#query - findRecord - finds record', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = {
      id: 'jupiter', type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: { 'moon:callisto': true } } } };

    cache.patch(t => [
      t.addRecord(jupiter)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test('#query - findRecord - throws RecordNotFoundException if record doesn\'t exist', function(assert) {
    let cache = new Cache({ schema, keyMap });

    assert.throws(
      () => cache.query(q => q.findRecord({ type: 'planet', id: 'jupiter' })),
      RecordNotFoundException
    );
  });

  test('#query - findRecords - finds matching records', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = {
      id: 'jupiter', type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: { 'moon:callisto': true } } } };

    const callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: 'planet:jupiter' } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(callisto)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecords('planet')),
      [ jupiter ]
    );
  });

  test('#query - page - can paginate records by offset and limit', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = {
      id: 'jupiter', type: 'planet',
      attributes: { name: 'Jupiter' } };

    const earth = {
      id: 'earth', type: 'planet',
      attributes: { name: 'Earth' } };

    const venus = {
      id: 'venus', type: 'planet',
      attributes: { name: 'Venus' } };

    const mars = {
      id: 'mars', type: 'planet',
      attributes: { name: 'Mars' } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecords('planet').sort('name')),
      [ earth, jupiter, mars, venus ]
    );

    assert.deepEqual(
      cache.query(q => q.findRecords('planet').sort('name').page({ limit: 3 })),
      [ earth, jupiter, mars ]
    );

    assert.deepEqual(
      cache.query(q => q.findRecords('planet').sort('name').page({ offset: 1, limit: 2 })),
      [ jupiter, mars ]
    );
  });

  test('#query - findRelatedRecords', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = {
      id: 'jupiter', type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: { 'moon:callisto': true } } } };

    const callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: 'planet:jupiter' } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(callisto)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')),
      [ callisto ]
    );
  });

  test('#query - findRelatedRecord', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = {
      id: 'jupiter', type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: { 'moon:callisto': true } } } };

    const callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: 'planet:jupiter' } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(callisto)
    ]);

    assert.deepEqual(
      cache.query(q => q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')),
      jupiter
    );
  });
});
