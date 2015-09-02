import { op, equalOps } from 'tests/test-helper';
import { coalesceOperations, normalizeOperation, normalizeOperations } from 'orbit/lib/operations';
import Operation from 'orbit/operation';

module("Orbit - Lib - Operations", {
});

function shouldCoalesceOperations(original, expected) {
  var actual = coalesceOperations(original);

  for(var i = 0; i < expected.length; i++) {
    equalOps(actual[i], expected[i], 'operation ' + i + ' matched');
  }
}

test("normalizeOperation - can create an Operation from an object", function() {
  var raw = {op: 'add', path: 'planet', value: {}};
  var normalized = normalizeOperation(raw);
  ok(normalized instanceof Operation, "operation has been normalized");
  equal(normalized.op, raw.op, "op matches");
  equal(normalized.path, raw.path, "path matches");
  equal(normalized.value, raw.value, "value matches");
});

test("normalizeOperation - can create an Operation from an object", function() {
  var raw = [{op: 'add', path: 'planet', value: {}},
             new Operation({op: 'add', path: 'moon', value: {}})];
  var normalized = normalizeOperations(raw);
  ok(normalized[0] instanceof Operation, "operation has been normalized");
  ok(normalized[1] instanceof Operation, "operation is still normalized");
  notStrictEqual(normalized[0], raw[0], "operation has changed");
  equal(normalized[0].op, raw[0].op, "op matches");
  equal(normalized[0].path, raw[0].path, "path matches");
  equal(normalized[0].value, raw[0].value, "value matches");
  strictEqual(normalized[1], raw[1], "operation hasn't changed");
});

test("coalesceOperations - can coalesce attribute operations", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234', 'name'], null),
      op('add', ['contact', '1234', 'name'], "Jim")
    ],
    [
      op('add', ['contact', '1234', 'name'], "Jim")
    ]
    );
});

test("coalesceOperations - can coalesce attributes into records", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234'], { id: '1234' }),
      op('add', ['contact', '1234', 'name'], "Jim")
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', name: "Jim" })
    ]
    );
});

test("coalesceOperations - can coalesce hasMany links into records", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234'], { id: '1234' }),
      op('add', ['contact', '1234', '__rel', 'phoneNumbers', 'abc123'], true)
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { phoneNumbers: { 'abc123': true } } })
    ]
    );
});

test("coalesceOperations - can coalesce hasOne links into records", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234'], { id: '1234' }),
      op('add', ['contact', '1234', '__rel', 'address'], "abc123")
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: "abc123" } } )
    ]
    );
});

test("coalesceOperations - can coalesce record into attributes operation", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234', 'name'], "Jim"),
      op('add', ['contact', '1234'], { id: '1234' })
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', name: "Jim" })
    ]
    );
});

test("coalesceOperations - can coalesce record into hasMany operation", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234', '__rel', 'phoneNumbers', 'abc123'], true),
      op('add', ['contact', '1234'], { id: '1234' })
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { phoneNumbers: { 'abc123': true } } })
    ]
    );
});

test("coalesceOperations - can coalesce record into hasOne operation", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234', '__rel', 'address'], "abc123"),
      op('add', ['contact', '1234'], { id: '1234' })
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: "abc123" } } )
    ]
    );
});

test("coalesceOperations - record values take precedence over existing hasOne operations", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234', '__rel', 'address'], "abc123"),
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: 'def789' } })
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: "def789" } } )
    ]
    );
});

test("coalesceOperations - record values take precedence over existing hasOne operations", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234'], {
        id: '1234',
        title: "Big Boss",
        __rel: {
          address: 'abc123',
          phoneNumbers: { id123: true }
        }
      }),
      op('add', ['contact', '1234'], {
        id: '1234',
        __rel: {
          address: 'def789'
        }
      })
    ],
    [
      op('add', ['contact', '1234'], {
        id: '1234',
        title: "Big Boss",
        __rel: { address: "def789",
          phoneNumbers: { id123: true }
        }
      })
    ]
  );
});

test("coalesceOperations - can coalesce remove operation with add operation", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234', 'name'], "Jim"),
      op('remove', ['contact', '1234', 'name'])
    ],
    [
      op('remove', ['contact', '1234', 'name'])
    ]
  );
});

test("coalesceOperations - can coalesce add operation with remove operation", function() {
  shouldCoalesceOperations(
    [
      op('remove', ['contact', '1234', 'name']),
      op('add', ['contact', '1234', 'name'], "Jim")
    ],
    [
      op('add', ['contact', '1234', 'name'], "Jim")
    ]
  );
});

test("coalesceOperations - can coalesce remove operation with other remove operation", function() {
  shouldCoalesceOperations(
    [
      op('remove', ['contact', '1234', 'name']),
      op('remove', ['contact', '1234', 'name'])
    ],
    [
      op('remove', ['contact', '1234', 'name'])
    ]
  );
});

test("coalesceOperations - can coalesce remove operation into record operation", function() {
  shouldCoalesceOperations(
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: 'def789' } }),
      op('remove', ['contact', '1234', '__rel', 'address'])
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: undefined } })
    ]
  );
});

test("coalesceOperations - record link takes precedence over remove operation", function() {
  shouldCoalesceOperations(
    [
      op('remove', ['contact', '1234', '__rel', 'address']),
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: 'def789' } }),
    ],
    [
      op('add', ['contact', '1234'], { id: '1234', __rel: { address: 'def789' } })
    ]
  );
});

test("coalesceOperations - coalesces operations, but doesn't allow reordering of ops that affect relationships", function() {
  shouldCoalesceOperations(
    [
      op('add', ['address', 'def789'], { id: 'def789' }),
      op('replace', ['address', 'def789', 'street'], 'a'),
      op('add', ['contact', '1234', '__rel', 'address', 'def789'], true),
      op('add', ['address', 'def789', '__rel', 'contact'], '1234'),
      op('replace', ['address', 'def789', 'street'], 'ab'),
      op('replace', ['address', 'def789', 'street'], 'abc'),
      op('replace', ['address', 'def789', 'street'], 'abcd')
    ],
    [
      op('add', ['address', 'def789'], { id: 'def789', street: 'abcd' }),
      op('add', ['contact', '1234', '__rel', 'address', 'def789'], true),
      op('add', ['address', 'def789', '__rel', 'contact'], '1234')
    ]
  );
});
