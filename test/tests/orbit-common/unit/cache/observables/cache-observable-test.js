import { equalOps } from 'tests/test-helper';
import Transform from 'orbit/transform';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import CacheObservable from 'orbit-common/cache/observables/cache-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromArray';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/toArray';

const { skip } = QUnit;

const planetsSchema = new Schema({
  models: {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' },
        colour: { type: 'string' }
      },
      relationships: {
        planet: { type: 'hasOne', model: 'planet' }
      }
    }
  }
});

module('OC - Cache - CacheObservable', function(hooks) {
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

  test('matching value', function(assert) {
    const addPluto = { op: 'addRecord', record: { id: 'pluto', attributes: { name: 'Pluto' } } };
    const addJupiter = { op: 'addRecord', record: { id: 'jupiter' } };
    const patches = Observable.fromArray([addPluto, addJupiter]);

    const cacheObservable = CacheObservable.fromObservable(patches, cache).matching({ op: 'addRecord', record: { id: 'pluto', attributes: { name: 'Pluto' } } });
    cacheObservable.subscribe(op => {
      assert.deepEqual(op, addPluto);
    });
    assert.equal(cacheObservable.cache, cache);
  });

  test('matching values', function(assert) {
    const addPluto = { op: 'addRecord', record: { id: 'pluto', attributes: { name: 'Pluto' } } };
    const patches = Observable.fromArray([addPluto]);

    const cacheObservable = CacheObservable.fromObservable(patches, cache).matching({ op: 'addRecord', record: { id: ['pluto', 'jupiter'] } });
    cacheObservable.subscribe(op => {
      assert.deepEqual(op, addPluto);
    });
    assert.equal(cacheObservable.cache, cache);
  });

  test('forHasMany', function(assert) {
    const jupiter = { id: 'jupiter', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', attributes: { name: 'Ganymede' } };

    const addJupiter = { op: 'addRecord', record: jupiter };
    const addGanymede = { op: 'addRecord', record: ganymede };
    const addGanymedeToJupiter = { op: 'addToHasMany', record: jupiter, relationship: 'moons', relatedRecord: ganymede };

    const patches = Observable.fromArray([addJupiter, addGanymede, addGanymedeToJupiter]);
    const cacheObservable = CacheObservable.fromObservable(patches, cache);

    cacheObservable.forHasMany(jupiter, 'moons').subscribe(operation => {
      assert.equal(operation, addGanymedeToJupiter);
    });
  });

  test('membershipChanges forHasMany', function(assert) {
    const jupiter = { id: 'jupiter', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', attributes: { name: 'Ganymede' } };

    const addJupiter = { op: 'addRecord', record: jupiter };
    const addGanymede = { op: 'addRecord', record: ganymede };
    const addGanymedeToJupiter = { op: 'addToHasMany', record: jupiter, relationship: 'moons', relatedRecord: ganymede };
    const removeGanymedeFromJupiter = { op: 'removeFromHasMany', record: jupiter, relationship: 'moons', relatedRecord: ganymede };

    const patches = Observable.fromArray([addJupiter, addGanymede, addGanymedeToJupiter, removeGanymedeFromJupiter]);
    const cacheObservable = CacheObservable.fromObservable(patches, cache);

    cacheObservable
      .forHasMany(jupiter, 'moons')
      .membershipChanges()
      .take(2)
      .toArray()
      .subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: ganymede },
          { op: 'removeRecord', record: ganymede }
        ]);
      });
  });

  test('current members for hasMany after add', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.patches
      .forHasMany(jupiter, 'moons')
      .currentMembers()
      .subscribe(members => {
        assert.deepEqual(members, [ganymede]);
      });

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .addToHasMany(jupiter, 'moons', ganymede));
  });

  test('current members for hasMany after remove', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .addToHasMany(jupiter, 'moons', ganymede));

    cache.patches
      .forHasMany(jupiter, 'moons')
      .currentMembers()
      .subscribe(members => {
        assert.deepEqual(members, []);
      });

    cache.transform(t => t.removeFromHasMany(jupiter, 'moons', ganymede));
  });

  test('patches for hasMany members', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .addToHasMany(jupiter, 'moons', ganymede));

    cache.patches
      .forHasMany(jupiter, 'moons')
      .currentMembers(true)
      .patches()
      .subscribe(operation => {
        assert.deepEqual(operation, { op: 'replaceAttribute', record: ganymede, attribute: 'colour', value: 'blue' });
      });

    cache.transform(t => t.replaceAttribute(ganymede, 'colour', 'blue'));
  });

  test('forHasOne', function(assert) {
    const jupiter = { id: 'jupiter', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', attributes: { name: 'Ganymede' } };

    const addJupiter = { op: 'addRecord', record: jupiter };
    const addGanymede = { op: 'addRecord', record: ganymede };
    const replaceGanymedesPlanet = { op: 'replaceHasOne', record: ganymede, relationship: 'planet', relatedRecord: jupiter };

    const patches = Observable.fromArray([addJupiter, addGanymede, replaceGanymedesPlanet]);
    const cacheObservable = CacheObservable.fromObservable(patches, cache);

    cacheObservable.forHasOne(ganymede, 'planet').subscribe(operation => {
      assert.equal(operation, replaceGanymedesPlanet);
    });
  });

  test('relationshipChanges forHasOne', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.patches
      .forHasOne(ganymede, 'planet')
      .relationshipChanges()
      .take(2)
      .toArray()
      .subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: jupiter },
          { op: 'removeRecord', record: jupiter }
        ]);
      });

    cache.transform(t => t.addRecord(jupiter)
                          .addRecord(ganymede)
                          .replaceHasOne(ganymede, 'planet', jupiter)
                          .replaceHasOne(ganymede, 'planet', null));
  });

  test('relationshipChanges forHasOne with initial value', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(jupiter)
                          .addRecord(ganymede)
                          .replaceHasOne(ganymede, 'planet', jupiter));

    cache.patches
      .forHasOne(ganymede, 'planet')
      .relationshipChanges()
      .subscribe(operation => {
        assert.deepEqual(operation, { op: 'removeRecord', record: jupiter });
      });

    cache.transform(t => t.replaceHasOne(ganymede, 'planet', null));
  });

  test('current related record for hasOne after add', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.patches
      .forHasOne(ganymede, 'planet')
      .currentRelatedRecord()
      .subscribe(relatedRecord => {
        assert.deepEqual(relatedRecord, jupiter);
      });

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .replaceHasOne(ganymede, 'planet', jupiter));
  });

  test('current related record for hasOne after remove', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .replaceHasOne(ganymede, 'planet', jupiter));

    cache.patches
      .forHasOne(ganymede, 'planet')
      .currentRelatedRecord()
      .subscribe(relatedRecord => {
        assert.deepEqual(relatedRecord, null);
      });

    cache.transform(t => t.replaceHasOne(ganymede, 'planet', null));
  });

  test('patches for hasOne member', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .replaceHasOne(ganymede, 'planet', jupiter)
                          .replaceAttribute(ganymede, 'colour', 'blue'));

    cache.patches
      .forHasOne(ganymede, 'planet')
      .currentRelatedRecord(true)
      .patches()
      .take(2)
      .toArray()
      .subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'replaceAttribute', record: ganymede, attribute: 'colour', value: 'blue' }
        ]);
      });
  });

  QUnit.skip('filter');
});

// const hasMany = patches.forHasMany(type, id, relationship);
// const membershipChanges = hasMany.membershipChanges();
// const currentMembers = hasMany.currentMembers();
// const operationsForMembers = currentMembers.patches();
// return Rx.Observable.concat(membershipChanges, currentMembers.patches());
