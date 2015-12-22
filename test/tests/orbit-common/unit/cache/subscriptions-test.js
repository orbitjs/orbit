import { planetsSchema, equalOps } from 'tests/test-helper';
import Transform from 'orbit/transform';
import {
  addRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  replaceHasOneOperation,
  addToHasManyOperation,
  removeFromHasManyOperation
} from 'orbit-common/lib/operations';
import Cache from 'orbit-common/cache';
import {
  queryExpression as oqe
} from 'orbit-common/oql/expressions';


module('OC - Cache - subscriptions', function(hooks) {
  let cache;

  hooks.beforeEach(function() {
    cache = new Cache(planetsSchema);
  });

  test('recordsOfType', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const addJupiter = addRecordOperation({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } });
    const addCallisto = addRecordOperation({ type: 'moon', id: 'callisto', attributes: { name: 'Callisto' } });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(addJupiter));
    cache.patches.onCompleted();

    const subscription = cache.subscribe({ oql: oqe('recordsOfType', 'planet') });

    subscription.toArray().subscribe((operations) => {
      equalOps(operations, [addPluto, addJupiter]);
      done();
    });
  });

  test('filter - add new match', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const addJupiter = addRecordOperation({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(addJupiter));
    cache.patches.onCompleted();

    const subscription = cache.subscribe({
      oql:
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto')) });

    subscription.toArray().subscribe((operations) => {
      equalOps(operations, [addPluto]);
      done();
    });
  });

  test('filter - remove match', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const removePluto = removeRecordOperation({ type: 'planet', id: 'pluto' });

    const subscription = cache.subscribe({
      oql:
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto')) });

    subscription.toArray().subscribe(operations => {
      equalOps(operations, [addPluto, removePluto]);
      done();
    });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(removePluto));
    cache.patches.onCompleted();
  });

  test('filter - remove then add match', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const removePluto = removeRecordOperation({ type: 'planet', id: 'pluto' });

    const subscription = cache.subscribe({
      oql:
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto')) });

    cache.transform(new Transform(removePluto));
    cache.transform(new Transform(addPluto));
    cache.patches.onCompleted();

    subscription.take(2).toArray().subscribe((operations) => {
      equalOps(operations, [addPluto]);
      done();
    });
  });

  test('filter - change attribute that causes removal from matches', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const renamePluto = replaceAttributeOperation({ type: 'planet', id: 'pluto' }, 'name', 'Jupiter');

    const subscription = cache.subscribe({
      oql:
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Pluto')) });

    subscription.take(2).toArray().subscribe(operations => {
      equalOps(operations[1], removeRecordOperation({ type: 'planet', id: 'pluto' }));
      done();
    });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(renamePluto));
    cache.patches.onCompleted();
  });

  test('filter - change attribute that causes add to matches', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const renamePluto = replaceAttributeOperation({ type: 'planet', id: 'pluto' }, 'name', 'Jupiter');

    const subscription = cache.subscribe({
      oql:
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Jupiter')) });

    subscription.subscribe(operation => {
      equalOps(operation, addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Jupiter' } }));
      done();
    });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(renamePluto));
    cache.patches.onCompleted();
  });

  test('filter - ignores remove record that isn\'t included in matches', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const removePluto = removeRecordOperation({ type: 'planet', id: 'pluto' });

    const subscription = cache.subscribe({
      oql:
        oqe('filter',
          oqe('recordsOfType', 'planet'),
          oqe('equal', oqe('get', 'attributes/name'), 'Jupiter')) });

    subscription.toArray().subscribe(operations => {
      equal(operations.length, 0);
      done();
    });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(removePluto));
    cache.patches.onCompleted();
  });

  test('record - responds to record added/removed', function(assert) {
    const done = assert.async();
    const addPluto = addRecordOperation({ type: 'planet', id: 'pluto', attributes: { name: 'Pluto' } });
    const removePluto = removeRecordOperation({ type: 'planet', id: 'pluto' });

    const subscription = cache.subscribe({ oql: oqe('record', 'planet', 'pluto') });

    subscription.toArray().subscribe(operations => {
      equalOps(operations, [addPluto, removePluto]);
      done();
    });

    cache.transform(new Transform(addPluto));
    cache.transform(new Transform(removePluto));
    cache.patches.onCompleted();
  });

  test('relatedRecord - responds to replace hasOne', function(assert) {
    const done = assert.async();
    const addJupiter = addRecordOperation({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } });
    const addCallisto = addRecordOperation({ type: 'planet', id: 'callisto', attributes: { name: 'Callisto' } });
    const addJupiterToCallisto = replaceHasOneOperation({ type: 'moon', id: 'callisto' }, 'planet', { type: 'planet', id: 'jupiter' });
    const removeJupiterFromCallisto = replaceHasOneOperation({ type: 'moon', id: 'callisto' }, 'planet', null);

    const query = {
      oql: oqe('relatedRecord', 'moon', 'callisto', 'planet') };

    const eventRecorder = new EventRecorder('recordAdded', 'recordRemoved');
    const subscription = cache.subscribe(query, { listeners: eventRecorder });

    eventRecorder.take(2).then(events => {
      deepEqual(events, [
        { type: 'recordAdded', value: 'jupiter' },
        { type: 'recordRemoved', value: 'jupiter' }
      ]);

      done();
    });

    cache.transform(new Transform(addJupiter));
    cache.transform(new Transform(addCallisto));
    cache.transform(new Transform(addJupiterToCallisto));
    cache.transform(new Transform(removeJupiterFromCallisto));
  });

  test('relatedRecords - responds to add record', function(assert) {
    const done = assert.async();
    const addJupiter = addRecordOperation({ type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } });
    const addCallisto = addRecordOperation({ type: 'planet', id: 'callisto', attributes: { name: 'Callisto' } });
    const addCallistoToJupiter = addToHasManyOperation({ type: 'planet', id: 'jupiter' }, 'moons', { type: 'moon', id: 'callisto' });
    const removeCallistoFromJupiter = removeFromHasManyOperation({ type: 'planet', id: 'jupiter' }, 'moons', { type: 'moon', id: 'callisto' });

    const query = { oql: oqe('relatedRecords', 'planet', 'jupiter', 'moons') };

    const eventRecorder = new EventRecorder('recordAdded', 'recordRemoved');
    const subscription = cache.subscribe(query, { listeners: eventRecorder });

    eventRecorder.take(2).then(events => {
      deepEqual(events, [
        { type: 'recordAdded', value: 'callisto' },
        { type: 'recordRemoved', value: 'callisto' }
      ]);

      done();
    });

    cache.transform(new Transform(addJupiter));
    cache.transform(new Transform(addCallisto));
    cache.transform(new Transform(addCallistoToJupiter));
    cache.transform(new Transform(removeCallistoFromJupiter));
  });
});

