import TransformBuilder from '../src/transform-builder';
import './test-helper';

const { module, test } = QUnit;

module('TransformBuilder', function(hooks) {
  let tb;

  hooks.beforeEach(function() {
    tb = new TransformBuilder();
  });

  test('#addRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      tb.addRecord(record),
      { op: 'addRecord', record }
    );
  });

  test('#replaceRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      tb.replaceRecord(record),
      { op: 'replaceRecord', record }
    );
  });

  test('#removeRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      tb.removeRecord(record),
      { op: 'removeRecord', record }
    );
  });

  test('#replaceKey', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      tb.replaceKey(record, 'remoteId', '123'),
      { op: 'replaceKey', record, key: 'remoteId', value: '123' }
    );
  });

  test('#replaceAttribute', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      tb.replaceAttribute(record, 'name', 'Earth'),
      { op: 'replaceAttribute', record, attribute: 'name', value: 'Earth' }
    );
  });

  test('#addToHasMany', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };

    assert.deepEqual(
      tb.addToHasMany(record, 'moons', relatedRecord),
      { op: 'addToHasMany', record, relationship: 'moons', relatedRecord }
    );
  });

  test('#removeFromHasMany', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };

    assert.deepEqual(
      tb.removeFromHasMany(record, 'moons', relatedRecord),
      { op: 'removeFromHasMany', record, relationship: 'moons', relatedRecord }
    );
  });

  test('#replaceHasMany', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecords = [{ type: 'moon', id: 'Io' }];

    assert.deepEqual(
      tb.replaceHasMany(record, 'moons', relatedRecords),
      { op: 'replaceHasMany', record, relationship: 'moons', relatedRecords }
    );
  });

  test('#replaceHasOne', function(assert) {
    let record = { type: 'moon', id: 'Io' };
    let relatedRecord = { type: 'planet', id: 'Jupiter' };

    assert.deepEqual(
      tb.replaceHasOne(record, 'planet', relatedRecord),
      { op: 'replaceHasOne', record, relationship: 'planet', relatedRecord }
    );
  });
});
