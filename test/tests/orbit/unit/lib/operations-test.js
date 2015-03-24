import { op, equalOps } from 'tests/test-helper';
import { coalesceOperations } from 'orbit/lib/operations';

module("Orbit - Lib - Operations - coalesce", {

});

function shouldCoalesceOperations(original, expected){
  var actual = coalesceOperations(original);

  for(var i = 0; i < expected.length; i++){
    equalOps(actual[i], expected[i], 'operation ' + i + ' matched');
  }
}

test("can coalesce attribute operations", function(){
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

test("can coalesce attributes into records", function(){
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

test("can coalesce hasMany links into records", function(){
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

test("can coalesce hasOne links into records", function(){
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

test("can coalesce record into attributes operation", function(){
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

test("can coalesce record into hasMany operation", function(){
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

test("can coalesce record into hasOne operation", function(){
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

test("record values take precedence over existing hasOne operations", function(){
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

test("record values take precedence over existing hasOne operations", function(){
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

test("can coalesce remove operation with add operation", function(){
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

test("can coalesce add operation with remove operation", function(){
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

test("can coalesce remove operation with other remove operation", function(){
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

test("can coalesce remove operation into record operation", function(){
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

test("record link takes precedence over remove operation", function(){
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
