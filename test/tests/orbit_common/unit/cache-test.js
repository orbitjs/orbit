import Orbit from 'orbit/main';
import Cache from 'orbit-common/cache';
import Schema from 'orbit-common/schema';
import { Promise } from 'rsvp';

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

test("#transform sets data and #retrieve retrieves it", function() {
  cache = new Cache(schema);

  var earth = {id: '1', name: 'Earth'};
  cache.transform({op: 'add', path: 'planet/1', value: earth});
  deepEqual(cache.retrieve('planet/1'), earth, 'objects metch in value');
  notStrictEqual(cache.retrieve('planet/1'), earth, 'objects don\'t match by reference because a clone has been cached');
});

test("#length returns the size of data at a path", function() {
  cache = new Cache(schema);

  equal(cache.length('planet'), 0, 'returns 0 when an object exists at a path but has no properties');
  equal(cache.length('notthere'), null, 'returns null when an object does not exist at a path');

  cache.transform({op: 'add', path: 'planet/1', value: {name: 'Earth'}});
  cache.transform({op: 'add', path: 'planet/2', value: {name: 'Mars'}});

  equal(cache.length('planet'), 2, 'returns count of objects at a path');

  cache.transform({op: 'add', path: 'planet/1/stuff', value: ['a', 'b', 'c']});

  equal(cache.length('planet/1/stuff'), 3, 'returns size of an array at a path');
});

test("#reset clears the cache by default", function() {
  cache = new Cache(schema);

  cache.transform({op: 'add', path: 'planet/1', value: {name: 'Earth'}});
  cache.reset();
  deepEqual(cache.retrieve(), {});
});

test("#reset overrides the cache completely with the value specified", function() {
  cache = new Cache(schema);

  cache.transform({op: 'add', path: 'planet/1', value: {name: 'Earth'}});

  var newData = {planet: {'2': {name: 'Mars'}}};
  cache.reset(newData);
  deepEqual(cache.retrieve(), newData);
});

test("#transform tracks refs by default, and clears them from hasOne relationships when a referenced record is removed", function() {
  cache = new Cache(schema);

  var jupiter = {id: 'p1', name: 'Jupiter', __rel: {moons: {}}};
  var io = {id: 'm1', name: 'Io', __rel: {planet: 'p1'}};
  var europa = {id: 'm2', name: 'Europa', __rel: {planet: 'p1'}};

  cache.transform({op: 'add', path: 'planet/p1', value: jupiter});
  cache.transform({op: 'add', path: 'moon/m1', value: io});
  cache.transform({op: 'add', path: 'moon/m2', value: europa});

  deepEqual(cache.retrieve('planet/p1/__rev'),
    {'/moon/m1/__rel/planet': true,
     '/moon/m2/__rel/planet': true});

  equal(cache.retrieve('/moon/m1/__rel/planet'), 'p1', 'Jupiter has been assigned to Io');
  equal(cache.retrieve('/moon/m2/__rel/planet'), 'p1', 'Jupiter has been assigned to Europa');

  cache.transform({op: 'remove', path: '/planet/p1'});

  equal(cache.retrieve('/planet/p1'), null, 'Jupiter is GONE');

  equal(cache.retrieve('/moon/m1/__rel/planet'), null, 'Jupiter has been cleared from Io');
  equal(cache.retrieve('/moon/m2/__rel/planet'), null, 'Jupiter has been cleared from Europa');
});

test("#transform tracks refs by default, and clears them from hasMany relationships when a referenced record is removed", function() {
  cache = new Cache(schema);

  var io = {id: 'm1', name: 'Io', __rel: {planet: null}};
  var europa = {id: 'm2', name: 'Europa', __rel: {planet: null}};
  var jupiter = {id: 'p1', name: 'Jupiter', __rel: {moons: {'m1': true, 'm2': true}}};

  cache.transform({op: 'add', path: 'moon/m1', value: io});
  cache.transform({op: 'add', path: 'moon/m2', value: europa});
  cache.transform({op: 'add', path: 'planet/p1', value: jupiter});

  deepEqual(cache.retrieve('moon/m1/__rev'),
    {'/planet/p1/__rel/moons/m1': true});

  equal(cache.retrieve('/planet/p1/__rel/moons/m1'), true, 'Jupiter has been assigned to Io');
  equal(cache.retrieve('/planet/p1/__rel/moons/m2'), true, 'Jupiter has been assigned to Europa');

  cache.transform({op: 'remove', path: '/moon/m1'});
  equal(cache.retrieve('/moon/m1'), null, 'Io is GONE');

  cache.transform({op: 'remove', path: '/moon/m2'});
  equal(cache.retrieve('/moon/m2'), null, 'Europa is GONE');

  equal(cache.retrieve('/planet/p1/__rel/moons/m1'), null, 'Io has been cleared from Jupiter');
  equal(cache.retrieve('/planet/p1/__rel/moons/m2'), null, 'Europa has been cleared from Jupiter');
});