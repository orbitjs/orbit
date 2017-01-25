import '../test-helper';
import {
  addRecord,
  replaceRecord,
  removeRecord,
  replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  replaceHasMany,
  replaceHasOne
} from '../../src/transform/operators';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('Transform Operators', function() {
  test('#addRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      addRecord(record),
      { op: 'addRecord', record }
    );
  });

  test('#replaceRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      replaceRecord(record),
      { op: 'replaceRecord', record }
    );
  });

  test('#removeRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      removeRecord(record),
      { op: 'removeRecord', record }
    );
  });

  test('#replaceKey', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      replaceKey(record, 'remoteId', '123'),
      { op: 'replaceKey', record, key: 'remoteId', value: '123' }
    );
  });

  test('#replaceAttribute', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(
      replaceAttribute(record, 'name', 'Earth'),
      { op: 'replaceAttribute', record, attribute: 'name', value: 'Earth' }
    );
  });

  test('#addToHasMany', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };

    assert.deepEqual(
      addToHasMany(record, 'moons', relatedRecord),
      { op: 'addToHasMany', record, relationship: 'moons', relatedRecord }
    );
  });

  test('#removeFromHasMany', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };

    assert.deepEqual(
      removeFromHasMany(record, 'moons', relatedRecord),
      { op: 'removeFromHasMany', record, relationship: 'moons', relatedRecord }
    );
  });

  test('#replaceHasMany', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecords = [{ type: 'moon', id: 'Io' }];

    assert.deepEqual(
      replaceHasMany(record, 'moons', relatedRecords),
      { op: 'replaceHasMany', record, relationship: 'moons', relatedRecords }
    );
  });

  test('#replaceHasOne', function(assert) {
    let record = { type: 'moon', id: 'Io' };
    let relatedRecord = { type: 'planet', id: 'Jupiter' };

    assert.deepEqual(
      replaceHasOne(record, 'planet', relatedRecord),
      { op: 'replaceHasOne', record, relationship: 'planet', relatedRecord }
    );
  });
});
