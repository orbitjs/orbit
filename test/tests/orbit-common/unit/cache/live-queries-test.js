import { planetsSchema, equalOps } from 'tests/test-helper';
import Transform from 'orbit/transform';
import {
  addRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  replaceHasOneOperation,
  addToHasManyOperation,
  removeFromHasManyOperation,
  addRecordToSetOperation,
  removeRecordFromSetOperation
} from 'orbit-common/lib/operations';
import Cache from 'orbit-common/cache';
import {
  queryExpression as oqe
} from 'orbit/query/expression';

const { skip } = QUnit;

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

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(addRecordOperation(jupiter)));
    cache.patches.onCompleted();

    const liveQuery = cache.liveQuery(oqe('recordsOfType', 'planet'));

    liveQuery.toArray().subscribe((operations) => {
      equalOps(operations, [
        addRecordToSetOperation(pluto),
        addRecordToSetOperation(jupiter)
      ]);

      done();
    });
  });

  test('filter - add new match', function(assert) {
    const done = assert.async();

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(addRecordOperation(jupiter)));
    cache.patches.onCompleted();

    const liveQuery = cache.liveQuery(
      oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );

    liveQuery.toArray().subscribe((operations) => {
      equalOps(operations, [addRecordToSetOperation(pluto)]);
      done();
    });
  });

  test('filter - remove match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );

    liveQuery.toArray().subscribe(operations => {
      equalOps(operations, [
        addRecordToSetOperation(pluto),
        removeRecordFromSetOperation(pluto)
      ]);
      done();
    });

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(removeRecordOperation(pluto)));
    cache.patches.onCompleted();
  });

  test('filter - remove then add match', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );

    cache.transform(new Transform(removeRecordOperation(pluto)));
    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.patches.onCompleted();

    liveQuery.take(2).toArray().subscribe((operations) => {
      equalOps(operations, [addRecordToSetOperation(pluto)]);
      done();
    });
  });

  test('filter - change attribute that causes removal from matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );

    liveQuery.take(2).toArray().subscribe(operations => {
      equalOps(operations[1], removeRecordFromSetOperation({ type: 'planet', id: 'pluto' }));
      done();
    });

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(replaceAttributeOperation({ type: 'planet', id: 'pluto' }, 'name', 'Jupiter')));
    cache.patches.onCompleted();
  });

  test('filter - change attribute that causes add to matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Uranus2'))
    );

    liveQuery.subscribe(operation => {
      equalOps(operation, addRecordToSetOperation({ type: 'planet', id: 'uranus', attributes: { name: 'Uranus2' } }));
      done();
    });

    cache.transform(new Transform(addRecordOperation({ type: 'planet', id: 'uranus', attributes: { name: 'Uranus' } })));
    cache.transform(new Transform(replaceAttributeOperation({ type: 'planet', id: 'uranus' }, 'name', 'Uranus2')));
    cache.patches.onCompleted();
  });

  test('filter - ignores remove record that isn\'t included in matches', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(
      oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Jupiter'))
    );

    liveQuery.toArray().subscribe(operations => {
      equal(operations.length, 0);
      done();
    });

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(removeRecordOperation(pluto)));
    cache.patches.onCompleted();
  });

  test('filter - nested', function(assert) {
    const done = assert.async();

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(addRecordOperation(jupiter)));
    cache.patches.onCompleted();

    const liveQuery = cache.liveQuery(
      oqe('filter',
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto')),
        oqe('equal', oqe('get', 'attributes/name'), 'Pluto'))
    );

    liveQuery.toArray().subscribe((operations) => {
      equalOps(operations, [addRecordToSetOperation(pluto)]);
      done();
    });
  });

  test('record - responds to record added/removed', function(assert) {
    const done = assert.async();

    const liveQuery = cache.liveQuery(oqe('record', 'planet', 'pluto'));

    liveQuery.toArray().subscribe(operations => {
      equalOps(operations, [
        addRecordToSetOperation(pluto),
        removeRecordFromSetOperation(pluto)
      ]);

      done();
    });

    cache.transform(new Transform(addRecordOperation(pluto)));
    cache.transform(new Transform(removeRecordOperation(pluto)));
    cache.patches.onCompleted();
  });

  module('relatedRecord', function() {
    test('adds and removes record from liveQuery', function(assert) {
      const done = assert.async();

      cache.reset({ planet: { jupiter }, moon: { callisto } });

      const liveQuery = cache.liveQuery(
        oqe('relatedRecord', 'moon', 'callisto', 'planet')
      );

      liveQuery.toArray().subscribe(operations => {
        equalOps(operations, [
          addRecordToSetOperation(jupiter),
          removeRecordFromSetOperation(jupiter)
        ]);

        done();
      });

      cache.transform(new Transform(replaceHasOneOperation(callisto, 'planet', jupiter)));
      cache.transform(new Transform(replaceHasOneOperation(callisto, 'planet', null)));
      cache.patches.onCompleted();
    });
  });

  module('relatedRecords', function() {
    test('adds and removes records from liveQuery', function(assert) {
      const done = assert.async();

      cache.reset({ planet: { jupiter }, moon: { callisto } });

      const liveQuery = cache.liveQuery(
        oqe('relatedRecords', 'planet', 'jupiter', 'moons')
      );

      liveQuery.toArray().subscribe(operations => {
        equalOps(operations, [
          addRecordToSetOperation(callisto),
          removeRecordFromSetOperation(callisto)
        ]);

        done();
      });

      cache.transform(new Transform(addToHasManyOperation(jupiter, 'moons', callisto)));
      cache.transform(new Transform(removeFromHasManyOperation(jupiter, 'moons', callisto)));
      cache.patches.onCompleted();
    });
  });
});
