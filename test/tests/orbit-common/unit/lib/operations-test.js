import { coalesceOperations } from 'orbit-common/lib/operations';

const { skip } = QUnit;

function shouldCoalesceOperations(original, expected) {
  let actual = coalesceOperations(original);

  for (var i = 0; i < expected.length; i++) {
    deepEqual(actual[i], expected[i], 'operation ' + i + ' matched');
  }
}

module('OC - Lib - Operations', function() {
  module('`coalesceOperations`', function() {
    // test('can coalesce attribute operations', function() {
    //   shouldCoalesceOperations(
    //     [
    //       {
    //         op: 'replaceAttribute',
    //         record: { type: 'contact', id: '1234' },
    //         attribute: 'name',
    //         value: null
    //       },
    //       {
    //         op: 'replaceAttribute',
    //         record: { type: 'contact', id: '1234' },
    //         attribute: 'name',
    //         value: 'Jim'
    //       }
    //     ],
    //     [
    //       {
    //         op: 'replaceAttribute',
    //         record: { type: 'contact', id: '1234' },
    //         attribute: 'name',
    //         value: 'Jim'
    //       }
    //     ]
    //   );
    // });
    //
    // test('can coalesce attributes into records', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234' }),
    //       toOperation('add', ['contact', '1234', 'name'], 'Jim')
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', name: 'Jim' })
    //     ]
    //     );
    // });
    //
    // test('can coalesce hasMany links into records', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234' }),
    //       toOperation('add', ['contact', '1234', 'relationships', 'phoneNumbers', 'abc123'], true)
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { phoneNumbers: { 'abc123': true } } })
    //     ]
    //     );
    // });
    //
    // test('can coalesce hasOne links into records', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234' }),
    //       toOperation('add', ['contact', '1234', 'relationships', 'address'], 'abc123')
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'abc123' } })
    //     ]
    //     );
    // });
    //
    // test('can coalesce record into attributes operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234', 'name'], 'Jim'),
    //       toOperation('add', ['contact', '1234'], { id: '1234' })
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', name: 'Jim' })
    //     ]
    //     );
    // });
    //
    // test('can coalesce record into hasMany operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234', 'relationships', 'phoneNumbers', 'abc123'], true),
    //       toOperation('add', ['contact', '1234'], { id: '1234' })
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { phoneNumbers: { 'abc123': true } } })
    //     ]
    //     );
    // });
    //
    // test('can coalesce record into hasOne operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234', 'relationships', 'address'], 'abc123'),
    //       toOperation('add', ['contact', '1234'], { id: '1234' })
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'abc123' } })
    //     ]
    //     );
    // });
    //
    // test('record values take precedence over existing hasOne operations', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234', 'relationships', 'address'], 'abc123'),
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } })
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } })
    //     ]
    //     );
    // });
    //
    // test('record values take precedence over existing hasOne operations', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234'], {
    //         id: '1234',
    //         title: 'Big Boss',
    //         relationships: {
    //           address: 'abc123',
    //           phoneNumbers: { id123: true }
    //         }
    //       }),
    //       toOperation('add', ['contact', '1234'], {
    //         id: '1234',
    //         relationships: {
    //           address: 'def789'
    //         }
    //       })
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], {
    //         id: '1234',
    //         title: 'Big Boss',
    //         relationships: { address: 'def789',
    //           phoneNumbers: { id123: true }
    //         }
    //       })
    //     ]
    //   );
    // });
    //
    // test('can coalesce remove operation with add operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234', 'name'], 'Jim'),
    //       toOperation('remove', ['contact', '1234', 'name'])
    //     ],
    //     [
    //       toOperation('remove', ['contact', '1234', 'name'])
    //     ]
    //   );
    // });
    //
    // test('can coalesce add operation with remove operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('remove', ['contact', '1234', 'name']),
    //       toOperation('add', ['contact', '1234', 'name'], 'Jim')
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234', 'name'], 'Jim')
    //     ]
    //   );
    // });
    //
    // test('can coalesce remove operation with other remove operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('remove', ['contact', '1234', 'name']),
    //       toOperation('remove', ['contact', '1234', 'name'])
    //     ],
    //     [
    //       toOperation('remove', ['contact', '1234', 'name'])
    //     ]
    //   );
    // });
    //
    // test('can coalesce remove operation into record operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } }),
    //       toOperation('remove', ['contact', '1234', 'relationships', 'address'])
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: undefined } })
    //     ]
    //   );
    // });
    //
    // test('record link takes precedence over remove operation', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('remove', ['contact', '1234', 'relationships', 'address']),
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } })
    //     ],
    //     [
    //       toOperation('add', ['contact', '1234'], { id: '1234', relationships: { address: 'def789' } })
    //     ]
    //   );
    // });
    //
    // test('coalesces operations, but doesn\'t allow reordering of ops that affect relationships', function() {
    //   shouldCoalesceOperations(
    //     [
    //       toOperation('add', ['address', 'def789'], { id: 'def789' }),
    //       toOperation('replace', ['address', 'def789', 'street'], 'a'),
    //       toOperation('add', ['contact', '1234', 'relationships', 'address', 'def789'], true),
    //       toOperation('add', ['address', 'def789', 'relationships', 'contact'], '1234'),
    //       toOperation('replace', ['address', 'def789', 'street'], 'ab'),
    //       toOperation('replace', ['address', 'def789', 'street'], 'abc'),
    //       toOperation('replace', ['address', 'def789', 'street'], 'abcd')
    //     ],
    //     [
    //       toOperation('add', ['address', 'def789'], { id: 'def789', street: 'abcd' }),
    //       toOperation('add', ['contact', '1234', 'relationships', 'address', 'def789'], true),
    //       toOperation('add', ['address', 'def789', 'relationships', 'contact'], '1234')
    //     ]
    //   );
    // });
  });
});
