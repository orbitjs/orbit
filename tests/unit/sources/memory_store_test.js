import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';
import RSVP from 'rsvp';

var store;

///////////////////////////////////////////////////////////////////////////////

module("Unit - MemoryStore", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    store = new MemoryStore();
  },

  teardown: function() {
    store = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(store);
});

test("#transform - can insert records and assign ids", function() {
  expect(6);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(store.length('planet'), 1, 'store should contain one record');
    ok(planet.__id, '__id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
    return planet;

  }).then(function(planet) {
    store.findRecord('planet', planet.__id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
      return planet;
    });
  });
});

test("#transform - throws an error when a record with a duplicate id is inserted", function() {
  expect(4);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(store.length('planet'), 1, 'store should contain one record');
    ok(planet.__id, '__id should be defined');
    return planet;

  }).then(function(planet) {
    store.transform('add', 'planet', {__id: planet.__id, name: 'Jupiter', classification: 'gas giant'}).then(null, function(e) {
      start();
      equal(e.constructor, 'AlreadyExistsException', 'duplicate error');
    });
  });
});

test("#transform - can update records", function() {
  expect(8);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return store.transform('replace', 'planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, '__id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });

  }).then(function(planet) {
    store.findRecord('planet', planet.__id).then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
      equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });
  });
});

test("#transform - can patch records", function() {
  expect(8);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return planet;

  }).then(function(planet) {
    return store.transform('patch', 'planet', {__id: planet.__id, name: 'Earth'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, '__id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'gas giant', 'classification has not been updated');
      return planet;
    });

  }).then(function(planet) {
    store.findRecord('planet', planet.__id).then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
      equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'gas giant', 'classification has not been updated');
      return planet;
    });
  });
});

test("#transform - can delete records", function() {
  expect(3);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(store.length('planet'), 1, 'store should contain one record');

    store.transform('remove', 'planet', {__id: planet.__id}).then(function() {
      start();
      equal(store.length('planet'), 0, 'store should be empty');
    });
  });
});

test("#findRecord - can find all records", function() {
  expect(3);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  RSVP.all([
    store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}),
    store.transform('add', 'planet', {name: 'Earth', classification: 'terrestrial'}),
    store.transform('add', 'planet', {name: 'Saturn', classification: 'gas giant'})
  ]).then(function() {
    equal(store.length('planet'), 3, 'store should contain 3 records');

    store.findRecord('planet').then(function(allPlanets) {
      start();
      equal(allPlanets.length, 3, 'findRecord() should return all records');
      return allPlanets;
    });
  });
});

test("#findRecord - can find records by one or more filters", function() {
  expect(5);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  RSVP.all([
    store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    store.transform('add', 'planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    store.transform('add', 'planet', {name: 'Venus', classification: 'terrestrial', atmosphere: true}),
    store.transform('add', 'planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(store.length('planet'), 4, 'store should contain 4 records');

    store.findRecord('planet', {classification: 'terrestrial', atmosphere: true}).then(function(allPlanets) {
      start();
      equal(allPlanets.length, 2, 'findRecord() should return all records');
      equal(allPlanets[0].name, 'Earth', 'first matching planet');
      equal(allPlanets[1].name, 'Venus', 'second matching planet');
      return allPlanets;
    });
  });
});

test("#createRecord - creates a record", function() {
  expect(6);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.createRecord('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    equal(store.length('planet'), 1, 'store should contain one record');
    ok(planet.__id, '__id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');
    return planet;

  }).then(function(planet) {
    store.findRecord('planet', planet.__id).then(function(foundPlanet) {
      start();
      equal(foundPlanet.__id, original.__id, 'record can be looked up by __id');
      return planet;
    });
  });
});

test("#updateRecord - can update records", function() {
  expect(8);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return store.updateRecord('planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, '__id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });

  }).then(function(planet) {
    store.findRecord('planet', planet.__id).then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
      equal(foundPlanet.__id, original.__id, 'record can be looked up by __id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'terrestrial', 'classification has been updated');
      return planet;
    });
  });
});

test("#patchRecord - can patch records", function() {
  expect(8);

  equal(store.length('planet'), 0, 'store should be empty');

  var original;

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    original = planet;
    return planet;

  }).then(function(planet) {
    return store.patchRecord('planet', {__id: planet.__id, name: 'Earth'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, '__id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'gas giant', 'classification has not been updated');
      return planet;
    });

  }).then(function(planet) {
    store.findRecord('planet', planet.__id).then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
      equal(foundPlanet.__id, planet.__id, 'record can be looked up by __id');
      equal(foundPlanet.name, 'Earth', 'name has been updated');
      equal(foundPlanet.classification, 'gas giant', 'classification has not been updated');
      return planet;
    });
  });
});

test("#deleteRecord - can destroy records", function() {
  expect(3);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  store.transform('add', 'planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(store.length('planet'), 1, 'store should contain one record');

    store.deleteRecord('planet', {__id: planet.__id}).then(function() {
      start();
      equal(store.length('planet'), 0, 'store should be empty');
    });
  });
});