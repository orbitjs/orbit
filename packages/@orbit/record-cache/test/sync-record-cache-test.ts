import {
  KeyMap,
  RecordNotFoundException,
  Schema,
  equalRecordIdentities,
  recordsInclude,
  recordsIncludeAll,
  Record
} from '@orbit/data';
import { SyncSchemaValidationProcessor } from '../src/operation-processors/sync-schema-validation-processor';
import { ExampleSyncRecordCache } from './support/example-sync-record-cache';
import { arrayMembershipMatches } from './support/matchers';

const { module, test } = QUnit;

module('SyncRecordCache', function (hooks) {
  let schema: Schema, keyMap: KeyMap;

  hooks.beforeEach(function () {
    schema = new Schema({
      models: {
        star: {
          keys: {
            remoteId: {}
          },
          relationships: {
            celestialObjects: {
              kind: 'hasMany',
              type: ['planet', 'moon'],
              inverse: 'star'
            }
          }
        },
        planet: {
          keys: {
            remoteId: {}
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
            star: { kind: 'hasOne', type: 'star', inverse: 'celestialObjects' }
          }
        },
        moon: {
          keys: {
            remoteId: {}
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' },
            star: { kind: 'hasOne', type: 'star', inverse: 'celestialObjects' }
          }
        },
        binaryStar: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            starOne: { kind: 'hasOne', type: 'star' }, // no inverse
            starTwo: { kind: 'hasOne', type: 'star' } // no inverse
          }
        },
        planetarySystem: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            star: { kind: 'hasOne', type: ['star', 'binaryStar'] } // no inverse
          }
        }
      }
    });

    keyMap = new KeyMap();
  });

  hooks.afterEach(function () {
    schema = null;
    keyMap = null;
  });

  test('it exists', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema });

    assert.ok(cache);
    assert.equal(
      cache.processors.length,
      3,
      'processors are assigned by default'
    );
  });

  test('it requires a schema', function (assert) {
    assert.expect(1);
    assert.throws(() => new ExampleSyncRecordCache({ schema: null }));
  });

  test('can be assigned processors', function (assert) {
    let cache = new ExampleSyncRecordCache({
      schema,
      processors: [SyncSchemaValidationProcessor]
    });
    assert.ok(cache);

    class FakeProcessor {}
    assert.throws(
      () =>
        (cache = new ExampleSyncRecordCache({
          schema,
          processors: [FakeProcessor as any]
        }))
    );
  });

  test('#patch sets data and #records retrieves it', function (assert) {
    assert.expect(4);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const earth: Record = {
      type: 'planet',
      id: '1',
      attributes: { name: 'Earth' },
      keys: { remoteId: 'a' }
    };

    cache.on('patch', (operation, data) => {
      assert.deepEqual(operation, {
        op: 'addRecord',
        record: earth
      });
      assert.deepEqual(data, earth);
    });

    cache.patch((t) => t.addRecord(earth));

    assert.strictEqual(
      cache.getRecordSync({ type: 'planet', id: '1' }),
      earth,
      'objects strictly match'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'a'),
      '1',
      'key has been mapped'
    );
  });

  test('#patch can replace records', function (assert) {
    assert.expect(5);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const earth: Record = {
      type: 'planet',
      id: '1',
      attributes: { name: 'Earth' },
      keys: { remoteId: 'a' }
    };

    cache.on('patch', (operation, data) => {
      assert.deepEqual(operation, {
        op: 'updateRecord',
        record: earth
      });
      assert.deepEqual(data, earth);
    });

    cache.patch((t) => t.updateRecord(earth));

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: '1' }),
      earth,
      'objects deeply match'
    );
    assert.notStrictEqual(
      cache.getRecordSync({ type: 'planet', id: '1' }),
      earth,
      'objects do not strictly match'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'a'),
      '1',
      'key has been mapped'
    );
  });

  test('#patch can replace keys', function (assert) {
    assert.expect(4);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const earth: Record = { type: 'planet', id: '1' };

    cache.on('patch', (operation, data) => {
      assert.deepEqual(operation, {
        op: 'replaceKey',
        record: earth,
        key: 'remoteId',
        value: 'a'
      });
      assert.deepEqual(data, {
        type: 'planet',
        id: '1',
        keys: { remoteId: 'a' }
      });
    });

    cache.patch((t) => t.replaceKey(earth, 'remoteId', 'a'));

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: '1' }),
      { type: 'planet', id: '1', keys: { remoteId: 'a' } },
      'records match'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'a'),
      '1',
      'key has been mapped'
    );
  });

  test('#patch updates the cache and returns arrays of primary data and inverse ops', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    let p1 = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
    let p2 = { type: 'planet', id: '2' };

    let result = cache.patch((t) => [t.addRecord(p1), t.removeRecord(p2)]);

    assert.deepEqual(
      result,
      {
        data: [
          p1,
          null // null because p2 didn't exist
        ],
        inverse: [{ op: 'removeRecord', record: { type: 'planet', id: '1' } }]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch updates inverse hasOne relationship when a record with relationships unspecified is added - record added after', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };
    const io: Record = { type: 'moon', id: 'm1', attributes: { name: 'Io' } };

    cache.patch((t) => [t.updateRecord(jupiter), t.updateRecord(io)]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [{ type: 'moon', id: 'm1' }],
      'Io has been assigned to Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Io'
    );
  });

  test('#patch updates inverse hasOne relationship when a record with relationships unspecified is added - record added before', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };
    const io: Record = { type: 'moon', id: 'm1', attributes: { name: 'Io' } };

    cache.patch((t) => [t.updateRecord(io), t.updateRecord(jupiter)]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [{ type: 'moon', id: 'm1' }],
      'Io has been assigned to Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Io'
    );
  });

  test('#patch updates inverse hasMany relationship when a record with relationships unspecified is added - record added after', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' }
    };

    cache.patch((t) => [t.updateRecord(io), t.updateRecord(jupiter)]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [{ type: 'moon', id: 'm1' }],
      'Io has been assigned to Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Io'
    );
  });

  test('#patch updates inverse hasMany relationship when a record with relationships unspecified is added - record added before', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' }
    };

    cache.patch((t) => [t.updateRecord(jupiter), t.updateRecord(io)]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [{ type: 'moon', id: 'm1' }],
      'Io has been assigned to Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Io'
    );
  });

  test('#patch updates inverse hasOne relationship when a record with an empty relationship is added', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [] } }
    };

    cache.patch((t) => [t.updateRecord(io), t.updateRecord(jupiter)]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [],
      'Jupiter has no moons'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      null,
      'Jupiter has been cleared from Io'
    );
  });

  test('#patch updates inverse hasMany relationship when a record with an empty relationship is added', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };
    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: null } }
    };

    cache.patch((t) => [t.updateRecord(jupiter), t.updateRecord(io)]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [],
      'Io has been cleared from Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      null,
      'Io has no planet'
    );
  });

  test('#patch updates inverse hasMany polymorphic relationship', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 's1',
      attributes: { name: 'Sun' },
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'p1' },
            { type: 'moon', id: 'm1' }
          ]
        }
      }
    };
    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' }
    };
    const io: Record = { type: 'moon', id: 'm1', attributes: { name: 'Io' } };

    cache.patch((t) => [
      t.updateRecord(sun),
      t.updateRecord(jupiter),
      t.updateRecord(io)
    ]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'star', id: 's1' }).relationships
        .celestialObjects.data,
      [
        { type: 'planet', id: 'p1' },
        { type: 'moon', id: 'm1' }
      ],
      'Jupiter and Io has been assigned to Sun'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.star.data,
      { type: 'star', id: 's1' },
      'Sun has been assigned to Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.star.data,
      { type: 'star', id: 's1' },
      'Sun has been assigned to Io'
    );
  });

  test('#patch updates inverse hasOne polymorphic relationship', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { star: { data: { type: 'star', id: 's1' } } }
    };
    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { star: { data: { type: 'star', id: 's1' } } }
    };
    const sun: Record = { type: 'star', id: 's1', attributes: { name: 'Sun' } };

    cache.patch((t) => [
      t.updateRecord(jupiter),
      t.updateRecord(io),
      t.updateRecord(sun)
    ]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'star', id: 's1' }).relationships
        .celestialObjects.data,
      [
        { type: 'planet', id: 'p1' },
        { type: 'moon', id: 'm1' }
      ],
      'Jupiter and Io has been assigned to Sun'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.star.data,
      { type: 'star', id: 's1' },
      'Sun has been assigned to Jupiter'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.star.data,
      { type: 'star', id: 's1' },
      'Sun has been assigned to Io'
    );
  });

  test('#patch tracks refs and clears them from hasOne relationships when a referenced record is removed', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: undefined } }
    };
    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const europa: Record = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa)
    ]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Io'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm2' }).relationships.planet.data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Europa'
    );

    cache.patch((t) => t.removeRecord(jupiter));

    assert.equal(
      cache.getRecordSync({ type: 'planet', id: 'p1' }),
      undefined,
      'Jupiter is GONE'
    );

    assert.equal(
      cache.getRecordSync({ type: 'moon', id: 'm1' }).relationships.planet.data,
      undefined,
      'Jupiter has been cleared from Io'
    );
    assert.equal(
      cache.getRecordSync({ type: 'moon', id: 'm2' }).relationships.planet.data,
      undefined,
      'Jupiter has been cleared from Europa'
    );
  });

  test('#patch tracks refs and clears them from hasMany relationships when a referenced record is removed', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: null } }
    };
    const europa: Record = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: null } }
    };
    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'm1' },
            { type: 'moon', id: 'm2' }
          ]
        }
      }
    };

    cache.patch((t) => [
      t.addRecord(io),
      t.addRecord(europa),
      t.addRecord(jupiter)
    ]);

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [
        { type: 'moon', id: 'm1' },
        { type: 'moon', id: 'm2' }
      ],
      'Jupiter has been assigned to Io and Europa'
    );
    assert.ok(
      recordsIncludeAll(cache.getRelatedRecordsSync(jupiter, 'moons'), [
        io,
        europa
      ]),
      'Jupiter has been assigned to Io and Europa'
    );

    cache.patch((t) => t.removeRecord(io));

    assert.equal(
      cache.getRecordSync({ type: 'moon', id: 'm1' }),
      null,
      'Io is GONE'
    );

    cache.patch((t) => t.removeRecord(europa));

    assert.equal(
      cache.getRecordSync({ type: 'moon', id: 'm2' }),
      null,
      'Europa is GONE'
    );

    assert.deepEqual(
      cache.getRelatedRecordsSync({ type: 'planet', id: 'p1' }, 'moons'),
      [],
      'moons have been cleared from Jupiter'
    );
  });

  test("#patch adds link to hasMany if record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    cache.patch((t) =>
      t.addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
        type: 'moon',
        id: 'm1'
      })
    );

    cache.patch((t) =>
      t.addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
        type: 'moon',
        id: 'm1'
      })
    );

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'p1' }).relationships.moons
        .data,
      [{ type: 'moon', id: 'm1' }],
      'relationship was added'
    );
  });

  test("#patch does not remove hasMany relationship if record doesn't exist", function (assert) {
    assert.expect(1);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch((t) =>
      t.removeFromRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
        type: 'moon',
        id: 'moon1'
      })
    );

    assert.equal(
      cache.getRecordSync({ type: 'planet', id: 'p1' }),
      undefined,
      'planet does not exist'
    );
  });

  test("#patch adds hasOne if record doesn't exist", function (assert) {
    assert.expect(2);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const tb = cache.transformBuilder;
    const replacePlanet = tb.replaceRelatedRecord(
      { type: 'moon', id: 'moon1' },
      'planet',
      { type: 'planet', id: 'p1' }
    );

    const addToMoons = tb.addToRelatedRecords(
      { type: 'planet', id: 'p1' },
      'moons',
      { type: 'moon', id: 'moon1' }
    );

    let order = 0;
    cache.on('patch', (op) => {
      order++;
      if (order === 1) {
        assert.deepEqual(
          op,
          replacePlanet.toOperation(),
          'applied replacePlanet operation'
        );
      } else if (order === 2) {
        assert.deepEqual(
          op,
          addToMoons.toOperation(),
          'applied addToMoons operation'
        );
      } else {
        assert.ok(false, 'too many ops');
      }
    });

    cache.patch([replacePlanet]);
  });

  test("#patch will add empty hasOne link if record doesn't exist", function (assert) {
    assert.expect(2);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const tb = cache.transformBuilder;
    const clearPlanet = tb.replaceRelatedRecord(
      { type: 'moon', id: 'moon1' },
      'planet',
      null
    );

    let order = 0;
    cache.on('patch', (op) => {
      order++;
      if (order === 1) {
        assert.deepEqual(
          op,
          clearPlanet.toOperation(),
          'applied clearPlanet operation'
        );
      } else {
        assert.ok(false, 'too many ops');
      }
    });

    cache.patch([clearPlanet]);

    assert.ok(true, 'patch applied');
  });

  test('#patch does not add link to hasMany if link already exists', function (assert) {
    assert.expect(1);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'p1',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };

    cache.patch((t) => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch((t) =>
      t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' })
    );

    assert.ok(true, 'patch completed');
  });

  test("#patch does not remove relationship from hasMany if relationship doesn't exist", function (assert) {
    assert.expect(1);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'p1',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    cache.patch((t) => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch((t) =>
      t.removeFromRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' })
    );

    assert.ok(true, 'patch completed');
  });

  test('#patch can add and remove to has-many relationship', function (assert) {
    assert.expect(2);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = { id: 'jupiter', type: 'planet' };
    cache.patch((t) => t.addRecord(jupiter));

    const callisto: Record = { id: 'callisto', type: 'moon' };
    cache.patch((t) => t.addRecord(callisto));

    cache.patch((t) =>
      t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'callisto' })
    );

    assert.ok(
      recordsInclude(cache.getRelatedRecordsSync(jupiter, 'moons'), callisto),
      'moon added'
    );

    cache.patch((t) =>
      t.removeFromRelatedRecords(jupiter, 'moons', {
        type: 'moon',
        id: 'callisto'
      })
    );

    assert.notOk(
      recordsInclude(cache.getRelatedRecordsSync(jupiter, 'moons'), callisto),
      'moon removed'
    );
  });

  test('#patch can add and clear has-one relationship', function (assert) {
    assert.expect(2);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = { id: 'jupiter', type: 'planet' };
    cache.patch((t) => t.addRecord(jupiter));

    const callisto: Record = { id: 'callisto', type: 'moon' };
    cache.patch((t) => t.addRecord(callisto));

    cache.patch((t) =>
      t.replaceRelatedRecord(callisto, 'planet', {
        type: 'planet',
        id: 'jupiter'
      })
    );

    assert.ok(
      equalRecordIdentities(
        cache.getRelatedRecordSync(callisto, 'planet'),
        jupiter
      ),
      'relationship added'
    );

    cache.patch((t) => t.replaceRelatedRecord(callisto, 'planet', null));

    assert.notOk(
      equalRecordIdentities(
        cache.getRelatedRecordSync(callisto, 'planet'),
        jupiter
      ),
      'relationship cleared'
    );
  });

  test('does not replace hasOne if relationship already exists', function (assert) {
    assert.expect(1);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const europa: Record = {
      id: 'm1',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.patch((t) => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch((t) =>
      t.replaceRelatedRecord(europa, 'planet', { type: 'planet', id: 'p1' })
    );

    assert.ok(true, 'patch completed');
  });

  test("does not remove hasOne if relationship doesn't exist", function (assert) {
    assert.expect(1);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const europa: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: null } }
    };

    cache.patch((t) => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.patch((t) => t.replaceRelatedRecord(europa, 'planet', null));

    assert.ok(true, 'patch completed');
  });

  test('#patch removing model with a bi-directional hasOne', function (assert) {
    assert.expect(5);

    const hasOneSchema = new Schema({
      models: {
        one: {
          relationships: {
            two: { kind: 'hasOne', type: 'two', inverse: 'one' }
          }
        },
        two: {
          relationships: {
            one: { kind: 'hasOne', type: 'one', inverse: 'two' }
          }
        }
      }
    });

    const cache = new ExampleSyncRecordCache({ schema: hasOneSchema, keyMap });

    cache.patch((t) => [
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
    assert.deepEqual(
      one.relationships.two.data,
      { type: 'two', id: '2' },
      'one links to two'
    );
    assert.deepEqual(
      two.relationships.one.data,
      { type: 'one', id: '1' },
      'two links to one'
    );

    cache.patch((t) => t.removeRecord(two));

    assert.equal(
      cache.getRecordSync({ type: 'one', id: '1' }).relationships.two.data,
      null,
      'ones link to two got removed'
    );
  });

  test('#patch removes dependent records in a hasOne relationship', function (assert) {
    const dependentSchema = new Schema({
      models: {
        planet: {
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', dependent: 'remove' }
          }
        }
      }
    });

    const cache = new ExampleSyncRecordCache({
      schema: dependentSchema,
      keyMap
    });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' }
    };
    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const europa: Record = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa),
      t.addToRelatedRecords(jupiter, 'moons', io),
      t.addToRelatedRecords(jupiter, 'moons', europa)
    ]);

    cache.patch((t) => t.removeRecord(io));

    assert.equal(
      cache.getRecordsSync('moon').length,
      1,
      'Only europa is left in store'
    );
    assert.equal(
      cache.getRecordsSync('planet').length,
      0,
      'Jupiter has been removed from the store'
    );
  });

  test('#patch removes dependent records in a hasMany relationship', function (assert) {
    const dependentSchema = new Schema({
      models: {
        planet: {
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', dependent: 'remove' }
          }
        },
        moon: {
          relationships: {
            planet: { kind: 'hasOne', type: 'planet' }
          }
        }
      }
    });

    const cache = new ExampleSyncRecordCache({
      schema: dependentSchema,
      keyMap
    });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' }
    };
    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const europa: Record = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.patch((t) => [
      t.updateRecord(jupiter),
      t.updateRecord(io),
      t.updateRecord(europa),
      t.addToRelatedRecords(jupiter, 'moons', io),
      t.addToRelatedRecords(jupiter, 'moons', europa)
    ]);

    cache.patch((t) => t.removeRecord(jupiter));

    assert.equal(
      cache.getRecordsSync('planet').length,
      0,
      'Jupiter has been removed from the store'
    );
    assert.equal(
      cache.getRecordsSync('moon').length,
      0,
      'All of Jupiters moons are removed from the store'
    );
  });

  test('#patch does not remove non-dependent records', function (assert) {
    const dependentSchema = new Schema({
      models: {
        planet: {
          relationships: {
            moons: { kind: 'hasMany', type: 'moon' }
          }
        },
        moon: {
          relationships: {
            planet: { kind: 'hasOne', type: 'planet' }
          }
        }
      }
    });

    const cache = new ExampleSyncRecordCache({
      schema: dependentSchema,
      keyMap
    });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' }
    };
    const io: Record = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };
    const europa: Record = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(io),
      t.addRecord(europa),
      t.addToRelatedRecords(jupiter, 'moons', io),
      t.addToRelatedRecords(jupiter, 'moons', europa)
    ]);

    // Since there are no dependent relationships, no other records will be
    // removed
    cache.patch((t) => t.removeRecord(io));

    assert.equal(
      cache.getRecordsSync('moon').length,
      1,
      'One moon left in store'
    );
    assert.equal(
      cache.getRecordsSync('planet').length,
      1,
      'One planet left in store'
    );
  });

  test('#patch merges records when "replacing" and will not stomp on attributes and relationships that are not replaced', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    cache.patch((t) => [
      t.addRecord({
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
      })
    ]);

    let result = cache.patch((t) => [
      t.updateRecord({
        type: 'planet',
        id: '1',
        attributes: { classification: 'terrestrial' }
      })
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: '1' })),
      {
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth', classification: 'terrestrial' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
      },
      'records have been merged'
    );

    assert.deepEqual(
      result,
      {
        data: [
          {
            type: 'planet',
            id: '1',
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
          tb
            .updateRecord({
              type: 'planet',
              id: '1',
              attributes: { classification: null }
            })
            .toOperation()
        ]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch can replace related records but only if they are different', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    cache.patch((t) => [
      t.addRecord({
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
      })
    ]);

    let result = cache.patch((t) => [
      t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
        { type: 'moon', id: 'm1' }
      ])
    ]);

    assert.deepEqual(
      result,
      {
        data: [null],
        inverse: []
      },
      'nothing has changed so there are no inverse ops'
    );

    result = cache.patch((t) => [
      t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
        { type: 'moon', id: 'm2' }
      ])
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: '1' })),
      {
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
      },
      'relationships have been replaced'
    );

    assert.deepEqual(
      result,
      {
        data: [
          {
            type: 'planet',
            id: '1',
            attributes: { name: 'Earth' },
            relationships: {
              moons: { data: [{ type: 'moon', id: 'm2' }] }
            }
          }
        ],
        inverse: [
          tb
            .replaceRelatedRecord({ type: 'moon', id: 'm2' }, 'planet', null)
            .toOperation(),
          tb
            .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', {
              type: 'planet',
              id: '1'
            })
            .toOperation(),
          tb
            .replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
              { type: 'moon', id: 'm1' }
            ])
            .toOperation()
        ]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch merges records when "replacing" and _will_ replace specified attributes and relationships', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    const earth: Record = {
      type: 'planet',
      id: '1',
      attributes: { name: 'Earth' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };

    const jupiter: Record = {
      type: 'planet',
      id: '1',
      attributes: { name: 'Jupiter', classification: 'terrestrial' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
    };

    let result = cache.patch([tb.addRecord(earth)]);

    assert.deepEqual(result, {
      data: [earth],
      inverse: [
        tb
          .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', null)
          .toOperation(),
        tb
          .removeRecord({
            type: 'planet',
            id: '1'
          })
          .toOperation()
      ]
    });

    result = cache.patch([tb.updateRecord(jupiter)]);

    assert.deepEqual(result, {
      data: [jupiter],
      inverse: [
        tb
          .replaceRelatedRecord({ type: 'moon', id: 'm2' }, 'planet', null)
          .toOperation(),
        tb
          .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', {
            type: 'planet',
            id: '1'
          })
          .toOperation(),
        tb
          .updateRecord({
            type: 'planet',
            id: '1',
            attributes: { name: 'Earth', classification: null },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          })
          .toOperation()
      ]
    });

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: '1' })),
      {
        type: 'planet',
        id: '1',
        attributes: { name: 'Jupiter', classification: 'terrestrial' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
      },
      'records have been merged'
    );
  });

  test('#patch can update existing record with empty relationship', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let result = cache.patch((t) => [t.addRecord({ id: '1', type: 'planet' })]);

    assert.deepEqual(result, {
      data: [{ id: '1', type: 'planet' }],
      inverse: [
        tb
          .removeRecord({
            type: 'planet',
            id: '1'
          })
          .toOperation()
      ]
    });

    result = cache.patch((t) => [
      t.updateRecord({
        id: '1',
        type: 'planet',
        relationships: {
          moons: { data: [] }
        }
      })
    ]);

    assert.deepEqual(result, {
      data: [
        {
          id: '1',
          type: 'planet',
          relationships: {
            moons: { data: [] }
          }
        }
      ],
      inverse: [
        tb
          .updateRecord({
            id: '1',
            type: 'planet',
            relationships: {
              moons: { data: [] }
            }
          })
          .toOperation()
      ]
    });

    const planet = cache.getRecordSync({ type: 'planet', id: '1' });
    assert.ok(planet, 'planet exists');
    assert.deepEqual(
      planet.relationships.moons.data,
      [],
      'planet has empty moons relationship'
    );
  });

  test('#patch will not overwrite an existing relationship with a missing relationship', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let result = cache.patch((t) => [
      t.addRecord({
        id: '1',
        type: 'planet',
        relationships: {
          moons: { data: [{ type: 'moon', id: 'm1' }] }
        }
      }),
      t.updateRecord({
        id: '1',
        type: 'planet'
      })
    ]);

    assert.deepEqual(result, {
      data: [
        {
          id: '1',
          type: 'planet',
          relationships: {
            moons: { data: [{ type: 'moon', id: 'm1' }] }
          }
        },
        null
      ],
      inverse: [
        tb
          .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', null)
          .toOperation(),
        tb
          .removeRecord({
            id: '1',
            type: 'planet'
          })
          .toOperation()
      ]
    });

    const planet = cache.getRecordSync({ type: 'planet', id: '1' });
    assert.ok(planet, 'planet exists');
    assert.deepEqual(
      planet.relationships.moons.data,
      [{ type: 'moon', id: 'm1' }],
      'planet has a moons relationship'
    );
  });

  test('#patch allows replaceRelatedRecord to be called on a relationship with no inverse and to be followed up by removing the replaced record', function (assert) {
    assert.expect(2);

    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const star1 = {
      id: 'star1',
      type: 'star',
      attributes: { name: 'sun1' }
    };

    const star2 = {
      id: 'star2',
      type: 'star',
      attributes: { name: 'sun2' }
    };

    const home = {
      id: 'home',
      type: 'planetarySystem',
      attributes: { name: 'Home' },
      relationships: {
        star: {
          data: { id: 'star1', type: 'star' }
        }
      }
    };

    cache.patch((t) => [
      t.addRecord(star1),
      t.addRecord(star2),
      t.addRecord(home)
    ]);

    let latestHome = cache.getRecordSync({
      id: 'home',
      type: 'planetarySystem'
    });
    assert.deepEqual(
      (latestHome.relationships.star.data as Record).id,
      star1.id,
      'The original related record is in place.'
    );

    cache.patch((t) => [
      t.replaceRelatedRecord(
        {
          id: 'home',
          type: 'planetarySystem'
        },
        'star',
        star2
      ),
      t.removeRecord(star1)
    ]);

    latestHome = cache.getRecordSync({
      id: 'home',
      type: 'planetarySystem'
    });

    assert.deepEqual(
      (latestHome.relationships.star.data as Record).id,
      star2.id,
      'The related record was replaced.'
    );
  });

  test('#query can retrieve an individual record', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    cache.patch((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test('#query can retrieve multiple expressions', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    cache.patch((t) => [t.addRecord(jupiter), t.addRecord(earth)]);

    assert.deepEqual(
      cache.query((q) => [
        q.findRecord({ type: 'planet', id: 'jupiter' }),
        q.findRecord({ type: 'planet', id: 'earth' })
      ]),
      [jupiter, earth]
    );
  });

  test('#query can find records by type', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) => q.findRecords('planet')),
      [jupiter, earth, venus, mercury]
    );
  });

  test('#query can find records by identities', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords([
          { type: 'planet', id: 'jupiter' },
          { type: 'planet', id: 'venus' },
          { type: 'planet', id: 'FAKE' }
        ])
      ),
      [jupiter, venus]
    );
  });

  test('#query can perform a simple attribute filter by value equality', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
      ),
      [jupiter]
    );
  });

  test('#query can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'gt' });
      }),
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'gte' });
      }),
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'lt' });
      }),
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'lte' });
      }),
      [venus, mercury]
    );
  });

  test('#query can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
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
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    cache.patch((t) => [
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
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [theMoon], op: 'equal' })
      ),
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      ),
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('planet').filter({
          relation: 'moons',
          records: [phobos, callisto],
          op: 'some'
        })
      ),
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      ),
      [earth, mars]
    );
  });

  test('#query can perform relatedRecord filters', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
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
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { moons: { data: [{ type: 'moon', id: 'moon' }] } }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: { planet: { data: null } }
    };

    cache.patch((t) => [
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
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: null })
      ),
      [titan]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: earth })
      ),
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: jupiter })
      ),
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: mercury })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('moon')
          .filter({ relation: 'planet', record: [earth, mars] })
      ),
      [theMoon, phobos, deimos]
    );
  });

  test('#query can perform a complex attribute filter by value', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ),
      [earth, venus]
    );
  });

  test('#query can perform a filter on attributes, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = { type: 'planet', id: 'jupiter' };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ),
      [earth, venus]
    );
  });

  test('#query can sort by an attribute', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, jupiter, mercury, venus]
    );
  });

  test('#query can sort by an attribute, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = { type: 'planet', id: 'jupiter' };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, mercury, venus, jupiter]
    );
  });

  test('#query can filter and sort by attributes', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
          .sort('name')
      ),
      [earth, venus]
    );
  });

  test('#query can sort by an attribute in descending order', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('-name')),
      [venus, mercury, jupiter, earth]
    );
  });

  test('#query can sort by according to multiple criteria', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRecords('planet').sort('classification', 'name')
      ),
      [jupiter, earth, mercury, venus]
    );
  });

  test('#query - findRecord - finds record', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    cache.patch((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test("#query - findRecord - throws RecordNotFoundException if record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.throws(
      () => cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      RecordNotFoundException
    );
  });

  test('#query - findRecords - finds matching records', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: [{ type: 'planet', id: 'jupiter' }] } }
    };

    cache.patch((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet')),
      [jupiter]
    );
  });

  test('#query - page - can paginate records by offset and limit', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const earth: Record = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' }
    };

    const venus: Record = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' }
    };

    const mars: Record = {
      id: 'mars',
      type: 'planet',
      attributes: { name: 'Mars' }
    };

    cache.patch((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet').sort('name')),
      [earth, jupiter, mars, venus]
    );

    assert.deepEqual(
      cache.query((q) =>
        q.findRecords('planet').sort('name').page({ limit: 3 })
      ),
      [earth, jupiter, mars]
    );

    assert.deepEqual(
      cache.query((q) =>
        q.findRecords('planet').sort('name').page({ offset: 1, limit: 2 })
      ),
      [jupiter, mars]
    );
  });

  test('#query - findRelatedRecords', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    cache.patch((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      [callisto]
    );
  });

  test('#query - findRelatedRecords - returns empty array if there are no related records', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    cache.patch((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      []
    );
  });

  test("#query - findRelatedRecords - throws RecordNotFoundException if primary record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.throws(
      () =>
        cache.query((q) =>
          q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
        ),
      RecordNotFoundException
    );
  });

  test('#query - findRelatedRecord', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    cache.patch((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      jupiter
    );
  });

  test('#query - findRelatedRecord - return null if no related record is found', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' }
    };

    cache.patch((t) => [t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      null
    );
  });

  test("#query - findRelatedRecord - throws RecordNotFoundException if primary record doesn't exist", function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    assert.throws(
      () =>
        cache.query((q) =>
          q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
        ),
      RecordNotFoundException
    );
  });

  test('#query - findRelatedRecords can perform a simple attribute filter by value equality', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'name', value: 'Jupiter' })
      ),
      [jupiter]
    );
  });

  test('#query - findRelatedRecords - can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'gt' })
      ),
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'gte' })
      ),
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'lt' })
      ),
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ attribute: 'sequence', value: 2, op: 'lte' })
      ),
      [venus, mercury]
    );
  });

  test('#query - findRelatedRecords - can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'mars' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: { data: [{ type: 'moon', id: 'moon' }] }
      }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {}
    };

    cache.patch((t) => [
      t.addRecord(sun),
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
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [theMoon], op: 'equal' })
      ),
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      ),
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').filter({
          relation: 'moons',
          records: [phobos, callisto],
          op: 'some'
        })
      ),
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      ),
      [earth, mars]
    );
  });

  test('#query - findRelatedRecords - can perform relatedRecord filters', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'mars' },
            { type: 'planet', id: 'mercury' },
            { type: 'moon', id: 'moon' },
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' },
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'europa' },
            { type: 'moon', id: 'ganymede' },
            { type: 'moon', id: 'callisto' }
          ]
        }
      }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: { data: [{ type: 'moon', id: 'moon' }] }
      }
    };
    const mars: Record = {
      type: 'planet',
      id: 'mars',
      attributes: {
        name: 'Mars',
        sequence: 4,
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: {
        star: { data: { type: 'star', id: 'sun' } },
        moons: {
          data: [
            { type: 'moon', id: 'phobos' },
            { type: 'moon', id: 'deimos' }
          ]
        }
      }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const theMoon: Record = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: {
        planet: { data: { type: 'planet', id: 'earth' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const europa: Record = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const ganymede: Record = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const phobos: Record = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: {
        planet: { data: { type: 'planet', id: 'mars' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const deimos: Record = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: {
        planet: { data: { type: 'planet', id: 'mars' } },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };
    const titan: Record = {
      id: 'titan',
      type: 'moon',
      attributes: { name: 'titan' },
      relationships: {
        planet: { data: null },
        star: { data: { type: 'star', id: 'sun' } }
      }
    };

    cache.patch((t) => [
      t.addRecord(sun),
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
      t.addRecord(titan)
    ]);
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'planet', record: null })
      ),
      [titan]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(earth, 'moons')
          .filter({ relation: 'planet', record: earth })
      ),
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(jupiter, 'moons')
          .filter({ relation: 'planet', record: jupiter })
      ),
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(mercury, 'moons')
          .filter({ relation: 'planet', record: mercury })
      ),
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter({ relation: 'planet', record: [earth, mars] })
      ),
      [theMoon, phobos, deimos]
    );
  });

  test('#query - findRelatedRecords - can perform a complex attribute filter by value', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ),
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can perform a filter on attributes, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
      ),
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, jupiter, mercury, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute, even when a particular record has none', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = { type: 'planet', id: 'jupiter' };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, mercury, venus, jupiter]
    );
  });

  test('#query - findRelatedRecords - can filter and sort by attributes', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .filter(
            { attribute: 'atmosphere', value: true },
            { attribute: 'classification', value: 'terrestrial' }
          )
          .sort('name')
      ),
      [earth, venus]
    );
  });

  test('#query - findRelatedRecords - can sort by an attribute in descending order', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('-name')
      ),
      [venus, mercury, jupiter, earth]
    );
  });

  test('#query - findRelatedRecords - can sort by according to multiple criteria', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mercury' }
          ]
        }
      }
    };

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const venus: Record = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };
    const mercury: Record = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        classification: 'terrestrial',
        atmosphere: false
      },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('classification', 'name')
      ),
      [jupiter, earth, mercury, venus]
    );
  });

  test('#query - findRelatedRecords - page - can paginate records by offset and limit', function (assert) {
    const cache = new ExampleSyncRecordCache({ schema, keyMap });

    const sun: Record = {
      type: 'star',
      id: 'sun',
      relationships: {
        celestialObjects: {
          data: [
            { type: 'planet', id: 'jupiter' },
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'venus' },
            { type: 'planet', id: 'mars' }
          ]
        }
      }
    };

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const earth = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const venus = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    const mars = {
      id: 'mars',
      type: 'planet',
      attributes: { name: 'Mars' },
      relationships: { star: { data: { type: 'star', id: 'sun' } } }
    };

    cache.patch((t) => [
      t.addRecord(sun),
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mars)
    ]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords(sun, 'celestialObjects').sort('name')
      ),
      [earth, jupiter, mars, venus]
    );

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('name')
          .page({ limit: 3 })
      ),
      [earth, jupiter, mars]
    );

    assert.deepEqual(
      cache.query((q) =>
        q
          .findRelatedRecords(sun, 'celestialObjects')
          .sort('name')
          .page({ offset: 1, limit: 2 })
      ),
      [jupiter, mars]
    );
  });

  test('#liveQuery', async function (assert) {
    let cache = new ExampleSyncRecordCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const jupiter2 = {
      ...jupiter,
      attributes: { name: 'Jupiter 2' }
    };

    const callisto: Record = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };

    const jupiterWithCallisto = {
      ...jupiter2,
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const livePlanet = cache.liveQuery((q) =>
      q.findRecord({ type: 'planet', id: 'jupiter' })
    );
    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));
    const livePlanetMoons = cache.liveQuery((q) =>
      q.findRelatedRecords(jupiter, 'moons')
    );
    const liveMoonPlanet = cache.liveQuery((q) =>
      q.findRelatedRecord(callisto, 'planet')
    );

    interface Deferred {
      promise?: Promise<any>;
      resolve?: () => void;
      reject?: (message: string) => void;
    }
    function defer() {
      let defer: Deferred = {};
      defer.promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = (message) => reject(new Error(message));
      });
      return defer;
    }

    let jupiterAdded = defer();
    let jupiterUpdated = defer();
    let callistoAdded = defer();
    let jupiterRemoved = defer();

    function next() {
      if (n === 1 && i === 1 && j === 0 && k === 0) {
        jupiterAdded.resolve();
      }
      if (n === 2 && i === 2 && j === 0 && k === 0) {
        jupiterUpdated.resolve();
      }
      if (n === 3 && i === 3 && j === 1 && k === 1) {
        callistoAdded.resolve();
      }
      if (n === 4 && i === 4 && j === 2 && k === 2) {
        jupiterRemoved.resolve();
      }
    }

    let n = 0;
    let livePlanetUnsubscribe = livePlanet.subscribe((update) => {
      n++;
      try {
        const result = update.query();

        if (n === 1) {
          assert.deepEqual(result, jupiter, 'findRecord jupiter');
        } else if (n === 2) {
          assert.deepEqual(result, jupiter2, 'findRecord jupiter2');
        } else if (n === 3) {
          assert.deepEqual(
            result,
            jupiterWithCallisto,
            'findRecord jupiterWithCallisto'
          );
        } else {
          assert.ok(false, 'findRecord should not execute');
        }
      } catch (error) {
        if (n === 4) {
          assert.ok(
            error instanceof RecordNotFoundException,
            'findRecord not found'
          );
        } else {
          assert.ok(false, 'findRecord should not throw error');
        }
      }
      next();
    });

    let i = 0;
    let livePlanetsUnsubscribe = livePlanets.subscribe((update) => {
      i++;
      try {
        const result = update.query();

        if (i === 1) {
          assert.deepEqual(result, [jupiter], 'findRecords [jupiter]');
        } else if (i === 2) {
          assert.deepEqual(result, [jupiter2], 'findRecords [jupiter2]');
        } else if (i === 3) {
          assert.deepEqual(
            result,
            [jupiterWithCallisto],
            'findRecords [jupiterWithCallisto]'
          );
        } else if (i === 4) {
          assert.deepEqual(result, [], 'findRecords []');
        } else {
          assert.ok(false, 'findRecords should not execute');
        }
      } catch (e) {
        assert.ok(false, 'findRecords should not throw error');
      }
      next();
    });

    let j = 0;
    let livePlanetMoonsUnsubscribe = livePlanetMoons.subscribe((update) => {
      j++;
      try {
        const result = update.query();

        if (j === 1) {
          assert.deepEqual(
            result,
            [callisto],
            'findRelatedRecords jupiter.moons => [callisto]'
          );
        } else {
          assert.ok(false, 'findRelatedRecords should not execute');
        }
      } catch (error) {
        if (j === 2) {
          assert.ok(
            error instanceof RecordNotFoundException,
            'findRelatedRecords not found'
          );
        } else {
          assert.ok(false, 'findRelatedRecords should not throw error');
        }
      }
      next();
    });

    let k = 0;
    let liveMoonPlanetUnsubscribe = liveMoonPlanet.subscribe((update) => {
      k++;
      try {
        const result = update.query();

        if (k === 1) {
          assert.deepEqual(
            result,
            jupiterWithCallisto,
            'findRelatedRecord callisto.planet => jupiter'
          );
        } else if (k === 2) {
          assert.deepEqual(
            result,
            null,
            'findRelatedRecord callisto.planet => null'
          );
        } else {
          assert.ok(false, 'findRelatedRecord should not execute');
        }
      } catch (e) {
        assert.ok(false, 'findRelatedRecord should not throw error');
      }
      next();
    });

    setTimeout(() => {
      jupiterAdded.reject('reject jupiterAdded');
      jupiterUpdated.reject('reject jupiterUpdated');
      callistoAdded.reject('reject callistoAdded');
      jupiterRemoved.reject('reject jupiterRemoved');
    }, 500);

    cache.patch((t) => t.addRecord(jupiter));
    await jupiterAdded.promise;

    cache.patch((t) => t.updateRecord(jupiter2));
    await jupiterUpdated.promise;

    cache.patch((t) => t.addRecord(callisto));
    await callistoAdded.promise;

    cache.patch((t) => t.removeRecord(jupiter));
    await jupiterRemoved.promise;

    assert.expect(16);
    assert.equal(n, 4, 'findRecord should run 4 times');
    assert.equal(i, 4, 'findRecords should run 4 times');
    assert.equal(j, 2, 'findRelatedRecords should run 2 times');
    assert.equal(k, 2, 'findRelatedRecord should run 2 times');

    livePlanetUnsubscribe();
    livePlanetsUnsubscribe();
    livePlanetMoonsUnsubscribe();
    liveMoonPlanetUnsubscribe();

    cache.patch((t) =>
      t.addRecord({
        type: 'planet',
        id: 'mercury',
        attributes: {
          name: 'Mercury'
        }
      })
    );
  });

  test('#liveQuery findRecords (debounce)', async function (assert) {
    let cache = new ExampleSyncRecordCache({ schema, keyMap });

    const planets: Record[] = [
      {
        id: 'planet1',
        type: 'planet',
        attributes: { name: 'Planet 1' }
      },
      {
        id: 'planet2',
        type: 'planet',
        attributes: { name: 'Planet 2' }
      },
      {
        id: 'planet3',
        type: 'planet',
        attributes: { name: 'Planet 3' }
      }
    ];

    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));

    let i = 0;
    cache.on('patch', () => i++);

    const done = assert.async();
    livePlanets.subscribe((update) => {
      const result = update.query();
      assert.deepEqual(result, planets);
      assert.equal(i, 3);
      done();
    });

    cache.patch((t) => planets.map((planet) => t.addRecord(planet)));
    assert.expect(2);
  });

  test('#liveQuery findRecords (no debounce)', async function (assert) {
    let cache = new ExampleSyncRecordCache({
      schema,
      keyMap,
      debounceLiveQueries: false
    });

    const planets: Record[] = [
      {
        id: 'planet1',
        type: 'planet',
        attributes: { name: 'Planet 1' }
      },
      {
        id: 'planet2',
        type: 'planet',
        attributes: { name: 'Planet 2' }
      },
      {
        id: 'planet3',
        type: 'planet',
        attributes: { name: 'Planet 3' }
      }
    ];

    const livePlanets = cache.liveQuery((q) => q.findRecords('planet'));

    let i = 0;
    cache.on('patch', () => i++);

    const done = assert.async();
    livePlanets.subscribe((update) => {
      const result = update.query() as Record[];
      assert.equal(result.length, i);

      if (i === 3) {
        done();
      }
    });

    cache.patch((t) => planets.map((planet) => t.addRecord(planet)));
    assert.expect(3);
  });
});
