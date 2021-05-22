import { InitializedRecord, UninitializedRecord } from '../src/record';
import { RecordTransformBuilder } from '../src/record-transform-builder';
import {
  AddRecordOperation,
  UpdateRecordOperation,
  RemoveRecordOperation,
  ReplaceKeyOperation,
  ReplaceAttributeOperation,
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation
} from '../src/record-operation';

const { module, test } = QUnit;

module('RecordTransformBuilder', function (hooks) {
  let tb: RecordTransformBuilder;

  hooks.beforeEach(function () {
    tb = new RecordTransformBuilder();
  });

  test('#addRecord', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let options = { url: '/test' };

    assert.deepEqual(tb.addRecord(record).toOperation(), {
      op: 'addRecord',
      record
    } as AddRecordOperation);
    assert.deepEqual(tb.addRecord(record).options(options).toOperation(), {
      op: 'addRecord',
      record,
      options
    } as AddRecordOperation);
  });

  test('#updateRecord', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let options = { url: '/test' };

    assert.deepEqual(tb.updateRecord(record).toOperation(), {
      op: 'updateRecord',
      record
    } as UpdateRecordOperation);
    assert.deepEqual(tb.updateRecord(record).options(options).toOperation(), {
      op: 'updateRecord',
      record,
      options
    } as UpdateRecordOperation);
  });

  test('#removeRecord', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let options = { url: '/test' };

    assert.deepEqual(tb.removeRecord(record).toOperation(), {
      op: 'removeRecord',
      record
    } as RemoveRecordOperation);
    assert.deepEqual(tb.removeRecord(record).options(options).toOperation(), {
      op: 'removeRecord',
      record,
      options
    } as RemoveRecordOperation);
  });

  test('#replaceKey', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let options = { url: '/test' };

    assert.deepEqual(tb.replaceKey(record, 'remoteId', '123').toOperation(), {
      op: 'replaceKey',
      record,
      key: 'remoteId',
      value: '123'
    } as ReplaceKeyOperation);
    assert.deepEqual(
      tb.replaceKey(record, 'remoteId', '123').options(options).toOperation(),
      {
        op: 'replaceKey',
        record,
        key: 'remoteId',
        value: '123',
        options
      } as ReplaceKeyOperation
    );
  });

  test('#replaceAttribute', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let options = { url: '/test' };

    assert.deepEqual(
      tb.replaceAttribute(record, 'name', 'Earth').toOperation(),
      {
        op: 'replaceAttribute',
        record,
        attribute: 'name',
        value: 'Earth'
      } as ReplaceAttributeOperation
    );
    assert.deepEqual(
      tb
        .replaceAttribute(record, 'name', 'Earth')
        .options(options)
        .toOperation(),
      {
        op: 'replaceAttribute',
        record,
        attribute: 'name',
        value: 'Earth',
        options
      } as ReplaceAttributeOperation
    );
  });

  test('#addToRelatedRecords', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };
    let options = { url: '/test' };

    assert.deepEqual(
      tb.addToRelatedRecords(record, 'moons', relatedRecord).toOperation(),
      {
        op: 'addToRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecord
      } as AddToRelatedRecordsOperation
    );
    assert.deepEqual(
      tb
        .addToRelatedRecords(record, 'moons', relatedRecord)
        .options(options)
        .toOperation(),
      {
        op: 'addToRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecord,
        options
      } as AddToRelatedRecordsOperation
    );
  });

  test('#removeFromRelatedRecords', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecord = { type: 'moon', id: 'Io' };
    let options = { url: '/test' };

    assert.deepEqual(
      tb.removeFromRelatedRecords(record, 'moons', relatedRecord).toOperation(),
      {
        op: 'removeFromRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecord
      } as RemoveFromRelatedRecordsOperation
    );
    assert.deepEqual(
      tb
        .removeFromRelatedRecords(record, 'moons', relatedRecord)
        .options(options)
        .toOperation(),
      {
        op: 'removeFromRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecord,
        options
      } as RemoveFromRelatedRecordsOperation
    );
  });

  test('#replaceRelatedRecords', function (assert) {
    let record = { type: 'planet', id: 'jupiter' };
    let relatedRecords = [{ type: 'moon', id: 'Io' }];
    let options = { url: '/test' };

    assert.deepEqual(
      tb.replaceRelatedRecords(record, 'moons', relatedRecords).toOperation(),
      {
        op: 'replaceRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecords
      } as ReplaceRelatedRecordsOperation
    );
    assert.deepEqual(
      tb
        .replaceRelatedRecords(record, 'moons', relatedRecords)
        .options(options)
        .toOperation(),
      {
        op: 'replaceRelatedRecords',
        record,
        relationship: 'moons',
        relatedRecords,
        options
      } as ReplaceRelatedRecordsOperation
    );
  });

  test('#replaceRelatedRecord', function (assert) {
    let record = { type: 'moon', id: 'Io' };
    let relatedRecord = { type: 'planet', id: 'Jupiter' };
    let options = { url: '/test' };

    assert.deepEqual(
      tb.replaceRelatedRecord(record, 'planet', relatedRecord).toOperation(),
      {
        op: 'replaceRelatedRecord',
        record,
        relationship: 'planet',
        relatedRecord
      } as ReplaceRelatedRecordOperation
    );
    assert.deepEqual(
      tb
        .replaceRelatedRecord(record, 'planet', relatedRecord)
        .options(options)
        .toOperation(),
      {
        op: 'replaceRelatedRecord',
        record,
        relationship: 'planet',
        relatedRecord,
        options
      } as ReplaceRelatedRecordOperation
    );
  });

  test('#addRecord - when a recordInitializer has been set', function (assert) {
    const recordInitializer = {
      initializeRecord(record: UninitializedRecord): InitializedRecord {
        if (record.id === undefined) {
          record.id = 'abc123';
        }
        return record as InitializedRecord;
      }
    };

    tb = new RecordTransformBuilder({ recordInitializer });

    let record: UninitializedRecord = { type: 'planet' };

    assert.deepEqual(tb.addRecord(record).toOperation(), {
      op: 'addRecord',
      record: { type: 'planet', id: 'abc123' }
    } as AddRecordOperation);
  });
});
