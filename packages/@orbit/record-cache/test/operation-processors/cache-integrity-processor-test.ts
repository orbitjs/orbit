import {
  RecordSchema,
  RecordSchemaSettings,
  RecordKeyMap,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  UpdateRecordOperation
} from '@orbit/records';
import { SyncCacheIntegrityProcessor } from '../../src/operation-processors/sync-cache-integrity-processor';
import { ExampleSyncRecordCache } from '../support/example-sync-record-cache';

const { module, test } = QUnit;

module('CacheIntegrityProcessor', function (hooks) {
  let schema: RecordSchema;
  let cache: ExampleSyncRecordCache;
  let processor: SyncCacheIntegrityProcessor;

  const schemaDefinition: RecordSchemaSettings = {
    models: {
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
          inhabitants: {
            kind: 'hasMany',
            type: 'inhabitant',
            inverse: 'planets'
          },
          next: { kind: 'hasOne', type: 'planet', inverse: 'previous' },
          previous: { kind: 'hasOne', type: 'planet', inverse: 'next' }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
        }
      },
      inhabitant: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planets: { kind: 'hasMany', type: 'planet', inverse: 'inhabitants' }
        }
      }
    }
  };

  const europaId = { type: 'moon', id: 'europa' };
  const titanId = { type: 'moon', id: 'titan' };
  const jupiterId = { type: 'planet', id: 'jupiter' };
  const saturnId = { type: 'planet', id: 'saturn' };
  const earthId = { type: 'planet', id: 'earth' };
  const humanId = { type: 'inhabitant', id: 'human' };

  hooks.beforeEach(function () {
    let keyMap = new RecordKeyMap();
    schema = new RecordSchema(schemaDefinition);
    cache = new ExampleSyncRecordCache({
      schema,
      keyMap,
      processors: [SyncCacheIntegrityProcessor]
    });
    processor = cache.processors[0] as SyncCacheIntegrityProcessor;
  });

  test('reset empty cache', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [europaId] } }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: jupiterId } }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('add to hasOne => hasMany', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [europaId] } }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: jupiterId } }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);

    const addPlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: europaId,
      relationship: 'planet',
      relatedRecord: saturnId
    };

    assert.deepEqual(processor.before(addPlanetOp), []);

    assert.deepEqual(processor.after(addPlanetOp), []);

    assert.deepEqual(processor.finally(addPlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      },
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('replace hasOne => hasMany', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [europaId] } }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: jupiterId } }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);

    const replacePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: europaId,
      relationship: 'planet',
      relatedRecord: saturnId
    };

    assert.deepEqual(processor.before(replacePlanetOp), []);

    assert.deepEqual(processor.after(replacePlanetOp), []);

    assert.deepEqual(processor.finally(replacePlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      },
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('replace hasMany => hasOne with empty array', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    cache.patch((t) => [t.addRecord(saturn), t.addRecord(titan)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);

    const clearMoonsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: saturn,
      relationship: 'moons',
      relatedRecords: []
    };

    assert.deepEqual(processor.before(clearMoonsOp), []);

    assert.deepEqual(processor.after(clearMoonsOp), []);

    assert.deepEqual(processor.finally(clearMoonsOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('replace hasMany => hasOne with populated array', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);

    const replaceMoonsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: saturn,
      relationship: 'moons',
      relatedRecords: [titanId]
    };

    assert.deepEqual(processor.before(replaceMoonsOp), []);

    assert.deepEqual(processor.after(replaceMoonsOp), []);

    assert.deepEqual(processor.finally(replaceMoonsOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('replace hasMany => hasOne with populated array, when already populated', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [europaId] } }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: jupiterId } }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);

    const replaceMoonsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: saturn,
      relationship: 'moons',
      relatedRecords: [europaId]
    };

    assert.deepEqual(processor.before(replaceMoonsOp), []);

    assert.deepEqual(processor.after(replaceMoonsOp), []);

    assert.deepEqual(processor.finally(replaceMoonsOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      },
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('replace hasMany => hasMany', function (assert) {
    const human = {
      type: 'inhabitant',
      id: 'human',
      relationships: { planets: { data: [earthId] } }
    };
    const earth = {
      type: 'planet',
      id: 'earth',
      relationships: { inhabitants: { data: [humanId] } }
    };

    cache.patch((t) => [t.addRecord(human), t.addRecord(earth)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(human), [
      {
        record: earthId,
        relationship: 'inhabitants',
        relatedRecord: humanId
      }
    ]);

    const clearInhabitantsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: earth,
      relationship: 'inhabitants',
      relatedRecords: []
    };

    assert.deepEqual(processor.after(clearInhabitantsOp), []);

    assert.deepEqual(processor.finally(clearInhabitantsOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(human), []);
  });

  test('remove hasOne => hasMany', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: [titanId] } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { moons: { data: [europaId] } }
    };

    const titan = {
      type: 'moon',
      id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: saturnId } }
    };

    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' },
      relationships: { planet: { data: jupiterId } }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: europaId,
        relationship: 'planet',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);

    const removePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: europa,
      relationship: 'planet',
      relatedRecord: null
    };

    assert.deepEqual(processor.before(removePlanetOp), []);

    assert.deepEqual(processor.after(removePlanetOp), []);

    assert.deepEqual(processor.finally(removePlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(europa), [
      {
        record: jupiterId,
        relationship: 'moons',
        relatedRecord: europaId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(titan), [
      {
        record: saturnId,
        relationship: 'moons',
        relatedRecord: titanId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: titanId,
        relationship: 'planet',
        relatedRecord: saturnId
      }
    ]);
  });

  test('add to hasOne => hasOne', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { next: { data: jupiterId } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { previous: { data: saturnId } }
    };

    const earth = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Earth' }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: saturnId,
        relationship: 'next',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: jupiterId,
        relationship: 'previous',
        relatedRecord: saturnId
      }
    ]);

    const changePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: earthId,
      relationship: 'next',
      relatedRecord: saturnId
    };

    assert.deepEqual(processor.before(changePlanetOp), []);

    assert.deepEqual(processor.after(changePlanetOp), []);

    assert.deepEqual(processor.finally(changePlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: saturnId,
        relationship: 'next',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: jupiterId,
        relationship: 'previous',
        relatedRecord: saturnId
      },
      {
        record: earthId,
        relationship: 'next',
        relatedRecord: saturnId
      }
    ]);
  });

  test('replace hasOne => hasOne with existing value', function (assert) {
    const saturn = {
      type: 'planet',
      id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { next: { data: jupiterId } }
    };

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' },
      relationships: { previous: { data: saturnId } }
    };

    const earth = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Earth' }
    };

    cache.patch((t) => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: saturnId,
        relationship: 'next',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: jupiterId,
        relationship: 'previous',
        relatedRecord: saturnId
      }
    ]);

    const changePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: earthId,
      relationship: 'next',
      relatedRecord: jupiterId
    };

    assert.deepEqual(processor.before(changePlanetOp), []);

    assert.deepEqual(processor.after(changePlanetOp), []);

    assert.deepEqual(processor.finally(changePlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(jupiter), [
      {
        record: saturnId,
        relationship: 'next',
        relatedRecord: jupiterId
      },
      {
        record: earthId,
        relationship: 'next',
        relatedRecord: jupiterId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(saturn), [
      {
        record: jupiterId,
        relationship: 'previous',
        relatedRecord: saturnId
      }
    ]);
  });

  test('add to hasMany => hasMany', function (assert) {
    const earth = earthId;
    const human = humanId;

    cache.patch((t) => [t.addRecord(earth), t.addRecord(human)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), []);
    assert.deepEqual(cache.getInverseRelationshipsSync(human), []);

    const addPlanetOp: AddToRelatedRecordsOperation = {
      op: 'addToRelatedRecords',
      record: humanId,
      relationship: 'planets',
      relatedRecord: earthId
    };

    assert.deepEqual(processor.before(addPlanetOp), []);

    assert.deepEqual(processor.after(addPlanetOp), []);

    assert.deepEqual(processor.finally(addPlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);
  });

  test('remove from hasMany => hasMany', function (assert) {
    const earth = {
      type: 'planet',
      id: 'earth',
      relationships: { inhabitants: { data: [humanId] } }
    };
    const human = {
      type: 'inhabitant',
      id: 'human',
      relationships: { planets: { data: [earthId] } }
    };

    cache.patch((t) => [t.addRecord(earth), t.addRecord(human)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(human), [
      {
        record: earthId,
        relationship: 'inhabitants',
        relatedRecord: humanId
      }
    ]);

    const removePlanetOp: RemoveFromRelatedRecordsOperation = {
      op: 'removeFromRelatedRecords',
      record: human,
      relationship: 'planets',
      relatedRecord: earth
    };

    assert.deepEqual(processor.before(removePlanetOp), []);

    assert.deepEqual(processor.after(removePlanetOp), []);

    assert.deepEqual(processor.finally(removePlanetOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(human), [
      {
        record: earthId,
        relationship: 'inhabitants',
        relatedRecord: humanId
      }
    ]);
  });

  test('remove record with hasMany relationships - verify processor', function (assert) {
    const earth = {
      type: 'planet',
      id: 'earth',
      relationships: { inhabitants: { data: [humanId] } }
    };
    const human = {
      type: 'inhabitant',
      id: 'human',
      relationships: { planets: { data: [earthId] } }
    };

    cache.patch((t) => [t.addRecord(earth), t.addRecord(human)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(human), [
      {
        record: earthId,
        relationship: 'inhabitants',
        relatedRecord: humanId
      }
    ]);

    const removeInhabitantOp: RemoveRecordOperation = {
      op: 'removeRecord',
      record: human
    };

    assert.deepEqual(processor.before(removeInhabitantOp), []);

    assert.deepEqual(processor.after(removeInhabitantOp), []);

    assert.deepEqual(processor.finally(removeInhabitantOp), [
      {
        op: 'removeFromRelatedRecords',
        record: earthId,
        relationship: 'inhabitants',
        relatedRecord: humanId
      }
    ]);
  });

  test('remove record with hasMany relationships - verify inverse relationships are cleared', function (assert) {
    const earth = {
      type: 'planet',
      id: 'earth',
      relationships: { inhabitants: { data: [humanId] } }
    };
    const human = {
      type: 'inhabitant',
      id: 'human',
      relationships: { planets: { data: [earthId] } }
    };

    cache.patch((t) => [t.addRecord(earth), t.addRecord(human)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);

    assert.deepEqual(cache.getInverseRelationshipsSync(human), [
      {
        record: earthId,
        relationship: 'inhabitants',
        relatedRecord: humanId
      }
    ]);

    cache.patch((t) => t.removeRecord(humanId));

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), []);
    assert.deepEqual(cache.getInverseRelationshipsSync(human), []);
  });

  test('updateRecord', function (assert) {
    const earth = earthId;
    const human = humanId;

    cache.patch((t) => [t.addRecord(earth), t.addRecord(human)]);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), []);
    assert.deepEqual(cache.getInverseRelationshipsSync(human), []);

    const humanOnEarth = {
      type: 'inhabitant',
      id: 'human',
      relationships: {
        planets: { data: [earthId] }
      }
    };

    const replaceHumanOp: UpdateRecordOperation = {
      op: 'updateRecord',
      record: humanOnEarth
    };

    assert.deepEqual(processor.before(replaceHumanOp), []);

    assert.deepEqual(processor.after(replaceHumanOp), []);

    assert.deepEqual(processor.finally(replaceHumanOp), []);

    assert.deepEqual(cache.getInverseRelationshipsSync(earth), [
      {
        record: humanId,
        relationship: 'planets',
        relatedRecord: earthId
      }
    ]);
    assert.deepEqual(cache.getInverseRelationshipsSync(human), []);
  });
});
