import { clone } from 'orbit/utils/object';

module("Orbit - Utils - Object", {
});

test("`clone` creates a deep clone of an object's own properties", function() {
  var obj = {
    a: 1,
    b: '2',
    c: ['3', {d: '4', e: ['5', '6']}, 7],
    f: new Date(),
    g: /123/g
  };

  var copy = clone(obj);

  deepEqual(obj, copy, 'clone is deeply equal to original');
  notStrictEqual(obj, copy, 'clone is not strictly equal to original');
});

// TODO - expose, extend