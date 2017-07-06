import {
  Schema,
  SchemaSettings,
  cloneRecordIdentity
} from '@orbit/data';
import RelationshipAccessor from '../../src/cache/relationship-accessor';
import InverseRelationshipAccessor from '../../src/cache/inverse-relationship-accessor';
import Cache from '../../src/cache';
import '../test-helper';

const { module, test } = QUnit;

module('InverseRelationshipAccessor', function(hooks) {
  let schema: Schema;
  let cache: Cache;

  const schemaDefinition: SchemaSettings = {
    models: {
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
          inhabitants: { type: 'hasMany', model: 'inhabitant', inverse: 'planets' },
          next: { type: 'hasOne', model: 'planet', inverse: 'previous' },
          previous: { type: 'hasOne', model: 'planet', inverse: 'next' }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
        }
      },
      inhabitant: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planets: { type: 'hasMany', model: 'planet', inverse: 'inhabitants' }
        }
      }
    }
  };

  hooks.beforeEach(function() {
    schema = new Schema(schemaDefinition);
    cache = new Cache({ schema, processors: [] });
  });

  hooks.afterEach(function() {
    schema = null;
    cache = null;
  });

  test('can be instantiated with just a cache', function(assert) {
    let accessor =  new InverseRelationshipAccessor(cache);
    assert.ok(accessor, 'accessor created');
  });

  test('can be instantiated with a cache and a base accessor', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter' };

    let base =  new InverseRelationshipAccessor(cache);

    const io = { type: 'moon', id: 'io' };
    base.relatedRecordAdded(jupiter, 'moons', io);

    assert.deepEqual(
      base.all(io),
      [{ record: jupiter, relationship: 'moons' }],
      'inverse relationship exists');

    let accessor =  new InverseRelationshipAccessor(cache, base);
    assert.ok(accessor, 'accessor created');
    assert.deepEqual(
      base.all(io),
      [{ record: jupiter, relationship: 'moons' }],
      'inverse relationship exists on new accessor');

    const europa = { type: 'moon', id: 'europa' };
    base.relatedRecordAdded(jupiter, 'moons', europa);

    assert.deepEqual(
      base.all(europa),
      [{ record: jupiter, relationship: 'moons' }],
      'inverse relationship exists');
    assert.deepEqual(
      accessor.all(europa),
      [],
      'inverse relationship does not exist on new accessor');
  });

  test('#recordAdded - can add has-one relationships', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter' };
    const europa = {
      type: 'moon', id: 'europa',
      attributes: { name: 'Europa' },
      relationships: {
        planet: { data: { type: 'planet', id: 'jupiter'} }
      }
    };

    let accessor =  new InverseRelationshipAccessor(cache);
    accessor.recordAdded(europa);

    assert.deepEqual(
      accessor.all(jupiter),
      [{ record: { type: 'moon', id: 'europa' }, relationship: 'planet' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [],
      'no inverse relationships exist');
  });

  test('#recordAdded - can add has-many relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]}
      }
    };

    let accessor =  new InverseRelationshipAccessor(cache);
    accessor.recordAdded(jupiter);

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'planet', id: 'jupiter' }),
      [],
      'no inverse relationships exist');
  });

  test('#recordRemoved - can remove has-one and has-many relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]},
        next: {
          data: { type: 'planet', id: 'saturn' }
        }
      }
    };

    let relationshipAccessor = new RelationshipAccessor(cache);
    let accessor =  new InverseRelationshipAccessor(cache);

    // InverseRelationshipAccessor relies on the record and its relationships
    // being registered in the cache.
    cache.patch(t => t.addRecord(jupiter));
    relationshipAccessor.addRecord(jupiter);

    accessor.recordAdded(jupiter);

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'planet', id: 'saturn' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'next' }],
      'inverse relationship exists');

    accessor.recordRemoved(jupiter);

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [],
      'no inverse relationships exist');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [],
      'no inverse relationships exist');

    assert.deepEqual(
      accessor.all({ type: 'planet', id: 'saturn' }),
      [],
      'no inverse relationships exist');
  });

  test('#relatedRecordAdded - add inverse relationship', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };

    let accessor = new InverseRelationshipAccessor(cache);
    accessor.relatedRecordAdded(jupiter, 'moons', io);
    assert.deepEqual(
      accessor.all(io),
      [{ record: jupiter, relationship: 'moons' }],
      'inverse relationship exists');
  });

  test('#relatedRecordsAdded - add inverse relationships', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };

    let accessor = new InverseRelationshipAccessor(cache);
    accessor.relatedRecordsAdded(jupiter, 'moons', [io, europa]);
    assert.deepEqual(
      accessor.all(io),
      [{ record: jupiter, relationship: 'moons' }],
      'inverse relationship exists');
    assert.deepEqual(
      accessor.all(europa),
      [{ record: jupiter, relationship: 'moons' }],
      'inverse relationship exists');
  });

  test('#relatedRecordRemoved - removes inverse relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]},
        next: {
          data: { type: 'planet', id: 'saturn' }
        }
      }
    };

    let relationshipAccessor = new RelationshipAccessor(cache);
    let accessor =  new InverseRelationshipAccessor(cache);

    // InverseRelationshipAccessor relies on the record and its relationships
    // being registered in the cache.
    cache.patch(t => t.addRecord(jupiter));
    relationshipAccessor.addRecord(jupiter);

    accessor.recordAdded(jupiter);

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'planet', id: 'saturn' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'next' }],
      'inverse relationship exists');

    accessor.relatedRecordRemoved(jupiter, 'moons', { type: 'moon', id: 'europa' });

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [],
      'no inverse relationships exist');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship still exists');
  });

  test('#relatedRecordsRemoved - removes inverse relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]},
        next: {
          data: { type: 'planet', id: 'saturn' }
        }
      }
    };

    let relationshipAccessor = new RelationshipAccessor(cache);
    let accessor =  new InverseRelationshipAccessor(cache);

    // InverseRelationshipAccessor relies on the record and its relationships
    // being registered in the cache.
    cache.patch(t => t.addRecord(jupiter));
    relationshipAccessor.addRecord(jupiter);

    accessor.recordAdded(jupiter);

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'moons' }],
      'inverse relationship exists');

    assert.deepEqual(
      accessor.all({ type: 'planet', id: 'saturn' }),
      [{ record: { type: 'planet', id: 'jupiter' }, relationship: 'next' }],
      'inverse relationship exists');

    accessor.relatedRecordsRemoved(jupiter, 'moons',
      [{ type: 'moon', id: 'europa' },
       { type: 'moon', id: 'io' }]);

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'europa' }),
      [],
      'no inverse relationships exist');

    assert.deepEqual(
      accessor.all({ type: 'moon', id: 'io' }),
      [],
      'no inverse relationships exist');
  });
});
