import Schema from 'orbit-common/schema';
import Store from 'orbit-common/store';
import { Promise } from 'rsvp';
import TransformBuilder from 'orbit-common/transform/builder';
import { RecordNotFoundException } from 'orbit-common/lib/exceptions';

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

  hooks.beforeEach(function() {
    store = new Store({ schema });
  });

  test('#query - record', function(assert) {
    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    const addRecordTransform = transformBuilder.build(t => t.addRecord(earth));

    store.on('fetchRequest', query => store.confirmFetch(query, [addRecordTransform]));

    return store.query(q => q.record('planet', 'earth'))
      .then(foundPlanet => assert.deepEqual(foundPlanet, earth, 'correct planet has been found'));
  });

  test('#query - record - returns undefined when a record can\'t be found', function(assert) {
    assert.expect(1);

    store.on('fetchRequest', query => store.confirmFetch(query, []));

    return store.query(q => q.record('planet', 'earth'))
      .catch(e => assert.ok(e instanceof RecordNotFoundException));
  });

  test('#query - recordsOfType - returns all records of a particular type', function(assert) {
    assert.expect(1);

    let earth = schema.normalize({ id: 'earth', type: 'planet' });
    let jupiter = schema.normalize({ id: 'jupiter', type: 'planet' });
    let io = schema.normalize({ id: 'io', type: 'moon' });

    const addPlanetsTransform = transformBuilder.build(t => {
      t.addRecord(earth);
      t.addRecord(jupiter);
      t.addRecord(io);
    });

    store.on('fetchRequest', query => store.confirmFetch(query, [addPlanetsTransform]));

    return store.query(q => q.recordsOfType('planet'))
      .then(planets => assert.deepEqual(planets, { earth, jupiter }, 'planets have been found'));
  });

  test('#query - recordsOfType - returns an empty set when there\'s no data', function(assert) {
    assert.expect(1);

    store.cache.reset({
      planet: {}
    });

    store.on('fetchRequest', query => store.confirmFetch(query, []));

    return store.query(q => q.recordsOfType('planet'))
      .then(planets => assert.deepEqual(planets, {}, 'no planets have been found'));
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
      const liveQuery = store.liveQuery(q => q.recordsOfType('planet'));
      liveQuery.take(2).toArray().subscribe((operations) => {
        // TODO
        // assert.deepEqual(operations, [
        //   addRecordToSetOperation(pluto),
        //   addRecordToSetOperation(jupiter)
        // ]);

        done();
      });
    });
  });

  test('#update - addRecord', function(assert) {
    assert.expect(3);

    let record = schema.normalize({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.addRecord(record))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['addRecord']);

        assert.deepEqual(store.cache.get(['planet', record.id]), record, 'record matches');
      });
  });

  test('#update - replaceRecord', function(assert) {
    assert.expect(3);

    let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto' } });
    let plutoReplacement = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto returns' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.replaceRecord(plutoReplacement))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceRecord']);

        assert.deepEqual(store.cache.get(['planet', 'pluto']), plutoReplacement);
      });
  });

  test('#update - removeRecord', function(assert) {
    assert.expect(3);

    let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.removeRecord(pluto))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['removeRecord']);

        assert.ok(!store.cache.get(['planet', 'pluto']), 'has been removed from store');
      });
  });

  test('#update - replaceKey', function(assert) {
    assert.expect(3);

    let pluto = schema.normalize({ id: 'pluto', type: 'planet', keys: { galaxyAlias: 'planet:pluto' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.replaceKey(pluto, 'galaxyAlias', 'planet:plooto'))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceKey']);

        assert.equal(store.cache.get(['planet', 'pluto']).keys.galaxyAlias, 'planet:plooto', 'key updated in cached record');
      });
  });

  test('#update - replaceAttribute', function(assert) {
    assert.expect(3);

    let pluto = schema.normalize({ id: 'pluto', type: 'planet', attributes: { name: 'pluto' } });

    store.cache.reset({
      planet: { pluto }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.replaceAttribute(pluto, 'name', 'pluto returns'))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceAttribute']);

        assert.equal(store.cache.get(['planet', 'pluto']).attributes.name, 'pluto returns', 'attributes updated in cached record');
      });
  });

  test('#update - addToHasMany', function(assert) {
    assert.expect(3);

    let earth = schema.normalize({ id: 'earth', type: 'planet' });
    let io = schema.normalize({ id: 'io', type: 'moon' });

    store.cache.reset({
      planet: { earth },
      moon: { io }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.addToHasMany(earth, 'moons', io))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['addToHasMany']);

        deepEqual(earth.relationships.moons.data, { 'moon:io': true }, 'added to hasMany');
      });
  });

  test('#update - removeFromHasMany', function(assert) {
    assert.expect(4);

    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    let io = schema.normalize({ id: 'io', type: 'moon', relationships: { planet: { data: 'planet:earth' } } });

    store.cache.reset({
      planet: { earth },
      moon: { io }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.removeFromHasMany(earth, 'moons', io))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['removeFromHasMany']);

        assert.deepEqual(earth.relationships.moons.data, {}, 'removed from hasMany');
        assert.deepEqual(io.relationships.planet.data, null, 'removed from inverse');
      });
  });

  test('#update - replaceHasMany', function(assert) {
    assert.expect(5);

    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    let io = schema.normalize({ id: 'io', type: 'moon', relationships: { planet: { data: 'planet:earth' } } });
    let titan = schema.normalize({ id: 'titan', type: 'moon' });

    store.cache.reset({
      planet: { earth },
      moon: { io, titan }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.replaceHasMany(earth, 'moons', [titan]))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceHasMany']);

        assert.deepEqual(earth.relationships.moons.data, { 'moon:titan': true }, 'replaced hasMany');
        assert.deepEqual(io.relationships.planet.data, null, 'updated inverse on removed records');
        assert.deepEqual(titan.relationships.planet.data, 'planet:earth', 'updated inverse on added records');
      });
  });

  test('#update - replaceHasOne', function(assert) {
    assert.expect(5);

    let earth = schema.normalize({ id: 'earth', type: 'planet', relationships: { moons: { data: { 'moon:io': true } } } });
    let jupiter = schema.normalize({ id: 'jupiter', type: 'planet' });
    let io = schema.normalize({ id: 'io', type: 'moon', relationships: { planet: { data: 'planet:earth' } } });

    store.cache.reset({
      planet: { earth, jupiter },
      moon: { io }
    });

    store.on('updateRequest', transform => store.confirmUpdate(transform));

    return store.update(t => t.replaceHasOne(io, 'planet', jupiter))
      .then(transforms => {
        assert.equal(transforms.length, 1);
        assert.deepEqual(transforms[0].operations.map(o => o.op), ['replaceHasOne']);

        assert.deepEqual(io.relationships.planet.data, 'planet:jupiter', 'updated hasOne');
        assert.deepEqual(earth.relationships.moons.data, {}, 'updated inverse on removed records');
        assert.deepEqual(jupiter.relationships.moons.data, { 'moon:io': true }, 'updated inverse on added records');
      });
  });
});
