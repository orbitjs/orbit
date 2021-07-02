import {
  AddRecordOperation,
  InitializedRecord,
  RecordKeyMap,
  RecordOperation,
  RecordSchema,
  RecordTransform
} from '@orbit/records';
import { IndexedDBSource } from '../src/indexeddb-source';

const { module, test } = QUnit;

module('IndexedDBSource - pullable', function (hooks) {
  let schema: RecordSchema, source: IndexedDBSource, keyMap: RecordKeyMap;

  hooks.beforeEach(async () => {
    schema = new RecordSchema({
      models: {
        planet: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
            revised: { type: 'boolean' }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
            solarSystem: {
              kind: 'hasOne',
              type: 'solarSystem',
              inverse: 'planets'
            }
          }
        },
        moon: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        },
        solarSystem: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planets: {
              kind: 'hasMany',
              type: 'planet',
              inverse: 'solarSystem'
            }
          }
        }
      }
    });

    keyMap = new RecordKeyMap();

    source = new IndexedDBSource({ schema, keyMap });
    await source.activated;
  });

  hooks.afterEach(async () => {
    await source.deactivate();
    await source.cache.deleteDB();
  });

  test('#pull - all records', async function (assert) {
    assert.expect(5);

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

    await source.push((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    // reset keyMap to verify that pulling records also adds keys
    keyMap.reset();

    let transforms = (await source.pull((q) =>
      q.findRecords()
    )) as RecordTransform[];

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.deepEqual(
      (transforms[0].operations as RecordOperation[]).map((o) => o.op),
      ['updateRecord', 'updateRecord', 'updateRecord'],
      'operations match expectations'
    );
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
  });

  test('#pull - records of one type', async function (assert) {
    assert.expect(4);

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

    await source.push((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let transforms = (await source.pull((q) =>
      q.findRecords('planet')
    )) as RecordTransform[];

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.ok(
      source.transformLog.contains(transforms[0].id),
      'log contains transform'
    );
    assert.deepEqual(
      (transforms[0].operations as RecordOperation[]).map((o) => o.op),
      ['updateRecord', 'updateRecord'],
      'operations match expectations'
    );
    assert.deepEqual(
      (transforms[0].operations as RecordOperation[]).map(
        (o) => (o as AddRecordOperation)?.record?.type
      ),
      ['planet', 'planet'],
      'operations match expectations'
    );
  });

  test('#pull - specific records', async function (assert) {
    assert.expect(4);

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

    await source.push((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let transforms = (await source.pull((q) =>
      q.findRecords([earth, io, { type: 'moon', id: 'FAKE' }])
    )) as RecordTransform[];

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.ok(
      source.transformLog.contains(transforms[0].id),
      'log contains transform'
    );
    assert.deepEqual(
      (transforms[0].operations as RecordOperation[]).map((o) => o.op),
      ['updateRecord', 'updateRecord'],
      'operations match expectations'
    );
    assert.deepEqual(
      (transforms[0].operations as RecordOperation[]).map(
        (o) => (o as AddRecordOperation).record.type
      ),
      ['planet', 'moon'],
      'operations match expectations'
    );
  });

  test('#pull - a specific record', async function (assert) {
    assert.expect(4);

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
      attributes: {
        name: 'Io'
      }
    };

    await source.push((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    // reset keyMap to verify that pulling records also adds keys
    keyMap.reset();

    let transforms = (await source.pull((q) =>
      q.findRecord(jupiter)
    )) as RecordTransform[];

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.ok(
      source.transformLog.contains(transforms[0].id),
      'log contains transform'
    );
    assert.deepEqual(
      (transforms[0].operations as RecordOperation[]).map((o) => o.op),
      ['updateRecord'],
      'operations match expectations'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'p2'),
      'jupiter',
      'key has been mapped'
    );
  });
});
