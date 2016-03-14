import { equalOps, asyncTest, transformMatching } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Store from 'orbit-common/store';
import { resolve, Promise } from 'rsvp';
import Transform from 'orbit/transform';
import TransformBuilder from 'orbit-common/transform/builder';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  replaceHasManyOperation,
  replaceHasOneOperation,
  removeFromHasManyOperation,
  replaceKeyOperation,
  addRecordToSetOperation
} from 'orbit-common/lib/operations';
import {
  queryExpression as oqe
} from 'orbit/query/expression';
import MemorySource from 'orbit-common/memory-source';
import { deferred } from 'orbit/lib/promises';

const stub = sinon.stub;

const schemaDefinition = {
  models: {
    star: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planets: { type: 'hasMany', model: 'planet', inverse: 'star' }
      }
    },
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
        star: { type: 'hasOne', model: 'star', inverse: 'planets' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
      }
    }
  }
};

const schema = new Schema(schemaDefinition);
const transformBuilder = new TransformBuilder();

module('OC - Store', function(hooks) {
  let store;
  let onTransform;
  let onFetch;

  hooks.beforeEach(function() {
    store = new Store({ schema });

    onTransform = stub();
    onFetch = deferred();

    store.on('transform', t => store.confirm(t));
    store.on('transform', t => onTransform(t));
    store.on('fetch', expression => onFetch.promise);
  });

  test('#findRecord', function(assert) {
    const done = assert.async();

    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    const addRecordTransform = transformBuilder.build(t => t.addRecord(earth));

    const runQuery = store.findRecord('planet', 'earth');
    onFetch.resolve([addRecordTransform]);
    store.confirm(addRecordTransform);
    runQuery
      .then(foundPlanet => assert.deepEqual(foundPlanet, earth, 'correct planet has been found'))
      .finally(done);
  });

  test('#findRecord - returns undefined when a record can\'t be found', function(assert) {
    const done = assert.async();

    const runQuery = store.findRecord('planet', 'earth');
    onFetch.resolve([]);
    runQuery
      .then(result => assert.deepEqual(result, undefined, 'planet not found'))
      .finally(done);
  });

  test('#findRecordsOfType - returns all records of a particular type', function(assert) {
    const done = assert.async();

    let earth = schema.normalize({ id: 'earth', type: 'planet' });
    let jupiter = schema.normalize({ id: 'jupiter', type: 'planet' });
    let io = schema.normalize({ id: 'io', type: 'moon' });

    const addPlanetsTransform = transformBuilder.build(t => {
      t.addRecord(earth);
      t.addRecord(jupiter);
      t.addRecord(io);
    });

    const runQuery = store.findRecordsOfType('planet');
    onFetch.resolve([addPlanetsTransform]);
    store.confirm(addPlanetsTransform);

    runQuery
      .then(function(planets) {
        deepEqual(planets, [earth, jupiter], 'planets have been found');
      })
      .finally(done);
  });

  test('#findRecordsOfType - returns an empty array when there\'s no data', function(assert) {
    const done = assert.async();

    const runQuery = store.findRecordsOfType('planet');
    onFetch.resolve([]);

    runQuery
      .then(function(planets) {
        deepEqual(planets, [], 'no planets have been found');
      })
      .finally(done);
  });

  QUnit.skip('#liveQuery', function(assert) {
    const done = assert.async();

    const jupiter = schema.normalize({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } });
    const pluto = schema.normalize({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });

    Promise.all([
      store.addRecord(pluto),
      store.addRecord(jupiter)
    ])
    .then(([pluto, jupiter]) => {
      const liveQuery = store.liveQuery(oqe('recordsOfType', 'planet'));
      liveQuery.take(2).toArray().subscribe((operations) => {
        equalOps(operations, [
          addRecordToSetOperation(pluto),
          addRecordToSetOperation(jupiter)
        ]);

        done();
      });
    });
  });

  test('#addRecord', function(assert) {
    let done = assert.async();
    let newRecord = { type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } };
    let normalizedRecord = schema.normalize(newRecord);

    store.addRecord(newRecord)
      .then(function(addedRecord) {
        assert.ok(addedRecord.id, 'has an id assigned');
        assert.deepEqual(addedRecord.attributes, newRecord.attributes, 'has attributes assigned');
        assert.deepEqual(addedRecord.relationships.moons, { data: {} }, 'has initialized hasMany relationships');
        assert.deepEqual(addedRecord.relationships.star, { data: null }, 'has initialized hasOne relationships');
        assert.deepEqual(store.cache.get(['planet', addedRecord.id]), addedRecord, 'is available for retrieval from the cache');
        assert.ok(onTransform.calledWith(transformMatching(t => t.addRecord(normalizedRecord))), 'operation has been emitted as a transform');
      })
      .finally(done);
  });

  test('#replaceRecord - replaced record', function(assert) {
    let done = assert.async();
    let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto' } });
    let plutoReplacement = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto returns' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.replaceRecord(plutoReplacement)
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.replaceRecord(plutoReplacement))), 'operation has been emitted as a transform');
        assert.deepEqual(store.cache.get(['planet', 'pluto']), plutoReplacement);
      })
      .finally(done);
  });

  test('#removeRecord - deleted record', function(assert) {
    let done = assert.async();
    let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.removeRecord(pluto)
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.removeRecord(pluto))), 'operation has been emitted as a transform');
        assert.ok(!store.cache.get(['planet', 'pluto']), 'has been removed from store');
      })
      .finally(done);
  });

  test('#replaceKey', function(assert) {
    let done = assert.async();
    let pluto = schema.normalize({ id: 'pluto', type: 'planet', keys: { galaxyAlias: 'planet:pluto' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.replaceKey(pluto, 'galaxyAlias', 'planet:plooto')
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.replaceKey(pluto, 'galaxyAlias', 'planet:plooto'))), 'operation has been emitted as a transform');
        assert.equal(store.cache.get(['planet', 'pluto']).keys.galaxyAlias, 'planet:plooto', 'key updated in cached record');
      })
      .finally(done);
  });

  test('#replaceAttribute', function(assert) {
    let done = assert.async();
    let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.replaceAttribute(pluto, 'name', 'pluto returns')
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.replaceAttribute(pluto, 'name', 'pluto returns'))), 'operation has been emitted as a transform');
        assert.equal(store.cache.get(['planet', 'pluto']).attributes.name, 'pluto returns', 'attributes updated in cached record');
      })
      .finally(done);
  });

  test('#addToHasMany', function(assert) {
    let done = assert.async();
    let earth = schema.normalize({ id: 'earth', type: 'planet' });
    let io = schema.normalize({ id: 'io', type: 'moon' });

    store.cache.reset({
      planet: { earth },
      moon: { io }
    });

    store.addToHasMany(earth, 'moons', io)
      .then(function() {
        ok(onTransform.calledWith(transformMatching(t => t.addToHasMany(earth, 'moons', io))), 'operation has been emitted as a transform');
        deepEqual(earth.relationships.moons.data, { 'moon:io': true }, 'added to hasMany');
      })
      .finally(done);
  });

  test('#removeFromHasMany', function(assert) {
    let done = assert.async();
    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    let io = schema.normalize({ id: 'io', type: 'moon', relationships: { planet: { data: 'planet:earth' } } });

    store.cache.reset({
      planet: { earth },
      moon: { io }
    });

    store.removeFromHasMany(earth, 'moons', io)
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.removeFromHasMany(earth, 'moons', io))), 'operation has been emitted as a transform');
        assert.deepEqual(earth.relationships.moons.data, {}, 'removed from hasMany');
        assert.deepEqual(io.relationships.planet.data, null, 'removed from inverse');
      })
      .finally(done);
  });

  test('#replaceHasMany', function(assert) {
    let done = assert.async();
    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    let io = schema.normalize({ id: 'io', type: 'moon', relationships: { planet: { data: 'planet:earth' } } });
    let titan = schema.normalize({ id: 'titan', type: 'moon' });

    store.cache.reset({
      planet: { earth },
      moon: { io, titan }
    });

    store.replaceHasMany(earth, 'moons', [titan])
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.replaceHasMany(earth, 'moons', [titan]))), 'operation has been emitted as a transform');
        assert.deepEqual(earth.relationships.moons.data, { 'moon:titan': true }, 'replaced hasMany');
        assert.deepEqual(io.relationships.planet.data, null, 'updated inverse on removed records');
        assert.deepEqual(titan.relationships.planet.data, 'planet:earth', 'updated inverse on added records');
      })
      .finally(done);
  });

  test('#replaceHasOne', function(assert) {
    let done = assert.async();
    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    let jupiter = schema.normalize({ id: 'jupiter', type: 'planet' });
    let io = schema.normalize({ id: 'io', type: 'moon', relationships: { planet: { data: 'planet:earth' } } });

    store.cache.reset({
      planet: { earth, jupiter },
      moon: { io }
    });

    store.replaceHasOne(io, 'planet', jupiter)
      .then(function() {
        assert.ok(onTransform.calledWith(transformMatching(t => t.replaceHasOne(io, 'planet', jupiter))), 'operation has been emitted as a transform');
        assert.deepEqual(io.relationships.planet.data, 'planet:jupiter', 'updated hasOne');
        assert.deepEqual(earth.relationships.moons.data, {}, 'updated inverse on removed records');
        assert.deepEqual(jupiter.relationships.moons.data, { 'moon:io': true }, 'updated inverse on added records');
      })
      .finally(done);
  });
});
