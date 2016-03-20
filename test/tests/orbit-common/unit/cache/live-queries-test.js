import { equalOps } from 'tests/test-helper';
import Transform from 'orbit/transform';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';

const { skip } = QUnit;

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
  let saturn;
  let titan;

  hooks.beforeEach(function() {
    pluto = planetsSchema.normalize({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });

    jupiter = planetsSchema.normalize({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } });
    callisto = planetsSchema.normalize({ type: 'moon', id: 'callisto', attributes: { name: 'Callisto' } });

    saturn = planetsSchema.normalize({
      type: 'planet', id: 'saturn',
      attributes: { name: 'Saturn' },
      relationships: { moons: { data: { 'moon:titan': true } } } });

    titan = planetsSchema.normalize({
      type: 'moon', id: 'titan',
      attributes: { name: 'Titan' },
      relationships: { planet: { data: 'planet:saturn' } } });

    cache = new Cache(planetsSchema);
  });

  test('recordsOfType', function(assert) {
    const done = assert.async();

    cache.transform(t =>
      t.addRecord(pluto)
       .replaceAttribute(pluto, 'name', 'Pluto2')
       .addRecord(jupiter)
    );

    cache.patches.onCompleted();

    const liveQuery = cache.liveQuery(q => q.recordsOfType('planet'));

    liveQuery.toArray().subscribe((operations) => {
      assert.deepEqual(operations, [
        { op: 'addRecord', record: pluto },
        { op: 'addRecord', record: jupiter }
      ]);

      done();
    });
  });

  test('filter - add new match', function(assert) {
    const done = assert.async();

    cache.transform(t =>
      t.addRecord(pluto)
       .addRecord(jupiter)
    );

    cache.patches.onCompleted();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet').filterAttributes({ name: 'Pluto' })
    );

    liveQuery.toArray().subscribe((operations) => {
      assert.deepEqual(operations, [{ op: 'addRecord', record: pluto }]);
      done();
    });
  });

  test('filter - remove match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet').filterAttributes({ name: 'Pluto' })
    );

    liveQuery.toArray().subscribe(operations => {
      assert.deepEqual(operations, [
        { op: 'addRecord', record: pluto },
        { op: 'removeRecord', record: pluto }
      ]);
      done();
    });

    cache.transform(t =>
      t.addRecord(pluto)
       .removeRecord(pluto)
    );

    cache.patches.onCompleted();
  });

  test('filter - remove then add match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet').filterAttributes({ name: 'Pluto' })
    );

    cache.transform(t =>
      t.removeRecord(pluto)
       .addRecord(pluto)
    );

    cache.patches.onCompleted();

    liveQuery.take(2).toArray().subscribe((operations) => {
      assert.deepEqual(operations, [{ op: 'addRecord', record: pluto }]);
      done();
    });
  });

  test('filter - change attribute that causes removal from matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet').filterAttributes({ name: 'Pluto' })
    );

    liveQuery.take(2).toArray().subscribe(operations => {
      const { op, record } = operations[1];

      assert.equal(op, 'removeRecord');
      assert.equal(record.id, 'pluto');

      done();
    });

    cache.transform(t =>
      t.addRecord(pluto)
       .replaceAttribute({ type: 'planet', id: 'pluto' }, 'name', 'Jupiter')
    );

    cache.patches.onCompleted();
  });

  test('filter - change attribute that causes add to matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet').filterAttributes({ name: 'Uranus2' })
    );

    liveQuery.subscribe(operation => {
      assert.deepEqual(operation, ({ op: 'addRecord', record: { type: 'planet', id: 'uranus', attributes: { name: 'Uranus2' } } }));
      done();
    });

    cache.transform(t =>
      t.addRecord({ type: 'planet', id: 'uranus', attributes: { name: 'Uranus' } })
       .replaceAttribute({ type: 'planet', id: 'uranus' }, 'name', 'Uranus2')
    );

    cache.patches.onCompleted();
  });

  test('filter - ignores remove record that isn\'t included in matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet').filterAttributes({ name: 'Jupiter' })
    );

    liveQuery.toArray().subscribe(operations => {
      equal(operations.length, 0);
      done();
    });

    cache.transform(t => t.addRecord(pluto)
                          .removeRecord(pluto));

    cache.patches.onCompleted();
  });

  test('filter - chained', function(assert) {
    const done = assert.async();

    cache.transform(t => {
      t.addRecord(pluto);
      t.addRecord(jupiter);
    });

    cache.patches.onCompleted();

    const liveQuery = cache.liveQuery(q =>
      q.recordsOfType('planet')
       .filterAttributes({ name: 'Pluto' })
       .filterAttributes({ name: 'Pluto' })
    );

    liveQuery.toArray().subscribe((operations) => {
      assert.deepEqual(operations, [{ op: 'addRecord', record: pluto }]);
      done();
    });
  });

  test('record - responds to record added/removed', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(q => q.record('planet', 'pluto'));

    liveQuery.toArray().subscribe(operations => {
      assert.deepEqual(operations, [
        { op: 'addRecord', record: pluto },
        { op: 'removeRecord', record: pluto }
      ]);

      done();
    });

    cache.transform(t => t.addRecord(pluto)
                          .removeRecord(pluto));

    cache.patches.onCompleted();
  });

  module('relatedRecord', function() {
    test('adds and removes record from liveQuery', function(assert) {
      const done = assert.async();

      cache.reset({ planet: { jupiter }, moon: { callisto } });

      cache.patches.subscribe(operation => console.log('patch', operation));

      const liveQuery = cache.liveQuery(q => q.relatedRecord('moon', 'callisto', 'planet'));

      liveQuery.toArray().subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: jupiter },
          { op: 'removeRecord', record: jupiter }
        ]);

        done();
      });

      cache.transform(t => t.replaceHasOne(callisto, 'planet', jupiter)
                            .replaceHasOne(callisto, 'planet', null));

      cache.patches.onCompleted();
    });
  });

  module('relatedRecords', function() {
    test('adds and removes records from liveQuery', function(assert) {
      const done = assert.async();

      cache.reset({ planet: { jupiter }, moon: { callisto } });

      const liveQuery = cache.liveQuery(q => q.relatedRecords('planet', 'jupiter', 'moons'));

      liveQuery.toArray().subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: callisto },
          { op: 'removeRecord', record: callisto }
        ]);

        done();
      });

      cache.transform(t => t.addToHasMany(jupiter, 'moons', callisto)
                            .removeFromHasMany(jupiter, 'moons', callisto));

      cache.patches.onCompleted();
    });
  });
});
