import { eq } from '../src/eq';

const { module, test } = QUnit;

module('Lib / eq', function() {
  /**
   * #eq tests from underscore
   * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   *
   * https://github.com/jashkenas/underscore/blob/master/test/objects.js
   *
   * We are specifically not supporting checks for function equality, circular
   * references, etc. which are not required for  See commented out specs
   * below for a complete list.
   */

  test('#eq compares two objects', function(assert) {
    /* jshint ignore:start */

    //  function First() {
    //    this.value = 1;
    //  }
    //  First.prototype.value = 1;
    //  function Second() {
    //    this.value = 1;
    //  }
    //  Second.prototype.value = 2;

    // Basic equality and identity comparisons.
    assert.ok(eq(null, null), '`null` is equal to `null`');
    assert.ok(eq(), '`undefined` is equal to `undefined`');

    assert.ok(!eq(0, -0), '`0` is not equal to `-0`');
    assert.ok(!eq(-0, 0), 'Commutative equality is implemented for `0` and `-0`');
    assert.ok(!eq(null, undefined), '`null` is not equal to `undefined`');
    assert.ok(!eq(undefined, null), 'Commutative equality is implemented for `null` and `undefined`');

    // String object and primitive comparisons.
    assert.ok(eq('Curly', 'Curly'), 'Identical string primitives are equal');
    assert.ok(eq(new String('Curly'), new String('Curly')), 'String objects with identical primitive values are equal');
    assert.ok(eq(new String('Curly'), 'Curly'), 'String primitives and their corresponding object wrappers are equal');
    assert.ok(eq('Curly', new String('Curly')), 'Commutative equality is implemented for string objects and primitives');

    assert.ok(!eq('Curly', 'Larry'), 'String primitives with different values are not equal');
    assert.ok(!eq(new String('Curly'), new String('Larry')), 'String objects with different primitive values are not equal');
    assert.ok(!eq(new String('Curly'), { toString: function() { return 'Curly'; } }), 'String objects and objects with a custom `toString` method are not equal');

    // Number object and primitive comparisons.
    assert.ok(eq(75, 75), 'Identical number primitives are equal');
    assert.ok(eq(new Number(75), new Number(75)), 'Number objects with identical primitive values are equal');
    assert.ok(eq(75, new Number(75)), 'Number primitives and their corresponding object wrappers are equal');
    assert.ok(eq(new Number(75), 75), 'Commutative equality is implemented for number objects and primitives');
    assert.ok(!eq(new Number(0), -0), '`new Number(0)` and `-0` are not equal');
    assert.ok(!eq(0, new Number(-0)), 'Commutative equality is implemented for `new Number(0)` and `-0`');

    assert.ok(!eq(new Number(75), new Number(63)), 'Number objects with different primitive values are not equal');
    assert.ok(!eq(new Number(63), { valueOf: function() { return 63; } }), 'Number objects and objects with a `valueOf` method are not equal');

    // Comparisons involving `NaN`.
    assert.ok(eq(NaN, NaN), '`NaN` is equal to `NaN`');
    assert.ok(!eq(61, NaN), 'A number primitive is not equal to `NaN`');
    assert.ok(!eq(new Number(79), NaN), 'A number object is not equal to `NaN`');
    assert.ok(!eq(Infinity, NaN), '`Infinity` is not equal to `NaN`');

    // Boolean object and primitive comparisons.
    assert.ok(eq(true, true), 'Identical boolean primitives are equal');
    assert.ok(eq(new Boolean, new Boolean), 'Boolean objects with identical primitive values are equal');
    assert.ok(eq(true, new Boolean(true)), 'Boolean primitives and their corresponding object wrappers are equal');
    assert.ok(eq(new Boolean(true), true), 'Commutative equality is implemented for booleans');
    assert.ok(!eq(new Boolean(true), new Boolean), 'Boolean objects with different primitive values are not equal');

    // Common type coercions.
    assert.ok(!eq(true, new Boolean(false)), 'Boolean objects are not equal to the boolean primitive `true`');
    assert.ok(!eq('75', 75), 'String and number primitives with like values are not equal');
    assert.ok(!eq(new Number(63), new String(63)), 'String and number objects with like values are not equal');
    assert.ok(!eq(75, '75'), 'Commutative equality is implemented for like string and number values');
    assert.ok(!eq(0, ''), 'Number and string primitives with like values are not equal');
    assert.ok(!eq(1, true), 'Number and boolean primitives with like values are not equal');
    assert.ok(!eq(new Boolean(false), new Number(0)), 'Boolean and number objects with like values are not equal');
    assert.ok(!eq(false, new String('')), 'Boolean primitives and string objects with like values are not equal');
    assert.ok(!eq(12564504e5, new Date(2009, 9, 25)), 'Dates and their corresponding numeric primitive values are not equal');

    // Dates.
    assert.ok(eq(new Date(2009, 9, 25), new Date(2009, 9, 25)), 'Date objects referencing identical times are equal');
    assert.ok(!eq(new Date(2009, 9, 25), new Date(2009, 11, 13)), 'Date objects referencing different times are not equal');
    assert.ok(!eq(new Date(2009, 11, 13), {
      getTime: function() {
        return 12606876e5;
      }
    }), 'Date objects and objects with a `getTime` method are not equal');
    assert.ok(!eq(new Date('Curly'), new Date('Curly')), 'Invalid dates are not equal');

    // Functions.
    //  assert.ok(!eq(First, Second), "Different functions with identical bodies and source code representations are not equal");

    // RegExps.
    assert.ok(eq(/(?:)/gim, /(?:)/gim), 'RegExps with equivalent patterns and flags are equal');
    assert.ok(!eq(/(?:)/g, /(?:)/gi), 'RegExps with equivalent patterns and different flags are not equal');
    assert.ok(!eq(/Moe/gim, /Curly/gim), 'RegExps with different patterns and equivalent flags are not equal');
    assert.ok(!eq(/(?:)/gi, /(?:)/g), 'Commutative equality is implemented for RegExps');
    assert.ok(!eq(/Curly/g, { source: 'Larry', global: true, ignoreCase: false, multiline: false }), 'RegExps and RegExp-like objects are not equal');

    // Empty arrays, array-like objects, and object literals.
    assert.ok(eq({}, {}), 'Empty object literals are equal');
    assert.ok(eq([], []), 'Empty array literals are equal');
    assert.ok(eq([{}], [{}]), 'Empty nested arrays and objects are equal');
    assert.ok(!eq({ length: 0 }, []), 'Array-like objects and arrays are not equal.');
    assert.ok(!eq([], { length: 0 }), 'Commutative equality is implemented for array-like objects');

    assert.ok(!eq({}, []), 'Object literals and array literals are not equal');
    assert.ok(!eq([], {}), 'Commutative equality is implemented for objects and arrays');

    // Arrays with primitive and object values.
    assert.ok(eq([1, 'Larry', true], [1, 'Larry', true]), 'Arrays containing identical primitives are equal');
    assert.ok(eq([(/Moe/g), new Date(2009, 9, 25)], [(/Moe/g), new Date(2009, 9, 25)]), 'Arrays containing equivalent elements are equal');

    // Multi-dimensional arrays.
    var a = [new Number(47), false, 'Larry', /Moe/, new Date(2009, 11, 13), ['running', 'biking', new String('programming')], { a: 47 }];
    var b = [new Number(47), false, 'Larry', /Moe/, new Date(2009, 11, 13), ['running', 'biking', new String('programming')], { a: 47 }];
    assert.ok(eq(a, b), 'Arrays containing nested arrays and objects are recursively compared');

    // Overwrite the methods defined in ES 5.1 section 15.4.4.
    //  a.forEach = a.map = a.filter = a.every = a.indexOf = a.lastIndexOf = a.some = a.reduce = a.reduceRight = null;
    //  b.join = b.pop = b.reverse = b.shift = b.slice = b.splice = b.concat = b.sort = b.unshift = null;

    // Array elements and properties.
    //  assert.ok(eq(a, b), "Arrays containing equivalent elements and different non-numeric properties are equal");
    a.push('White Rocks');
    assert.ok(!eq(a, b), 'Arrays of different lengths are not equal');
    a.push('East Boulder');
    b.push('Gunbarrel Ranch', 'Teller Farm');
    assert.ok(!eq(a, b), 'Arrays of identical lengths containing different elements are not equal');

    // Sparse arrays.
    assert.ok(eq(Array(3), Array(3)), 'Sparse arrays of identical lengths are equal');
    assert.ok(!eq(Array(3), Array(6)), 'Sparse arrays of different lengths are not equal when both are empty');

    // Simple objects.
    assert.ok(eq({ a: 'Curly', b: 1, c: true }, { a: 'Curly', b: 1, c: true }), 'Objects containing identical primitives are equal');
    assert.ok(eq({ a: /Curly/g, b: new Date(2009, 11, 13) }, { a: /Curly/g, b: new Date(2009, 11, 13) }), 'Objects containing equivalent members are equal');
    assert.ok(!eq({ a: 63, b: 75 }, { a: 61, b: 55 }), 'Objects of identical sizes with different values are not equal');
    assert.ok(!eq({ a: 63, b: 75 }, { a: 61, c: 55 }), 'Objects of identical sizes with different property names are not equal');
    assert.ok(!eq({ a: 1, b: 2 }, { a: 1 }), 'Objects of different sizes are not equal');
    assert.ok(!eq({ a: 1 }, { a: 1, b: 2 }), 'Commutative equality is implemented for objects');
    assert.ok(!eq({ x: 1, y: undefined }, { x: 1, z: 2 }), 'Objects with identical keys and different values are not equivalent');

    // `A` contains nested objects and arrays.
    a = {
      name: new String('Moe Howard'),
      age: new Number(77),
      stooge: true,
      hobbies: ['acting'],
      film: {
        name: 'Sing a Song of Six Pants',
        release: new Date(1947, 9, 30),
        stars: [new String('Larry Fine'), 'Shemp Howard'],
        minutes: new Number(16),
        seconds: 54
      }
    };

    // `B` contains equivalent nested objects and arrays.
    b = {
      name: new String('Moe Howard'),
      age: new Number(77),
      stooge: true,
      hobbies: ['acting'],
      film: {
        name: 'Sing a Song of Six Pants',
        release: new Date(1947, 9, 30),
        stars: [new String('Larry Fine'), 'Shemp Howard'],
        minutes: new Number(16),
        seconds: 54
      }
    };
    assert.ok(eq(a, b), 'Objects with nested equivalent members are recursively compared');

    //  // Instances.
    //  assert.ok(eq(new First, new First), "Object instances are equal");
    //  assert.ok(!eq(new First, new Second), "Objects with different constructors and identical own properties are not equal");
    //  assert.ok(!eq({value: 1}, new First), "Object instances and objects sharing equivalent properties are not equal");
    //  assert.ok(!eq({value: 2}, new Second), "The prototype chain of objects should not be examined");

    //  // Circular Arrays.
    //  (a = []).push(a);
    //  (b = []).push(b);
    //  assert.ok(eq(a, b), "Arrays containing circular references are equal");
    //  a.push(new String("Larry"));
    //  b.push(new String("Larry"));
    //  assert.ok(eq(a, b), "Arrays containing circular references and equivalent properties are equal");
    //  a.push("Shemp");
    //  b.push("Curly");
    //  assert.ok(!eq(a, b), "Arrays containing circular references and different properties are not equal");
    //
    //  // More circular arrays #767.
    //  a = ["everything is checked but", "this", "is not"];
    //  a[1] = a;
    //  b = ["everything is checked but", ["this", "array"], "is not"];
    //  assert.ok(!eq(a, b), "Comparison of circular references with non-circular references are not equal");
    //
    //  // Circular Objects.
    //  a = {abc: null};
    //  b = {abc: null};
    //  a.abc = a;
    //  b.abc = b;
    //  assert.ok(eq(a, b), "Objects containing circular references are equal");
    //  a.def = 75;
    //  b.def = 75;
    //  assert.ok(eq(a, b), "Objects containing circular references and equivalent properties are equal");
    //  a.def = new Number(75);
    //  b.def = new Number(63);
    //  assert.ok(!eq(a, b), "Objects containing circular references and different properties are not equal");
    //
    //  // More circular objects #767.
    //  a = {everything: "is checked", but: "this", is: "not"};
    //  a.but = a;
    //  b = {everything: "is checked", but: {that:"object"}, is: "not"};
    //  assert.ok(!eq(a, b), "Comparison of circular references with non-circular object references are not equal");
    //
    //  // Cyclic Structures.
    //  a = [{abc: null}];
    //  b = [{abc: null}];
    //  (a[0].abc = a).push(a);
    //  (b[0].abc = b).push(b);
    //  assert.ok(eq(a, b), "Cyclic structures are equal");
    //  a[0].def = "Larry";
    //  b[0].def = "Larry";
    //  assert.ok(eq(a, b), "Cyclic structures containing equivalent properties are equal");
    //  a[0].def = new String("Larry");
    //  b[0].def = new String("Curly");
    //  assert.ok(!eq(a, b), "Cyclic structures containing different properties are not equal");
    //
    //  // Complex Circular References.
    //  a = {foo: {b: {foo: {c: {foo: null}}}}};
    //  b = {foo: {b: {foo: {c: {foo: null}}}}};
    //  a.foo.b.foo.c.foo = a;
    //  b.foo.b.foo.c.foo = b;
    //  assert.ok(eq(a, b), "Cyclic structures with nested and identically-named properties are equal");
    //
    //  // Chaining.
    //  assert.ok(!eq(_({x: 1, y: undefined}).chain(), _({x: 1, z: 2}).chain()), 'Chained objects containing different values are not equal');
    //
    //  a = _({x: 1, y: 2}).chain();
    //  b = _({x: 1, y: 2}).chain();
    //  equal(eq(a.eq(b), _(true)), true, '`eq` can be chained');
    //
    //  // Objects from another frame.
    //  assert.ok(eq({}, iObject));

    /* jshint ignore:end */
  });
});
