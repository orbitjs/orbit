import { 
  Schema, 
  Transform,
  addRecord,
  replaceRecord,
  removeRecord,
  replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  replaceHasMany,
  replaceHasOne
} from '@orbit/data';
import { getTransformRequests } from '../../src/lib/transform-requests';
import JSONAPISource from '../../src/jsonapi-source';

const { module, test } = QUnit;

module('TransformRequests', function(hooks) {
  module('getTransformRequests', function(hooks) {
    let schema: Schema;
    let source: JSONAPISource;

    hooks.beforeEach(() => {
      let schema = new Schema({
        models: {
          planet: {
            keys: {
              remoteId: {}
            },
            attributes: {
              name: { type: 'string' },
              classification: { type: 'string' },
              lengthOfDay: { type: 'number' }
            },
            relationships: {
              moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
              solarSystem: { type: 'hasOne', model: 'solarSystem', inverse: 'planets' }
            }
          },
          moon: {
            keys: {
              remoteId: {}
            },
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
            }
          },
          solarSystem: {
            keys: {
              remoteId: {}
            },
            attributes: {
              name: { type: 'string' }
            },
            relationships: {
              planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
            }
          }
        }
      });

      source = new JSONAPISource({ schema });
    });

    hooks.afterEach(() => {
      schema = source = null;
    });

    test('addRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from(addRecord(jupiter));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'addRecord',
        record: jupiter
      }]);
    });

    test('removeRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from(removeRecord(jupiter));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }]);
    });

    test('replaceAttribute => replaceRecord', function(assert) {
      const t = Transform.from(replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Earth'));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'replaceRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth' } }
      }]);
    });

    test('replaceRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from(replaceRecord(jupiter));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'replaceRecord',
        record: jupiter
      }]);
    });

    test('addToHasMany', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from(addToHasMany(jupiter, 'moons', io));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io]
      }]);
    });

    test('removeFromHasMany', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from(removeFromHasMany(jupiter, 'moons', io));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'removeFromHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io]
      }]);
    });

    test('replaceHasOne => replaceRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from(replaceHasOne(io, 'planet', jupiter));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'replaceRecord',
        record: {
          type: 'moon',
          id: 'io',
          relationships: {
            planet: {
              data: 'planet:jupiter'
            }
          }
        }
      }]);
    });

    test('replaceHasOne (with null) => replaceRecord', function(assert) {
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from(replaceHasOne(io, 'planet', null));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'replaceRecord',
        record: {
          type: 'moon',
          id: 'io',
          relationships: {
            planet: {
              data: null
            }
          }
        }
      }]);
    });

    test('replaceHasMany => replaceRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };

      const t = Transform.from(replaceHasMany(jupiter, 'moons', [io, europa]));

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'replaceRecord',
        record: {
          type: 'planet',
          id: 'jupiter',
          relationships: {
            moons: {
              data: {
                'moon:io': true,
                'moon:europa': true
              }
            }
          }
        }
      }]);
    });

    test('addRecord + removeRecord => []', function(assert) {
      const t = Transform.from([
        addRecord({ type: 'planet', id: 'jupiter', attributes: { name: 'Earth' } }),
        removeRecord({ type: 'planet', id: 'jupiter' })
      ]);

      assert.deepEqual(getTransformRequests(source, t), []);
    });

    test('removeRecord + removeRecord => [removeRecord]', function(assert) {
      const t = Transform.from([
        removeRecord({ type: 'planet', id: 'jupiter' }),
        removeRecord({ type: 'planet', id: 'jupiter' })
      ]);

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }]);
    });

    test('addRecord + replaceAttribute => [addRecord]', function(assert) {
      const t = Transform.from([
        addRecord({ type: 'planet', id: 'jupiter', attributes: { name: 'Earth' } }),
        replaceAttribute({ type: 'planet', id: 'jupiter' }, 'atmosphere', 'gaseous')
      ]);

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'addRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth', atmosphere: 'gaseous' } }
      }]);
    });

    test('replaceAttribute + replaceAttribute => [replaceRecord]', function(assert) {
      const t = Transform.from([
        replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Earth'),
        replaceAttribute({ type: 'planet', id: 'jupiter' }, 'atmosphere', 'gaseous')
      ]);

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'replaceRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth', atmosphere: 'gaseous' } }
      }]);
    });

    test('addToHasMany + addToHasMany => [addToHasMany]', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };

      const t = Transform.from([
        addToHasMany(jupiter, 'moons', io),
        addToHasMany(jupiter, 'moons', europa)
      ]);

      assert.deepEqual(getTransformRequests(source, t), [{
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io, europa]
      }]);
    });
  });
});
