import Operation from 'orbit/operation';
import { toOperation } from 'orbit/lib/operations';
import {
  operationType,
  coalesceOperations,
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from 'orbit-common/lib/operations';
import { equalOps } from 'tests/test-helper';

module("OC - Lib - Operations", function() {});

function shouldCoalesceOperations(original, expected) {
  var actual = coalesceOperations(original);

  for(var i = 0; i < expected.length; i++) {
    equalOps(actual[i], expected[i], 'operation ' + i + ' matched');
  }
}

function identifiesOperationType(operation, type) {
  equal(operationType(operation), type, "`operationType` identifies operation type " + type);
}

test("`operationType` identifies operation type addRecord", function() {
  identifiesOperationType(toOperation('add', 'planet/planet1', {type: 'planet', id: 'planet1', attributes: { name: 'Jupiter' }}), 'addRecord');
});

test("`operationType` identifies operation type replaceRecord", function() {
  identifiesOperationType(toOperation('replace', 'planet/planet1', {type: 'planet', id: 'planet1', attributes: { name: 'Jupiter' }}), 'replaceRecord');
});

test("`operationType` identifies operation type removeRecord", function() {
  identifiesOperationType(toOperation('remove', 'planet/planet1'), 'removeRecord');
});

test("`operationType` identifies operation type addToRelationship for to-many relationship", function() {
  identifiesOperationType(toOperation('add', 'planet/planet1/relationships/moons/data/moon:moon1', true), 'addToRelationship');
});

test("`operationType` identifies operation type replaceRelationship for to-many relationship", function() {
  identifiesOperationType(toOperation('replace', 'planet/planet1/relationships/moons/data', {'moon:moon1': true, 'moon:moon2': true}), 'replaceRelationship');
});

test("`operationType` identifies operation type replaceRelationship for to-one relationship", function() {
  identifiesOperationType(toOperation('replace', 'moons/moon1/relationships/planet/data', 'planet:planet1'), 'replaceRelationship');
});

test("`operationType` identifies operation type removeFromRelationship for to-many relationship", function() {
  identifiesOperationType(toOperation('remove', 'planet/planet1/relationships/moons/data/moon:moon1'), 'removeFromRelationship');
});

test("`operationType` identifies operation type replaceAttribute", function() {
  identifiesOperationType(toOperation('replace', 'planet/planet1/attributes/name', 'Jupiter'), 'replaceAttribute');
});

test("`addRecordOperation` encodes addRecord", function() {
  var record = {
    id: 'planet1',
    type: 'planet',
    attributes: { name: 'Jupiter' },
    relationships: { moons: { data: { 'moon:moon1': true } } }
  };

  equalOps(
    addRecordOperation(record),
    toOperation('add', 'planet/planet1', record)
  );
});

test("`replaceRecordOperation` encodes replaceRecord", function() {
  var record = {id: 'planet1', type: 'planet', attributes: { name: 'Jupiter' }};

  equalOps(
    replaceRecordOperation(record),
    toOperation('replace', 'planet/planet1', record)
  );
});

test("`removeRecordOperation` encodes removeRecord", function() {
  equalOps(
    removeRecordOperation({type: 'planet', id: 'planet1'}),
    toOperation('remove', 'planet/planet1')
  );
});

test("`replaceRecordOperation` encodes replaceRecord", function() {
  var record = {id: 'planet1', type: 'planet', attributes: { name: 'Jupiter' }};

  equalOps(
    replaceRecordOperation(record),
    toOperation('replace', 'planet/planet1', record)
  );
});

test("`replaceAttributeOperation` encodes replaceAttribute", function() {
  equalOps(
    replaceAttributeOperation({type: 'planet', id: 'planet1'}, 'name', 'Jupiter'),
    toOperation('replace', 'planet/planet1/attributes/name', 'Jupiter')
  );
});

test("`addToRelationshipOperation` encodes addToRelationship", function() {
  equalOps(
    addToRelationshipOperation({type: 'planet', id: 'planet1'}, 'moons', {type: 'moon', id: 'moon1'}),
    toOperation('add', 'planet/planet1/relationships/moons/data/moon:moon1', true)
  );
});

test("`removeFromRelationshipOperation` encodes removeFromRelationship", function() {
  equalOps(
    removeFromRelationshipOperation({type: 'planet', id: 'planet1'}, 'moons', {type: 'moon', id: 'moon1'}),
    toOperation('remove', 'planet/planet1/relationships/moons/data/moon:moon1')
  );
});

test("`replaceRelationshipOperation` encodes replaceRelationship for to-many relationships", function() {
  equalOps(
    replaceRelationshipOperation({type: 'planet', id: 'planet1'}, 'moons', [{type: 'moon', id: 'moon1'}, {type: 'moon', id: 'moon2'}]),
    toOperation('replace', 'planet/planet1/relationships/moons/data', {'moon:moon1': true, 'moon:moon2': true})
  );
});

test("`replaceRelationshipOperation` encodes replaceRelationship for to-one relationships", function() {
  equalOps(
    replaceRelationshipOperation({type: 'moon', id: 'moon1'}, 'planet', {type: 'planet', id: 'planet1'}),
    toOperation('replace', 'moon/moon1/relationships/planet/data', 'planet:planet1')
  );
});

test("coalesceOperations - can coalesce attribute operations", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234', 'name'], null),
      toOperation('add', ['contact', '1234', 'name'], "Jim")
    ],
    [
      toOperation('add', ['contact', '1234', 'name'], "Jim")
    ]
    );
});

test("coalesceOperations - can coalesce attributes into records", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234'], { id: '1234' }),
      toOperation('add', ['contact', '1234', 'name'], "Jim")
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', name: "Jim" })
    ]
    );
});

test("coalesceOperations - can coalesce hasMany links into records", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234'], { id: '1234' }),
      toOperation('add', ['contact', '1234', 'relationships', 'phoneNumbers', 'abc123'], true)
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { phoneNumbers: { 'abc123': true } } })
    ]
    );
});

test("coalesceOperations - can coalesce hasOne links into records", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234'], { id: '1234' }),
      toOperation('add', ['contact', '1234', 'relationships', 'address'], "abc123")
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: "abc123" } } )
    ]
    );
});

test("coalesceOperations - can coalesce record into attributes operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234', 'name'], "Jim"),
      toOperation('add', ['contact', '1234'], { id: '1234' })
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', name: "Jim" })
    ]
    );
});

test("coalesceOperations - can coalesce record into hasMany operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234', 'relationships', 'phoneNumbers', 'abc123'], true),
      toOperation('add', ['contact', '1234'], { id: '1234' })
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { phoneNumbers: { 'abc123': true } } })
    ]
    );
});

test("coalesceOperations - can coalesce record into hasOne operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234', 'relationships', 'address'], "abc123"),
      toOperation('add', ['contact', '1234'], { id: '1234' })
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: "abc123" } } )
    ]
    );
});

test("coalesceOperations - record values take precedence over existing hasOne operations", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234', 'relationships', 'address'], "abc123"),
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } })
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: "def789" } } )
    ]
    );
});

test("coalesceOperations - record values take precedence over existing hasOne operations", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234'], {
        id: '1234',
        title: "Big Boss",
        relationships: {
          address: 'abc123',
          phoneNumbers: { id123: true }
        }
      }),
      toOperation('add', ['contact', '1234'], {
        id: '1234',
        relationships: {
          address: 'def789'
        }
      })
    ],
    [
      toOperation('add', ['contact', '1234'], {
        id: '1234',
        title: "Big Boss",
        relationships: { address: "def789",
          phoneNumbers: { id123: true }
        }
      })
    ]
  );
});

test("coalesceOperations - can coalesce remove operation with add operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234', 'name'], "Jim"),
      toOperation('remove', ['contact', '1234', 'name'])
    ],
    [
      toOperation('remove', ['contact', '1234', 'name'])
    ]
  );
});

test("coalesceOperations - can coalesce add operation with remove operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('remove', ['contact', '1234', 'name']),
      toOperation('add', ['contact', '1234', 'name'], "Jim")
    ],
    [
      toOperation('add', ['contact', '1234', 'name'], "Jim")
    ]
  );
});

test("coalesceOperations - can coalesce remove operation with other remove operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('remove', ['contact', '1234', 'name']),
      toOperation('remove', ['contact', '1234', 'name'])
    ],
    [
      toOperation('remove', ['contact', '1234', 'name'])
    ]
  );
});

test("coalesceOperations - can coalesce remove operation into record operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } }),
      toOperation('remove', ['contact', '1234', 'relationships', 'address'])
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: undefined } })
    ]
  );
});

test("coalesceOperations - record link takes precedence over remove operation", function() {
  shouldCoalesceOperations(
    [
      toOperation('remove', ['contact', '1234', 'relationships', 'address']),
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } }),
    ],
    [
      toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } })
    ]
  );
});

test("coalesceOperations - coalesces operations, but doesn't allow reordering of ops that affect relationships", function() {
  shouldCoalesceOperations(
    [
      toOperation('add', ['address', 'def789'], { id: 'def789' }),
      toOperation('replace', ['address', 'def789', 'street'], 'a'),
      toOperation('add', ['contact', '1234', 'relationships', 'address', 'def789'], true),
      toOperation('add', ['address', 'def789', 'relationships', 'contact'], '1234'),
      toOperation('replace', ['address', 'def789', 'street'], 'ab'),
      toOperation('replace', ['address', 'def789', 'street'], 'abc'),
      toOperation('replace', ['address', 'def789', 'street'], 'abcd')
    ],
    [
      toOperation('add', ['address', 'def789'], { id: 'def789', street: 'abcd' }),
      toOperation('add', ['contact', '1234', 'relationships', 'address', 'def789'], true),
      toOperation('add', ['address', 'def789', 'relationships', 'contact'], '1234')
    ]
  );
});
