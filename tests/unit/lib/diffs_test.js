import diffs from 'orbit/lib/diffs';

module("Unit - diffs", {
});

test("#diffs return `undefined` for matching objects", function() {
  var a, b;

  a = {name: 'Jupiter', classification: 'gas giant'};
  b = {name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b), undefined);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b), undefined);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', links: [{moons: ['a', 'b']}]};
  b = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', links: [{moons: ['a', 'b']}]};

  deepEqual(diffs(a, b), undefined);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant', links: [{moons: ['a', 'b']}]};
  b = {id: {b: '2', a: '1'}, classification: 'gas giant', name: 'Jupiter', links: [{moons: ['a', 'b']}]};

  deepEqual(diffs(a, b), undefined);
});

test("#diffs creates an array of patches when comparing two objects", function() {
  var a, b;

  a = {name: 'Jupiter', classification: 'gas giant'};
  b = {id: 12345, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'add', path: 'planets/1/id', value: 12345}]);

  a = {id: 12345, name: 'Jupiter', classification: 'gas giant'};
  b = {name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'remove', path: 'planets/1/id'}]);

  a = {name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'add', path: 'planets/1/id', value: {a: '1', b: '2'}}]);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '3'}, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'replace', path: 'planets/1/id/b', value: '3'}]);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '3'}, name: 'Saturn', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1', ignore: ['id']}),
            [{op: 'replace', path: 'planets/1/name', value: 'Saturn'}],
            'specified items are ignored in delta');
});
