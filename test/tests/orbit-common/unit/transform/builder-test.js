import 'tests/test-helper';
import Builder from 'orbit-common/transform/builder';

///////////////////////////////////////////////////////////////////////////////

let builder;

module('OC - Transform - Builder', {
  setup() {
    builder = new Builder();
  },

  teardown() {
    builder = null;
  }
});

test('#addRecord', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };

  let transform = builder.build((b) => {
    b.addRecord(record);
  });

  assert.deepEqual(transform.operations, [
    { op: 'addRecord', record }
  ]);
});

test('#replaceRecord', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };

  let transform = builder.build((b) => {
    b.replaceRecord(record);
  });

  assert.deepEqual(transform.operations, [
    { op: 'replaceRecord', record }
  ]);
});

test('#removeRecord', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };

  let transform = builder.build((b) => {
    b.removeRecord(record);
  });

  assert.deepEqual(transform.operations, [
    { op: 'removeRecord', record }
  ]);
});

test('#replaceKey', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };

  let transform = builder.build((b) => {
    b.replaceKey(record, 'remoteId', '123');
  });

  assert.deepEqual(transform.operations, [
    { op: 'replaceKey', record, key: 'remoteId', value: '123' }
  ]);
});

test('#replaceAttribute', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };

  let transform = builder.build((b) => {
    b.replaceAttribute(record, 'name', 'Earth');
  });

  assert.deepEqual(transform.operations, [
    { op: 'replaceAttribute', record, attribute: 'name', value: 'Earth' }
  ]);
});

test('#addToHasMany', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };
  let relatedRecord = { type: 'moon', id: 'Io' };

  let transform = builder.build((b) => {
    b.addToHasMany(record, 'moons', relatedRecord);
  });

  assert.deepEqual(transform.operations, [
    { op: 'addToHasMany', record, relationship: 'moons', relatedRecord }
  ]);
});

test('#removeFromHasMany', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };
  let relatedRecord = { type: 'moon', id: 'Io' };

  let transform = builder.build((b) => {
    b.removeFromHasMany(record, 'moons', relatedRecord);
  });

  assert.deepEqual(transform.operations, [
    { op: 'removeFromHasMany', record, relationship: 'moons', relatedRecord }
  ]);
});

test('#replaceHasMany', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };
  let relatedRecords = [{ type: 'moon', id: 'Io' }];

  let transform = builder.build((b) => {
    b.replaceHasMany(record, 'moons', relatedRecords);
  });

  assert.deepEqual(transform.operations, [
    { op: 'replaceHasMany', record, relationship: 'moons', relatedRecords }
  ]);
});

test('#replaceHasOne', function(assert) {
  let record = { type: 'moon', id: 'Io' };
  let relatedRecord = { type: 'planet', id: 'Jupiter' };

  let transform = builder.build((b) => {
    b.replaceHasOne(record, 'planet', relatedRecord);
  });

  assert.deepEqual(transform.operations, [
    { op: 'replaceHasOne', record, relationship: 'planet', relatedRecord }
  ]);
});

test('can add multiple operations', function(assert) {
  let record = { type: 'planet', id: 'jupiter' };

  let io = { type: 'moon', id: 'Io' };

  let europa = { type: 'moon', id: 'Europa' };

  let transform = builder.build((b) => {
    b.addToHasMany(record, 'moons', io);
    b.addToHasMany(record, 'moons', europa);
  });

  assert.deepEqual(transform.operations, [
    { op: 'addToHasMany', record, relationship: 'moons', relatedRecord: io },
    { op: 'addToHasMany', record, relationship: 'moons', relatedRecord: europa }
  ]);
});
