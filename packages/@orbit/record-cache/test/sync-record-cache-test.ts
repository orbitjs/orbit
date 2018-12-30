import {
  KeyMap,
  RecordNotFoundException,
  Schema,
  equalRecordIdentities,
  recordsInclude,
  recordsIncludeAll
} from '@orbit/data';
import {
  SyncSchemaValidationProcessor
} from '../src/index';
import Cache from './support/example-sync-record-cache';
import { arrayMembershipMatches } from './support/matchers';

const { module, test } = QUnit;

module('SyncRecordCache', function(hooks) {
  let schema: Schema,
      keyMap: KeyMap;

  hooks.beforeEach(function() {
    schema = new Schema({
      models: {
        planet: {
          keys: {
            remoteId: {}
          },
          relationships: {
            moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
          }
        },
        moon: {
          keys: {
            remoteId: {}
          },
          relationships: {
            planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
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
    assert.equal(cache.processors.length, 3, 'processors are assigned by default');
  });

  test('can be assigned processors', function(assert) {
    let cache = new Cache({ schema, processors: [SyncSchemaValidationProcessor] });
    assert.ok(cache);

    class FakeProcessor {};
    assert.throws(
      //@ts-ignore
      () => cache = new Cache({ schema, processors: [FakeProcessor] })
    );
  });

  test('#patch sets data and #records retrieves it', function(assert) {
    assert.expect(4);

    let cache = new Cache({ schema, keyMap });

    const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' }, keys: { remoteId: 'a' } };

    cache.on('patch', (operation, data) => {
      assert.deepEqual(operation, {
        op: 'addRecord',
        record: earth
      });
      assert.deepEqual(data, earth);
    });

    cache.patch(t => t.addRecord(earth));

    assert.strictEqual(cache.getRecordSync({ type: 'planet', id: '1' }), earth, 'objects strictly match');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1', 'key has been mapped');
  });

  test('#patch can replace records', function(assert) {
    assert.expect(4);

    let cache = new Cache({ schema, keyMap });

    const earth = { type: 'planet', id: '1', attributes: { name: 'Earth' }, keys: { remoteId: 'a' } };

    cache.on('patch', (operation, data) => {
      assert.deepEqual(operation, {
        op: 'replaceRecord',
        record: earth
      });
      assert.deepEqual(data, earth);
    });

    cache.patch(t => t.replaceRecord(earth));

    assert.strictEqual(cache.getRecordSync({ type: 'planet', id: '1' }), earth, 'objects strictly match');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1', 'key has been mapped');
  });

  test('#patch can replace keys', function(assert) {
    assert.expect(4);

    let cache = new Cache({ schema, keyMap });

    const earth = { type: 'planet', id: '1' };

    cache.on('patch', (operation, data) => {
      assert.deepEqual(operation, {
        op: 'replaceKey',
        record: earth,
        key: 'remoteId',
        value: 'a'
      });
      assert.deepEqual(data, { type: 'planet', id: '1', keys: { remoteId: 'a' } });
    });

    cache.patch(t => t.replaceKey(earth, 'remoteId', 'a'));

    assert.deepEqual(cache.getRecordSync({ type: 'planet', id: '1' }), { type: 'planet', id: '1', keys: { remoteId: 'a' } }, 'records match');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'a'), '1', 'key has been mapped');
  });

  test('#patch updates the cache and returns arrays of primary data and inverse ops', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let p1 = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
    let p2 = { type: 'planet', id: '2' };

    let result = cache.patch(t => [
      t.addRecord(p1),
      t.removeRecord(p2)
    ]);

    assert.deepEqual(
      result,
      {
        data: [
          p1,
          null // null because p2 didn't exist
        ],
        inverse:[
          { op: 'removeRecord', record: { type: 'planet', id: '1' } }
        ]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch tracks refs and clears them from hasOne relationships when a referenced record is removed', function(assert) {
    let cache = new Cache({ schema, keyMap });

    const jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: undefined } } };
    const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: { type: 'planet', id: 'p1'} } } };
    const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: { type: 'planet', id: 'p1'} } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data, { type: 'planet', id: 'p1' }, 'Jupiter has been assigned to Io');
    assert.deepEqual(cache.getRecordSync({ type: 'moon', id: 'm2' }).relationships.planet.data, { type: 'planet', id: 'p1' }, 'Jupiter has been assigned to Europa');

    cache.patch(t => t.removeRecord(jupiter));

    assert.equal(cache.getRecordSync({ type: 'planet', id: 'p1' }), undefined, 'Jupiter is GONE');

    assert.equal(cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data, undefined, 'Jupiter has been cleared from Io');
    assert.equal(cache.getRecordSync({ type: 'moon', id: 'm2' }).relationships.planet.data, undefined, 'Jupiter has been cleared from Europa');
  });

  test('#patch tracks refs and clears them from hasMany relationships when a referenced record is removed', function(assert) {
    let cache = new Cache({ schema, keyMap });

    var io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: null } } };
    var europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: null } } };
    var jupiter = { type: 'planet', id: 'p1', attributes: { name: 'Jupiter' }, relationships: { moons: { data: [{ type: 'moon', id: 'm1' }, { type: 'moon', id: 'm2' }] } } };

    cache.patch(t => [
      t.addRecord(io),
      t.addRecord(europa),
      t.addRecord(jupiter)]);

    assert.deepEqual(cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons.data, [{ type: 'moon', id: 'm1' }, { type: 'moon', id: 'm2' }], 'Jupiter has been assigned to Io and Europa');
    assert.ok(recordsIncludeAll(cache.getRelatedRecordsSync(jupiter, 'moons'), [io, europa]), 'Jupiter has been assigned to Io and Europa');

    cache.patch(t => t.removeRecord(io));

    assert.equal(cache.getRecordSync({ type: 'moon', id: 'm1' }), null, 'Io is GONE');

    cache.patch(t => t.removeRecord(europa));

    assert.equal(cache.getRecordSync({ type: 'moon', id: 'm2' }), null, 'Europa is GONE');

    assert.equal(cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons.data['moon:m1'], null, 'Io has been cleared from Jupiter');
    assert.equal(cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons.data['moon:m2'], null, 'Europa has been cleared from Jupiter');
  });

  test('#patch adds link to hasMany if record doesn\'t exist', function(assert) {
    let cache = new Cache({ schema, keyMap });

    cache.patch(t => t.addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'm1' }));

    assert.deepEqual(cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons.data, [{ type: 'moon', id: 'm1' }], 'relationship was added');
  });

  test('#patch does not remove hasMany relationship if record doesn\'t exist', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.removeFromRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', { type: 'moon', id: 'moon1' }));

    assert.equal(cache.getRecordSync({ type: 'planet', id: 'p1' }), undefined, 'planet does not exist');
  });

  test('#patch adds hasOne if record doesn\'t exist', function(assert) {
    assert.expect(2);

    let cache = new Cache({ schema, keyMap });

    const tb = cache.transformBuilder;
    const replacePlanet = tb.replaceRelatedRecord(
      { type: 'moon', id: 'moon1' },
      'planet',
      { type: 'planet', id: 'p1' });

    const addToMoons = tb.addToRelatedRecords(
      { type: 'planet', id: 'p1' },
      'moons',
      { type: 'moon', id: 'moon1' });

    let order = 0;
    cache.on('patch', (op) => {
      order++;
      if (order === 1) {
        assert.deepEqual(op, replacePlanet, 'applied replacePlanet operation');
      } else if (order === 2) {
        assert.deepEqual(op, addToMoons, 'applied addToMoons operation');
      } else {
        assert.ok(false, 'too many ops');
      }
    });

    cache.patch([replacePlanet]);
  });

  test('#patch will add empty hasOne link if record doesn\'t exist', function(assert) {
    assert.expect(2);

    let cache = new Cache({ schema, keyMap });

    const tb = cache.transformBuilder;
    const clearPlanet = tb.replaceRelatedRecord(
      { type: 'moon', id: 'moon1' },
      'planet',
      null);

    let order = 0;
    cache.on('patch', (op) => {
      order++;
      if (order === 1) {
        assert.deepEqual(op, clearPlanet, 'applied clearPlanet operation');
      } else {
        assert.ok(false, 'too many ops');
      }
    });

    cache.patch([clearPlanet]);

    assert.ok(true, 'patch applied')
  });

  test('#patch does not add link to hasMany if link already exists', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const jupiter = { id: 'p1', type: 'planet', attributes: { name: 'Jupiter' }, relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } } };

    cache.patch(t => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' }));

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

    cache.patch(t => t.removeFromRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' }));

    assert.ok(true, 'patch completed');
  });

  test('#patch can add and remove to has-many relationship', function(assert) {
    assert.expect(2);

    let cache = new Cache({ schema, keyMap });

    const jupiter = { id: 'jupiter', type: 'planet' };
    cache.patch(t => t.addRecord(jupiter));

    const callisto = { id: 'callisto', type: 'moon' };
    cache.patch(t => t.addRecord(callisto));

    cache.patch(t => t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'callisto' }));

    assert.ok(recordsInclude(cache.getRelatedRecordsSync(jupiter, 'moons'), callisto), 'moon added');

    cache.patch(t => t.removeFromRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'callisto' }));

    assert.notOk(recordsInclude(cache.getRelatedRecordsSync(jupiter, 'moons'), callisto), 'moon removed');
  });

  test('#patch can add and clear has-one relationship', function(assert) {
    assert.expect(2);

    let cache = new Cache({ schema, keyMap });

    const jupiter = { id: 'jupiter', type: 'planet' };
    cache.patch(t => t.addRecord(jupiter));

    const callisto = { id: 'callisto', type: 'moon' };
    cache.patch(t => t.addRecord(callisto));

    cache.patch(t => t.replaceRelatedRecord(callisto, 'planet', { type: 'planet', id: 'jupiter' }));

    assert.ok(equalRecordIdentities(cache.getRelatedRecordSync(callisto, 'planet'), jupiter), 'relationship added');

    cache.patch(t => t.replaceRelatedRecord(callisto, 'planet', null));

    assert.notOk(equalRecordIdentities(cache.getRelatedRecordSync(callisto, 'planet'), jupiter), 'relationship cleared');
  });

  test('does not replace hasOne if relationship already exists', function(assert) {
    assert.expect(1);

    let cache = new Cache({ schema, keyMap });

    const europa = { id: 'm1', type: 'moon', attributes: { name: 'Europa' }, relationships: { planet: { data: { type: 'planet', id: 'p1'} } } };

    cache.patch(t => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch(t => t.replaceRelatedRecord(europa, 'planet', { type: 'planet', id: 'p1' }));

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

    cache.patch(t => t.replaceRelatedRecord(europa, 'planet', null));

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
          one: { data: { type: 'one', id: '1' } }
        }
      })
    ]);

    const one = cache.getRecordSync({ type: 'one', id: '1' });
    const two = cache.getRecordSync({ type: 'two', id: '2' });
    assert.ok(one, 'one exists');
    assert.ok(two, 'two exists');
    assert.deepEqual(one.relationships.two.data, { type: 'two', id: '2' }, 'one links to two');
    assert.deepEqual(two.relationships.one.data, { type: 'one', id: '1' }, 'two links to one');

    cache.patch(t => t.removeRecord(two));

    assert.equal(cache.getRecordSync({ type: 'one', id: '1' }).relationships.two.data, null, 'ones link to two got removed');
  });

  test('#patch removes dependent records', function(assert) {
    const dependentSchema = new Schema({
      models: {
        planet: {
          relationships: {
            moons: { type: 'hasMany', model: 'moon' }
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
    const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: { type: 'planet', id: 'p1'} } } };
    const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: { type: 'planet', id: 'p1'} } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa),
      t.addToRelatedRecords(jupiter, 'moons', io),
      t.addToRelatedRecords(jupiter, 'moons', europa)
    ]);

    // Removing the moon should remove the planet should remove the other moon
    cache.patch(t => t.removeRecord(io));

    assert.equal(cache.getRecordsSync('moon').length, 1, 'Only europa is left in store');
    assert.equal(cache.getRecordsSync('planet').length, 0, 'No planets left in store');
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
    const io = { type: 'moon', id: 'm1', attributes: { name: 'Io' }, relationships: { planet: { data: { type: 'planet', id: 'p1' } } } };
    const europa = { type: 'moon', id: 'm2', attributes: { name: 'Europa' }, relationships: { planet: { data: { type: 'planet', id: 'p1' } } } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa),
      t.addToRelatedRecords(jupiter, 'moons', io),
      t.addToRelatedRecords(jupiter, 'moons', europa)
    ]);

    // Since there are no dependent relationships, no other records will be
    // removed
    cache.patch(t => t.removeRecord(io));

    assert.equal(cache.getRecordsSync('moon').length, 1, 'One moon left in store');
    assert.equal(cache.getRecordsSync('planet').length, 1, 'One planet left in store');
  });

  test('#patch merges records when "replacing" and will not stomp on attributes and relationships that are not replaced', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = cache.transformBuilder;

    cache.patch(t => [
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' }, relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } } })
    ]);

    let result = cache.patch(t => [
      t.replaceRecord({ type: 'planet', id: '1', attributes: { classification: 'terrestrial' } })
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: '1' })),
      { type: 'planet', id: '1', attributes: { name: 'Earth', classification: 'terrestrial' }, relationships: { moons: { data: [{ type: 'moon', id: 'm1' }]} } },
      'records have been merged'
    );

    assert.deepEqual(
      result,
      {
        data: [
          {
            type: 'planet', id: '1',
            attributes: {
              name: 'Earth',
              classification: 'terrestrial'
            },
            relationships: {
              moons: {
                data: [{ type: 'moon', id: 'm1' }]
              }
            }
          }
        ],
        inverse: [
          tb.replaceRecord({ type: 'planet', id: '1', attributes: { classification: null } })
        ]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch can replace related records but only if they are different', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = cache.transformBuilder;

    cache.patch(t => [
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' }, relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } } })
    ]);

    let result = cache.patch(t => [
      t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [{ type: 'moon', id: 'm1' }])
    ]);

    assert.deepEqual(
      result,
      {
        data: [null],
        inverse: []
      },
      'nothing has changed so there are no inverse ops'
    );

    result = cache.patch(t => [
      t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [{ type: 'moon', id: 'm2' }])
    ]);

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: '1' })),
      { type: 'planet', id: '1', attributes: { name: 'Earth' }, relationships: { moons: { data: [{ type: 'moon', id: 'm2' }]} } },
      'relationships have been replaced'
    );

    assert.deepEqual(
      result,
      {
        data: [
          {
            type: 'planet', id: '1',
            attributes: { name: 'Earth' },
            relationships: {
              moons: { data: [{ type: 'moon', id: 'm2' }] }
            }
          }
        ],
        inverse: [
          tb.replaceRelatedRecord(
            { type: 'moon', id: 'm2' },
            'planet',
            null
          ),
          tb.replaceRelatedRecord(
            { type: 'moon', id: 'm1' },
            'planet',
            { type: 'planet', id: '1' }
          ),
          tb.replaceRelatedRecords(
            { type: 'planet', id: '1' },
            'moons',
            [{ type: 'moon', id: 'm1' }]
          )
        ]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch merges records when "replacing" and _will_ replace specified attributes and relationships', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let earth = {
      type: 'planet', id: '1',
      attributes: { name: 'Earth' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };

    let jupiter = {
      type: 'planet', id: '1',
      attributes: { name: 'Jupiter', classification: 'terrestrial' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
    };

    let result = cache.patch([
      tb.addRecord(earth)
    ]);

    assert.deepEqual(
      result,
      {
        data: [
          earth
        ],
        inverse: [
          tb.replaceRelatedRecord(
            { type: 'moon', id: 'm1' },
            'planet',
            null
          ),
          tb.removeRecord({
            type: 'planet', id: '1'
          })
        ]
      }
    );

    result = cache.patch([
      tb.replaceRecord(jupiter)
    ]);

    assert.deepEqual(
      result,
      {
        data: [
          jupiter
        ],
        inverse: [
            tb.replaceRelatedRecord(
            { type: 'moon', id: 'm2' },
            'planet',
            null
          ),
          tb.replaceRelatedRecord(
            { type: 'moon', id: 'm1' },
            'planet',
            { type: 'planet', id: '1' }
          ),
          tb.replaceRecord({
            type: 'planet', id: '1',
            attributes: { name: 'Earth', classification: null },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          })
        ]
      }
    );

    assert.deepEqual(
      cache.query(q => q.findRecord({ type: 'planet', id: '1' })),
      { type: 'planet', id: '1', attributes: { name: 'Jupiter', classification: 'terrestrial' }, relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } } },
      'records have been merged'
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

  test('#query can perform a simple attribute filter by value equality', function(assert) {
    let cache = new Cache({ schema, keyMap });
    const tb = cache.transformBuilder;

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

  test('#query can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter', sequence: 5, classification: 'gas giant', atmosphere: true } };
    let earth = { type: 'planet', id: 'earth', attributes: { name: 'Earth', sequence: 3, classification: 'terrestrial', atmosphere: true } };
    let venus = { type: 'planet', id: 'venus', attributes: { name: 'Venus', sequence: 2, classification: 'terrestrial', atmosphere: true } };
    let mercury = { type: 'planet', id: 'mercury', attributes: { name: 'Mercury', sequence: 1, classification: 'terrestrial', atmosphere: false } };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query(q => {
        let tmp = q.findRecords('planet')
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'gt' })
      }),
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => {
        let tmp = q.findRecords('planet')
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'gte' })
      }),
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => {
        let tmp = q.findRecords("planet");
        return tmp.filter({ attribute: "sequence", value: 2, op: "lt" });
      }),
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => {
        let tmp = q.findRecords("planet");
        return tmp.filter({ attribute: "sequence", value: 2, op: "lte" });
      }),
      [venus, mercury]
    );
  });

  test('#query can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', sequence: 5, classification: 'gas giant', atmosphere: true },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Earth', sequence: 3, classification: 'terrestrial', atmosphere: true },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    let mars = {
      type: 'planet',
      id: 'mars',
      attributes: { name: 'Mars', sequence: 4, classification: 'terrestrial', atmosphere: true },
      relationships: { moons: { data: [{ type: 'moon', id: 'phobos' }, { type: 'moon', id: 'deimos' }] } }
    };
    let mercury = {
      type: 'planet',
      id: 'mercury',
      attributes: { name: 'Mercury', sequence: 1, classification: 'terrestrial', atmosphere: false }
    };
    let theMoon = {
      id: 'moon', type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    let europa = {
      id: 'europa', type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let ganymede = {
      id: 'ganymede', type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let phobos = {
      id: 'phobos', type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let deimos = {
      id: 'deimos', type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let titan = {
      id: 'titan', type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan),
    ]);
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('planet')
                        .filter({ relation: 'moons', records: [theMoon], op: 'equal' })),
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords("planet")
                        .filter({ relation: 'moons', records: [phobos], op: 'equal' })),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords("planet")
                        .filter({ relation: 'moons', records: [phobos], op: 'all' })),
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords("planet")
                        .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords("planet")
                        .filter({ relation: 'moons', records: [phobos, callisto], op: 'some' })),
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords("planet")
                        .filter({ relation: 'moons', records: [titan], op: 'some' })),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords("planet")
                        .filter({ relation: 'moons', records: [ganymede], op: 'none' })),
      [earth, mars, mercury]
    );
  });

  test('#query can perform relatedRecord filters', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', sequence: 5, classification: 'gas giant', atmosphere: true },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Earth', sequence: 3, classification: 'terrestrial', atmosphere: true },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    let mars = {
      type: 'planet',
      id: 'mars',
      attributes: { name: 'Mars', sequence: 4, classification: 'terrestrial', atmosphere: true },
      relationships: { moons: { data: [{ type: 'moon', id: 'phobos' }, { type: 'moon', id: 'deimos' }] } }
    };
    let mercury = {
      type: 'planet',
      id: 'mercury',
      attributes: { name: 'Mercury', sequence: 1, classification: 'terrestrial', atmosphere: false }
    };
    let theMoon = {
      id: 'moon', type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    let europa = {
      id: 'europa', type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let ganymede = {
      id: 'ganymede', type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let phobos = {
      id: 'phobos', type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let deimos = {
      id: 'deimos', type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let titan = {
      id: 'titan', type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(mars),
      t.addRecord(mercury),
      t.addRecord(theMoon),
      t.addRecord(europa),
      t.addRecord(ganymede),
      t.addRecord(callisto),
      t.addRecord(phobos),
      t.addRecord(deimos),
      t.addRecord(titan),
    ]);
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('moon')
                        .filter({ relation: 'planet', record: earth })),
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('moon')
                        .filter({ relation: 'planet', record: jupiter })),
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('moon')
                        .filter({ relation: 'planet', record: mercury })),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query(q => q.findRecords('moon')
                        .filter({ relation: 'planet', record: [earth, mars] })),
      [theMoon, phobos, deimos]
    );
  });

  test('#query can perform a complex attribute filter by value', function(assert) {
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

  test('#query can perform a filter on attributes, even when a particular record has none', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter' };
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

  test('#query can sort by an attribute, even when a particular record has none', function(assert) {
    let cache = new Cache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter' };
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
        mercury,
        venus,
        jupiter
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
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } } };

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
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } } };

    const callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: [{ type: 'planet', id: 'jupiter' }] } } };

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
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } } };

    const callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

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
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } } };

    const callisto = {
      id: 'callisto', type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

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
