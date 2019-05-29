import { Record, TransformBuilder } from '../src/index';
import './test-helper';

const { module, test } = QUnit;

module('TransformBuilder', function(hooks) {
  let tb: TransformBuilder;

  hooks.beforeEach(function() {
    tb = new TransformBuilder();
  });

  test('#addRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(tb.addRecord(record), { op: 'addRecord', record });
  });

  test('#updateRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(tb.updateRecord(record), { op: 'updateRecord', record });
  });

  test('#removeRecord', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(tb.removeRecord(record), { op: 'removeRecord', record });
  });

  test('#replaceKey', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(tb.replaceKey(record, 'remoteId', '123'), {
      op: 'replaceKey',
      record,
      key: 'remoteId',
      value: '123'
    });
  });

  test('#replaceAttribute', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };

    assert.deepEqual(tb.replaceAttribute(record, 'name', 'Earth'), {
      op: 'replaceAttribute',
      record,
      attribute: 'name',
      value: 'Earth'
    });
  });

  test('#addToRelatedRecords', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };

    assert.deepEqual(tb.addToRelatedRecords(record, 'moons', relatedRecord), {
      op: 'addToRelatedRecords',
      record,
      relationship: 'moons',
      relatedRecord
    });
  });

  test('#removeFromRelatedRecords', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };

    assert.deepEqual(
      tb.removeFromRelatedRecords(record, 'moons', relatedRecord),
      {
        op: 'removeFromRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecord
      }
    );
  });

  test('#replaceRelatedRecords', function(assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecords = [{ type: 'moon', id: 'Io' }];

    assert.deepEqual(
      tb.replaceRelatedRecords(record, 'moons', relatedRecords),
      {
        op: 'replaceRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecords
      }
    );
  });

  test('#replaceRelatedRecord', function(assert) {
    let record = { type: 'moon', id: 'Io' };
    let relatedRecord = { type: 'planet', id: 'Jupiter' };

    assert.deepEqual(tb.replaceRelatedRecord(record, 'planet', relatedRecord), {
      op: 'replaceRelatedRecord',
      record,
      relationship: 'planet',
      relatedRecord
    });
  });

  test('#addRecord - when a recordInitializer has been set', function(assert) {
    const recordInitializer = {
      initializeRecord(record: Record) {
        if (record.id === undefined) {
          record.id = 'abc123';
        }
      }
    };

    tb = new TransformBuilder({ recordInitializer });

    let record = { type: 'planet' };

    assert.deepEqual(tb.addRecord(record as Record), {
      op: 'addRecord',
      record: { type: 'planet', id: 'abc123' }
    });
  });
});
