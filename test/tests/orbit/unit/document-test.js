import Document from 'orbit/document';

var doc;

var applyPatches = function(doc, operations) {
  for (var i = 0; i < operations.length; i++) {
    doc.patch(operations[i]);
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
  deepEqual(doc.get(), {});
});

test("#reset - will reset the full document to the value specified", function() {
  var data = {a: 'b', c: ['d', 'e']};
  doc.reset(data);
  deepEqual(doc.get(), data);
});

/*
  `get`
 */

test("#get - will get the full document by default", function() {
  deepEqual(doc.get(), {});

  doc.reset({a: 'b', c: ['d', 'e']});
  deepEqual(doc.get(), {a: 'b', c: ['d', 'e']});
});

test("#get - can get a value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  deepEqual(doc.get(['a']), 'b');
});

test("#get - can get an array value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  deepEqual(doc.get(['c']), ['d', 'e']);
});

test("#get - can get a value at the end of an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  deepEqual(doc.get(['c', '-']), 'f');
});

test("#get - can get a value at a specific position in an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  deepEqual(doc.get(['c', '1']), 'e');
});

test("#get - can get a value with an array in the path", function() {
  doc.reset({a: 'b', c: ['d', {e: 'f'}]});
  deepEqual(doc.get(['c', '1', 'e']), 'f');
});

test("#get - throws an exception for a path that doesn't exist", function() {
  doc.reset({a: 'b'});
  throws(
    function() {
      doc.get(['b']);
    },
    Document.PathNotFoundException
  );
});

test("#get - returns `undefined` for a path that doesn't exist when `quiet=true`", function() {
  doc.reset({a: 'b'});
  strictEqual(doc.get(['b'], true), undefined);
});

/*
  `test`
 */

test("#test - can verify the full document", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  equal(doc.test([], {a: 'b', c: ['d', 'e']}), true);
});

test("#test - can verify a value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  equal(doc.test(['a'], 'b'), true);
});

test("#test - can verify an array value from a simple object path", function() {
  doc.reset({a: 'b', c: ['d', 'e']});
  equal(doc.test(['c'], ['d', 'e']), true);
});

test("#test - can verify a value at the end of an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  equal(doc.test(['c', '-'], 'f'), true);
});

test("#test - can verify a value at a specific position in an array", function() {
  doc.reset({a: 'b', c: ['d', 'e', 'f']});
  equal(doc.test(['c', '1'], 'e'), true);
});

test("#test - can verify a value with an array in the path", function() {
  doc.reset({a: 'b', c: ['d', {e: 'f'}]});
  equal(doc.test(['c', '1', 'e'], 'f'), true);
});

test("#test - returns false for a mismatch", function() {
  doc.reset({a: 'b'});
  equal(doc.test(['a'], 'c'), false);
});

test("#test - throws an exception for a path that doesn't exist", function() {
  doc.reset({a: 'b'});
  throws(
    function() {
      doc.test(['b'], 'c');
    },
    Document.PathNotFoundException
  );
});

test("#test - uses `undefined` for the value of a path that doesn't exist when `quiet=true`", function() {
  doc.reset({a: 'b'});
  strictEqual(doc.test(['b'], undefined, true), true);
});

/*
  `add`
 */

test("#patch - `add` - can add a value to the root object", function() {
  doc.reset({foo: 'bar'});
  doc.patch({op: 'add', path: [], value: {baz: 'boo'}});
  deepEqual(doc.get(), {baz: 'boo'});
});

test("#patch - `add` - can add a value to a parent object path that doesn't exist", function() {
  doc.reset({foo: 'bar'});
  doc.patch({op: 'add', path: ['baz'], value: 'boo'});
  deepEqual(doc.get(), {foo: 'bar', baz: 'boo'});
});

test("#patch - `add` - can NOT add data to a grandparent object path that doesn't exist", function() {
  doc.reset({q: 'bar'});
  throws(
    function() {
      doc.patch({op: 'add', path: ['a', 'b'], value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `add` - can replace an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'add', path: ['a'], value: 'baz'});
  deepEqual(doc.get(), {a: 'baz'});
});

test("#patch - `add` - can replace an object at a deep target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.patch({op: 'add', path: ['a', 'b', 'c'], value: 'e'});
  deepEqual(doc.get(), {a: {b: {c: 'e'}}});
});

test("#patch - `add` - can append a value to the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz']});
  doc.patch({op: 'add', path: ['foo', '-'], value: 'boo'});
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

test("#patch - `add` - can insert a value in a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'c']});
  doc.patch({op: 'add', path: ['foo', '1'], value: 'b'});
  deepEqual(doc.get(), {foo: ['a', 'b', 'c']});

  doc.patch({op: 'add', path: ['foo', '3'], value: 'd'});
  deepEqual(doc.get(), {foo: ['a', 'b', 'c', 'd']});
});

test("#patch - `add` - can NOT insert a value in a position beyond the end of an targeted array", function() {
  doc.reset({foo: ['a', 'b']});
  throws(
    function() {
      doc.patch({op: 'add', path: ['foo', '3'], value: 'x'});
    },
    Document.PathNotFoundException
  );
});

/*
  `add` inversion
 */

test("#patch - `add` - can invert the addition of a value to the root object", function() {
  doc.reset({foo: 'bar'});
  var inverse = doc.patch({op: 'add', path: [], value: {baz: 'boo'}}, true);
  deepEqual(inverse, [{op: 'replace', path: [], value: {foo: 'bar'}}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: 'bar'});
});

test("#patch - `add` - can invert the addition of a value to a parent object path that doesn't exist", function() {
  doc.reset({foo: 'bar'});
  var inverse = doc.patch({op: 'add', path: ['baz'], value: 'boo'}, true);
  deepEqual(inverse, [{op: 'remove', path: ['baz']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: 'bar'});
});

test("#patch - `add` - can invert the replacement of an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'add', path: ['a'], value: 'baz'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['a'], value: 'bar'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `add` - can invert the replacement of an object at a deep target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.patch({op: 'add', path: ['a', 'b', 'c'], value: 'e'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['a', 'b', 'c'], value: 'd'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: {c: 'd'}}});
});

test("#patch - `add` - can invert the appending of a value to the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz']});
  var inverse = doc.patch({op: 'add', path: ['foo', '-'], value: 'boo'}, true);
  deepEqual(inverse, [{op: 'remove', path: ['foo', '-']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz']});
});

test("#patch - `add` - can invert the insertion of a value in a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'c']});
  var inverse = doc.patch({op: 'add', path: ['foo', '1'], value: 'b'}, true);
  deepEqual(inverse, [{op: 'remove', path: ['foo', '1']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['a', 'c']});
});

/*
  `remove`
 */

test("#patch - `remove` - can clear the root object", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'remove', path: []});
  deepEqual(doc.get(), {});
});

test("#patch - `remove` - can remove an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'remove', path: ['a']});
  deepEqual(doc.get(), {});
});

test("#patch - `remove` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.patch({op: 'remove', path: ['a']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `remove` - can remove a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  doc.patch({op: 'remove', path: ['a', 'b']});
  deepEqual(doc.get(), {a: {}});
});

test("#patch - `remove` - can remove a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.patch({op: 'remove', path: ['a', 'b', 'c']});
  deepEqual(doc.get(), {a: {b: {}}});
});

test("#patch - `remove` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.patch({op: 'remove', path: ['foo', 'baz']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `remove` - can remove an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.patch({op: 'remove', path: ['foo', '-']});
  deepEqual(doc.get(), {foo: ['bar', 'baz']});
});

test("#patch - `remove` - can NOT remove the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.patch({op: 'remove', path: ['foo', '-']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `remove` - can remove an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.patch({op: 'remove', path: ['foo', '1']});
  deepEqual(doc.get(), {foo: ['bar', 'boo']});
});

test("#patch - `remove` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  throws(
    function() {
      doc.patch({op: 'remove', path: ['foo', '3']});
    },
    Document.PathNotFoundException
  );
});

/*
  `remove` inversion
 */

test("#patch - `remove` - can invert removal of the root object", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'remove', path: []}, true);
  deepEqual(inverse, [{op: 'add', path: [], value: {a: 'bar'}}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `remove` - can invert removal of an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'remove', path: ['a']}, true);
  deepEqual(inverse, [{op: 'add', path: ['a'], value: 'bar'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `remove` - can invert removal of a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  var inverse = doc.patch({op: 'remove', path: ['a', 'b']}, true);
  deepEqual(inverse, [{op: 'add', path: ['a', 'b'], value: 'c'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: 'c'}});
});

test("#patch - `remove` - can invert removal of a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.patch({op: 'remove', path: ['a', 'b', 'c']}, true);
  deepEqual(inverse, [{op: 'add', path: ['a', 'b', 'c'], value: 'd'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: {c: 'd'}}});
});

test("#patch - `remove` - can invert removal of an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.patch({op: 'remove', path: ['foo', '-']}, true);
  deepEqual(inverse, [{op: 'add', path: ['foo', '-'], value: 'boo'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

test("#patch - `remove` - can invert removal of an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.patch({op: 'remove', path: ['foo', '1']}, true);
  deepEqual(inverse, [{op: 'add', path: ['foo', '1'], value: 'baz'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

/*
  `replace`
 */

test("#patch - `replace` - can replace the root object", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'replace', path: [], value: {baz: 'boo'}});
  deepEqual(doc.get(), {baz: 'boo'});
});

test("#patch - `replace` - can replace an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'replace', path: ['a'], value: 'boo'});
  deepEqual(doc.get(), {a: 'boo'});
});

test("#patch - `replace` - can add an object to the root object", function() {
  doc.reset();
  doc.patch({op: 'replace', path: ['foo'], value: 'boo'});
  deepEqual(doc.get(), {foo: 'boo'});
});

test("#patch - `replace` - verifies that the parent of the target object path is present", function() {
  doc.reset();
  throws(
    function() {
      doc.patch({op: 'replace', path: ['a', 'b'], value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `replace` - can replace a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  doc.patch({op: 'replace', path: ['a', 'b'], value: 'd'});
  deepEqual(doc.get(), {a: {b: 'd'}});
});

test("#patch - `replace` - can replace a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.patch({op: 'replace', path: ['a', 'b', 'c'], value: 'e'});
  deepEqual(doc.get(), {a: {b: {c: 'e'}}});
});

test("#patch - `replace` - can add an object to a path that doesn't exist as long as the parent path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  doc.patch({op: 'replace', path: ['foo', 'baz'], value: 'boo'});
  deepEqual(doc.get(), {foo: {bar: 'baz', baz: 'boo'}});
});

test("#patch - `replace` - can replace an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.patch({op: 'replace', path: ['foo', '-'], value: 'fuz'});
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'fuz']});
});

test("#patch - `replace` - can NOT replace the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.patch({op: 'replace', path: ['foo', '-'], value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `replace` - can replace an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.patch({op: 'replace', path: ['foo', '1'], value: 'fuz'});
  deepEqual(doc.get(), {foo: ['bar', 'fuz', 'boo']});
});

test("#patch - `replace` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  throws(
    function() {
      doc.patch({op: 'replace', path: ['foo', '3'], value: 'boo'});
    },
    Document.PathNotFoundException
  );
});

/*
  `replace` inversion
 */

test("#patch - `replace` - can invert replacement of the root object", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'replace', path: [], value: {baz: 'boo'}}, true);
  deepEqual(inverse, [{op: 'replace', path: [], value: {a: 'bar'}}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `replace` - can invert replacement of an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'replace', path: ['a'], value: 'boo'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['a'], value: 'bar'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `replace` - can invert replacement of a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  var inverse = doc.patch({op: 'replace', path: ['a', 'b'], value: 'd'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['a', 'b'], value: 'c'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: 'c'}});
});

test("#patch - `replace` - can invert replacement of a deeply nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.patch({op: 'replace', path: ['a', 'b', 'c'], value: 'e'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['a', 'b', 'c'], value: 'd'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: {c: 'd'}}});
});

test("#patch - `replace` - can invert replacement of an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.patch({op: 'replace', path: ['foo', '-'], value: 'fuz'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['foo', '-'], value: 'boo'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

test("#patch - `replace` - can invert replacement of an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.patch({op: 'replace', path: ['foo', '1'], value: 'fuz'}, true);
  deepEqual(inverse, [{op: 'replace', path: ['foo', '1'], value: 'baz'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

/*
  `move`
 */

test("#patch - `move` - can replace the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'move', from: [], path: []});
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `move` - can move an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'move', from: ['a'], path: ['b']});
  deepEqual(doc.get(), {b: 'bar'});
});

test("#patch - `move` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.patch({op: 'move', from: ['nonexistent'], path: ['b']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `move` - can move a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  doc.patch({op: 'move', from: ['a', 'b'], path: ['d']});
  deepEqual(doc.get(), {a: {}, d: 'c'});
});

test("#patch - `move` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.patch({op: 'move', from: ['foo', 'nonexistent'], path: ['boo']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `move` - can move an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.patch({op: 'move', from: ['foo', '-'], path: ['fuz']});
  deepEqual(doc.get(), {foo: ['bar', 'baz'], fuz: 'boo'});
});

test("#patch - `move` - can NOT move the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.patch({op: 'move', from: ['foo', '-'], path: ['fuz']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `move` - can move an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  doc.patch({op: 'move', from: ['foo', '0'], path: ['foo', '2']});
  deepEqual(doc.get(), {foo: ['b', 'c', 'a']});
});

test("#patch - `move` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  throws(
    function() {
      doc.patch({op: 'move', from: ['foo', '3'], path: ['foo', '0']});
    },
    Document.PathNotFoundException
  );
});

/*
  `move` inversion
 */

test("#patch - `move` - can invert replacing the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'move', from: [], path: []}, true);
  deepEqual(inverse, []);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `move` - can invert moving an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'move', from: ['a'], path: ['b']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['b']},
                      {op: 'add', path: ['a'], value: 'bar'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `move` - can invert moving a nested object at a target object path", function() {
  doc.reset({a: {b: 'c'}});
  var inverse = doc.patch({op: 'move', from: ['a', 'b'], path: ['d']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['d']},
                      {op: 'add', path: ['a', 'b'], value: 'c'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: 'c'}});
});

test("#patch - `move` - can invert moving an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.patch({op: 'move', from: ['foo', '-'], path: ['fuz']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['fuz']},
                      {op: 'add', path: ['foo', '-'], value: 'boo'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

test("#patch - `move` - can invert moving an object from a specific position in a targeted array", function() {
  var inverse;

  doc.reset({foo: ['a', 'b', 'c']});
  inverse = doc.patch({op: 'move', from: ['foo', '0'], path: ['foo', '2']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['foo', '2']},
                      {op: 'add', path: ['foo', '0'], value: 'a'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['a', 'b', 'c']});

  doc.reset({foo: ['a', 'b', 'c']});
  inverse = doc.patch({op: 'move', from: ['foo', '2'], path: ['foo', '0']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['foo', '0']},
                      {op: 'add', path: ['foo', '2'], value: 'c'}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['a', 'b', 'c']});
});

/*
  `copy`
 */

test("#patch - `copy` - can replace the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'copy', from: [], path: []});
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `copy` - can copy an object at a target object path", function() {
  doc.reset({a: 'bar'});
  doc.patch({op: 'copy', from: ['a'], path: ['b']});
  deepEqual(doc.get(), {a: 'bar', b: 'bar'});
});

test("#patch - `copy` - verifies that a target object path exists", function() {
  doc.reset({foo: 'bar'});
  throws(
    function() {
      doc.patch({op: 'copy', from: ['nonexistent'], path: ['b']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `copy` - can copy a nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  doc.patch({op: 'copy', from: ['a', 'b'], path: ['e']});
  deepEqual(doc.get(), {a: {b: {c: 'd'}}, e: {c: 'd'}});
});

test("#patch - `copy` - verifies that a nested object path exists", function() {
  doc.reset({foo: {bar: 'baz'}});
  throws(
    function() {
      doc.patch({op: 'copy', from: ['foo', 'nonexistent'], path: ['boo']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `copy` - can copy an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  doc.patch({op: 'copy', from: ['foo', '-'], path: ['fuz']});
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo'], fuz: 'boo'});
});

test("#patch - `copy` - can NOT copy the last value in an empty array", function() {
  doc.reset({foo: []});
  throws(
    function() {
      doc.patch({op: 'copy', from: ['foo', '-'], path: ['fuz']});
    },
    Document.PathNotFoundException
  );
});

test("#patch - `copy` - can copy an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  doc.patch({op: 'copy', from: ['foo', '0'], path: ['foo', '3']});
  deepEqual(doc.get(), {foo: ['a', 'b', 'c', 'a']});
});

test("#patch - `copy` - can NOT an object from a position not present in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  throws(
    function() {
      doc.patch({op: 'copy', from: ['foo', '3'], path: ['foo', '0']});
    },
    Document.PathNotFoundException
  );
});

/*
  `copy` inversion
 */

test("#patch - `copy` - can invert replacing the root object with itself (yes, this is silly)", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'copy', from: [], path: []}, true);
  deepEqual(inverse, []);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `copy` - can invert copying an object at a target object path", function() {
  doc.reset({a: 'bar'});
  var inverse = doc.patch({op: 'copy', from: ['a'], path: ['b']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['b']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: 'bar'});
});

test("#patch - `copy` - can invert copying a nested object at a target object path", function() {
  doc.reset({a: {b: {c: 'd'}}});
  var inverse = doc.patch({op: 'copy', from: ['a', 'b'], path: ['e']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['e']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {a: {b: {c: 'd'}}});
});

test("#patch - `copy` - can invert copying an object from the end of a targeted array", function() {
  doc.reset({foo: ['bar', 'baz', 'boo']});
  var inverse = doc.patch({op: 'copy', from: ['foo', '-'], path: ['fuz']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['fuz']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['bar', 'baz', 'boo']});
});

test("#patch - `copy` - can invert copying an object from a specific position in a targeted array", function() {
  doc.reset({foo: ['a', 'b', 'c']});
  var inverse = doc.patch({op: 'copy', from: ['foo', '0'], path: ['foo', '3']}, true);
  deepEqual(inverse, [{op: 'remove', path: ['foo', '3']}]);
  applyPatches(doc, inverse);
  deepEqual(doc.get(), {foo: ['a', 'b', 'c']});
});
