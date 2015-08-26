import Orbit from 'orbit/main';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import { equalOps } from 'tests/test-helper';
import { Promise, on } from 'rsvp';

var schema,
    cache;

///////////////////////////////////////////////////////////////////////////////

module("OC - Cache", {
  setup: function() {
    Orbit.Promise = Promise;
    schema = new Schema({
      models: {
        planet: {
          links: {
            moons: {type: 'hasMany', model: 'moon'}
          }
        },
        moon: {
          links: {
            planet: {type: 'hasOne', model: 'planet'}
          }
        }
      }
    });

  },

  teardown: function() {
    schema = null;
  }
});

test("it exists", function() {
  cache = new Cache(schema);

  ok(cache);
});

test("is sparse by default", function(assert) {
  cache = new Cache(schema);

  assert.equal(cache.sparse, true, 'sparse is true');
  assert.equal(cache.retrieve('planet'), undefined, 'no data is initialized');
});

test("non-sparse caches will initialize data for all models in a schema", function(assert) {
  cache = new Cache(schema, {sparse: false});

  assert.equal(cache.sparse, false, 'sparse is false');
  assert.deepEqual(cache.retrieve('planet'), {}, 'data is initialized');
});

test("#transform sets data and #retrieve retrieves it", function() {
  cache = new Cache(schema);

  var earth = {id: '1', name: 'Earth'};
  cache.transform([{op: 'add', path: 'planet/1', value: earth}]);
  deepEqual(cache.retrieve('planet/1'), earth, 'objects match in value');
  notStrictEqual(cache.retrieve('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test("#exists indicates whether a path exists", function() {
  cache = new Cache(schema);

  var earth = {id: '1', name: 'Earth'};
  cache.transform([{op: 'add', path: 'planet/1', value: earth}]);
  equal(cache.exists('planet'), true, 'path exists');
  equal(cache.exists('planet/1'), true, 'path exists');
  equal(cache.exists('planet/1/id'), true, 'path exists');
  equal(cache.exists('planet/1/id/bogus'), false, 'path does not exist');
  equal(cache.exists('this/path/is/bogus'), false, 'path does not exist');
});

test("#hasDeleted by default just returns the inverse of #exists", function() {
  cache = new Cache(schema);

  var earth = {id: '1', name: 'Earth'};
  cache.transform([{op: 'add', path: 'planet/1', value: earth}]);
  equal(cache.hasDeleted('planet'), !cache.exists('planet'), 'path exists');
  equal(cache.hasDeleted('planet/1'), !cache.exists('planet/1'), 'path exists');
  equal(cache.hasDeleted('planet/1/id/bogus'), !cache.exists('planet/1/id/bogus'), false, 'path does not exist');
});

test("#length returns the size of data at a path", function() {
  cache = new Cache(schema);

  equal(cache.length('notthere'), 0, 'returns 0 when an object does not exist at a path');

  cache.transform([{op: 'add', path: 'planet/1', value: {name: 'Earth'}},
                   {op: 'add', path: 'planet/2', value: {name: 'Mars'}}]);

  equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.transform([{op: 'add', path: 'planet/1/stuff', value: ['a', 'b', 'c']}]);

  equal(cache.length('planet/1/stuff'), 3, 'returns size of an array at a path');
});

test("#reset clears the cache by default", function() {
  cache = new Cache(schema);

  cache.transform([{op: 'add', path: 'planet/1', value: {name: 'Earth'}}]);
  cache.reset();
  deepEqual(cache.retrieve(), {});
});

test("#reset overrides the cache completely with the value specified", function() {
  cache = new Cache(schema);

  cache.transform([{op: 'add', path: 'planet/1', value: {name: 'Earth'}}]);

  var newData = {planet: {'2': {name: 'Mars'}}};
  cache.reset(newData);
  deepEqual(cache.retrieve(), newData);
});

test("#transform returns an empty array of `operations` when an operation is a noop", function() {
  cache = new Cache(schema);

  cache.transform([{op: 'add', path: 'planet/1', value: {name: 'Earth'}}]);

  deepEqual(cache.transform([{op: 'remove', path: 'planet/2'}]).operations, [], 'operation was a noop');
});

test("#transform tracks refs and clears them from hasOne relationships when a referenced record is removed", function() {
  cache = new Cache(schema);

  var jupiter = {id: 'p1', name: 'Jupiter', __rel: {moons: {}}};
  var io = {id: 'm1', name: 'Io', __rel: {planet: 'p1'}};
  var europa = {id: 'm2', name: 'Europa', __rel: {planet: 'p1'}};

  cache.transform([{op: 'add', path: 'planet/p1', value: jupiter},
                   {op: 'add', path: 'moon/m1', value: io},
                   {op: 'add', path: 'moon/m2', value: europa}]);

  equal(cache.retrieve('moon/m1/__rel/planet'), 'p1', 'Jupiter has been assigned to Io');
  equal(cache.retrieve('moon/m2/__rel/planet'), 'p1', 'Jupiter has been assigned to Europa');

  cache.transform([{op: 'remove', path: 'planet/p1'}]);

  equal(cache.retrieve('planet/p1'), undefined, 'Jupiter is GONE');

  equal(cache.retrieve('moon/m1/__rel/planet'), undefined, 'Jupiter has been cleared from Io');
  equal(cache.retrieve('moon/m2/__rel/planet'), undefined, 'Jupiter has been cleared from Europa');
});

test("#transform tracks refs and clears them from hasMany relationships when a referenced record is removed", function() {
  cache = new Cache(schema);

  var io = {id: 'm1', name: 'Io', __rel: {planet: null}};
  var europa = {id: 'm2', name: 'Europa', __rel: {planet: null}};
  var jupiter = {id: 'p1', name: 'Jupiter', __rel: {moons: {'m1': true, 'm2': true}}};

  cache.transform([{op: 'add', path: 'moon/m1', value: io},
                   {op: 'add', path: 'moon/m2', value: europa},
                   {op: 'add', path: 'planet/p1', value: jupiter}]);

  equal(cache.retrieve('/planet/p1/__rel/moons/m1'), true, 'Jupiter has been assigned to Io');
  equal(cache.retrieve('/planet/p1/__rel/moons/m2'), true, 'Jupiter has been assigned to Europa');

  cache.transform([{op: 'remove', path: '/moon/m1'}]);
  equal(cache.retrieve('/moon/m1'), null, 'Io is GONE');

  cache.transform([{op: 'remove', path: '/moon/m2'}]);
  equal(cache.retrieve('/moon/m2'), null, 'Europa is GONE');

  equal(cache.retrieve('/planet/p1/__rel/moons/m1'), null, 'Io has been cleared from Jupiter');
  equal(cache.retrieve('/planet/p1/__rel/moons/m2'), null, 'Europa has been cleared from Jupiter');
});

test("for a sparse cache, adds link to hasMany if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'add', path: ['planet', 'p1', '__rel', 'moons', 'moon1'], value: true};

  var result = cache.transform([operation]);
  equalOps(result.operations, [operation], "didn't apply transform");
});

test("for a non-sparse cache, does not add link to hasMany if record doesn't exist", function(){
  cache = new Cache(schema, {sparse: false});
  var operation = {op: 'add', path: ['planet', 'p1', '__rel', 'moons', 'moon1'], value: true};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not remove link from hasMany if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'remove', path: ['planet', 'p1', '__rel', 'moons', 'moon1'], value: true};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("for a sparse cache, adds (instead of replaces) hasOne if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'replace', path: ['moon', 'moon1', '__rel', 'planet'], value: "p1"};

  var result = cache.transform([operation]);
  equalOps(result.operations, [operation], "didn't apply transform");
});

test("for a non-sparse cache, does not replace hasOne if record doesn't exist", function(){
  cache = new Cache(schema, {sparse: false});
  var operation = {op: 'replace', path: ['moon', 'moon1', '__rel', 'planet'], value: "p1"};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not remove hasOne link if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'remove', path: ['moon', 'moon1', '__rel', 'planet'], value: "p1"};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not add link to hasMany if link already exists", function(){
  cache = new Cache(schema);
  var jupiter = { id: 'p1', name: "Jupiter", __rel: { moons: { 'm1': true } } };
  cache.transform([{op: 'add', path: ['planet', jupiter.id], value: jupiter }]);

  var operation = {op: 'replace', path: ['planet', jupiter.id, '__rel', 'moons', 'm1'], value: true};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("test does not remove link from hasMany if link doesn't exist", function(){
  cache = new Cache(schema);
  var jupiter = { id: 'p1', name: "Jupiter", __rel: { moons: {} } };
  cache.transform([{op: 'add', path: ['planet', jupiter.id], value: jupiter }]);

  var operation = {op: 'remove', path: ['planet', jupiter.id, '__rel', 'moons', 'm1']};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not replace hasOne if link already exists", function(){
  cache = new Cache(schema);
  var europa = { id: 'm1', name: "Europe", __rel: { planet: 'p1' } };
  cache.transform([{op: 'add', path: ['moon', europa.id], value: europa }]);

  var operation = {op: 'replace', path: ['moon', europa.id, '__rel', 'planet'], value: 'p1'};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not remove hasOne if link doesn't exist", function(){
  cache = new Cache(schema);
  var europa = { id: 'm1', name: "Europe" };
  cache.transform([{op: 'add', path: ['moon', europa.id], value: europa }]);

  var operation = {op: 'remove', path: ['moon', europa.id, '__rel', 'planet']};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("#transform removing model with a bi-directional hasOne", function() {
  expect(6);

  var hasOneSchema = new Schema({
    models: {
      one: {
        links: {
          two: { type: 'hasOne', model: 'two', inverse: 'one' }
        }
      },
      two: {
        links: {
          one: { type: 'hasOne', model: 'one', inverse: 'two' }
        }
      },
    }
  });
  cache = new Cache(hasOneSchema);
  cache.transform([
    {
      op: 'add', path: 'one/one',
      value: {
        id: 'one',
        __rel: { two: null },
      }
    },
    {
      op: 'add', path: 'two/two',
      value: {
        id: 'two',
        __rel: { one: 'one' },
      }
    }
  ]);
  var one = cache.retrieve(['one', 'one']);
  var two = cache.retrieve(['two', 'two']);
  ok(one, 'one exists');
  ok(two, 'two exists');
  equal(one.__rel.two, 'two', 'one links to two');
  equal(two.__rel.one, 'one', 'two links to one');

  var result = cache.transform([{ op: 'remove', path: 'two/two' }]);
  strictEqual(one.__rel.two, null, 'ones link to two got removed');

  deepEqual(
    result.inverseOperations,
    [
      {
        op: 'add',
        path: ['two', 'two'],
        value: {
          id: 'two',
          __rel: {
            one: 'one'
          }
        }
      },
      {
        op: 'replace',
        path: ['one', 'one', '__rel', 'two'],
        value: 'two'
      }
    ],
    'inverse ops match'
  );
});

test("#transform removes dependent records", function() {
  // By making this schema recursively dependent remove we check that recursive
  // works as well.
  var dependentSchema = new Schema({
    models: {
      planet: {
        links: {
          moons: {type: 'hasMany', model: 'moon', dependent: 'remove'}
        }
      },
      moon: {
        links: {
          planet: {type: 'hasOne', model: 'planet', dependent: 'remove'}
        }
      }
    }
  });
  cache = new Cache(dependentSchema);

  var jupiter = {id: 'p1', name: 'Jupiter', __rel: {moons: {}}};
  var io = {id: 'm1', name: 'Io', __rel: {planet: 'p1'}};
  var europa = {id: 'm2', name: 'Europa', __rel: {planet: 'p1'}};

  cache.transform([
    {op: 'add', path: 'planet/p1', value: jupiter},
    {op: 'add', path: 'moon/m1', value: io},
    {op: 'add', path: 'moon/m2', value: europa},
    {op: 'add', path: 'planet/p1/__rel/moons/m1', value: true },
    {op: 'add', path: 'planet/p1/__rel/moons/m2', value: true }
  ]);

  // Removing the moon should remove the planet should remove the other moon
  var result = cache.transform([{op: 'remove', path: 'moon/m1'}]);

  equal(cache.length('moon'), 0, 'No moons left in store');
  equal(cache.length('planet'), 0, 'No planets left in store');

  deepEqual(
    result.inverseOperations,
    [
      {
        op: 'add',
        path: ['moon', 'm1'],
        value: {
          id: 'm1',
          name: 'Io',
          __rel: {
            planet: 'p1'
          }
        }
      },
      {
        op: 'add',
        path: ['planet', 'p1'],
        value: {
          id: 'p1',
          name: 'Jupiter',
          __rel: {
            moons: {
              'm1': true,
              'm2': true
            }
          }
        },
      },
      {
        op: 'add',
        path: ['moon', 'm2'],
        value: {
          id: 'm2',
          name: 'Europa',
          __rel: {
            planet: 'p1'
          }
        }
      }
    ],
    'inverse ops match'
  );
});

test("#transform does not remove non-dependent records", function() {
  var dependentSchema = new Schema({
    models: {
      planet: {
        links: {
          moons: {type: 'hasMany', model: 'moon'}
        }
      },
      moon: {
        links: {
          planet: {type: 'hasOne', model: 'planet'}
        }
      }
    }
  });
  cache = new Cache(dependentSchema);

  var jupiter = {id: 'p1', name: 'Jupiter', __rel: {moons: {}}};
  var io = {id: 'm1', name: 'Io', __rel: {planet: 'p1'}};
  var europa = {id: 'm2', name: 'Europa', __rel: {planet: 'p1'}};

  cache.transform([
    {op: 'add', path: 'planet/p1', value: jupiter},
    {op: 'add', path: 'moon/m1', value: io},
    {op: 'add', path: 'moon/m2', value: europa},
    {op: 'add', path: 'planet/p1/__rel/moons/m1', value: true },
    {op: 'add', path: 'planet/p1/__rel/moons/m2', value: true }
  ]);

  // Since there are no dependent relationships, no other records will be
  // removed
  var result = cache.transform([{op: 'remove', path: 'moon/m1'}]);
  equal(cache.length('moon'), 1, 'One moon left in store');
  equal(cache.length('planet'), 1, 'One planet left in store');

  deepEqual(
    result.inverseOperations,
    [
      {
        op: 'add',
        path: ['moon', 'm1'],
        value: {
          id: 'm1',
          name: 'Io',
          __rel: {
            planet: 'p1'
          }
        }
      }
    ],
    'inverse ops match'
  );
});
