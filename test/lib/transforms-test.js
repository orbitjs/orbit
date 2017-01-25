import Transform from '../../src/transform';
import {
  operationsInTransforms,
  reduceTransforms,
  coalesceTransforms
} from '../../src/lib/transforms';

const { module, test } = QUnit;

module('Lib / Transforms', function() {
  test('operationsInTransforms - returns a single array containing all the operations in an array of transforms', function(assert) {
    assert.deepEqual(
      operationsInTransforms([
        Transform.from([{
          op: 'addRecord',
          record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
        },
        {
          op: 'addRecord',
          record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
        }]),
        Transform.from([{
          op: 'replaceAttribute',
          record: { type: 'contact', id: '1234' },
          attribute: 'name',
          value: 'Joseph'
        }])
      ]),
      [
        {
          op: 'addRecord',
          record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
        },
        {
          op: 'addRecord',
          record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
        },
        {
          op: 'replaceAttribute',
          record: { type: 'contact', id: '1234' },
          attribute: 'name',
          value: 'Joseph'
        }
      ]
    );
  });

  test('reduceTransforms - reduces an array of transforms into a single transform containing a merged set of operations', function(assert) {
    let result = reduceTransforms([
      Transform.from([
        {
          op: 'addRecord',
          record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
        },
        {
          op: 'addRecord',
          record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
        }
      ]),
      Transform.from([{
        op: 'replaceAttribute',
        record: { type: 'contact', id: '1234' },
        attribute: 'name',
        value: 'Joseph'
      }])
    ]);

    assert.ok(result instanceof Transform);
    assert.deepEqual(
      result.operations,
      [
        {
          op: 'addRecord',
          record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
        },
        {
          op: 'addRecord',
          record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
        },
        {
          op: 'replaceAttribute',
          record: { type: 'contact', id: '1234' },
          attribute: 'name',
          value: 'Joseph'
        }
      ],
      'operations are identical to originals'
    );
  });

  test('coalesceTransforms - reduces an array of transforms into a single transform containing a merged set of equivalent coalesced operations', function(assert) {
    let result = coalesceTransforms([
      Transform.from([
        {
          op: 'addRecord',
          record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
        },
        {
          op: 'addRecord',
          record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
        }
      ]),
      Transform.from([{
        op: 'replaceAttribute',
        record: { type: 'contact', id: '1234' },
        attribute: 'name',
        value: 'Joseph'
      }])
    ]);

    assert.ok(result instanceof Transform);
    assert.deepEqual(
      result.operations,
      [
        {
          op: 'addRecord',
          record: { type: 'contact', id: '1234', attributes: { name: 'Joseph' } }
        },
        {
          op: 'addRecord',
          record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
        }
      ],
      'operations have been coalesced'
    );
  });
});
