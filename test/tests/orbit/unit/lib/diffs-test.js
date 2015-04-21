import { diffs } from 'orbit/lib/diffs';

module("Orbit - Lib - diffs", {
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

test("#diffs generates `add` patches when comparing two objects (as per rfc 6902)", function() {
  var a, b;

  // RFC 6902 - Appendix A.1.  Adding an Object Member
  a = {foo: 'bar'};
  b = {foo: 'bar', 'baz': 'qux'};

  deepEqual(diffs(a, b),
            [{op: 'add', path: '/baz', value: 'qux'}]);

  // RFC 6902 - Appendix A.2.  Adding an Array Element
  a = {foo: ['bar', 'baz']};
  b = {foo: ['bar', 'qux', 'baz']};

  deepEqual(diffs(a, b),
            [{op: 'add', path: '/foo/1', value: 'qux'}]);

  // Adding multiple array elements
  a = {foo: ['BAR', 'BAZ']};
  b = {foo: ['BAR', 'qux', 'dux', 'BAZ']};

  deepEqual(diffs(a, b),
            [{op: 'add', path: '/foo/1', value: 'qux'},
             {op: 'add', path: '/foo/2', value: 'dux'}]);

  // Adding multiple array elements
  a = {foo: ['BAR', 'BAZ']};
  b = {foo: ['BAR', 'qux', 'dux', 'BAZ', 'flux']};

  deepEqual(diffs(a, b),
            [{op: 'add', path: '/foo/1', value: 'qux'},
             {op: 'add', path: '/foo/2', value: 'dux'},
             {op: 'add', path: '/foo/4', value: 'flux'}]);

  // Misc tests
  a = {name: 'Jupiter', classification: 'gas giant'};
  b = {id: 12345, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'add', path: 'planets/1/id', value: 12345}]);

  a = {name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'add', path: 'planets/1/id', value: {a: '1', b: '2'}}]);

});

test("#diffs generates `remove` patches when comparing two objects (as per rfc 6902)", function() {
  var a, b;

  // RFC 6902 - Appendix A.4. Removing an Array Element
  a = {foo: ['bar', 'qux', 'baz']};
  b = {foo: ['bar', 'baz']};

  deepEqual(diffs(a, b),
            [{op: 'remove', path: '/foo/1'}]);

  // Misc tests
  a = {id: 12345, name: 'Jupiter', classification: 'gas giant'};
  b = {name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'remove', path: 'planets/1/id'}]);
});

test("#diffs generates `replace` patches when comparing two objects (as per rfc 6902)", function() {
  var a, b;

  // RFC 6902 - Appendix A.5. Replacing a Value
  a = {foo: 'bar', baz: 'qux'};
  b = {foo: 'bar', baz: 'boo'};

  deepEqual(diffs(a, b),
            [{op: 'replace', path: '/baz', 'value': 'boo'}]);

  // Misc tests
  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '3'}, name: 'Jupiter', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'replace', path: 'planets/1/id/b', value: '3'}]);

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '3'}, name: 'Earth', classification: 'terrestrial'};

  deepEqual(diffs(a, b, {basePath: 'planets/1'}),
            [{op: 'replace', path: 'planets/1/id/b', value: '3'},
             {op: 'replace', path: 'planets/1/name', value: 'Earth'},
             {op: 'replace', path: 'planets/1/classification', value: 'terrestrial'}]);
});

test("#diffs ignores specified items with `ignore` option", function() {
  var a, b;

  a = {id: {a: '1', b: '2'}, name: 'Jupiter', classification: 'gas giant'};
  b = {id: {a: '1', b: '3'}, name: 'Saturn', classification: 'gas giant'};

  deepEqual(diffs(a, b, {basePath: 'planets/1', ignore: ['id']}),
            [{op: 'replace', path: 'planets/1/name', value: 'Saturn'}],
            'specified items are ignored in delta');
});

test("#diffs generates `replace` patch when comparing two dates", function() {
  var a = new Date(1428555600000),
      b = new Date(1428555601000);

  deepEqual(diffs(a,b, {basePath: 'planets/1/birthDate'}),
            [{op: 'replace', path: 'planets/1/birthDate', value: b}],
            'dates are replaced');
});

test("#diffs generates undefined patch when comparing two equal dates", function() {
  var a = new Date(1428555600000),
      b = new Date(1428555600000);

  deepEqual(diffs(a,b, {basePath: 'planets/1/birthDate'}),
            undefined,
            'dates are the same');
});

test("#diffs generates `replace` patch when string is replaced by a date", function() {
  var a = "string",
      b = new Date(1428555600000);

  deepEqual(diffs(a,b, {basePath: 'planets/1/birthDate'}),
            [{op: 'replace', path: 'planets/1/birthDate', value: b}],
            'string was replaced by date');
});

test("#diffs generates `replace` patch when date is replaced by a string", function() {
  var a = new Date(1428555600000),
      b = "string";

  deepEqual(diffs(a,b, {basePath: 'planets/1/birthDate'}),
            [{op: 'replace', path: 'planets/1/birthDate', value: b}],
            'date was replaced by string');
});
