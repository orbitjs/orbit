import diff from 'orbit/lib/diff';

module("Unit - diff", {
});

test("#diff creates a delta object when comparing two objects", function() {
  var a, b;

  a = {name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};
  b = {id: 12345, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};

  deepEqual(diff(a, b), {id: 12345});

  a = {id: 12345, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};
  b = {name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};

  strictEqual(diff(a, b), undefined, 'no positive delta to get from a -> b');

  a = {name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};
  b = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};

  deepEqual(diff(a, b), {id: {a: '1', b: '2'}});

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};
  b = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};

  deepEqual(diff(a, b), undefined);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};
  b = {id: {a: '1', b: '3'}, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};

  deepEqual(diff(a, b), {id: {a: '1', b: '3'}});

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', __id: '1380308346603-1'};
  b = {id: {a: '1', b: '3'}, name: 'Saturn', classification: 'gas giant', __id: '1380308346603-1'};

  deepEqual(diff(a, b, ['id']), {name: 'Saturn'}, 'specified items are ignored in delta');
});
