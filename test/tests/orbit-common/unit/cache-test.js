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
          relationships: {
            moons: {type: 'hasMany', model: 'moon'}
          }
        },
        moon: {
          relationships: {
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

  var earth = {type: 'planet', id: '1', attributes: {name: 'Earth'}};
  cache.transform([{op: 'add', path: 'planet/1', value: earth}]);
  deepEqual(cache.retrieve('planet/1'), earth, 'objects match in value');
  notStrictEqual(cache.retrieve('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test("#exists indicates whether a path exists", function() {
  cache = new Cache(schema);

  var earth = {type: 'planet', id: '1', attributes: {name: 'Earth'}};
  cache.transform([{op: 'add', path: 'planet/1', value: earth}]);
  equal(cache.exists('planet'), true, 'path exists');
  equal(cache.exists('planet/1'), true, 'path exists');
  equal(cache.exists('planet/1/id'), true, 'path exists');
  equal(cache.exists('planet/1/id/bogus'), false, 'path does not exist');
  equal(cache.exists('this/path/is/bogus'), false, 'path does not exist');
});

test("#hasDeleted by default just returns the inverse of #exists", function() {
  cache = new Cache(schema);

  var earth = {type: 'planet', id: '1', attributes: {name: 'Earth'}};
  cache.transform([{op: 'add', path: 'planet/1', value: earth}]);
  equal(cache.hasDeleted('planet'), !cache.exists('planet'), 'path exists');
  equal(cache.hasDeleted('planet/1'), !cache.exists('planet/1'), 'path exists');
  equal(cache.hasDeleted('planet/1/id/bogus'), !cache.exists('planet/1/id/bogus'), false, 'path does not exist');
});

test("#length returns the size of data at a path", function() {
  cache = new Cache(schema);

  equal(cache.length('notthere'), 0, 'returns 0 when an object does not exist at a path');

  cache.transform([{op: 'add', path: 'planet/1', value: {type: 'planet', id: '1', attributes: {name: 'Earth'}}},
                   {op: 'add', path: 'planet/2', value: {type: 'planet', id: '2', attributes: {name: 'Mars'}}}]);

  equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.transform([{op: 'add', path: 'planet/1/stuff', value: ['a', 'b', 'c']}]);

  equal(cache.length('planet/1/stuff'), 3, 'returns size of an array at a path');
});

test("#reset clears the cache by default", function() {
  cache = new Cache(schema);

  cache.transform([{op: 'add', path: 'planet/1', value: {type: 'planet', id: '1', attributes: {name: 'Earth'}}}]);
  cache.reset();
  deepEqual(cache.retrieve(), {});
});

test("#reset overrides the cache completely with the value specified", function() {
  cache = new Cache(schema);

  cache.transform([{op: 'add', path: 'planet/1', value: {type: 'planet', id: '1', attributes: {name: 'Earth'}}}]);

  var newData = {planet: {'2': {name: 'Mars'}}};
  cache.reset(newData);
  deepEqual(cache.retrieve(), newData);
});

test("#transform returns an empty array of `operations` when an operation is a noop", function() {
  cache = new Cache(schema);

  cache.transform([{op: 'add', path: 'planet/1', value: {type: 'planet', id: '1', attributes: {name: 'Earth'}}}]);

  deepEqual(cache.transform([{op: 'remove', path: 'planet/2'}]).operations, [], 'operation was a noop');
});

test("#transform tracks refs and clears them from hasOne relationships when a referenced record is removed", function() {
  cache = new Cache(schema);

  var jupiter = {type: 'planet', id: 'p1', attributes: {name: 'Jupiter'}, relationships: {moons: {data: undefined}}};
  var io = {type: 'moon', id: 'm1', attributes: {name: 'Io'}, relationships: {planet: {data: 'planet:p1'}}};
  var europa = {type: 'moon', id: 'm2', attributes: {name: 'Europa'}, relationships: {planet: {data: 'planet:p1'}}};

  cache.transform([{op: 'add', path: 'planet/p1', value: jupiter},
                   {op: 'add', path: 'moon/m1', value: io},
                   {op: 'add', path: 'moon/m2', value: europa}]);

  equal(cache.retrieve('moon/m1/relationships/planet/data'), 'planet:p1', 'Jupiter has been assigned to Io');
  equal(cache.retrieve('moon/m2/relationships/planet/data'), 'planet:p1', 'Jupiter has been assigned to Europa');

  cache.transform([{op: 'remove', path: 'planet/p1'}]);

  equal(cache.retrieve('planet/p1'), undefined, 'Jupiter is GONE');

  equal(cache.retrieve('moon/m1/relationships/planet/data'), undefined, 'Jupiter has been cleared from Io');
  equal(cache.retrieve('moon/m2/relationships/planet/data'), undefined, 'Jupiter has been cleared from Europa');
});

test("#transform tracks refs and clears them from hasMany relationships when a referenced record is removed", function() {
  cache = new Cache(schema);

  var io = {type: 'moon', id: 'm1', attributes: {name: 'Io'}, relationships: {planet: {data: null}}};
  var europa = {type: 'moon', id: 'm2', attributes: {name: 'Europa'}, relationships: {planet: {data: null}}};
  var jupiter = {type: 'planet', id: 'p1', attributes: {name: 'Jupiter'}, relationships: {moons: {data: {'moon:m1': true, 'moon:m2': true}}}};

  cache.transform([{op: 'add', path: 'moon/m1', value: io},
                   {op: 'add', path: 'moon/m2', value: europa},
                   {op: 'add', path: 'planet/p1', value: jupiter}]);

  equal(cache.retrieve('planet/p1/relationships/moons/data/moon:m1'), true, 'Jupiter has been assigned to Io');
  equal(cache.retrieve('planet/p1/relationships/moons/data/moon:m2'), true, 'Jupiter has been assigned to Europa');

  cache.transform([{op: 'remove', path: 'moon/m1'}]);
  equal(cache.retrieve('moon/m1'), null, 'Io is GONE');

  cache.transform([{op: 'remove', path: 'moon/m2'}]);
  equal(cache.retrieve('moon/m2'), null, 'Europa is GONE');

  equal(cache.retrieve('planet/p1/relationships/moons/data/moon:m1'), null, 'Io has been cleared from Jupiter');
  equal(cache.retrieve('planet/p1/relationships/moons/data/moon:m2'), null, 'Europa has been cleared from Jupiter');
});

test("for a sparse cache, adds link to hasMany if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'add', path: ['planet', 'p1', 'relationships', 'moons', 'data', 'moon:moon1'], value: true};

  var result = cache.transform([operation]);
  equalOps(result.operations, [operation], "applied transform");
});

test("for a non-sparse cache, does not add link to hasMany if record doesn't exist", function(){
  cache = new Cache(schema, {sparse: false});
  var operation = {op: 'add', path: ['planet', 'p1', 'relationships', 'moons', 'data', 'moon:moon1'], value: true};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not remove link from hasMany if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'remove', path: ['planet', 'p1', 'relationships', 'moons', 'data', 'moon:moon1'], value: true};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("for a sparse cache, adds (instead of replaces) hasOne if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'replace', path: ['moon', 'moon1', 'relationships', 'planet', 'data'], value: 'planet:p1'};

  var result = cache.transform([operation]);
  equalOps(result.operations, [operation], "applied transform");
});

test("for a non-sparse cache, does not replace hasOne if record doesn't exist", function(){
  cache = new Cache(schema, {sparse: false});
  var operation = {op: 'replace', path: ['moon', 'moon1', 'relationships', 'planet', 'data'], value: 'planet:p1'};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not remove hasOne link if record doesn't exist", function(){
  cache = new Cache(schema);
  var operation = {op: 'remove', path: ['moon', 'moon1', 'relationships', 'planet', 'data'], value: 'planet:p1'};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not add link to hasMany if link already exists", function(){
  cache = new Cache(schema);
  var jupiter = { id: 'p1', name: "Jupiter", relationships: { moons: { data: {'moon:m1': true} } } };
  cache.transform([{op: 'add', path: ['planet', jupiter.id], value: jupiter }]);

  var operation = {op: 'replace', path: ['planet', jupiter.id, 'relationships', 'moons', 'data', 'moon:m1'], value: true};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("test does not remove link from hasMany if link doesn't exist", function(){
  cache = new Cache(schema);
  var jupiter = { id: 'p1', name: "Jupiter", relationships: { moons: {} } };
  cache.transform([{op: 'add', path: ['planet', jupiter.id], value: jupiter }]);

  var operation = {op: 'remove', path: ['planet', jupiter.id, 'relationships', 'moons', 'data', 'moon:m1']};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not replace hasOne if link already exists", function(){
  cache = new Cache(schema);
  var europa = { id: 'm1', name: "Europe", relationships: { planet: {data: 'planet:p1'} } };
  cache.transform([{op: 'add', path: ['moon', europa.id], value: europa }]);

  var operation = {op: 'replace', path: ['moon', europa.id, 'relationships', 'planet', 'data'], value: 'planet:p1'};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("does not remove hasOne if link doesn't exist", function(){
  cache = new Cache(schema);
  var europa = { id: 'm1', name: "Europe" };
  cache.transform([{op: 'add', path: ['moon', europa.id], value: europa }]);

  var operation = {op: 'remove', path: ['moon', europa.id, 'relationships', 'planet']};

  var result = cache.transform([operation]);
  deepEqual(result.operations, [], "didn't apply transform");
});

test("#transform removing model with a bi-directional hasOne", function() {
  expect(5);

  var hasOneSchema = new Schema({
    models: {
      one: {
        relationships: {
          two: { type: 'hasOne', model: 'two', inverse: 'one' }
        }
      },
      two: {
        relationships: {
          one: { type: 'hasOne', model: 'one', inverse: 'two' }
        }
      },
    }
  });
  cache = new Cache(hasOneSchema);
  cache.transform([
    {
      op: 'add', path: 'one/1',
      value: {
        id: '1',
        type: 'one',
        relationships: {
          two: {data: undefined}
        },
      }
    },
    {
      op: 'add', path: 'two/2',
      value: {
        id: '2',
        type: 'two',
        relationships: {
          one: {data: 'one:1'}
        },
      }
    }
  ]);
  var one = cache.retrieve(['one', '1']);
  var two = cache.retrieve(['two', '2']);
  ok(one, 'one exists');
  ok(two, 'two exists');
  equal(one.relationships.two.data, 'two:2', 'one links to two');
  equal(two.relationships.one.data, 'one:1', 'two links to one');

  var result = cache.transform([{ op: 'remove', path: 'two/2' }]);
  strictEqual(one.relationships.two.data, undefined, 'ones link to two got removed');

  // TODO
  // deepEqual(
  //   result.inverseOperations,
  //   [
  //     {
  //       op: 'add',
  //       path: ['two', '2'],
  //       value: {
  //         type: 'two',
  //         id: '2',
  //         relationships: {
  //           one: {
  //             data: 'one:1'
  //           }
  //         }
  //       }
  //     },
  //     {
  //       op: 'replace',
  //       path: ['one', '1', 'relationships', 'two', 'data'],
  //       value: 'two:2'
  //     }
  //   ],
  //   'inverse ops match'
  // );
});

test("#transform removes dependent records", function() {
  // By making this schema recursively dependent remove we check that recursive
  // works as well.
  var dependentSchema = new Schema({
    models: {
      planet: {
        relationships: {
          moons: {type: 'hasMany', model: 'moon', dependent: 'remove'}
        }
      },
      moon: {
        relationships: {
          planet: {type: 'hasOne', model: 'planet', dependent: 'remove'}
        }
      }
    }
  });
  cache = new Cache(dependentSchema);

  var jupiter = {type: 'planet', id: 'p1', attributes: {name: 'Jupiter'}, relationships: {moons: {}}};
  var io = {type: 'moon', id: 'm1', attributes: {name: 'Io'}, relationships: {planet: {data: 'planet:p1'}}};
  var europa = {type: 'moon', id: 'm2', attributes: {name: 'Europa'}, relationships: {planet: {data: 'planet:p1'}}};

  cache.transform([
    {op: 'add', path: 'planet/p1', value: jupiter},
    {op: 'add', path: 'moon/m1', value: io},
    {op: 'add', path: 'moon/m2', value: europa},
    {op: 'add', path: 'planet/p1/relationships/moons/data/moon:m1', value: true },
    {op: 'add', path: 'planet/p1/relationships/moons/data/moon:m2', value: true }
  ]);

  // Removing the moon should remove the planet should remove the other moon
  var result = cache.transform([{op: 'remove', path: 'moon/m1'}]);

  equal(cache.length('moon'), 0, 'No moons left in store');
  equal(cache.length('planet'), 0, 'No planets left in store');

  // TODO
  // deepEqual(
  //   result.inverseOperations,
  //   [
  //     {
  //       op: 'add',
  //       path: ['moon', 'm1'],
  //       value: {
  //         id: 'm1',
  //         name: 'Io',
  //         relationships: {
  //           planet: 'p1'
  //         }
  //       }
  //     },
  //     {
  //       op: 'add',
  //       path: ['planet', 'p1'],
  //       value: {
  //         id: 'p1',
  //         name: 'Jupiter',
  //         relationships: {
  //           moons: {
  //             'm1': true,
  //             'm2': true
  //           }
  //         }
  //       },
  //     },
  //     {
  //       op: 'add',
  //       path: ['moon', 'm2'],
  //       value: {
  //         id: 'm2',
  //         name: 'Europa',
  //         relationships: {
  //           planet: 'p1'
  //         }
  //       }
  //     }
  //   ],
  //   'inverse ops match'
  // );
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

  var jupiter = {id: 'p1', name: 'Jupiter', relationships: {moons: {}}};
  var io = {id: 'm1', name: 'Io', relationships: {planet: 'p1'}};
  var europa = {id: 'm2', name: 'Europa', relationships: {planet: 'p1'}};

  cache.transform([
    {op: 'add', path: 'planet/p1', value: jupiter},
    {op: 'add', path: 'moon/m1', value: io},
    {op: 'add', path: 'moon/m2', value: europa},
    {op: 'add', path: 'planet/p1/relationships/moons/m1', value: true },
    {op: 'add', path: 'planet/p1/relationships/moons/m2', value: true }
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
          relationships: {
            planet: 'p1'
          }
        }
      }
    ],
    'inverse ops match'
  );
});

test("#retrieve will retrieve missing data from a `fallback` cache if one has been set", function(assert) {
  assert.expect(1);

  var fallbackCache = new Cache(schema);
  var mars = {name: 'Mars'};
  fallbackCache.reset({planet: {'2': mars}});

  cache = new Cache(schema, {fallback: fallbackCache});

  assert.deepEqual(cache.retrieve('planet/2'), mars, 'data retrieved from fallback');
});
