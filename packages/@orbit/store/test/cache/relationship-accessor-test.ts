import {
  Schema,
  SchemaSettings,
  cloneRecordIdentity
} from '@orbit/data';
import RelationshipAccessor from '../../src/cache/relationship-accessor';
import Cache from '../../src/cache';
import '../test-helper';

const { module, test } = QUnit;

module('RelationshipAccessor', function(hooks) {
  let schema: Schema;
  let cache: Cache;
  let accessor: RelationshipAccessor;

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
    accessor = null;
  });

  test('#addRecord can create has-one relationships', function(assert) {
    const europa = {
      type: 'moon', id: 'm2',
      attributes: { name: 'Europa' },
      relationships: {
        planet: { data: { type: 'planet', id: 'p1'} }
      }
    };

    accessor = new RelationshipAccessor(cache);

    assert.ok(!accessor.relationshipExists(europa, 'planet', { type: 'planet', id: 'p1' }), 'relationship does not exist');

    accessor.addRecord(europa);

    assert.ok(accessor.relationshipExists(europa, 'planet', { type: 'planet', id: 'p1' }), 'relationship exists');
    assert.deepEqual(accessor.relatedRecord(europa, 'planet'), { type: 'planet', id: 'p1' }, 'relatedRecord returns record identity');
  });

  test('#addRecord can create has-many relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      attributes: { name: 'Europa' },
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]}
      }
    };

    accessor = new RelationshipAccessor(cache);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');

    accessor.addRecord(jupiter);

    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship exists');
    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship exists');
    assert.deepEqual(
      accessor.relatedRecords(jupiter, 'moons'),
      [{ type: 'moon', id: 'io' }, { type: 'moon', id: 'europa' }],
      'relatedRecords returns record identities');
  });

  test('#replaceRecord can overwrite has-many relationships', function(assert) {
    let jupiter = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]}
      }
    };

    accessor = new RelationshipAccessor(cache);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');

    accessor.addRecord(jupiter);

    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship exists');

    let jupiter2 = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'europa'},
        ]}
      }
    };

    accessor.replaceRecord(jupiter2);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');
    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship exists');
    assert.deepEqual(
      accessor.relatedRecords(jupiter, 'moons'),
      [{ type: 'moon', id: 'europa' }],
      'relatedRecords returns record identities');
  });

  test('#clearRecord clears all relationships for a record', function(assert) {
    let jupiter = {
      type: 'planet', id: 'jupiter',
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]}
      }
    };

    accessor = new RelationshipAccessor(cache);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');

    accessor.addRecord(jupiter);

    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship exists');

    accessor.clearRecord(jupiter);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');
  });

  test('#addToRelatedRecords adds members to has-many relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      attributes: { name: 'Europa' },
      relationships: {
        moons: { data: [
        ]}
      }
    };

    accessor = new RelationshipAccessor(cache);

    accessor.addRecord(jupiter);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');

    accessor.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'io' });
    accessor.addToRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'europa' });

    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship exists');
    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship exists');
    assert.deepEqual(
      accessor.relatedRecords(jupiter, 'moons'),
      [{ type: 'moon', id: 'io' }, { type: 'moon', id: 'europa' }],
      'relatedRecords returns record identities');
  });

  test('#removeFromRelatedRecords removes members from has-many relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      attributes: { name: 'Europa' },
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'io'},
          { type: 'moon', id: 'europa'},
        ]}
      }
    };

    accessor = new RelationshipAccessor(cache);

    accessor.addRecord(jupiter);

    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship exists');
    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship exists');

    accessor.removeFromRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'io' });
    accessor.removeFromRelatedRecords(jupiter, 'moons', { type: 'moon', id: 'europa' });

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');
    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship does not exist');
    assert.deepEqual(
      accessor.relatedRecords(jupiter, 'moons'),
      [],
      'relatedRecords returns record identities');
  });


  test('#replaceRelatedRecord can create has-one relationships', function(assert) {
    const europa = {
      type: 'moon', id: 'm2',
      attributes: { name: 'Europa' },
      relationships: {
        planet: { data: { type: 'planet', id: 'p1'} }
      }
    };

    accessor = new RelationshipAccessor(cache);

    accessor.addRecord(europa);

    assert.ok(accessor.relationshipExists(europa, 'planet', { type: 'planet', id: 'p1' }), 'relationship exists');

    accessor.replaceRelatedRecord(europa, 'planet', { type: 'planet', id: 'p2' });

    assert.deepEqual(accessor.relatedRecord(europa, 'planet'), { type: 'planet', id: 'p2' }, 'relatedRecord returns record identity');
  });

  test('#replaceRelatedRecords removes members from has-many relationships', function(assert) {
    const jupiter = {
      type: 'planet', id: 'jupiter',
      attributes: { name: 'Europa' },
      relationships: {
        moons: { data: [
          { type: 'moon', id: 'europa'}
        ]}
      }
    };

    accessor = new RelationshipAccessor(cache);

    accessor.addRecord(jupiter);

    assert.ok(!accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship does not exist');
    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship exists');

    accessor.replaceRelatedRecords(jupiter, 'moons', [{ type: 'moon', id: 'io' }, { type: 'moon', id: 'europa' }]);

    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'io' }), 'relationship exists');
    assert.ok(accessor.relationshipExists(jupiter, 'moons', { type: 'moon', id: 'europa' }), 'relationship exists');
    assert.deepEqual(
      accessor.relatedRecords(jupiter, 'moons'),
      [{ type: 'moon', id: 'europa' }, { type: 'moon', id: 'io' }],
      'relatedRecords returns record identities');
  });
});
