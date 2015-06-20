import Document from 'orbit/document';

var doc;

var applyTransforms = function(doc, operations) {
  for (var i = 0; i < operations.length; i++) {
    doc.transform(operations[i]);
  }
};

///////////////////////////////////////////////////////////////////////////////

module("Orbit - Document", {
  setup: function() {
    doc = new Document();
  },

  teardown: function() {
    doc = null;
  }
});

test("it exists", function() {
  ok(doc);
});

/*
  `reset`
 */

test("#reset - will clear the document by default", function() {
  doc.reset();
  deepEqual(doc.retrieve(), {});
});

test("#reset - will reset the full document to the value specified", function() {
  var data = {a: 'b', c: ['d', 'e']};
  doc.reset(data);
  deepEqual(doc.retrieve(), data);
});

/*
  `retrieve`
 */

test("#retrieve - will retrieve the full document by default", function() {
  deepEqual(doc.retrieve(), {});

  doc.reset({a: 'b', c: ['d', 'e']});
  deepEqual(doc.retrieve(), {a: 'b', c: ['d', 'e']});
});

test("#retrieve - can retrieve a value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  deepEqual(doc.retrieve('/a'), 'b');
});

test("#retrieve - can retrieve an array value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  deepEqual(doc.retrieve('/c'), ['d', 'e']);
});

test("#retrieve - can retrieve a value at the end of an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  deepEqual(doc.retrieve('/c/-'), 'f');
});

test("#retrieve - can retrieve a value at a specific position in an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  deepEqual(doc.retrieve('/c/1'), 'e');
});

test("#retrieve - can retrieve a value with an array in the path", function() {
  doc.reset({a: 'b', c: ['d', {e: 'f'}]});
  deepEqual(doc.retrieve('/c/1/e'), 'f');
});

test("#retrieve - throws an exception for a path that doesn't exist", function() {
  doc.reset({a: 'b'});
  throws(
    function() {
      doc.retrieve('/b');
    },
    Document.PathNotFoundException
  );
});

test("#retrieve - returns `undefined` for a path that doesn't exist when `quiet=true`", function() {
  doc.reset({a: 'b'});
  strictEqual(doc.retrieve('/b', true), undefined);
});

/*
  `test`
 */

test("#test - can verify the full document", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  equal(doc.test('/', {a: 'b', c: ['d', 'e']}), true);
});

test("#test - can verify a value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  equal(doc.test('/a', 'b'), true);
});

test("#test - can verify an array value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  equal(doc.test('/c', ['d', 'e']), true);
});

test("#test - can verify a value at the end of an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  equal(doc.test('/c/-', 'f'), true);
});

test("#test - can verify a value at a specific position in an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  equal(doc.test('/c/1', 'e'), true);
});

test("#test - can verify a value with an array in the path", function() {
  doc.reset({a: 'b', c: ['d', {e: 'f'}]});
  equal(doc.test('/c/1/e', 'f'), true);
});

test("#test - returns false for a mismatch", function() {
  doc.reset({a: 'b'});
  equal(doc.test('/a', 'c'), false);
});

test("#test - throws an exception for a path that doesn't exist", function() {
  doc.reset({a: 'b'});
  throws(
    function() {
      doc.test('/b', 'c');
    },
    Document.PathNotFoundException
  );
});

test("#test - uses `undefined` for the value of a path that doesn't exist when `quiet=true`", function() {
  doc.reset({a: 'b'});
  strictEqual(doc.test('/b', undefined, true), true);
});

/*
  `add`
 */

test("#transform - `add` - can add a value to the root object", function() {
  doc.reset({foo: 'bar'});
  doc.transform({op: 'add', path: '/', value: {baz: 'boo'}});
  deepEqual(doc.retrieve(), {baz: 'boo'});
});

test("#transform - `add` - can add a value to a parent object path that doesn't exist", function() {
  doc.reset({foo: 'bar'});
  doc.transform({op: 'add', path: '/baz', value: 'boo'});
  deepEqual(doc.retrieve(), {foo: 'bar', baz: 'boo'});
});

test("#transform - `add` - can NOT add data to a grandparent object path that doesn't exist", function() {
  doc.reset({q: 'bar'});
  throws(
    function() {
      doc.transform({op: 'add', path: '/a/b', value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `add` - can replace an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'add', path: '/a', value: 'baz'});
  deepEqual(doc.retrieve(), {a: 'baz'});
});

test("#transform - `add` - can replace an object at a deep target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.transform({op: 'add', path: '/a/b/c', value: 'e'});
  deepEqual(doc.retrieve(), {a: {b: {c: 'e'}}});
});

test("#transform - `add` - can append a value to the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz']});
  doc.transform({op: 'add', path: '/foo/-', value: 'boo'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

test("#transform - `add` - can insert a value in a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'c']});
  doc.transform({op: 'add', path: '/foo/1', value: 'b'});
  deepEqual(doc.retrieve(), {foo: ['a', 'b', 'c']});

  doc.transform({op: 'add', path: '/foo/3', value: 'd'});
  deepEqual(doc.retrieve(), {foo: ['a', 'b', 'c', 'd']});
});

test("#transform - `add` - can NOT insert a value in a position beyond the end of an targeted array", function() {
  doc.reset({foo: ['a', 'b']});
  throws(
    function() {
      doc.transform({op: 'add', path: '/foo/3', value: 'x'});
    },
    Document.PathNotFoundException
  );
});

/*
  `add` inversion
 */

test("#transform - `add` - can invert the addition of a value to the root object", function() {
  doc.reset({foo: 'bar'});
  var inverse = doc.transform({op: 'add', path: '/', value: {baz: 'boo'}}, true);
  deepEqual(inverse, [{op: 'replace', path: '/', value: {foo: 'bar'}}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: 'bar'});
});

test("#transform - `add` - can invert the addition of a value to a parent object path that doesn't exist", function() {
  doc.reset({foo: 'bar'});
  var inverse = doc.transform({op: 'add', path: '/baz', value: 'boo'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/baz'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: 'bar'});
});

test("#transform - `add` - can invert the replacement of an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'add', path: '/a', value: 'baz'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/a', value: 'bar'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `add` - can invert the replacement of an object at a deep target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.transform({op: 'add', path: '/a/b/c', value: 'e'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/a/b/c', value: 'd'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: {c: 'd'}}});
});

test("#transform - `add` - can invert the appending of a value to the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz']});
  var inverse = doc.transform({op: 'add', path: '/foo/-', value: 'boo'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/foo/-'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz']});
});

test("#transform - `add` - can invert the insertion of a value in a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'c']});
  var inverse = doc.transform({op: 'add', path: '/foo/1', value: 'b'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/foo/1'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['a', 'c']});
});

/*
  `remove`
 */

test("#transform - `remove` - can clear the root object", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'remove', path: '/'});
  deepEqual(doc.retrieve(), {});
});

test("#transform - `remove` - can remove an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'remove', path: '/a'});
  deepEqual(doc.retrieve(), {});
});

test("#transform - `remove` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.transform({op: 'remove', path: '/a'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `remove` - can remove a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  doc.transform({op: 'remove', path: '/a/b'});
  deepEqual(doc.retrieve(), {a: {}});
});

test("#transform - `remove` - can remove a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.transform({op: 'remove', path: '/a/b/c'});
  deepEqual(doc.retrieve(), {a: {b: {}}});
});

test("#transform - `remove` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.transform({op: 'remove', path: '/foo/baz'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `remove` - can remove an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.transform({op: 'remove', path: '/foo/-'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz']});
});

test("#transform - `remove` - can NOT remove the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.transform({op: 'remove', path: '/foo/-'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `remove` - can remove an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.transform({op: 'remove', path: '/foo/1'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'boo']});
});

test("#transform - `remove` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  throws(
    function() {
      doc.transform({op: 'remove', path: '/foo/3'});
    },
    Document.PathNotFoundException
  );
});

/*
  `remove` inversion
 */

test("#transform - `remove` - can invert removal of the root object", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'remove', path: '/'}, true);
  deepEqual(inverse, [{op: 'add', path: '/', value: {a: 'bar'}}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `remove` - can invert removal of an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'remove', path: '/a'}, true);
  deepEqual(inverse, [{op: 'add', path: '/a', value: 'bar'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `remove` - can invert removal of a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  var inverse = doc.transform({op: 'remove', path: '/a/b'}, true);
  deepEqual(inverse, [{op: 'add', path: '/a/b', value: 'c'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: 'c'}});
});

test("#transform - `remove` - can invert removal of a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.transform({op: 'remove', path: '/a/b/c'}, true);
  deepEqual(inverse, [{op: 'add', path: '/a/b/c', value: 'd'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: {c: 'd'}}});
});

test("#transform - `remove` - can invert removal of an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.transform({op: 'remove', path: '/foo/-'}, true);
  deepEqual(inverse, [{op: 'add', path: '/foo/-', value: 'boo'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

test("#transform - `remove` - can invert removal of an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.transform({op: 'remove', path: '/foo/1'}, true);
  deepEqual(inverse, [{op: 'add', path: '/foo/1', value: 'baz'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

/*
  `replace`
 */

test("#transform - `replace` - can replace the root object", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'replace', path: '/', value: {baz: 'boo'}});
  deepEqual(doc.retrieve(), {baz: 'boo'});
});

test("#transform - `replace` - can replace an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'replace', path: '/a', value: 'boo'});
  deepEqual(doc.retrieve(), {a: 'boo'});
});

test("#transform - `replace` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.transform({op: 'replace', path: '/a', value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `replace` - can replace a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  doc.transform({op: 'replace', path: '/a/b', value: 'd'});
  deepEqual(doc.retrieve(), {a: {b: 'd'}});
});

test("#transform - `replace` - can replace a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.transform({op: 'replace', path: '/a/b/c', value: 'e'});
  deepEqual(doc.retrieve(), {a: {b: {c: 'e'}}});
});

test("#transform - `replace` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.transform({op: 'replace', path: '/foo/baz', value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `replace` - can replace an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.transform({op: 'replace', path: '/foo/-', value: 'fuz'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'fuz']});
});

test("#transform - `replace` - can NOT replace the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.transform({op: 'replace', path: '/foo/-', value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `replace` - can replace an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.transform({op: 'replace', path: '/foo/1', value: 'fuz'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'fuz', 'boo']});
});

test("#transform - `replace` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  throws(
    function() {
      doc.transform({op: 'replace', path: '/foo/3', value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

/*
  `replace` inversion
 */

test("#transform - `replace` - can invert replacement of the root object", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'replace', path: '/', value: {baz: 'boo'}}, true);
  deepEqual(inverse, [{op: 'replace', path: '/', value: {a: 'bar'}}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `replace` - can invert replacement of an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'replace', path: '/a', value: 'boo'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/a', value: 'bar'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `replace` - can invert replacement of a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  var inverse = doc.transform({op: 'replace', path: '/a/b', value: 'd'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/a/b', value: 'c'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: 'c'}});
});

test("#transform - `replace` - can invert replacement of a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.transform({op: 'replace', path: '/a/b/c', value: 'e'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/a/b/c', value: 'd'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: {c: 'd'}}});
});

test("#transform - `replace` - can invert replacement of an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.transform({op: 'replace', path: '/foo/-', value: 'fuz'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/foo/-', value: 'boo'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

test("#transform - `replace` - can invert replacement of an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.transform({op: 'replace', path: '/foo/1', value: 'fuz'}, true);
  deepEqual(inverse, [{op: 'replace', path: '/foo/1', value: 'baz'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

/*
  `move`
 */

test("#transform - `move` - can replace the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'move', from: '/', path: '/'});
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `move` - can move an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'move', from: '/a', path: '/b'});
  deepEqual(doc.retrieve(), {b: 'bar'});
});

test("#transform - `move` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.transform({op: 'move', from: '/nonexistent', path: '/b'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `move` - can move a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  doc.transform({op: 'move', from: '/a/b', path: '/d'});
  deepEqual(doc.retrieve(), {a: {}, d: 'c'});
});

test("#transform - `move` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.transform({op: 'move', from: '/foo/nonexistent', path: '/boo'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `move` - can move an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.transform({op: 'move', from: '/foo/-', path: '/fuz'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz'], fuz: 'boo'});
});

test("#transform - `move` - can NOT move the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.transform({op: 'move', from: '/foo/-', path: '/fuz'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `move` - can move an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  doc.transform({op: 'move', from: '/foo/0', path: '/foo/2'});
  deepEqual(doc.retrieve(), {foo: ['b', 'c', 'a']});
});

test("#transform - `move` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  throws(
    function() {
      doc.transform({op: 'move', from: '/foo/3', path: '/foo/0'});
    },
    Document.PathNotFoundException
  );
});

/*
  `move` inversion
 */

test("#transform - `move` - can invert replacing the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'move', from: '/', path: '/'}, true);
  deepEqual(inverse, []);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `move` - can invert moving an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'move', from: '/a', path: '/b'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/b'},
                      {op: 'add', path: '/a', value: 'bar'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `move` - can invert moving a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  var inverse = doc.transform({op: 'move', from: '/a/b', path: '/d'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/d'},
                      {op: 'add', path: '/a/b', value: 'c'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: 'c'}});
});

test("#transform - `move` - can invert moving an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.transform({op: 'move', from: '/foo/-', path: '/fuz'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/fuz'},
                      {op: 'add', path: '/foo/-', value: 'boo'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

test("#transform - `move` - can invert moving an object from a specific position in a targeted array", function() {
  var inverse;

  doc.reset({foo: ['a', 'b', 'c']});
  inverse = doc.transform({op: 'move', from: '/foo/0', path: '/foo/2'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/foo/2'},
                      {op: 'add', path: '/foo/0', value: 'a'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['a', 'b', 'c']});

  doc.reset({foo: ['a', 'b', 'c']});
  inverse = doc.transform({op: 'move', from: '/foo/2', path: '/foo/0'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/foo/0'},
                      {op: 'add', path: '/foo/2', value: 'c'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['a', 'b', 'c']});
});

/*
  `copy`
 */

test("#transform - `copy` - can replace the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'copy', from: '/', path: '/'});
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `copy` - can copy an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.transform({op: 'copy', from: '/a', path: '/b'});
  deepEqual(doc.retrieve(), {a: 'bar', b: 'bar'});
});

test("#transform - `copy` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.transform({op: 'copy', from: '/nonexistent', path: '/b'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `copy` - can copy a nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.transform({op: 'copy', from: '/a/b', path: '/e'});
  deepEqual(doc.retrieve(), {a: {b: {c: 'd'}}, e: {c: 'd'}});
});

test("#transform - `copy` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.transform({op: 'copy', from: '/foo/nonexistent', path: '/boo'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `copy` - can copy an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.transform({op: 'copy', from: '/foo/-', path: '/fuz'});
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo'], fuz: 'boo'});
});

test("#transform - `copy` - can NOT copy the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.transform({op: 'copy', from: '/foo/-', path: '/fuz'});
    },
    Document.PathNotFoundException
  );
});

test("#transform - `copy` - can copy an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  doc.transform({op: 'copy', from: '/foo/0', path: '/foo/3'});
  deepEqual(doc.retrieve(), {foo: ['a', 'b', 'c', 'a']});
});

test("#transform - `copy` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  throws(
    function() {
      doc.transform({op: 'copy', from: '/foo/3', path: '/foo/0'});
    },
    Document.PathNotFoundException
  );
});

/*
  `copy` inversion
 */

test("#transform - `copy` - can invert replacing the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'copy', from: '/', path: '/'}, true);
  deepEqual(inverse, []);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `copy` - can invert copying an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.transform({op: 'copy', from: '/a', path: '/b'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/b'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: 'bar'});
});

test("#transform - `copy` - can invert copying a nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.transform({op: 'copy', from: '/a/b', path: '/e'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/e'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {a: {b: {c: 'd'}}});
});

test("#transform - `copy` - can invert copying an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.transform({op: 'copy', from: '/foo/-', path: '/fuz'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/fuz'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['bar', 'baz', 'boo']});
});

test("#transform - `copy` - can invert copying an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  var inverse = doc.transform({op: 'copy', from: '/foo/0', path: '/foo/3'}, true);
  deepEqual(inverse, [{op: 'remove', path: '/foo/3'}]);
  applyTransforms(doc, inverse);
  deepEqual(doc.retrieve(), {foo: ['a', 'b', 'c']});
});
