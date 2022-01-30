import {
  RecordKeyMap,
  InitializedRecord,
  RecordNotFoundException,
  RecordSchema,
  equalRecordIdentities,
  recordsInclude,
  recordsIncludeAll,
  RecordIdentity,
  RecordOperation
} from '@orbit/records';
import { clone } from '@orbit/utils';
import { MemoryCache } from '../src/memory-cache';
import { arrayMembershipMatches } from './support/matchers';

const { module, test } = QUnit;

module('MemoryCache', function (hooks) {
  let schema: RecordSchema;
  let keyMap: RecordKeyMap;

  hooks.beforeEach(function () {
    schema = new RecordSchema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
            atmosphere: { type: 'boolean' },
            sequence: { type: 'number' }
          },
          keys: {
            remoteId: {}
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' }
          }
        },
        moon: {
          attributes: {
            name: { type: 'string' }
          },
          keys: {
            remoteId: {}
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        }
      }
    });

    keyMap = new RecordKeyMap();
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
  });

  test('will not create a `validatorFor` fn if `autoValidate: false`', function (assert) {
    let cache = new MemoryCache({ schema, autoValidate: false });
    assert.strictEqual(
      cache.validatorFor,
      undefined,
      'cache.validatorFor is undefined'
    );
  });

  test('will track update operations by default if a `base` cache is passed', function (assert) {
    let base = new MemoryCache({ schema });
    assert.strictEqual(base.base, undefined, 'base.base is undefined');
    assert.notOk(
      base.isTrackingUpdateOperations,
      'base is not tracking update ops'
    );

    let cache = new MemoryCache({ schema, base });
    assert.strictEqual(cache.base, base, 'cache.base is defined');
    assert.ok(cache.isTrackingUpdateOperations, 'child is tracking update ops');
  });

  test('#update sets data and #records retrieves it', function (assert) {
    assert.expect(4);

    let cache = new MemoryCache({ schema, keyMap });

    const earth: InitializedRecord = {
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

    cache.update((t) => t.addRecord(earth));

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

  test('#update can replace records', function (assert) {
    assert.expect(5);

    let cache = new MemoryCache({ schema, keyMap });

    const earth: InitializedRecord = {
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

    cache.update((t) => t.updateRecord(earth));

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

  test('#update can replace keys', function (assert) {
    assert.expect(4);

    let cache = new MemoryCache({ schema, keyMap });

    const earth: InitializedRecord = { type: 'planet', id: '1' };

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

    cache.update((t) => t.replaceKey(earth, 'remoteId', 'a'));

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

    cache.update((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } })
    );

    assert.equal(cache.getRecordsSync('planet').length, 1);

    cache.on('reset', () => {
      assert.ok(true, 'reset event emitted');
    });

    cache.reset();

    assert.equal(cache.getRecordsSync('planet').length, 0);
  });

  test('#reset overrides the cache completely with data from another cache (DEPRECATED)', function (assert) {
    let cache1 = new MemoryCache({ schema, keyMap });
    let cache2 = new MemoryCache({ schema, keyMap });

    cache1.update((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } })
    );
    cache2.update((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Jupiter' } })
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Passing an argument to reset is deprecated
    cache1.reset(cache2);

    assert.strictEqual(
      cache1.getRecordSync({ type: 'planet', id: '1' })?.attributes?.name,
      'Jupiter'
    );
  });

  test('#reset overrides the cache completely with data from a base cache, if configured', function (assert) {
    let cache2 = new MemoryCache({ schema, keyMap });
    let cache1 = new MemoryCache({ schema, keyMap, base: cache2 });

    cache1.update((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Earth' } })
    );
    cache2.update((t) =>
      t.addRecord({ type: 'planet', id: '1', attributes: { name: 'Jupiter' } })
    );

    cache1.reset();

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

    assert.throws(() => cache.update({ op: 'addRecord', record: person }));

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
    cache.update({ op: 'addRecord', record: person });
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

  test('sets/gets records individually', function (assert) {
    const cache = new MemoryCache({ schema, keyMap });
    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    const io = { type: 'moon', id: 'io', attributes: { name: 'Io' } };
    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' }
    };

    cache.setRecordSync(jupiter);
    cache.setRecordSync(io);
    cache.setRecordSync(europa);

    assert.deepEqual(cache.getRecordSync(jupiter), jupiter);
    assert.deepEqual(cache.getRecordSync(io), io);
    assert.deepEqual(cache.getRecordSync(europa), europa);

    cache.removeRecordSync(jupiter);
    cache.removeRecordSync(io);
    cache.removeRecordSync(europa);

    assert.deepEqual(cache.getRecordSync(jupiter), undefined);
    assert.deepEqual(cache.getRecordSync(io), undefined);
    assert.deepEqual(cache.getRecordSync(europa), undefined);
  });

  test('sets/gets records in bulk', function (assert) {
    const cache = new MemoryCache({ schema, keyMap });
    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    const io = { type: 'moon', id: 'io', attributes: { name: 'Io' } };
    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' }
    };

    cache.setRecordsSync([jupiter, io, europa]);

    assert.deepEqual(cache.getRecordsSync([jupiter, io, europa]), [
      jupiter,
      io,
      europa
    ]);

    cache.removeRecordsSync([jupiter, io, europa]);

    assert.deepEqual(cache.getRecordsSync([jupiter, io, europa]), []);
  });

  test('sets/gets inverse relationships for a single record', function (assert) {
    const cache = new MemoryCache({ schema, keyMap });
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };
    const callisto = { type: 'moon', id: 'callisto' };

    const earth = { type: 'planet', id: 'earth' };
    const earthMoon = { type: 'moon', id: 'earthMoon' };

    assert.deepEqual(
      cache.getInverseRelationshipsSync(jupiter),
      [],
      'no inverse relationships to start'
    );

    cache.addInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync(jupiter),
      [
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter }
      ],
      'inverse relationships have been added'
    );

    assert.deepEqual(
      cache.getInverseRelationshipsSync(earth),
      [{ record: earthMoon, relationship: 'planet', relatedRecord: earth }],
      'inverse relationships have been added'
    );

    cache.removeInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync(jupiter),
      [],
      'inverse relationships have been removed'
    );

    assert.deepEqual(
      cache.getInverseRelationshipsSync(earth),
      [],
      'inverse relationships have been removed'
    );
  });

  test('sets/gets inverse relationships for a multiple records', function (assert) {
    const cache = new MemoryCache({ schema, keyMap });

    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };
    const callisto = { type: 'moon', id: 'callisto' };

    const earth = { type: 'planet', id: 'earth' };
    const earthMoon = { type: 'moon', id: 'earthMoon' };

    assert.deepEqual(
      cache.getInverseRelationshipsSync([jupiter, earth]),
      [],
      'no inverse relationships to start'
    );

    cache.addInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync([jupiter, earth]),
      [
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter },
        { record: earthMoon, relationship: 'planet', relatedRecord: earth }
      ],
      'inverse relationships have been added'
    );

    cache.removeInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync([jupiter, earth]),
      [],
      'inverse relationships have been removed'
    );
  });

  test('#update can return a full response that includes applied and inverse ops', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    let p1 = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
    let p2 = { type: 'planet', id: '2' };

    let result = cache.update((t) => [t.addRecord(p1), t.removeRecord(p2)], {
      fullResponse: true
    });

    assert.deepEqual(
      result,
      {
        data: [
          p1,
          undefined // undefined because p2 didn't exist
        ],
        details: {
          appliedOperations: [
            {
              op: 'addRecord',
              record: { type: 'planet', id: '1', attributes: { name: 'Earth' } }
            }
          ],
          appliedOperationResults: [
            { type: 'planet', id: '1', attributes: { name: 'Earth' } }
          ],
          inverseOperations: [
            { op: 'removeRecord', record: { type: 'planet', id: '1' } }
          ]
        }
      },
      'ignores ops that are noops'
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

  test('#update tracks refs and clears them from hasOne relationships when a referenced record is removed', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
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
    const europa: InitializedRecord = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.update((t) => [
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

    cache.update((t) => t.removeRecord(jupiter));

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

  test('#update tracks refs and clears them from hasMany relationships when a referenced record is removed', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const io: InitializedRecord = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Io' },
      relationships: { planet: { data: null } }
    };
    const europa: InitializedRecord = {
      type: 'moon',
      id: 'm2',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: null } }
    };
    const jupiter: InitializedRecord = {
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

    cache.update((t) => [
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

    cache.update((t) => t.removeRecord(io));

    assert.equal(
      cache.getRecordSync({ type: 'moon', id: 'm1' }),
      null,
      'Io is GONE'
    );

    cache.update((t) => t.removeRecord(europa));

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

  test("#update adds link to hasMany if record doesn't exist", function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    cache.update((t) =>
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

  test("#update does not remove hasMany relationship if record doesn't exist", function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.update((t) =>
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

  test("#update adds hasOne if record doesn't exist", function (assert) {
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

    cache.update([replacePlanet]);
  });

  test("#update will add empty hasOne link if record doesn't exist", function (assert) {
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

    cache.update([clearPlanet]);

    assert.ok(true, 'patch applied');
  });

  test('#update does not add link to hasMany if link already exists', function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'p1',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
    };

    cache.update((t) => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.update((t) =>
      t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' })
    );

    assert.ok(true, 'patch completed');
  });

  test("#update does not remove relationship from hasMany if relationship doesn't exist", function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      id: 'p1',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    cache.update((t) => t.addRecord(jupiter));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.update((t) =>
      t.removeFromRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' })
    );

    assert.ok(true, 'patch completed');
  });

  test('#update can add and remove to has-many relationship', function (assert) {
    assert.expect(2);

    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = { id: 'jupiter', type: 'planet' };
    cache.update((t) => t.addRecord(jupiter));

    const callisto = { id: 'callisto', type: 'moon' };
    cache.update((t) => t.addRecord(callisto));

    cache.update((t) =>
      t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'callisto' })
    );

    assert.ok(
      recordsInclude(
        cache.getRelatedRecordsSync(jupiter, 'moons') as RecordIdentity[],
        callisto
      ),
      'moon added'
    );

    cache.update((t) =>
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

  test('#update can add and clear has-one relationship', function (assert) {
    assert.expect(2);

    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = { id: 'jupiter', type: 'planet' };
    cache.update((t) => t.addRecord(jupiter));

    const callisto = { id: 'callisto', type: 'moon' };
    cache.update((t) => t.addRecord(callisto));

    cache.update((t) =>
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

    cache.update((t) => t.replaceRelatedRecord(callisto, 'planet', null));

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

    const europa: InitializedRecord = {
      id: 'm1',
      type: 'moon',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
    };

    cache.update((t) => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.update((t) =>
      t.replaceRelatedRecord(europa, 'planet', { type: 'planet', id: 'p1' })
    );

    assert.ok(true, 'patch completed');
  });

  test("does not remove hasOne if relationship doesn't exist", function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

    const europa: InitializedRecord = {
      type: 'moon',
      id: 'm1',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: null } }
    };

    cache.update((t) => t.addRecord(europa));

    cache.on('patch', () => {
      assert.ok(false, 'no operations were applied');
    });

    cache.update((t) => t.replaceRelatedRecord(europa, 'planet', null));

    assert.ok(true, 'patch completed');
  });

  test('#update removing model with a bi-directional hasOne', function (assert) {
    assert.expect(5);

    const hasOneSchema = new RecordSchema({
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

    cache.update((t) => [
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

    const one = cache.getRecordSync({
      type: 'one',
      id: '1'
    }) as InitializedRecord;
    const two = cache.getRecordSync({
      type: 'two',
      id: '2'
    }) as InitializedRecord;
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

    cache.update((t) => t.removeRecord(two));

    assert.equal(
      cache.getRecordSync({ type: 'one', id: '1' })?.relationships?.two.data,
      null,
      'ones link to two got removed'
    );
  });

  test('#update merges records when "replacing" and will not stomp on attributes and relationships that are not replaced', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    cache.update((t) =>
      t.addRecord({
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
      })
    );

    let result = cache.update(
      (t) =>
        t.updateRecord({
          type: 'planet',
          id: '1',
          attributes: { classification: 'terrestrial' }
        }),
      { fullResponse: true }
    );

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
        data: {
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
        },
        details: {
          appliedOperations: [
            tb
              .updateRecord({
                type: 'planet',
                id: '1',
                attributes: { classification: 'terrestrial' }
              })
              .toOperation()
          ],
          appliedOperationResults: [
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
          inverseOperations: [
            tb
              .updateRecord({
                type: 'planet',
                id: '1',
                attributes: { classification: null }
              })
              .toOperation()
          ]
        }
      },
      'ignores ops that are noops'
    );
  });

  test('#update can replace related records but only if they are different', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });
    const tb = cache.transformBuilder;

    cache.update((t) =>
      t.addRecord({
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth' },
        relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
      })
    );

    let result = cache.update(
      (t) =>
        t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
          { type: 'moon', id: 'm1' }
        ]),
      { fullResponse: true }
    );

    assert.deepEqual(
      result,
      {
        data: undefined,
        details: {
          appliedOperations: [],
          appliedOperationResults: [],
          inverseOperations: []
        }
      },
      'nothing has changed so there are no inverse ops'
    );

    result = cache.update(
      (t) =>
        t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
          { type: 'moon', id: 'm2' }
        ]),
      { fullResponse: true }
    );

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
        data: {
          type: 'planet',
          id: '1',
          attributes: { name: 'Earth' },
          relationships: {
            moons: { data: [{ type: 'moon', id: 'm2' }] }
          }
        },
        details: {
          appliedOperations: [
            tb
              .replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
                { type: 'moon', id: 'm2' }
              ])
              .toOperation(),
            tb
              .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', null)
              .toOperation(),
            tb
              .replaceRelatedRecord({ type: 'moon', id: 'm2' }, 'planet', {
                type: 'planet',
                id: '1'
              })
              .toOperation()
          ],
          appliedOperationResults: [
            {
              type: 'planet',
              id: '1',
              attributes: { name: 'Earth' },
              relationships: {
                moons: { data: [{ type: 'moon', id: 'm2' }] }
              }
            },
            {
              type: 'moon',
              id: 'm1',
              relationships: {
                planet: { data: null }
              }
            },
            {
              type: 'moon',
              id: 'm2',
              relationships: {
                planet: { data: { type: 'planet', id: '1' } }
              }
            }
          ],
          inverseOperations: [
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
        }
      },
      'ignores ops that are noops'
    );
  });

  test('#update merges records when "replacing" and _will_ replace specified attributes and relationships', function (assert) {
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

    let result = cache.update(tb.addRecord(earth), { fullResponse: true });

    assert.deepEqual(result, {
      data: earth,
      details: {
        appliedOperations: [
          tb
            .addRecord({
              type: 'planet',
              id: '1',
              attributes: { name: 'Earth' },
              relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
            })
            .toOperation(),
          tb
            .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', {
              type: 'planet',
              id: '1'
            })
            .toOperation()
        ],
        appliedOperationResults: [
          earth,
          {
            type: 'moon',
            id: 'm1',
            relationships: {
              planet: {
                data: {
                  type: 'planet',
                  id: '1'
                }
              }
            }
          }
        ],
        inverseOperations: [
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
      }
    });

    result = cache.update(tb.updateRecord(jupiter), { fullResponse: true });

    assert.deepEqual(result, {
      data: jupiter,
      details: {
        appliedOperations: [
          tb
            .updateRecord({
              type: 'planet',
              id: '1',
              attributes: { name: 'Jupiter', classification: 'terrestrial' },
              relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
            })
            .toOperation(),
          tb
            .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', null)
            .toOperation(),
          tb
            .replaceRelatedRecord({ type: 'moon', id: 'm2' }, 'planet', {
              type: 'planet',
              id: '1'
            })
            .toOperation()
        ],
        appliedOperationResults: [
          {
            type: 'planet',
            id: '1',
            attributes: { name: 'Jupiter', classification: 'terrestrial' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
          },
          {
            type: 'moon',
            id: 'm1',
            relationships: {
              planet: {
                data: null
              }
            }
          },
          {
            type: 'moon',
            id: 'm2',
            relationships: {
              planet: {
                data: { type: 'planet', id: '1' }
              }
            }
          }
        ],
        inverseOperations: [
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
      }
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

  test('#getAllUpdateOperations will return update ops if they are tracked', function (assert) {
    let cache = new MemoryCache({ schema, trackUpdateOperations: true });
    assert.ok(cache.isTrackingUpdateOperations, 'cache is tracking update ops');

    const addEarth: RecordOperation = {
      op: 'addRecord',
      record: {
        type: 'planet',
        id: '1',
        attributes: { name: 'Earth' }
      }
    };
    cache.update(addEarth);

    const removeEarth: RecordOperation = {
      op: 'removeRecord',
      record: { type: 'planet', id: '1' }
    };
    cache.update(removeEarth);

    assert.deepEqual(cache.getAllUpdateOperations(), [addEarth, removeEarth]);
  });

  test('#getAllUpdateOperations will assert if update ops are not being tracked', function (assert) {
    let cache = new MemoryCache({ schema });
    assert.notOk(
      cache.isTrackingUpdateOperations,
      'cache is not tracking update ops'
    );
    assert.throws(() => cache.getAllUpdateOperations());
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
    cache.update((t) => [t.addRecord(jupiter)]);

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

    cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(venus),
      t.addRecord(mercury)
    ]);

    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
      ) as InitializedRecord[],
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

    cache.update((t) => [
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
      }) as InitializedRecord[],
      [earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'gte' });
      }) as InitializedRecord[],
      [venus, earth, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'lt' });
      }) as InitializedRecord[],
      [mercury]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) => {
        let tmp = q.findRecords('planet');
        return tmp.filter({ attribute: 'sequence', value: 2, op: 'lte' });
      }) as InitializedRecord[],
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

    cache.update((t) => [
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
      ) as InitializedRecord[],
      [earth]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'equal' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos], op: 'all' })
      ) as InitializedRecord[],
      [mars]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [phobos, callisto], op: 'all' })
      ) as InitializedRecord[],
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
      ) as InitializedRecord[],
      [mars, jupiter]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [titan], op: 'some' })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('planet')
          .filter({ relation: 'moons', records: [ganymede], op: 'none' })
      ) as InitializedRecord[],
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

    cache.update((t) => [
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
      ) as InitializedRecord[],
      [theMoon]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: jupiter })
      ) as InitializedRecord[],
      [europa, ganymede, callisto]
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q.findRecords('moon').filter({ relation: 'planet', record: mercury })
      ) as InitializedRecord[],
      []
    );
    arrayMembershipMatches(
      assert,
      cache.query((q) =>
        q
          .findRecords('moon')
          .filter({ relation: 'planet', record: [earth, mars] })
      ) as InitializedRecord[],
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

    cache.update((t) => [
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
      ) as InitializedRecord[],
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

    cache.update((t) => [
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
      ) as InitializedRecord[],
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

    cache.update((t) => [
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

    cache.update((t) => [
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

    cache.update((t) => [
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

    cache.update((t) => [
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

    cache.update((t) => [
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

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [{ type: 'moon', id: 'callisto' }] } }
    };

    cache.update((t) => [t.addRecord(jupiter)]);

    assert.deepEqual(
      cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      jupiter
    );
  });

  test("#query - findRecord - returns undefined if record doesn't exist", function (assert) {
    const cache = new MemoryCache({ schema, keyMap });

    assert.equal(
      cache.query((q) => q.findRecord({ type: 'planet', id: 'jupiter' })),
      undefined
    );
  });

  test("#query - findRecord - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", function (assert) {
    const cache = new MemoryCache({ schema, keyMap });

    assert.throws(
      () =>
        cache.query((q) =>
          q.findRecord({ type: 'planet', id: 'jupiter' }).options({
            raiseNotFoundExceptions: true
          })
        ),
      RecordNotFoundException
    );
  });

  test('#query - findRecords - records by type', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
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

    cache.update((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) => q.findRecords('planet')),
      [jupiter]
    );
  });

  test('#query - findRecords - records by identity', async function (assert) {
    assert.expect(1);

    let cache = new MemoryCache({ schema, keyMap });

    let earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: InitializedRecord = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    await cache.update((t) => [
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

    const jupiter: InitializedRecord = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const earth: InitializedRecord = {
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

    cache.update((t) => [
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

  test('#query - all records', function (assert) {
    assert.expect(4);

    let cache = new MemoryCache({ schema, keyMap });

    let earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      keys: {
        remoteId: 'p1'
      },
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'p2'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: InitializedRecord = {
      type: 'moon',
      id: 'io',
      keys: {
        remoteId: 'm1'
      },
      attributes: {
        name: 'Io'
      }
    };

    cache.update((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'p1'),
      'earth',
      'key has been mapped'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'p2'),
      'jupiter',
      'key has been mapped'
    );
    assert.equal(
      keyMap.keyToId('moon', 'remoteId', 'm1'),
      'io',
      'key has been mapped'
    );

    let records = cache.query((q) => q.findRecords());
    assert.deepEqual(
      records,
      [earth, jupiter, io],
      'query results are expected'
    );
  });

  test('#query - findRelatedRecords', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
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

    cache.update((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons')
      ),
      [callisto]
    );
  });

  test('#query - findRelatedRecord', function (assert) {
    let cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
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

    cache.update((t) => [t.addRecord(jupiter), t.addRecord(callisto)]);

    assert.deepEqual(
      cache.query((q) =>
        q.findRelatedRecord({ type: 'moon', id: 'callisto' }, 'planet')
      ),
      jupiter
    );
  });

  test('#fork - creates a new cache that starts with the same schema and keyMap as the base cache', function (assert) {
    const cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    cache.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'verify base data'
    );

    const fork = cache.fork();

    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'data in fork matches data in source'
    );
    assert.strictEqual(fork.schema, cache.schema, 'schema matches');
    assert.strictEqual(fork.keyMap, cache.keyMap, 'keyMap matches');
    assert.strictEqual(
      fork.transformBuilder,
      cache.transformBuilder,
      'transformBuilder is shared'
    );
    assert.strictEqual(
      fork.queryBuilder,
      cache.queryBuilder,
      'queryBuilder is shared'
    );
    assert.strictEqual(
      fork.validatorFor,
      cache.validatorFor,
      'validatorFor is shared'
    );
    assert.strictEqual(
      fork.base,
      cache,
      'base cache is set on the forked cache'
    );
  });

  test('#fork - skips creating validatorFor if none is set for the base cache', async function (assert) {
    const cache = new MemoryCache({ schema, keyMap, autoValidate: false });

    assert.strictEqual(
      cache.validatorFor,
      undefined,
      'cache.validatorFor is undefined'
    );

    const fork = cache.fork();

    assert.strictEqual(
      fork.validatorFor,
      undefined,
      'fork.validatorFor is undefined'
    );
  });

  test('#fork - can have different settings from the base cache', async function (assert) {
    const cache = new MemoryCache({ schema, keyMap });

    assert.notStrictEqual(
      cache.validatorFor,
      undefined,
      'cache.validatorFor is defined'
    );

    const fork = cache.fork({ autoValidate: false });

    assert.strictEqual(
      fork.validatorFor,
      undefined,
      'fork.validatorFor is undefined'
    );
  });

  test('#merge - merges changes from a forked cache back into a base cache', function (assert) {
    const cache = new MemoryCache({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let fork = cache.fork();

    fork.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'verify fork data'
    );

    let response = cache.merge(fork);

    assert.deepEqual(response, [jupiter], 'response is array');

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'data in cache matches data in fork'
    );
  });

  test('#rebase - change in base ends up in fork', function (assert) {
    assert.expect(3);

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    const cache = new MemoryCache({ schema, keyMap });

    let fork = cache.fork();

    cache.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'verify base cache data'
    );
    assert.equal(
      fork.getRecordsSync('planet').length,
      0,
      'forked cache is still empty'
    );

    fork.rebase();

    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'verify data in forked cache'
    );
  });

  test('#rebase - changes in fork are replayed after reset', function (assert) {
    assert.expect(8);

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Earth', classification: 'terrestrial' }
    };

    const cache = new MemoryCache({ schema, keyMap });

    let fork = cache.fork();

    cache.update((t) => t.addRecord(jupiter));
    fork.update((t) => t.addRecord(earth));

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'jupiter is in base'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'earth' }),
      undefined,
      'earth is not in base'
    );

    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'jupiter' }),
      undefined,
      'jupiter is not in fork'
    );
    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'earth' }),
      earth,
      'earth is in fork'
    );

    fork.rebase();

    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'after rebase, jupiter is now in fork'
    );
    assert.deepEqual(
      fork.getRecordSync({ type: 'planet', id: 'earth' }),
      earth,
      'after rebase, earth is still in fork'
    );

    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'after rebase, jupiter is still in base'
    );
    assert.deepEqual(
      cache.getRecordSync({ type: 'planet', id: 'earth' }),
      undefined,
      'after rebase, earth is still not in base'
    );
  });
});
