import Schema from 'orbit/schema';
import KeyMap from 'orbit/key-map';
import { identity } from 'orbit/lib/identifiers';
import qb from 'orbit/query/builder';
import {
  addRecord,
  // replaceRecord,
  removeRecord,
  // replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  // replaceHasMany,
  replaceHasOne
} from 'orbit/transform/operators';
import Cache from 'orbit/cache';

const planetsSchema = new Schema({
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

module('OC - Cache - liveQuery', function(hooks) {
  let cache;
  let pluto;
  let jupiter;
  let callisto;
  let io;

  let keyMap = new KeyMap;

  hooks.beforeEach(function() {
    pluto = { type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } };
    jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };
    callisto = { type: 'moon', id: 'callisto', attributes: { name: 'Callisto' } };
    io = { type: 'moon', id: 'io', attributes: { name: 'Io' } };

    [pluto, jupiter, callisto, io].forEach((p) => keyMap.pushRecord(p));

    cache = new Cache({ keyMap, schema: planetsSchema });
  });

  test('records', function(assert) {
    const done = assert.async();
    const liveQuery = cache.liveQuery(qb.records('planet'));

    liveQuery.take(2).toArray().subscribe((operations) => {
      assert.deepEqual(operations, [
        { op: 'addRecord', record: pluto },
        { op: 'addRecord', record: jupiter }
      ]);

      done();
    });

    cache.patch([
      addRecord(pluto),
      replaceAttribute(pluto, 'name', 'Pluto2'),
      addRecord(jupiter)
    ]);
  });

  test('filter - add new match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      qb.records('planet').filterAttributes({ name: 'Pluto' })
    );

    liveQuery.take(1).toArray().subscribe((operations) => {
      assert.deepEqual(operations, [{ op: 'addRecord', record: pluto }]);
      done();
    });

    cache.patch([
      addRecord(pluto),
      addRecord(jupiter)
    ]);
  });

  test('filter - remove match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      qb.records('planet').filterAttributes({ name: 'Pluto' })
    );

    liveQuery.take(2).toArray().subscribe(operations => {
      assert.deepEqual(operations, [
        { op: 'addRecord', record: pluto },
        { op: 'removeRecord', record: pluto }
      ]);
      done();
    });

    cache.patch([
      addRecord(pluto),
      removeRecord(pluto)
    ]);
  });

  test('filter - remove then add match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      qb.records('planet').filterAttributes({ name: 'Pluto' })
    );

    liveQuery.subscribe(operation => {
      assert.deepEqual(operation, { op: 'addRecord', record: pluto });

      done();
    });

    cache.patch([
      removeRecord(pluto),
      addRecord(pluto)
    ]);
  });

  test('filter - change attribute that causes removal from matches', function(assert) {
    const done = assert.async();

    cache.patch(addRecord(pluto));

    const liveQuery = cache.liveQuery(
      qb.records('planet')
       .filterAttributes({ name: 'Pluto' })
    );

    liveQuery.take(2).toArray().subscribe(operations => {
      assert.matchesPattern(operations[0], { op: 'addRecord', record: { id: 'pluto' } });
      assert.matchesPattern(operations[1], { op: 'removeRecord', record: { id: 'pluto' } });

      done();
    });

    cache.patch(replaceAttribute({ type: 'planet', id: 'pluto' }, 'name', 'Jupiter'));
  });

  test('filter - change attribute that causes add to matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      qb.records('planet').filterAttributes({ name: 'Uranus2' })
    );

    liveQuery.subscribe(operation => {
      assert.deepEqual(operation, ({ op: 'addRecord', record: { type: 'planet', id: 'uranus', attributes: { name: 'Uranus2' } } }));
      done();
    });

    cache.patch([
      addRecord({ type: 'planet', id: 'uranus', attributes: { name: 'Uranus' } }),
      replaceAttribute({ type: 'planet', id: 'uranus' }, 'name', 'Uranus2')
    ]);
  });

  test('filter - ignores remove record that isn\'t included in matches', function(assert) {
    const liveQuery = cache.liveQuery(
      qb.records('planet').filterAttributes({ name: 'Jupiter' })
    );

    const onOperation = sinon.stub();
    liveQuery.subscribe(onOperation);

    cache.patch([
      addRecord(pluto),
      removeRecord(pluto)
    ]);

    assert.equal(onOperation.getCalls().length, 0);
  });

  test('filter - chained', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      qb.records('planet')
        .filterAttributes({ name: 'Pluto' })
        .filterAttributes({ name: 'Pluto' })
    );

    liveQuery.subscribe(operation => {
      assert.deepEqual(operation, { op: 'addRecord', record: pluto });
      done();
    });

    cache.patch([
      addRecord(pluto),
      addRecord(jupiter)
    ]);
  });

  test('filter - records with existing match in cache', function(assert) {
    const done = assert.async();

    cache.patch(addRecord(pluto));

    const liveQuery = cache.liveQuery(qb.records('planet'));

    liveQuery.subscribe(operation => {
      assert.deepEqual(operation, { op: 'addRecord', record: pluto });
      done();
    });
  });

  test('record - existing record with removal', function(assert) {
    const done = assert.async();

    cache.patch(addRecord(pluto));
    const liveQuery = cache.liveQuery(qb.record(identity(pluto)));
    // liveQuery.subscribe(op => console.log('op', op));

    liveQuery.take(2).toArray().subscribe(operations => {
      assert.deepEqual(operations, [
        { op: 'addRecord', record: pluto },
        { op: 'removeRecord', record: pluto }
      ]);

      done();
    });

    cache.patch(removeRecord(pluto));
  });

  module('relatedRecord', function() {
    test('adds and removes record from liveQuery', function(assert) {
      const done = assert.async();

      cache.reset({ planet: { jupiter, pluto }, moon: { callisto, io } });

      const liveQuery = cache.liveQuery(qb.relatedRecord(callisto, 'planet'));

      liveQuery.take(2).toArray().subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: jupiter },
          { op: 'removeRecord', record: jupiter }
        ]);

        done();
      });

      cache.patch([
        // this first transform should not match the liveQuery's filter
        replaceHasOne(io, 'planet', pluto),
        // subsequent transforms should match the liveQuery's filter
        replaceHasOne(callisto, 'planet', jupiter),
        replaceHasOne(callisto, 'planet', null)
      ]);
    });
  });

  module('relatedRecords', function() {
    test('adds and removes records from liveQuery', function(assert) {
      const done = assert.async();

      cache.reset({ planet: { jupiter, pluto }, moon: { callisto, io } });

      const liveQuery = cache.liveQuery(qb.relatedRecords(jupiter, 'moons'));

      liveQuery.take(2).toArray().subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: callisto },
          { op: 'removeRecord', record: callisto }
        ]);

        done();
      });

      cache.patch([
        // this first transform should not match the liveQuery's filter
        addToHasMany(pluto, 'moons', io),
        // subsequent transforms should match the liveQuery's filter
        addToHasMany(jupiter, 'moons', callisto),
        removeFromHasMany(jupiter, 'moons', callisto)
      ]);
    });
  });
});
