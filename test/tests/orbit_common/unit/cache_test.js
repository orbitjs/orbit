import Cache from 'orbit_common/cache';
import Schema from 'orbit_common/schema';

var schema,
    cache;

///////////////////////////////////////////////////////////////////////////////

module("OC - Cache", {
  setup: function() {
    schema = new Schema({
      models: {
        planet: {
          links: {
            moons: {type: 'hasMany', model: 'moon', inverse: 'planet'}
          }
        },
        moon: {
          links: {
            planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
          }
        }
      }
    });

    cache = new Cache(schema);
  },

  teardown: function() {
    schema = null;
  }
});

test("it exists", function() {
  ok(cache);
});

test("#transform sets data and #retrieve retrieves it", function() {
  var earth = {name: 'Earth'};
  cache.transform({op: 'add', path: 'planet/1', value: earth});
  deepEqual(cache.retrieve('planet/1'), earth, 'objects metch in value');
  notStrictEqual(cache.retrieve('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test("#length returns the size of data at a path", function() {
  equal(cache.length('planet'), 0, 'returns 0 when an object exists at a path but has no properties');
  equal(cache.length('notthere'), null, 'returns null when an object does not exist at a path');

  cache.transform({op: 'add', path: 'planet/1', value: {name: 'Earth'}});
  cache.transform({op: 'add', path: 'planet/2', value: {name: 'Mars'}});

  equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.transform({op: 'add', path: 'planet/1/stuff', value: ['a', 'b', 'c']});

  equal(cache.length('planet/1/stuff'), 3, 'returns size of an array at a path');
});

test("#reset clears the cache by default", function() {
  cache.transform({op: 'add', path: 'planet/1', value: {name: 'Earth'}});
  cache.reset();
  deepEqual(cache.retrieve(), {});
});

test("#reset overrides the cache completely with the value specified", function() {
  cache.transform({op: 'add', path: 'planet/1', value: {name: 'Earth'}});

  var newData = {planet: {'2': {name: 'Mars'}}};
  cache.reset(newData);
  deepEqual(cache.retrieve(), newData);
});
