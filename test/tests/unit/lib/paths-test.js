import {
  joinPath,
  splitPath
} from 'orbit/lib/paths';

module('Orbit - Lib - Paths', {});

test('joinPath - joins an array of path segments into a string', function(assert) {
  assert.equal(joinPath([]), '/', 'returns a leading `/` joining an empty array');
  assert.equal(joinPath(['a']), '/a', 'properly joins an array with one item');
  assert.equal(joinPath(['a', 'b']), '/a/b', 'properly joins an array with two items');
  assert.equal(joinPath('/a'), '/a', 'returns argument if not an array');
});

test('splitPath - splits a `/` delimited path into an array', function(assert) {
  assert.deepEqual(splitPath('/'), [], 'properly splits a root path');
  assert.deepEqual(splitPath(''), [], 'properly splits an empty string');
  assert.deepEqual(splitPath('/a'), ['a'], 'properly splits a path with one segment');
  assert.deepEqual(splitPath('/a/b'), ['a', 'b'], 'properly splits a path with two segments');
  assert.deepEqual(splitPath('/a/b/'), ['a', 'b'], 'trims trailing slashes');
});
