import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Source from 'orbit-common/source';
import MemorySource from 'orbit-common/memory-source';
import LocalStorageSource from 'orbit-common/local-storage-source';
import { all, Promise } from 'rsvp';
import { verifyLocalStorageContainsRecord, verifyLocalStorageIsEmpty } from 'tests/test-helper';

var source;

///////////////////////////////////////////////////////////////////////////////

module("OC - LocalStorageSource", {
  setup: function() {
    Orbit.Promise = Promise;

    var schema = new Schema({
      models: {
        planet: {}
      }
    });

    source = new LocalStorageSource({schema: schema, autoload: false});
  },

  teardown: function() {
    window.localStorage.removeItem(source.namespace);
    source = null;
    Orbit.Promise = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("its prototype chain is correct", function() {
  ok(source instanceof Source,       'instanceof Source');
  ok(source instanceof MemorySource, 'instanceof MemorySource');
});

test("#add - can insert records and assign ids", function() {
  expect(7);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      equal(source.length('planet'), 1, 'source should contain one record');
      ok(planet.id, 'id should be defined');
      equal(planet.attributes.name, 'Jupiter', 'name should match');
      equal(planet.attributes.classification, 'gas giant', 'classification should match');
      return planet;
    })
    .then(function(planet) {
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
      source.find('planet', planet.id).then(function(foundPlanet) {
        start();
        equal(foundPlanet.id, planet.id, 'record can be looked up by id');
      });
    });
});

test("#replaceRecord - can replace whole records", function() {
  expect(8);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      original = planet;
      return source.replaceRecord({type: 'planet', id: planet.id, attributes: {name: 'Earth', classification: 'terrestrial'}});
    })
    .then(function() {
      var updatedPlanet = source.retrieve(['planet', original.id]);
      equal(updatedPlanet.id, original.id, 'id remains the same');
      equal(updatedPlanet.attributes.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.attributes.classification, 'terrestrial', 'classification has been updated');

      verifyLocalStorageContainsRecord(source.namespace, 'planet', original.id, updatedPlanet);

      return source.find('planet', original.id);
    })
    .then(function(foundPlanet) {
      start();
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      equal(foundPlanet.attributes.name, 'Earth', 'name has been updated');
      equal(foundPlanet.attributes.classification, 'terrestrial', 'classification has been updated');
    });
});

test("#replaceAttribute - can update attributes", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  var original;

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      original = planet;
      return source.replaceAttribute(planet, 'name', 'Earth');
    })
    .then(function() {
      verifyLocalStorageContainsRecord(source.namespace, 'planet', original.id, original);
      return source.find('planet', original.id);
    })
    .then(function(foundPlanet) {
      start();
      strictEqual(foundPlanet, original, 'still the same object as the one originally inserted');
      equal(foundPlanet.id, original.id, 'record can be looked up by id');
      equal(foundPlanet.attributes.name, 'Earth', 'name has been updated');
      equal(foundPlanet.attributes.classification, 'gas giant', 'classification has not been updated');
    });
});

test("#removeRecord - can delete records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      equal(source.length('planet'), 1, 'source should contain one record');
      return source.removeRecord(planet);
    })
    .then(function() {
      start();
      equal(source.length('planet'), 0, 'source should be empty');
    });
});

test("#find - can find all records", function() {
  expect(3);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Earth', classification: 'terrestrial', atmosphere: true}}),
    source.addRecord({type: 'planet', attributes: {name: 'Mercury', classification: 'terrestrial', atmosphere: false}})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');
    source.find('planet').then(function(allPlanets) {
      start();
      equal(allPlanets.length, 3, 'find() should return all records');
      return allPlanets;
    });
  });
});

test("it can use a custom local storage namespace for storing data", function() {
  expect(1);

  source.namespace = 'planets';

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      start();
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});

test("autosave can be disabled to delay writing to local storage", function() {
  expect(4);

  source.disableAutosave();

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  source.addRecord({type: 'planet', attributes: {name: 'Jupiter', classification: 'gas giant'}})
    .then(function(planet) {
      start();
      equal(source.length('planet'), 1, 'source should contain one record');
      verifyLocalStorageIsEmpty(source.namespace);

      source.enableAutosave();
      verifyLocalStorageContainsRecord(source.namespace, 'planet', planet.id, planet);
    });
});
