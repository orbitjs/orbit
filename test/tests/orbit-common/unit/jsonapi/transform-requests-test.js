import Transform from 'orbit/transform';
import { TransformRequestProcessors, getTransformRequests } from 'orbit-common/jsonapi/transform-requests';

module('OC - JSONAPI - TransformRequests', function() {
  module('getTransformRequests', function() {
    test('addRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from({
        op: 'addRecord',
        record: jupiter
      });

      assert.deepEqual(getTransformRequests(t), [{
        op: 'addRecord',
        record: jupiter
      }]);
    });

    test('removeRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from({
        op: 'removeRecord',
        record: jupiter
      });

      assert.deepEqual(getTransformRequests(t), [{
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }]);
    });

    test('replaceAttribute => replaceRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from({
        op: 'replaceAttribute',
        record: { type: 'planet', id: 'jupiter' },
        attribute: 'name',
        value: 'Earth'
      });

      assert.deepEqual(getTransformRequests(t), [{
        op: 'replaceRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth' } }
      }]);
    });

    test('replaceRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from({
        op: 'replaceRecord',
        record: jupiter
      });

      assert.deepEqual(getTransformRequests(t), [{
        op: 'replaceRecord',
        record: jupiter
      }]);
    });

    test('addToHasMany', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from({
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecord: io
      });

      assert.deepEqual(getTransformRequests(t), [{
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io]
      }]);
    });

    test('removeFromHasMany', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from({
        op: 'removeFromHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecord: io
      });

      assert.deepEqual(getTransformRequests(t), [{
        op: 'removeFromHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io]
      }]);
    });

    test('replaceHasOne => replaceRecord', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };

      const t = Transform.from({
        op: 'replaceHasOne',
        record: io,
        relationship: 'planet',
        relatedRecord: jupiter
      });

      assert.deepEqual(getTransformRequests(t), [{
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

      const t = Transform.from({
        op: 'replaceHasOne',
        record: io,
        relationship: 'planet',
        relatedRecord: null
      });

      assert.deepEqual(getTransformRequests(t), [{
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

      const t = Transform.from({
        op: 'replaceHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io, europa]
      });

      assert.deepEqual(getTransformRequests(t), [{
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
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from([{
        op: 'addRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth' } }
      }, {
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }]);

      assert.deepEqual(getTransformRequests(t), []);
    });

    test('removeRecord + removeRecord => [removeRecord]', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from([{
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }, {
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }]);

      assert.deepEqual(getTransformRequests(t), [{
        op: 'removeRecord',
        record: { type: 'planet', id: 'jupiter' }
      }]);
    });

    test('addRecord + replaceAttribute => [addRecord]', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from([{
        op: 'addRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth' } }
      }, {
        op: 'replaceAttribute',
        record: { type: 'planet', id: 'jupiter' },
        attribute: 'atmosphere',
        value: 'gaseous'
      }]);

      assert.deepEqual(getTransformRequests(t), [{
        op: 'addRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth', atmosphere: 'gaseous' } }
      }]);
    });

    test('replaceAttribute + replaceAttribute => [replaceRecord]', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter', attributes: { name: 'Jupiter' } };

      const t = Transform.from([{
        op: 'replaceAttribute',
        record: { type: 'planet', id: 'jupiter' },
        attribute: 'name',
        value: 'Earth'
      }, {
        op: 'replaceAttribute',
        record: { type: 'planet', id: 'jupiter' },
        attribute: 'atmosphere',
        value: 'gaseous'
      }]);

      assert.deepEqual(getTransformRequests(t), [{
        op: 'replaceRecord',
        record: { type: 'planet', id: 'jupiter', attributes: { name: 'Earth', atmosphere: 'gaseous' } }
      }]);
    });

    test('addToHasMany + addToHasMany => [addToHasMany]', function(assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };

      const t = Transform.from([{
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecord: io
      }, {
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecord: europa
      }]);

      assert.deepEqual(getTransformRequests(t), [{
        op: 'addToHasMany',
        record: jupiter,
        relationship: 'moons',
        relatedRecords: [io, europa]
      }]);
    });
  });
});
