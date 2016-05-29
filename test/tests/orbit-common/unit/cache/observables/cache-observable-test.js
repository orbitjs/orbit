import { equalOps } from 'tests/test-helper';
import Transform from 'orbit/transform';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import CacheObservable from 'orbit-common/cache/observables/cache-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
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
    const patches = Observable.from([addPluto, addJupiter]);

    const cacheObservable = CacheObservable.fromObservable(patches, cache).matching({ op: 'addRecord', record: { id: 'pluto', attributes: { name: 'Pluto' } } });
    cacheObservable.subscribe(op => {
      assert.deepEqual(op, addPluto);
    });
    assert.equal(cacheObservable.cache, cache);
  });

  test('matching values', function(assert) {
    const addPluto = { op: 'addRecord', record: { id: 'pluto', attributes: { name: 'Pluto' } } };
    const patches = Observable.from([addPluto]);

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

    const patches = Observable.from([addJupiter, addGanymede, addGanymedeToJupiter]);
    const cacheObservable = CacheObservable.fromObservable(patches, cache);

    cacheObservable.forHasMany(jupiter, 'moons').subscribe(operation => {
      assert.equal(operation, addGanymedeToJupiter);
    });
  });

  test('relationshipChanges forHasMany', function(assert) {
    const jupiter = { id: 'jupiter', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', attributes: { name: 'Ganymede' } };

    const addJupiter = { op: 'addRecord', record: jupiter };
    const addGanymede = { op: 'addRecord', record: ganymede };
    const addGanymedeToJupiter = { op: 'addToHasMany', record: jupiter, relationship: 'moons', relatedRecord: ganymede };
    const removeGanymedeFromJupiter = { op: 'removeFromHasMany', record: jupiter, relationship: 'moons', relatedRecord: ganymede };

    const patches = Observable.from([addJupiter, addGanymede, addGanymedeToJupiter, removeGanymedeFromJupiter]);
    const cacheObservable = CacheObservable.fromObservable(patches, cache);

    cacheObservable
      .forHasMany(jupiter, 'moons')
      .relationshipChanges()
      .take(2)
      .toArray()
      .subscribe(operations => {
        assert.deepEqual(operations, [
          { op: 'addRecord', record: ganymede },
          { op: 'removeRecord', record: ganymede }
        ]);
      });
  });

  test('relatedRecords for hasMany after add', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.patches
      .forHasMany(jupiter, 'moons')
      .relatedRecords()
      .subscribe(relatedRecords => {
        assert.deepEqual(relatedRecords, [ganymede]);
      });

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .addToHasMany(jupiter, 'moons', ganymede));
  });

  test('relatedRecords for hasMany after remove', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .addToHasMany(jupiter, 'moons', ganymede));

    cache.patches
      .forHasMany(jupiter, 'moons')
      .relatedRecords()
      .subscribe(relatedRecords => {
        assert.deepEqual(relatedRecords, []);
      });

    cache.transform(t => t.removeFromHasMany(jupiter, 'moons', ganymede));
  });

  test('patches for hasMany relatedRecords', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .addToHasMany(jupiter, 'moons', ganymede));

    cache.patches
      .forHasMany(jupiter, 'moons')
      .relatedRecords({ initial: true })
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

    const patches = Observable.from([addJupiter, addGanymede, replaceGanymedesPlanet]);
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

  test('related record for hasOne after add', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.patches
      .forHasOne(ganymede, 'planet')
      .relatedRecord()
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
      .relatedRecord()
      .subscribe(relatedRecord => {
        assert.deepEqual(relatedRecord, null);
      });

    cache.transform(t => t.replaceHasOne(ganymede, 'planet', null));
  });

  test('patches for hasOne relatedRecord', function(assert) {
    const jupiter = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const ganymede = { id: 'ganymede', type: 'moon', attributes: { name: 'Ganymede' } };

    cache.transform(t => t.addRecord(ganymede)
                          .addRecord(jupiter)
                          .replaceHasOne(ganymede, 'planet', jupiter));

    cache.patches
      .forHasOne(ganymede, 'planet')
      .relatedRecord({ initial: true })
      .patches()
      .subscribe(operation => {
        assert.deepEqual(operation, {
          op: 'replaceAttribute',
          record: jupiter,
          attribute: 'colour',
          value: 'blue'
        });
      });

    cache.transform(t => t.replaceAttribute(jupiter, 'colour', 'blue'));
  });

  QUnit.skip('filter');
});
