import { clone, expose, extend, toArray, isObject, isNone, merge, deepMerge, deepGet, deepSet, objectValues } from '../src/objects';

const { module, test } = QUnit;

module('Lib / Object', function() {
  test('`clone` creates a deep clone of an object\'s own properties', function(assert) {
    var obj = {
      a: 1,
      b: '2',
      c: ['3', { d: '4', e: ['5', '6'] }, 7],
      f: new Date(),
      g: /123/g
    };

    var copy = clone(obj);

    assert.deepEqual(obj, copy, 'clone is deeply equal to original');
    assert.notStrictEqual(obj, copy, 'clone is not strictly equal to original');
  });

  test('`expose` can expose all the properties and methods from one object on another', function(assert) {
    var earth = {
      name: 'earth',
      age: 4.5,
      greeting: function() {
        return 'hi from ' + this.name;
      }
    };

    var blank = {
      age: 0
    };

    expose(blank, earth);

    assert.equal(blank.name, earth.name, 'name matches');
    assert.equal(blank.age, earth.age, 'age matches');
    assert.equal(blank.greeting(), earth.greeting(), 'greeting matches');

    blank.name = 'blank';
    assert.equal(blank.greeting(), 'hi from earth', 'functions are evaluated with original context');
  });

  test('`expose` can expose specific properties and methods from one object on another', function(assert) {
    var earth = {
      name: 'earth',
      age: 4.5,
      greeting: function() {
        return 'hi from ' + this.name;
      }
    };

    var blank = {
      name: 'blank',
      age: 0
    };

    expose(blank, earth, 'age', 'greeting');

    assert.equal(blank.name, 'blank', 'name has not changed');
    assert.equal(blank.age, earth.age, 'age matches');
    assert.equal(blank.greeting(), earth.greeting(), 'greeting matches');

    blank.name = 'blank';
    assert.equal(blank.greeting(), 'hi from earth', 'functions are evaluated with original context');
  });

  test('`extend` can copy all the properties and methods from one object to another', function(assert) {
    assert.expect(5);
    var blank = {
      age: 0
    };

    var earth = {
      name: 'earth',
      age: 4.5,
      greeting: function() {
        return 'hi from ' + this.name;
      }
    };

    var result = extend(blank, earth);

    assert.equal(result, blank, 'extend() returns the destination object');
    assert.equal(blank.name, earth.name, 'name matches');
    assert.equal(blank.age, earth.age, 'age matches');
    assert.equal(blank.greeting(), earth.greeting(), 'greeting matches');

    blank.name = 'blank';
    assert.equal(blank.greeting(), 'hi from blank', 'functions are evaluated with the destination context');
  });

  test('`extend` can copy all the properties and methods from multiple objects to another', function(assert) {
    var blank = {
      age: 0
    };

    var earth = {
      name: 'earth',
      greeting: function() {
        return 'hi from ' + this.name;
      },
      hasPeople: true
    };

    var jupiter = {
      name: 'jupiter',
      age: 5
    };

    extend(blank, earth, jupiter);

    assert.equal(blank.name, 'jupiter', 'name came from jupiter');
    assert.equal(blank.age, 5, 'age came from jupiter');
    assert.equal(blank.hasPeople, true, 'hasPeople came from earth, and was not overridden');
    assert.equal(blank.greeting(), 'hi from jupiter', 'greeting came from earth but was evaluated in destination context');
  });

  test('`toArray` converts an argument into an array', function(assert) {
    var arr = ['a', 'b', 'c'];
    assert.strictEqual(toArray(arr), arr, 'Returns an array argument as the same array');

    assert.deepEqual(toArray('a'), ['a'], 'Returns a string argument in a new array');

    var obj = { prop: true };
    assert.strictEqual(toArray(obj)[0], obj, 'Returns an object argument in a new array');

    assert.deepEqual(toArray(null), [], 'Returns a null argument as an empty array');
    assert.deepEqual(toArray(), [], 'Returns an undefined argument as an empty array');
  });

  test('`isObject` checks whether a value is a non-null object', function(assert) {
    assert.equal(isObject(null), false, 'null is not an object');
    assert.equal(isObject(9), false, 'Number is not an object');
    assert.equal(isObject({}), true, 'Object is identified correctly');
    assert.equal(isObject([]), true, 'Array is an object');
  });

  test('`isNone` checks whether an object is `null` or `undefined`', function(assert) {
    assert.equal(isNone({}), false, 'Object is not null or undefined');
    assert.equal(isNone(null), true, 'isNone identifies null');
    assert.equal(isNone(undefined), true, 'isNone identifies undefined');
  });

  test('`merge` can combine two objects', function(assert) {
    let a = { firstName: 'Bob', underling: false };
    let b = { lastName: 'Dobbs', 'title': 'Mr.', underlings: null };
    let expected = { title: 'Mr.', firstName: 'Bob',
                     lastName: 'Dobbs', underling: false, underlings: null };
    let actual = merge(a, b);

    assert.deepEqual(actual, expected, 'Objects are merged');
    assert.strictEqual(actual, a, 'Passed object is mutated and returned');
  });

  test('`merge` can combine multiple objects', function(assert) {
    let a = { firstName: 'Bob', underling: false };
    let b = { lastName: 'Dobbs', 'title': 'Mr.', underlings: null,
              identity: { ssn: '123-456-7890' },
              children: [ 'Bob, Jr.', 'Sally' ] };
    let c = { lastName: 'Johnson', underlings: undefined };
    let expected = { title: 'Mr.', firstName: 'Bob',
                     lastName: 'Johnson', underling: false, underlings: null,
                     identity: { ssn: '123-456-7890' },
                     children: [ 'Bob, Jr.', 'Sally' ] };
    let actual = merge(a, b, c);

    assert.deepEqual(actual, expected, 'Objects are merged');
    assert.strictEqual(actual, a, 'Passed object is mutated and returned');
    assert.notStrictEqual(actual.identity, b.identity, 'object properties are cloned, not copied');
    assert.notStrictEqual(actual.children, b.children, 'array properties are cloned, not copied');
  });

  test('`deepMerge` can combine multiple objects at every level', function(assert) {
    let a = { firstName: 'Bob',
              underling: false,
              details: {
                address: '123 Main St.',
                family: {
                  spouse: 'Jane'
                }
              } };
    let b = { lastName: 'Dobbs',
              'title': 'Mr.',
              underlings: null,
              details: {
                city: 'Boston',
                state: 'Massachussetts',
                family: {
                  children: [
                    'Bob, Jr.',
                    'Sally'
                  ]
                }
              },
              identity: {
                ssn: '123-456-7890'
              } };
    let c = { lastName: 'Johnson',
              underlings: undefined,
              details: {
                state: 'MA',
                family: {
                  children: [
                    'Joe'
                  ]
                }
              } };
    let expected = { title: 'Mr.', firstName: 'Bob', lastName: 'Johnson',
                     underling: false, underlings: null,
                     details: {
                       address: '123 Main St.',
                       city: 'Boston',
                       state: 'MA',
                       family: {
                         spouse: 'Jane',
                         children: [
                           'Joe'
                         ]
                       }
                      },
                      identity: {
                        ssn: '123-456-7890'
                      } };
            let actual = deepMerge(a, b, c);

    assert.deepEqual(actual, expected, 'Objects are merged');
    assert.strictEqual(actual, a, 'Passed object is mutated and returned');
    assert.notStrictEqual(actual.identity, b.identity, 'object properties are cloned, not copied');
    assert.notStrictEqual(actual.details.family.children, c.details.family.children, 'array properties are cloned, not copied');
  });

  test('`deepGet` retrieves a value from a nested object', function(assert) {
    let obj = {
      author: {
        name: {
          first: 'Ginkgo'
        }
      }
    };

    assert.equal(deepGet(obj, ['author', 'name', 'first']), 'Ginkgo', 'returns a match');
    assert.equal(deepGet(obj, ['author', 'name', 'last']), undefined, 'returns undefined if no match');
  });

  test('`deepSet` sets a value on an object, creating objects/arrays as needed', function(assert) {
    let obj = {};

    let ret = deepSet(obj, ['name'], 'Ginkgo');

    assert.deepEqual(obj, { name: 'Ginkgo' }, 'simple set one level deep');
    assert.equal(ret, true, 'object was mutated');

    ret = deepSet(obj, ['appendages', 'feet'], 4);

    assert.deepEqual(obj, { name: 'Ginkgo', appendages: { feet: 4 } }, 'simple set one level deep');
    assert.equal(ret, true, 'object was mutated');

    let owner = { name: 'dgeb' };

    ret = deepSet(obj, ['owner'], owner);
    assert.equal(ret, true, 'object was mutated');

    ret = deepSet(obj, ['owner'], owner);
    assert.equal(ret, false, 'object was not mutated');

    ret = deepSet(obj, ['toys', 2], 'blue chewy');
    assert.equal(obj.toys[2], 'blue chewy', 'set can add array members too');
  });

  test('`objectValues` provides a ponyfill for `Object.values`', function(assert) {
    let obj = {
      a: '1',
      b: '2',
      c: null
    };

    assert.deepEqual(objectValues(obj), ['1', '2', null]);
  });
});
