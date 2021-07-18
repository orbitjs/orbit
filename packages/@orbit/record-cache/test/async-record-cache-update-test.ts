import {
  equalRecordIdentities,
  RecordKeyMap,
  InitializedRecord,
  RecordIdentity,
  recordsInclude,
  recordsIncludeAll,
  RecordSchema,
  RecordNotFoundException
} from '@orbit/records';
import { SimpleRecordTransformBuffer } from '../src/simple-record-transform-buffer';
import { ExampleAsyncRecordCache } from './support/example-async-record-cache';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

QUnit.dump.maxDepth = 7;

module('AsyncRecordCache - update', function (hooks) {
  let schema: RecordSchema;
  let keyMap: RecordKeyMap;
  let transformBuffer: SimpleRecordTransformBuffer | undefined;

  [true, false].forEach((useBuffer) => {
    module(`useBuffer: ${useBuffer}`, function (hooks) {
      // All caches in this module share these transform options
      const defaultTransformOptions = { useBuffer };

      hooks.beforeEach(function () {
        keyMap = new RecordKeyMap();
      });

      module('with standard schema', function (hooks) {
        let cache: ExampleAsyncRecordCache;

        hooks.beforeEach(function () {
          schema = createSchemaWithRemoteKey();

          if (useBuffer) {
            transformBuffer = new SimpleRecordTransformBuffer({
              schema,
              keyMap
            });
          } else {
            transformBuffer = undefined;
          }

          cache = new ExampleAsyncRecordCache({
            schema,
            keyMap,
            defaultTransformOptions,
            transformBuffer
          });
        });

        test('#update sets data and #records retrieves it', async function (assert) {
          assert.expect(4);

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

          await cache.update((t) => t.addRecord(earth));

          assert.strictEqual(
            await cache.getRecordAsync({ type: 'planet', id: '1' }),
            earth,
            'objects strictly match'
          );
          assert.equal(
            keyMap.keyToId('planet', 'remoteId', 'a'),
            '1',
            'key has been mapped'
          );
        });

        test('#update can replace records', async function (assert) {
          assert.expect(5);

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

          await cache.update((t) => t.updateRecord(earth));

          assert.deepEqual(
            await cache.getRecordAsync({ type: 'planet', id: '1' }),
            earth,
            'objects deeply match'
          );
          assert.notStrictEqual(
            await cache.getRecordAsync({ type: 'planet', id: '1' }),
            earth,
            'objects do not strictly match'
          );
          assert.equal(
            keyMap.keyToId('planet', 'remoteId', 'a'),
            '1',
            'key has been mapped'
          );
        });

        test('#update can replace keys', async function (assert) {
          assert.expect(4);

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

          await cache.update((t) => t.replaceKey(earth, 'remoteId', 'a'));

          assert.deepEqual(
            await cache.getRecordAsync({ type: 'planet', id: '1' }),
            { type: 'planet', id: '1', keys: { remoteId: 'a' } },
            'records match'
          );
          assert.equal(
            keyMap.keyToId('planet', 'remoteId', 'a'),
            '1',
            'key has been mapped'
          );
        });

        test('#update updates the cache and returns primary data', async function (assert) {
          let p1 = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
          let p2 = { type: 'planet', id: '2' };

          let result = await cache.update((t) => [
            t.addRecord(p1),
            t.removeRecord(p2)
          ]);

          assert.deepEqual(
            result,
            [
              p1,
              undefined // p2 didn't exist
            ],
            'response includes just primary data'
          );
        });

        test('#update updates the cache and returns a full response if requested', async function (assert) {
          let p1 = { type: 'planet', id: '1', attributes: { name: 'Earth' } };
          let p2 = { type: 'planet', id: '2' };

          let result = await cache.update(
            (t) => [t.addRecord(p1), t.removeRecord(p2)],
            {
              fullResponse: true
            }
          );

          assert.deepEqual(
            result,
            {
              data: [
                p1,
                undefined // p2 didn't exist
              ],
              details: {
                appliedOperations: [{ op: 'addRecord', record: p1 }],
                appliedOperationResults: [p1],
                inverseOperations: [
                  { op: 'removeRecord', record: { type: 'planet', id: '1' } }
                ]
              }
            },
            'full response includes data and details'
          );
        });

        test('#update updates inverse hasOne relationship when a record with relationships unspecified is added - record added after', async function (assert) {
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          };
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' }
          };

          await cache.update((t) => [
            t.updateRecord(jupiter),
            t.updateRecord(io)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [{ type: 'moon', id: 'm1' }],
            'Io has been assigned to Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            { type: 'planet', id: 'p1' },
            'Jupiter has been assigned to Io'
          );
        });

        test('#update updates inverse hasOne relationship when a record with relationships unspecified is added - record added before', async function (assert) {
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          };
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' }
          };

          await cache.update((t) => [
            t.updateRecord(io),
            t.updateRecord(jupiter)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [{ type: 'moon', id: 'm1' }],
            'Io has been assigned to Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            { type: 'planet', id: 'p1' },
            'Jupiter has been assigned to Io'
          );
        });

        test('#update updates inverse hasMany relationship when a record with relationships unspecified is added - record added after', async function (assert) {
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' },
            relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
          };
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          };

          await cache.update((t) => [
            t.updateRecord(io),
            t.updateRecord(jupiter)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [{ type: 'moon', id: 'm1' }],
            'Io has been assigned to Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            { type: 'planet', id: 'p1' },
            'Jupiter has been assigned to Io'
          );
        });

        test('#update updates inverse hasMany relationship when a record with relationships unspecified is added - record added before', async function (assert) {
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' },
            relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
          };
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          };

          await cache.update((t) => [
            t.updateRecord(jupiter),
            t.updateRecord(io)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [{ type: 'moon', id: 'm1' }],
            'Io has been assigned to Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            { type: 'planet', id: 'p1' },
            'Jupiter has been assigned to Io'
          );
        });

        test('#update updates inverse hasOne relationship when a record with an empty relationship is added', async function (assert) {
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' },
            relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
          };
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' },
            relationships: { moons: { data: [] } }
          };

          await cache.update((t) => [
            t.updateRecord(io),
            t.updateRecord(jupiter)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [],
            'Jupiter has no moons'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            null,
            'Jupiter has been cleared from Io'
          );
        });

        test('#update updates inverse hasMany relationship when a record with an empty relationship is added', async function (assert) {
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          };
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' },
            relationships: { planet: { data: null } }
          };

          await cache.update((t) => [
            t.updateRecord(jupiter),
            t.updateRecord(io)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [],
            'Io has been cleared from Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            null,
            'Io has no planet'
          );
        });

        test('#update updates inverse hasMany polymorphic relationship', async function (assert) {
          const sun: InitializedRecord = {
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
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          };
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' }
          };

          await cache.update((t) => [
            t.updateRecord(sun),
            t.updateRecord(jupiter),
            t.updateRecord(io)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'star',
              id: 's1'
            })) as InitializedRecord)?.relationships?.celestialObjects.data,
            [
              { type: 'planet', id: 'p1' },
              { type: 'moon', id: 'm1' }
            ],
            'Jupiter and Io has been assigned to Sun'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.star.data,
            { type: 'star', id: 's1' },
            'Sun has been assigned to Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.star.data,
            { type: 'star', id: 's1' },
            'Sun has been assigned to Io'
          );
        });

        test('#update updates inverse hasOne polymorphic relationship', async function (assert) {
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' },
            relationships: { star: { data: { type: 'star', id: 's1' } } }
          };
          const io: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Io' },
            relationships: { star: { data: { type: 'star', id: 's1' } } }
          };
          const sun: InitializedRecord = {
            type: 'star',
            id: 's1',
            attributes: { name: 'Sun' }
          };

          await cache.update((t) => [
            t.updateRecord(jupiter),
            t.updateRecord(io),
            t.updateRecord(sun)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'star',
              id: 's1'
            })) as InitializedRecord)?.relationships?.celestialObjects.data,
            [
              { type: 'planet', id: 'p1' },
              { type: 'moon', id: 'm1' }
            ],
            'Jupiter and Io has been assigned to Sun'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.star.data,
            { type: 'star', id: 's1' },
            'Sun has been assigned to Jupiter'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.star.data,
            { type: 'star', id: 's1' },
            'Sun has been assigned to Io'
          );
        });

        test('#update tracks refs and clears them from hasOne relationships when a referenced record is removed', async function (assert) {
          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' },
            relationships: { moons: { data: undefined } }
          };
          const io: InitializedRecord = {
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

          await cache.update((t) => [
            t.addRecord(jupiter),
            t.addRecord(io),
            t.addRecord(europa)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            { type: 'planet', id: 'p1' },
            'Jupiter has been assigned to Io'
          );
          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm2'
            })) as InitializedRecord)?.relationships?.planet.data,
            { type: 'planet', id: 'p1' },
            'Jupiter has been assigned to Europa'
          );

          await cache.update((t) => t.removeRecord(jupiter));

          assert.equal(
            await cache.getRecordAsync({ type: 'planet', id: 'p1' }),
            undefined,
            'Jupiter is GONE'
          );

          assert.equal(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm1'
            })) as InitializedRecord)?.relationships?.planet.data,
            undefined,
            'Jupiter has been cleared from Io'
          );
          assert.equal(
            ((await cache.getRecordAsync({
              type: 'moon',
              id: 'm2'
            })) as InitializedRecord)?.relationships?.planet.data,
            undefined,
            'Jupiter has been cleared from Europa'
          );
        });

        test('#update tracks refs and clears them from hasMany relationships when a referenced record is removed', async function (assert) {
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

          await cache.update((t) => [
            t.addRecord(io),
            t.addRecord(europa),
            t.addRecord(jupiter)
          ]);

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [
              { type: 'moon', id: 'm1' },
              { type: 'moon', id: 'm2' }
            ],
            'Jupiter has been assigned to Io and Europa'
          );
          assert.ok(
            recordsIncludeAll(
              (await cache.getRelatedRecordsAsync(
                jupiter,
                'moons'
              )) as RecordIdentity[],
              [io, europa]
            ),
            'Jupiter has been assigned to Io and Europa'
          );

          await cache.update((t) => t.removeRecord(io));

          assert.equal(
            await cache.getRecordAsync({ type: 'moon', id: 'm1' }),
            null,
            'Io is GONE'
          );

          await cache.update((t) => t.removeRecord(europa));

          assert.equal(
            await cache.getRecordAsync({ type: 'moon', id: 'm2' }),
            null,
            'Europa is GONE'
          );

          assert.deepEqual(
            (await cache.getRelatedRecordsAsync(
              { type: 'planet', id: 'p1' },
              'moons'
            )) as RecordIdentity[],
            [],
            'moons have been cleared from Jupiter'
          );
        });

        test("#update adds link to hasMany if record doesn't exist", async function (assert) {
          await cache.update((t) =>
            t.addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
              type: 'moon',
              id: 'm1'
            })
          );

          await cache.update((t) =>
            t.addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
              type: 'moon',
              id: 'm1'
            })
          );

          assert.deepEqual(
            ((await cache.getRecordAsync({
              type: 'planet',
              id: 'p1'
            })) as InitializedRecord)?.relationships?.moons.data,
            [{ type: 'moon', id: 'm1' }],
            'relationship was added'
          );
        });

        test("#update does not remove hasMany relationship if record doesn't exist", async function (assert) {
          assert.expect(1);

          cache.on('patch', () => {
            assert.ok(false, 'no operations were applied');
          });

          await cache.update((t) =>
            t.removeFromRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
              type: 'moon',
              id: 'moon1'
            })
          );

          assert.equal(
            await cache.getRecordAsync({ type: 'planet', id: 'p1' }),
            undefined,
            'planet does not exist'
          );
        });

        test("#update adds hasOne if record doesn't exist", async function (assert) {
          assert.expect(2);

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

          await cache.update([replacePlanet]);
        });

        test("#update will add empty hasOne link if record doesn't exist", async function (assert) {
          assert.expect(2);

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

          await cache.update([clearPlanet]);

          assert.ok(true, 'patch applied');
        });

        test('#update does not add link to hasMany if link already exists', async function (assert) {
          assert.expect(1);

          const jupiter: InitializedRecord = {
            id: 'p1',
            type: 'planet',
            attributes: { name: 'Jupiter' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          };

          await cache.update((t) => t.addRecord(jupiter));

          cache.on('patch', () => {
            assert.ok(false, 'no operations were applied');
          });

          await cache.update((t) =>
            t.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'm1' })
          );

          assert.ok(true, 'patch completed');
        });

        test("#update does not remove relationship from hasMany if relationship doesn't exist", async function (assert) {
          assert.expect(1);

          const jupiter: InitializedRecord = {
            id: 'p1',
            type: 'planet',
            attributes: { name: 'Jupiter' }
          };

          await cache.update((t) => t.addRecord(jupiter));

          cache.on('patch', () => {
            assert.ok(false, 'no operations were applied');
          });

          await cache.update((t) =>
            t.removeFromRelatedRecords(jupiter, 'moons', {
              type: 'moon',
              id: 'm1'
            })
          );

          assert.ok(true, 'patch completed');
        });

        test('#update can add and remove to has-many relationship', async function (assert) {
          assert.expect(2);

          const jupiter: InitializedRecord = { id: 'jupiter', type: 'planet' };
          await cache.update((t) => t.addRecord(jupiter));

          const callisto: InitializedRecord = { id: 'callisto', type: 'moon' };
          await cache.update((t) => t.addRecord(callisto));

          await cache.update((t) =>
            t.addToRelatedRecords(jupiter, 'moons', {
              type: 'moon',
              id: 'callisto'
            })
          );

          assert.ok(
            recordsInclude(
              (await cache.getRelatedRecordsAsync(
                jupiter,
                'moons'
              )) as RecordIdentity[],
              callisto
            ),
            'moon added'
          );

          await cache.update((t) =>
            t.removeFromRelatedRecords(jupiter, 'moons', {
              type: 'moon',
              id: 'callisto'
            })
          );

          assert.notOk(
            recordsInclude(
              (await cache.getRelatedRecordsAsync(
                jupiter,
                'moons'
              )) as RecordIdentity[],
              callisto
            ),
            'moon removed'
          );
        });

        test('#update can add and clear has-one relationship', async function (assert) {
          assert.expect(2);

          const jupiter: InitializedRecord = { id: 'jupiter', type: 'planet' };
          await cache.update((t) => t.addRecord(jupiter));

          const callisto: InitializedRecord = { id: 'callisto', type: 'moon' };
          await cache.update((t) => t.addRecord(callisto));

          await cache.update((t) =>
            t.replaceRelatedRecord(callisto, 'planet', {
              type: 'planet',
              id: 'jupiter'
            })
          );

          assert.ok(
            equalRecordIdentities(
              (await cache.getRelatedRecordAsync(
                callisto,
                'planet'
              )) as RecordIdentity,
              jupiter
            ),
            'relationship added'
          );

          await cache.update((t) =>
            t.replaceRelatedRecord(callisto, 'planet', null)
          );

          assert.notOk(
            equalRecordIdentities(
              (await cache.getRelatedRecordAsync(
                callisto,
                'planet'
              )) as RecordIdentity,
              jupiter
            ),
            'relationship cleared'
          );
        });

        test('does not replace hasOne if relationship already exists', async function (assert) {
          assert.expect(1);

          const europa: InitializedRecord = {
            id: 'm1',
            type: 'moon',
            attributes: { name: 'Europa' },
            relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
          };

          await cache.update((t) => t.addRecord(europa));

          cache.on('patch', () => {
            assert.ok(false, 'no operations were applied');
          });

          await cache.update((t) =>
            t.replaceRelatedRecord(europa, 'planet', {
              type: 'planet',
              id: 'p1'
            })
          );

          assert.ok(true, 'patch completed');
        });

        test("does not remove hasOne if relationship doesn't exist", async function (assert) {
          assert.expect(1);

          const europa: InitializedRecord = {
            type: 'moon',
            id: 'm1',
            attributes: { name: 'Europa' },
            relationships: { planet: { data: null } }
          };

          await cache.update((t) => t.addRecord(europa));

          cache.on('patch', () => {
            assert.ok(false, 'no operations were applied');
          });

          await cache.update((t) =>
            t.replaceRelatedRecord(europa, 'planet', null)
          );

          assert.ok(true, 'patch completed');
        });

        test('#update merges records when "replacing" and will not stomp on attributes and relationships that are not replaced', async function (assert) {
          const tb = cache.transformBuilder;

          await cache.update((t) =>
            t.addRecord({
              type: 'planet',
              id: '1',
              attributes: { name: 'Earth' },
              relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
            })
          );

          let result = await cache.update(
            (t) =>
              t.updateRecord({
                type: 'planet',
                id: '1',
                attributes: { classification: 'terrestrial' }
              }),
            { fullResponse: true }
          );

          assert.deepEqual(
            await cache.query((q) => q.findRecord({ type: 'planet', id: '1' })),
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
            'full response is correct'
          );
        });

        test('#update can replace related records but only if they are different', async function (assert) {
          const tb = cache.transformBuilder;

          await cache.update((t) =>
            t.addRecord({
              type: 'planet',
              id: '1',
              attributes: { name: 'Earth' },
              relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
            })
          );

          let result = await cache.update(
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
            'nothing has changed so there are no appliend or inverse ops'
          );

          result = await cache.update(
            (t) =>
              t.replaceRelatedRecords({ type: 'planet', id: '1' }, 'moons', [
                { type: 'moon', id: 'm2' }
              ]),
            { fullResponse: true }
          );

          assert.deepEqual(
            await cache.query((q) => q.findRecord({ type: 'planet', id: '1' })),
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
                    .replaceRelatedRecords(
                      { type: 'planet', id: '1' },
                      'moons',
                      [{ type: 'moon', id: 'm2' }]
                    )
                    .toOperation(),
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm1' },
                      'planet',
                      null
                    )
                    .toOperation(),
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm2' },
                      'planet',
                      {
                        type: 'planet',
                        id: '1'
                      }
                    )
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
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm2' },
                      'planet',
                      null
                    )
                    .toOperation(),
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm1' },
                      'planet',
                      {
                        type: 'planet',
                        id: '1'
                      }
                    )
                    .toOperation(),
                  tb
                    .replaceRelatedRecords(
                      { type: 'planet', id: '1' },
                      'moons',
                      [{ type: 'moon', id: 'm1' }]
                    )
                    .toOperation()
                ]
              }
            },
            'full response is correct'
          );
        });

        test('#update merges records when "replacing" and _will_ replace specified attributes and relationships', async function (assert) {
          const tb = cache.transformBuilder;

          const earth: InitializedRecord = {
            type: 'planet',
            id: '1',
            attributes: { name: 'Earth' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm1' }] } }
          };

          const jupiter: InitializedRecord = {
            type: 'planet',
            id: '1',
            attributes: { name: 'Jupiter', classification: 'terrestrial' },
            relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
          };

          let result = await cache.update(tb.addRecord(earth), {
            fullResponse: true
          });

          assert.deepEqual(
            result,
            {
              data: earth,
              details: {
                appliedOperations: [
                  tb.addRecord(earth).toOperation(),
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm1' },
                      'planet',
                      {
                        type: 'planet',
                        id: '1'
                      }
                    )
                    .toOperation()
                ],
                appliedOperationResults: [
                  {
                    type: 'planet',
                    id: '1',
                    attributes: { name: 'Earth' },
                    relationships: {
                      moons: { data: [{ type: 'moon', id: 'm1' }] }
                    }
                  },
                  {
                    type: 'moon',
                    id: 'm1',
                    relationships: {
                      planet: { data: { type: 'planet', id: '1' } }
                    }
                  }
                ],
                inverseOperations: [
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm1' },
                      'planet',
                      null
                    )
                    .toOperation(),
                  tb
                    .removeRecord({
                      type: 'planet',
                      id: '1'
                    })
                    .toOperation()
                ]
              }
            },
            'addRecord full response is correct'
          );

          result = await cache.update(tb.updateRecord(jupiter), {
            fullResponse: true
          });

          assert.deepEqual(result, {
            data: jupiter,
            details: {
              appliedOperations: [
                tb.updateRecord(jupiter).toOperation(),
                tb
                  .replaceRelatedRecord(
                    { type: 'moon', id: 'm1' },
                    'planet',
                    null
                  )
                  .toOperation(),
                tb
                  .replaceRelatedRecord({ type: 'moon', id: 'm2' }, 'planet', {
                    type: 'planet',
                    id: '1'
                  })
                  .toOperation()
              ],
              appliedOperationResults: [
                jupiter,
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
                  .replaceRelatedRecord(
                    { type: 'moon', id: 'm2' },
                    'planet',
                    null
                  )
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
                    relationships: {
                      moons: { data: [{ type: 'moon', id: 'm1' }] }
                    }
                  })
                  .toOperation()
              ]
            }
          });

          assert.deepEqual(
            await cache.query((q) => q.findRecord({ type: 'planet', id: '1' })),
            {
              type: 'planet',
              id: '1',
              attributes: { name: 'Jupiter', classification: 'terrestrial' },
              relationships: { moons: { data: [{ type: 'moon', id: 'm2' }] } }
            },
            'records have been merged'
          );
        });

        test('#update can update existing record with empty relationship', async function (assert) {
          const tb = cache.transformBuilder;

          let result = await cache.update(
            (t) => t.addRecord({ id: '1', type: 'planet' }),
            { fullResponse: true }
          );

          assert.deepEqual(
            result,
            {
              data: { id: '1', type: 'planet' },
              details: {
                appliedOperations: [
                  tb
                    .addRecord({
                      type: 'planet',
                      id: '1'
                    })
                    .toOperation()
                ],
                appliedOperationResults: [
                  {
                    id: '1',
                    type: 'planet'
                  }
                ],
                inverseOperations: [
                  tb
                    .removeRecord({
                      type: 'planet',
                      id: '1'
                    })
                    .toOperation()
                ]
              }
            },
            'addRecord result is correct'
          );

          result = await cache.update(
            (t) =>
              t.updateRecord({
                id: '1',
                type: 'planet',
                relationships: {
                  moons: { data: [] }
                }
              }),
            { fullResponse: true }
          );

          assert.deepEqual(
            result,
            {
              data: {
                id: '1',
                type: 'planet',
                relationships: {
                  moons: { data: [] }
                }
              },
              details: {
                appliedOperations: [
                  tb
                    .updateRecord({
                      id: '1',
                      type: 'planet',
                      relationships: {
                        moons: { data: [] }
                      }
                    })
                    .toOperation()
                ],
                appliedOperationResults: [
                  {
                    id: '1',
                    type: 'planet',
                    relationships: {
                      moons: { data: [] }
                    }
                  }
                ],
                inverseOperations: [
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
              }
            },
            'updateRecord result is correct'
          );

          const planet = await cache.getRecordAsync({
            type: 'planet',
            id: '1'
          });
          assert.ok(planet, 'planet exists');
          assert.deepEqual(
            planet?.relationships?.moons.data,
            [],
            'planet has empty moons relationship'
          );
        });

        test('#update will not overwrite an existing relationship with a missing relationship', async function (assert) {
          const tb = cache.transformBuilder;

          let result = await cache.update(
            (t) => [
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
            ],
            { fullResponse: true }
          );

          assert.deepEqual(
            result,
            {
              data: [
                {
                  id: '1',
                  type: 'planet',
                  relationships: {
                    moons: { data: [{ type: 'moon', id: 'm1' }] }
                  }
                },
                undefined
              ],
              details: {
                appliedOperations: [
                  tb
                    .addRecord({
                      id: '1',
                      type: 'planet',
                      relationships: {
                        moons: { data: [{ type: 'moon', id: 'm1' }] }
                      }
                    })
                    .toOperation(),
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm1' },
                      'planet',
                      {
                        id: '1',
                        type: 'planet'
                      }
                    )
                    .toOperation()
                ],
                appliedOperationResults: [
                  {
                    id: '1',
                    type: 'planet',
                    relationships: {
                      moons: { data: [{ type: 'moon', id: 'm1' }] }
                    }
                  },
                  {
                    type: 'moon',
                    id: 'm1',
                    relationships: {
                      planet: { data: { id: '1', type: 'planet' } }
                    }
                  }
                ],
                inverseOperations: [
                  tb
                    .replaceRelatedRecord(
                      { type: 'moon', id: 'm1' },
                      'planet',
                      null
                    )
                    .toOperation(),
                  tb
                    .removeRecord({
                      id: '1',
                      type: 'planet'
                    })
                    .toOperation()
                ]
              }
            },
            'update full response is correct'
          );

          const planet = await cache.getRecordAsync({
            type: 'planet',
            id: '1'
          });
          assert.ok(planet, 'planet exists');
          assert.deepEqual(
            planet?.relationships?.moons.data,
            [{ type: 'moon', id: 'm1' }],
            'planet has a moons relationship'
          );
        });

        test('#update allows replaceRelatedRecord to be called on a relationship with no inverse and to be followed up by removing the replaced record', async function (assert) {
          assert.expect(2);

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

          await cache.update((t) => [
            t.addRecord(star1),
            t.addRecord(star2),
            t.addRecord(home)
          ]);

          let latestHome = await cache.getRecordAsync({
            id: 'home',
            type: 'planetarySystem'
          });
          assert.deepEqual(
            (latestHome?.relationships?.star.data as InitializedRecord).id,
            star1.id,
            'The original related record is in place.'
          );

          await cache.update((t) => [
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

          latestHome = await cache.getRecordAsync({
            id: 'home',
            type: 'planetarySystem'
          });

          assert.deepEqual(
            (latestHome?.relationships?.star.data as InitializedRecord).id,
            star2.id,
            'The related record was replaced.'
          );
        });

        test("#update - updateRecord - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          const earth: InitializedRecord = {
            type: 'planet',
            id: '1',
            attributes: { name: 'Earth' },
            keys: { remoteId: 'a' }
          };

          try {
            await cache.update((t) =>
              t.updateRecord(earth).options({
                raiseNotFoundExceptions: true
              })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - removeRecord - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          const earth: InitializedRecord = {
            type: 'planet',
            id: '1'
          };

          try {
            await cache.update((t) =>
              t.removeRecord(earth).options({
                raiseNotFoundExceptions: true
              })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - replaceKey - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          const earth: InitializedRecord = {
            type: 'planet',
            id: '1',
            attributes: { name: 'Earth' },
            keys: { remoteId: 'a' }
          };

          try {
            await cache.update((t) =>
              t.replaceKey(earth, 'remoteId', 'b').options({
                raiseNotFoundExceptions: true
              })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - replaceAttribute - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          const earth: InitializedRecord = {
            type: 'planet',
            id: '1',
            attributes: { name: 'Earth' },
            keys: { remoteId: 'a' }
          };

          try {
            await cache.update((t) =>
              t.replaceAttribute(earth, 'name', 'Mother Earth').options({
                raiseNotFoundExceptions: true
              })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - addToRelatedRecords - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          try {
            await cache.update((t) =>
              t
                .addToRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', {
                  type: 'moon',
                  id: 'm1'
                })
                .options({
                  raiseNotFoundExceptions: true
                })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - removeFromRelatedRecords - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          try {
            await cache.update((t) =>
              t
                .removeFromRelatedRecords(
                  { type: 'planet', id: 'p1' },
                  'moons',
                  {
                    type: 'moon',
                    id: 'm1'
                  }
                )
                .options({
                  raiseNotFoundExceptions: true
                })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - replaceRelatedRecords - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          try {
            await cache.update((t) =>
              t
                .replaceRelatedRecords({ type: 'planet', id: 'p1' }, 'moons', [
                  {
                    type: 'moon',
                    id: 'm1'
                  }
                ])
                .options({
                  raiseNotFoundExceptions: true
                })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });

        test("#update - replaceRelatedRecord - throws RecordNotFoundException if record doesn't exist with `raiseNotFoundExceptions` option", async function (assert) {
          try {
            await cache.update((t) =>
              t
                .replaceRelatedRecord({ type: 'moon', id: 'm1' }, 'planet', {
                  type: 'planet',
                  id: 'p1'
                })
                .options({
                  raiseNotFoundExceptions: true
                })
            );
          } catch (e) {
            assert.ok(e instanceof RecordNotFoundException);
          }
        });
      });

      module('with alt schema', function (hooks) {
        test('#update removing model with a bi-directional hasOne', async function (assert) {
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

          if (useBuffer) {
            transformBuffer = new SimpleRecordTransformBuffer({
              schema: hasOneSchema,
              keyMap
            });
          } else {
            transformBuffer = undefined;
          }

          const cache = new ExampleAsyncRecordCache({
            schema: hasOneSchema,
            keyMap,
            defaultTransformOptions,
            transformBuffer
          });

          await cache.update((t) => [
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

          const one = (await cache.getRecordAsync({
            type: 'one',
            id: '1'
          })) as InitializedRecord;
          const two = (await cache.getRecordAsync({
            type: 'two',
            id: '2'
          })) as InitializedRecord;
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

          await cache.update((t) => t.removeRecord(two));

          assert.equal(
            ((await cache.getRecordAsync({
              type: 'one',
              id: '1'
            })) as InitializedRecord).relationships?.two.data,
            null,
            'ones link to two got removed'
          );
        });

        test('#update removes dependent records in a hasOne relationship', async function (assert) {
          const dependentSchema = new RecordSchema({
            models: {
              planet: {
                attributes: {
                  name: { type: 'string' }
                },
                relationships: {
                  moons: { kind: 'hasMany', type: 'moon' }
                }
              },
              moon: {
                attributes: {
                  name: { type: 'string' }
                },
                relationships: {
                  planet: {
                    kind: 'hasOne',
                    type: 'planet',
                    dependent: 'remove'
                  }
                }
              }
            }
          });

          if (useBuffer) {
            transformBuffer = new SimpleRecordTransformBuffer({
              schema: dependentSchema,
              keyMap
            });
          } else {
            transformBuffer = undefined;
          }

          const cache = new ExampleAsyncRecordCache({
            schema: dependentSchema,
            keyMap,
            defaultTransformOptions,
            transformBuffer
          });

          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          };
          const io: InitializedRecord = {
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

          await cache.update((t) => [
            t.addRecord(jupiter),
            t.addRecord(io),
            t.addRecord(europa),
            t.addToRelatedRecords(jupiter, 'moons', io),
            t.addToRelatedRecords(jupiter, 'moons', europa)
          ]);

          await cache.update((t) => t.removeRecord(io));

          assert.equal(
            (await cache.getRecordsAsync('moon')).length,
            1,
            'Only europa is left in store'
          );
          assert.equal(
            (await cache.getRecordsAsync('planet')).length,
            0,
            'Jupiter has been removed from the store'
          );
        });

        test('#update removes dependent records in a hasMany relationship', async function (assert) {
          const dependentSchema = new RecordSchema({
            models: {
              planet: {
                attributes: {
                  name: { type: 'string' }
                },
                relationships: {
                  moons: { kind: 'hasMany', type: 'moon', dependent: 'remove' }
                }
              },
              moon: {
                attributes: {
                  name: { type: 'string' }
                },
                relationships: {
                  planet: { kind: 'hasOne', type: 'planet' }
                }
              }
            }
          });

          if (useBuffer) {
            transformBuffer = new SimpleRecordTransformBuffer({
              schema: dependentSchema,
              keyMap
            });
          } else {
            transformBuffer = undefined;
          }

          const cache = new ExampleAsyncRecordCache({
            schema: dependentSchema,
            keyMap,
            defaultTransformOptions,
            transformBuffer
          });

          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          };
          const io: InitializedRecord = {
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

          await cache.update((t) => [
            t.updateRecord(jupiter),
            t.updateRecord(io),
            t.updateRecord(europa),
            t.addToRelatedRecords(jupiter, 'moons', io),
            t.addToRelatedRecords(jupiter, 'moons', europa)
          ]);

          await cache.update((t) => t.removeRecord(jupiter));

          assert.equal(
            (await cache.getRecordsAsync('planet')).length,
            0,
            'Jupiter has been removed from the store'
          );
          assert.equal(
            (await cache.getRecordsAsync('moon')).length,
            0,
            'All of Jupiters moons are removed from the store'
          );
        });

        test('#update does not remove non-dependent records', async function (assert) {
          const dependentSchema = new RecordSchema({
            models: {
              planet: {
                attributes: {
                  name: { type: 'string' }
                },
                relationships: {
                  moons: { kind: 'hasMany', type: 'moon' }
                }
              },
              moon: {
                attributes: {
                  name: { type: 'string' }
                },
                relationships: {
                  planet: { kind: 'hasOne', type: 'planet' }
                }
              }
            }
          });

          if (useBuffer) {
            transformBuffer = new SimpleRecordTransformBuffer({
              schema: dependentSchema,
              keyMap
            });
          } else {
            transformBuffer = undefined;
          }

          const cache = new ExampleAsyncRecordCache({
            schema: dependentSchema,
            keyMap,
            defaultTransformOptions,
            transformBuffer
          });

          const jupiter: InitializedRecord = {
            type: 'planet',
            id: 'p1',
            attributes: { name: 'Jupiter' }
          };
          const io: InitializedRecord = {
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

          await cache.update((t) => [
            t.addRecord(jupiter),
            t.addRecord(io),
            t.addRecord(europa),
            t.addToRelatedRecords(jupiter, 'moons', io),
            t.addToRelatedRecords(jupiter, 'moons', europa)
          ]);

          // Since there are no dependent relationships, no other records will be
          // removed
          await cache.update((t) => t.removeRecord(io));

          assert.equal(
            (await cache.getRecordsAsync('moon')).length,
            1,
            'One moon left in store'
          );
          assert.equal(
            (await cache.getRecordsAsync('planet')).length,
            1,
            'One planet left in store'
          );
        });
      });
    });
  });
});
