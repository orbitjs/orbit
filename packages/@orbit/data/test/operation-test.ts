import { coalesceRecordOperations } from '../src/index';
import './test-helper';

const { module, test } = QUnit;

module('Operation', function() {
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
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joseph' }
            }
          },
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '5678',
              attributes: { name: 'James' }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceRelatedRecords for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceRelatedRecords',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecords: [{ type: 'phoneNumber', id: 'abc' }]
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                phoneNumbers: {
                  data: [{ type: 'phoneNumber', id: 'abc' }]
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceRelatedRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: { type: 'address', id: 'abc' }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce replaceAttribute + replaceRelatedRecord with null', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: null
          }, {
            op: 'replaceAttribute',
            record: { type: 'contact', id: '1234' },
            attribute: 'name',
            value: 'James'
          },
        ]),
        [
          {
            op: 'updateRecord',
            record: {
              type: 'contact', id: '1234',
              attributes: {
                name: 'James'
              },
              relationships: {
                address: {
                  data: null
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + addToRelatedRecords for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'addToRelatedRecords',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                phoneNumbers: {
                  data: [{ type: 'phoneNumber', id: 'abc' }]
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceRelatedRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'contact', id: '1234', attributes: { name: 'Joe' } }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: { type: 'address', id: 'abc' }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce addRecord + replaceRelatedRecord for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: { type: 'address', id: 'def' }
                }
              }
            }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          }
        ]),
        [
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: { type: 'address', id: 'abc' }
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce replaceRelatedRecord + replaceRelatedRecord for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def' }
          }
        ]),
        [
          {
            op: 'replaceRelatedRecord',
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
        []
      );
    });

    test('can coalesce addRecord + replaceRelatedRecord + removeRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: { type: 'address', id: 'def' }
                }
              }
            }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'abc' }
          },
          {
            op: 'removeRecord',
            record: { type: 'contact', id: '1234' }
          }
        ]),
        []
      );
    });

    test('can coalesce addRecord + replaceRelatedRecord + removeRecord for the same record in non-contiguous ops', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: {
              type: 'contact',
              id: '1234',
              attributes: { name: 'Joe' },
              relationships: {
                address: {
                  data: { type: 'address', id: 'def' }
                }
              }
            }
          },
          {
            op: 'addRecord',
            record: { type: 'contact', id: '5678', attributes: { name: 'Jim' } }
          },
          {
            op: 'replaceRelatedRecord',
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

    test('can coalesce addRecord + addToRelatedRecords + removeRecord for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addRecord',
            record: { type: 'phoneNumber', id: 'abc' }
          },
          {
            op: 'addToRelatedRecords',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          },
          {
            op: 'removeRecord',
            record: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        []
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

    test("coalesces operations, but doesn't allow reordering of ops that affect relationships", function(assert) {
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
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def789' }
          },
          {
            op: 'replaceRelatedRecord',
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
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' }
            }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'contact', id: '1234' },
            relationship: 'address',
            relatedRecord: { type: 'address', id: 'def789' }
          },
          {
            op: 'replaceRelatedRecord',
            record: { type: 'address', id: 'def789' },
            relationship: 'contact',
            relatedRecord: { type: 'contact', id: '1234' }
          }
        ]
      );
    });

    test('can coalesce addToRelatedRecords + removeFromRelatedRecords for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addToRelatedRecords',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          },
          {
            op: 'removeFromRelatedRecords',
            record: { type: 'contact', id: '1234' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        []
      );
    });

    test('can coalesce addRecord + addToRelatedRecords for the same record', function(assert) {
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
                  data: [{ type: 'phoneNumber', id: 'abc' }]
                }
              }
            }
          },
          {
            op: 'addToRelatedRecords',
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
                  data: [
                    { type: 'phoneNumber', id: 'abc' },
                    { type: 'phoneNumber', id: 'def' }
                  ]
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce updateRecord + addToRelatedRecords for the same record', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'updateRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: [{ type: 'phoneNumber', id: 'abc' }]
                }
              }
            }
          },
          {
            op: 'addToRelatedRecords',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'def' }
          }
        ]),
        [
          {
            op: 'updateRecord',
            record: {
              type: 'address',
              id: 'def789',
              attributes: { street: 'abc' },
              relationships: {
                phoneNumbers: {
                  data: [
                    { type: 'phoneNumber', id: 'abc' },
                    { type: 'phoneNumber', id: 'def' }
                  ]
                }
              }
            }
          }
        ]
      );
    });

    test('can coalesce removeFromRelatedRecords + addToRelatedRecords for the same record + relationship', function(assert) {
      assert.deepEqual(
        coalesceRecordOperations([
          {
            op: 'addToRelatedRecords',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          },
          {
            op: 'removeFromRelatedRecords',
            record: { type: 'address', id: 'def789' },
            relationship: 'phoneNumbers',
            relatedRecord: { type: 'phoneNumber', id: 'abc' }
          }
        ]),
        []
      );
    });

    test('can coalesce addRecord + removeFromRelatedRecords for the same record', function(assert) {
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
                  data: [{ type: 'phoneNumber', id: 'abc' }]
                }
              }
            }
          },
          {
            op: 'removeFromRelatedRecords',
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
                  data: []
                }
              }
            }
          }
        ]
      );
    });
  });
});
