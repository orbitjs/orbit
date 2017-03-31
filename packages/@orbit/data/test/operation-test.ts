import {
  addRecord,
  replaceRecord,
  removeRecord,
  replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  replaceHasMany,
  replaceHasOne,
  coalesceRecordOperations
} from '../src/operation';
import './test-helper';

const { module, test } = QUnit;

module('Operation', function() {
  module('Operation helpers', function() {
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

  module('`coalesceRecordOperations`', function() {
    test('can coalesce replaceAttribute + replaceAttribute for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: null
          },
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: 'Jim'
          }
        ]),
        [
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: 'Jim'
          }
        ]
      );
    });

    test('will not coalesce replaceAttribute + replaceAttribute for different records', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: null
          },
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '5678' },
            attribute: 'name',
            value: 'Jim'
          }
        ]),
        [
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: null
          },
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '5678' },
            attribute: 'name',
            value: 'Jim'
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceAttribute for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: 'Jim'
          }
        ]),
        [
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Jim' } }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceAttribute for a couple records', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
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
          },
          {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '5678' },
            attribute: 'name',
            value: 'James'
          }
        ]),
        [
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joseph' } }
          },
          {
            op: 'addRecord',
            record: { type: 'contact', id: '5678', attributes: { name: 'James' } }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceHasMany for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceHasMany',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecords: [{ type: 'phoneNumber', id: 'abc' }]
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact', id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                phoneNumbers: {
                  data: { 'phoneNumber:abc': true }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceHasOne for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact', id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: 'address:abc'
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + addToHasMany for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'addToHasMany',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact', id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                phoneNumbers: {
                  data: { 'phoneNumber:abc': true }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceHasOne for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact', id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: 'address:abc'
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceHasOne for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: 'address:def'
                }
              }
            }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact', id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: 'address:abc'
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce replaceHasOne + replaceHasOne for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def' }
          }
        ]),
        [
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def' }
          }
        ]
      );
    });

    test('can coalesce addRecord + removeRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          }
        ]),
        [
        ]
      );
    });

    test('can coalesce addRecord + replaceHasOne + removeRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: 'address:def'
                }
              }
            }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          },
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          }
        ]),
        [
        ]
      );
    });

    test('can coalesce addRecord + replaceHasOne + removeRecord for the same record in non-contiguous ops', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: 'address:def'
                }
              }
            }
          },
          {
            op: 'addRecord',
            record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          },
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
          }
        ]
      );
    });

    test('can coalesce removeRecord + removeRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          },
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          }
        ]),
        [
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          }
        ]
      );
    });

    test('coalesces operations, but doesn\'t allow reordering of ops that affect relationships', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'address', id: 'def789' }
          },
          {
            op: 'replaceAttribute',
            record: { type: 'address', id: 'def789' },
            attribute: 'street',
            value: 'a'
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def789' }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'address', id: 'def789' },
            relationship: 'contact',
            relatedRecord: { type: 'contact', id: '1234' }
          },
          {
            op: 'replaceAttribute',
            record: { type: 'address', id: 'def789' },
            attribute: 'street',
            value: 'ab'
          },
          {
            op: 'replaceAttribute',
            record: { type: 'address', id: 'def789' },
            attribute: 'street',
            value: 'abc'
          }
        ]),
        [
          {
            op: 'addRecord',
            record: { type: 'address', id: 'def789', attributes: { street: 'abc' } }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def789' }
          },
          {
            op: 'replaceHasOne',
            record: { type: 'address', id: 'def789' },
            relationship: 'contact',
            relatedRecord: { type: 'contact', id: '1234' }
          }
        ]
      );
    });

    test('can coalesce addToHasMany + removeFromHasMany for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addToHasMany',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          },
          {
            op: 'removeFromHasMany',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        [
        ]
      );
    });

    test('can coalesce addRecord + addToHasMany for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: { 'phoneNumber:abc': true }
                }
              }
            }
          },
          {
            op: 'addToHasMany',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'def' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: {
                    'phoneNumber:abc': true,
                    'phoneNumber:def': true
                  }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce replaceRecord + addToHasMany for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'replaceRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: { 'phoneNumber:abc': true }
                }
              }
            }
          },
          {
            op: 'addToHasMany',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'def' }
          }
        ]),
        [
          {
            op: 'replaceRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: {
                    'phoneNumber:abc': true,
                    'phoneNumber:def': true
                  }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce removeFromHasMany + addToHasMany for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addToHasMany',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          },
          {
            op: 'removeFromHasMany',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        [
        ]
      );
    });

    test('can coalesce addRecord + removeFromHasMany for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: { 'phoneNumber:abc': true }
                }
              }
            }
          },
          {
            op: 'removeFromHasMany',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: {
                  }
                }
              }
            }
          }
        ]
      );
    });
  });
});
