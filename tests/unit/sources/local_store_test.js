import Orbit from 'orbit/core';
import LocalStore from 'orbit/sources/local_store';
import RSVP from 'rsvp';

var store;

///////////////////////////////////////////////////////////////////////////////

module("Unit - LocalStore", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    var schema = {
      idField: '__id',
      models: {
        planet: {
        }
      }
    };

    store = new LocalStore(schema, {autoload: false});
  },

  teardown: function() {
    window.localStorage.removeItem(store.namespace);
    store = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(store);
});

test("#add - can insert records and assign ids", function() {
  expect(7);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(store.length('planet'), 1, 'store should contain one record');
    ok(planet.__id, 'id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
    return planet;

  }).then(function(planet) {
    verifyLocalStorageContainsRecord(store.namespace, 'planet', planet);
    store.find('planet', planet.__id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, planet.id, 'record can be looked up by id');
    });
  });
});

test("#update - can update records", function() {
  expect(8);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return store.update('planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, '__id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');
      return updatedPlanet;
    });

  }).then(function(planet) {
    verifyLocalStorageContainsRecord(store.namespace, 'planet', planet);
    store.find('planet', planet.__id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });
  });
});

test("#patch - can patch records", function() {
  expect(6);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;

    store.patch('planet', planet.__id, 'name', 'Earth').then(function() {
      verifyLocalStorageContainsRecord(store.namespace, 'planet', planet);
      store.find('planet', planet.__id).then(function(foundPlanet) {
        start();
        strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
        equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
        equal(foundPlanet.name, 'Earth', 'name has been updated');
        equal(foundPlanet.classification, 'gas giant', 'classification has not been updated');
      });
    });
  });
});

test("#remove - can delete records", function() {
  expect(3);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(store.length('planet'), 1, 'store should contain one record');

    store.remove('planet', planet.__id).then(function() {
      start();
      equal(store.length('planet'), 0, 'store should be empty');
    });
  });
});

test("#find - can find all records", function() {
  expect(3);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  RSVP.all([
    store.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    store.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    store.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(store.length('planet'), 3, 'store should contain 3 records');

    store.find('planet').then(function(planets) {
      start();
      equal(planets.length, 3, 'find() should return all records');
    });
  });
});

test("it can use a custom local storage namespace for storing data", function() {
  expect(1);

  store.namespace = 'planets';

  stop();
  store.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    verifyLocalStorageContainsRecord(store.namespace, 'planet', planet);
  });
});

test("autosave can be disabled to delay writing to local storage", function() {
  expect(4);

  store.disableAutosave();

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    start();
    equal(store.length('planet'), 1, 'store should contain one record');
    verifyLocalStorageIsEmpty(store.namespace);

    store.enableAutosave();
    verifyLocalStorageContainsRecord(store.namespace, 'planet', planet);
  });
});

