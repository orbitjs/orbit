import {
  KeyMap,
  Record,
  RecordNotFoundException,
  Schema,
  equalRecordIdentities,
  recordsInclude,
  recordsIncludeAll,
  RecordIdentity
} from '@orbit/data';
import { clone } from '@orbit/utils';
import { MemoryCache } from '../src/memory-cache';
import { arrayMembershipMatches } from './support/matchers';

const { module, test } = QUnit;

module('MemoryCache', function (hooks) {
  let schema: Schema;
  let keyMap: KeyMap;

  hooks.beforeEach(function () {
    schema = new Schema({
      models: {
        planet: {
          keys: {
            remoteId: {}
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' }
          }
        },
        moon: {
          keys: {
            remoteId: {}
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        }
      }
    });

    keyMap = new KeyMap();
  });

  test('it exists', function (assert) {
    let cache = new MemoryCache({ schema });

    assert.ok(cache);
  });

  test('it creates a `queryBuilder` if none is assigned', function (assert) {
    let cache = new MemoryCache({ schema });
    assert.ok(cache.queryBuilder, 'queryBuilder has been instantiated');
  });

  test('creates a `transformBuilder` upon first access', function (assert) {
    let cache = new MemoryCache({ schema });
    assert.ok(cache.transformBuilder, 'transformBuilder has been instantiated');
    assert.strictEqual(
      cache.transformBuilder.recordInitializer,
      schema,
      'transformBuilder uses the schema to initialize records'
    );
  });

  test('#patch sets data and #records retrieves it', function (assert) {
    assert.expect(4);

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

  test('#reset clears the cache by default', function (assert) {
    assert.expect(3);

    let cache = new MemoryCache({ schema, keyMap });

    cache.patch((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } })
    );

    assert.equal(cache.getRecordsSync('planet').length, 1);

    cache.on('reset', () => {
      assert.ok(true, 'reset event emitted');
    });

    cache.reset();

    assert.equal(cache.getRecordsSync('planet').length, 0);
  });

  test('#reset overrides the cache completely with data from another cache', function (assert) {
    let cache1 = new MemoryCache({ schema, keyMap });
    let cache2 = new MemoryCache({ schema, keyMap });

    cache1.patch((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } })
    );
    cache2.patch((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Jupiter' } })
    );

    cache1.reset(cache2);

    assert.strictEqual(
      cache1.getRecordSync({ type: 'planet', id: '1' })?.attributes?.name,
      'Jupiter'
    );
  });

  test('#upgrade upgrades the cache to include new models introduced in a schema', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let person = {
      type: 'person',
      id: '1',
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };

    assert.throws(() => cache.patch({ op: 'addRecord', record: person }));

    let models = clone(schema.models);
    models.planet.relationships.inhabitants = {
      kind: 'hasMany',
      type: 'person',
      inverse: 'planet'
    };
    models.person = {
      relationships: {
        planet: { kind: 'hasOne', type: 'planet', inverse: 'inhabitants' }
      }
    };

    schema.upgrade({ models });
    cache.upgrade();
    cache.patch({ op: 'addRecord', record: person });
    assert.deepEqual(
      cache.getRecordSync({ type: 'person', id: '1' }),
      person,
      'records match'
    );
    assert.deepEqual(
      cache.getRelatedRecordSync(person, 'planet'),
      { type: 'planet', id: 'earth' },
      'relationship exists'
    );
    assert.equal(
      cache.getInverseRelationshipsSync({ type: 'planet', id: 'earth' }).length,
      1,
      'inverse relationship exists'
    );
  });

  test('#patch updates the cache and returns arrays of primary data and inverse ops', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let p1 = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
    let p2 = { type: 'planet', id: '2' };

    let result = cache.patch((t) => [t.addRecord(p1), t.removeRecord(p2)]);

    assert.deepEqual(
      result,
      {
        data: [
          p1,
          undefined // undefined because p2 didn't exist
        ],
        inverse: [{ op: 'removeRecord', record: { type: 'planet', id: '1' } }]
      },
      'ignores ops that are noops'
    );
  });

  test('#patch tracks refs and clears them from hasOne relationships when a referenced record is removed', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: Record = {
      type: 'planet',
      id: 'p1',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: undefined } }
    };
    const io = {
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
      cache.getRecordSync({ type: 'moon', id: 'm1' })?.relationships?.planet
        .data,
      { type: 'planet', id: 'p1' },
      'Jupiter has been assigned to Io'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'moon', id: 'm2' })?.relationships?.planet
        .data,
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
      cache.getRecordSync({ type: 'moon', id: 'm1' })?.relationships?.planet
        .data,
      undefined,
      'Jupiter has been cleared from Io'
    );
    assert.equal(
      cache.getRecordSync({ type: 'moon', id: 'm2' })?.relationships?.planet
        .data,
      undefined,
      'Jupiter has been cleared from Europa'
    );
  });

  test('#patch tracks refs and clears them from hasMany relationships when a referenced record is removed', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

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
      cache.getRecordSync({ type: 'planet', id: 'p1' })?.relationships?.moons
        .data,
      [
        { type: 'moon', id: 'm1' },
        { type: 'moon', id: 'm2' }
      ],
      'Jupiter has been assigned to Io and Europa'
    );
    assert.ok(
      recordsIncludeAll(
        cache.getRelatedRecordsSync(jupiter, 'moons') as RecordIdentity[],
        [io, europa]
      ),
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
      'Europa and Io have been cleared from Jupiter'
    );
  });

  test("#patch adds link to hasMany if record doesn't exist", function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    cache.patch((t) =>
      t.addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
        type: 'moon',
        id: 'm1'
      })
    );

    assert.deepEqual(
      cache.getRelatedRecordsSync({ type: 'planet', id: 'p1' }, 'moons'),
      [{ type: 'moon', id: 'm1' }],
      'relationship was added'
    );
  });

  test("#patch does not remove hasMany relationship if record doesn't exist", function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: Record = { id: 'jupiter', type: 'planet' };
    cache.patch((t) => t.addRecord(jupiter));

    const callisto = { id: 'callisto', type: 'moon' };
    cache.patch((t) => t.addRecord(callisto));

    cache.patch((t) =>
      t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'callisto' })
    );

    assert.ok(
      recordsInclude(
        cache.getRelatedRecordsSync(jupiter, 'moons') as RecordIdentity[],
        callisto
      ),
      'moon added'
    );

    cache.patch((t) =>
      t.removeFromRelatedRecords(jupiter, 'moons', {
        type: 'moon',
        id: 'callisto'
      })
    );

    assert.notOk(
      recordsInclude(
        cache.getRelatedRecordsSync(jupiter, 'moons') as RecordIdentity[],
        callisto
      ),
      'moon removed'
    );
  });

  test('#patch can add and clear has-one relationship', function (assert) {
    assert.expect(2);

    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: Record = { id: 'jupiter', type: 'planet' };
    cache.patch((t) => t.addRecord(jupiter));

    const callisto = { id: 'callisto', type: 'moon' };
    cache.patch((t) => t.addRecord(callisto));

    cache.patch((t) =>
      t.replaceRelatedRecord(callisto, 'planet', {
        type: 'planet',
        id: 'jupiter'
      })
    );

    assert.ok(
      equalRecordIdentities(
        cache.getRelatedRecordSync(callisto, 'planet') as RecordIdentity,
        jupiter
      ),
      'relationship added'
    );

    cache.patch((t) => t.replaceRelatedRecord(callisto, 'planet', null));

    assert.notOk(
      equalRecordIdentities(
        cache.getRelatedRecordSync(callisto, 'planet') as RecordIdentity,
        jupiter
      ),
      'relationship cleared'
    );
  });

  test('does not replace hasOne if relationship already exists', function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema, keyMap });

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

    let cache = new MemoryCache({ schema: hasOneSchema, keyMap });

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

    const one = cache.getRecordSync({ type: 'one', id: '1' }) as Record;
    const two = cache.getRecordSync({ type: 'two', id: '2' }) as Record;
    assert.ok(one, 'one exists');
    assert.ok(two, 'two exists');
    assert.deepEqual(
      one.relationships?.two.data,
      { type: 'two', id: '2' },
      'one links to two'
    );
    assert.deepEqual(
      two.relationships?.one.data,
      { type: 'one', id: '1' },
      'two links to one'
    );

    cache.patch((t) => t.removeRecord(two));

    assert.equal(
      cache.getRecordSync({ type: 'one', id: '1' })?.relationships?.two.data,
      null,
      'ones link to two got removed'
    );
  });

  test('#patch merges records when "replacing" and will not stomp on attributes and relationships that are not replaced', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
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
    let cache = new MemoryCache({ schema, keyMap });
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
        data: [undefined],
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
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let earth = {
      type: 'planet',
      id: '1',
      attributes: { name: 'Earth' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };

    let jupiter = {
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

  test('#query can retrieve an individual record with `record`', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = {
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

  test('#query can perform a simple attribute filter by value equality', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
      ) as Record[],
      [jupiter]
    );
  });

  test('#query can perform a simple attribute filter by value comparison (gt, lt, gte & lte)', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        sequence: 5,
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        sequence: 3,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        sequence: 2,
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
      }) as Record[],
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'gte' });
      }) as Record[],
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'lt' });
      }) as Record[],
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'lte' });
      }) as Record[],
      [venus, mercury]
    );
  });

  test('#query can perform relatedRecords filters with operators `equal`, `all`, `some` and `none`', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let jupiter = {
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
    let earth = {
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
    let mars = {
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
    let mercury = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    let theMoon = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    let europa = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let ganymede = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let callisto = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let phobos = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let deimos = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let titan = {
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
      ) as Record[],
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      ) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      ) as Record[],
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      ) as Record[],
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
      ) as Record[],
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      ) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      ) as Record[],
      [earth, mars]
    );
  });

  test('#query can perform relatedRecord filters', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    let jupiter = {
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
    let earth = {
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
    let mars = {
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
    let mercury = {
      type: 'planet',
      id: 'mercury',
      attributes: {
        name: 'Mercury',
        sequence: 1,
        classification: 'terrestrial',
        atmosphere: false
      }
    };
    let theMoon = {
      id: 'moon',
      type: 'moon',
      attributes: { name: 'The moon' },
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    let europa = {
      id: 'europa',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let ganymede = {
      id: 'ganymede',
      type: 'moon',
      attributes: { name: 'Ganymede' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let callisto = {
      id: 'callisto',
      type: 'moon',
      attributes: { name: 'Callisto' },
      relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } }
    };
    let phobos = {
      id: 'phobos',
      type: 'moon',
      attributes: { name: 'Phobos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let deimos = {
      id: 'deimos',
      type: 'moon',
      attributes: { name: 'Deimos' },
      relationships: { planet: { data: { type: 'planet', id: 'mars' } } }
    };
    let titan = {
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
        q.findRecords('moon').filter({ relation: 'planet', record: earth })
      ) as Record[],
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: jupiter })
      ) as Record[],
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: mercury })
      ) as Record[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('moon')
          .filter({ relation: 'planet', record: [earth, mars] })
      ) as Record[],
      [theMoon, phobos, deimos]
    );
  });

  test('#query can perform a complex attribute filter by value', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
      ) as Record[],
      [earth, venus]
    );
  });

  test('#query can perform a filter on attributes, even when a particular record has none', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter' };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
      ) as Record[],
      [earth, venus]
    );
  });

  test('#query can sort by an attribute', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = { type: 'planet', id: 'jupiter' };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
    let cache = new MemoryCache({ schema, keyMap });

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        atmosphere: true
      }
    };
    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let venus = {
      type: 'planet',
      id: 'venus',
      attributes: {
        name: 'Venus',
        classification: 'terrestrial',
        atmosphere: true
      }
    };
    let mercury = {
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
    let cache = new MemoryCache({ schema, keyMap });

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
    let cache = new MemoryCache({ schema, keyMap });

    assert.throws(
      () => cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      RecordNotFoundException
    );
  });

  test('#query - findRecords - records by type', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto = {
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

  test('#query - findRecords - records by identity', async function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

    let earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: Record = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    await cache.patch((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let records = await cache.query((q) =>
      q.findRecords([earth, io, { type: 'moon', id: 'FAKE' }])
    );
    assert.deepEqual(records, [earth, io], 'query results are expected');
  });

  test('#query - page - can paginate records by offset and limit', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

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

    const venus = {
      id: 'venus',
      type: 'planet',
      attributes: { name: 'Venus' }
    };

    const mars = {
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
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto = {
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

  test('#query - findRelatedRecord', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    const callisto = {
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
});
