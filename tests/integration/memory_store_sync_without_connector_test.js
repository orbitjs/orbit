import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';
import RSVP from 'rsvp';

var primaryStore,
    backupStore;

///////////////////////////////////////////////////////////////////////////////

module("Integration - MemoryStore Sync without Connector", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    var schema = {
      models: {
        planet: {
        }
      }
    };

    primaryStore = new MemoryStore(schema);
    backupStore = new MemoryStore(schema);

    primaryStore.on('didTransform',  backupStore.transform);
  },

  teardown: function() {
    primaryStore = backupStore = null;
  }
});

test("both sources exist and are empty", function() {
  ok(primaryStore);
  ok(backupStore);

  equal(primaryStore.length('planet'), 0, 'store should be empty');
  equal(backupStore.length('planet'), 0, 'store should be empty');
});

test("records inserted into the primary store should be automatically copied to the backup store", function() {
  expect(9);

  var originalPlanet;

  stop();
  primaryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    originalPlanet = planet;

    equal(primaryStore.length('planet'), 1, 'primary store should contain one record');
    equal(backupStore.length('planet'), 1, 'backup store should contain one record');

    ok(planet.__id, 'primary id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    backupStore.find('planet', planet.__id).then(function(backupPlanet) {
      start();
      notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
      equal(backupPlanet.__id, planet.__id, 'backup record has the same primary id');
      equal(backupPlanet.name, 'Jupiter', 'backup record has the same name');
      equal(backupPlanet.classification, 'gas giant', 'backup record has the same classification');
    });
  });
});

test("updates to records in the primary store should be automatically copied to the backup store", function() {
  expect(7);

  var originalPlanet;

  stop();
  primaryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    originalPlanet = planet;

    primaryStore.update('planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(function(updatedPlanet) {
      equal(updatedPlanet.__id, planet.__id, 'primary id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');

    }).then(function() {
      backupStore.find('planet', planet.__id).then(function(backupPlanet) {
        start();
        notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
        equal(backupPlanet.__id, planet.__id, 'backup record has the same primary id');
        equal(backupPlanet.name, 'Earth', 'backup record has updated name');
        equal(backupPlanet.classification, 'terrestrial', 'backup record has udpated classification');
      });
    });
  });
});

test("patches to records in the primary store should be automatically copied to the backup store", function() {
  expect(4);

  var originalPlanet;

  stop();
  primaryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    originalPlanet = planet;

    primaryStore.patch('planet', planet.__id, 'name', 'Earth').then(function() {
      backupStore.find('planet', planet.__id).then(function(backupPlanet) {
        start();
        notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
        equal(backupPlanet.__id, planet.__id, 'backup record has the same primary id');
        equal(backupPlanet.name, 'Earth', 'backup record has updated name');
        equal(backupPlanet.classification, 'gas giant', 'backup record has not udpated classification');
      });
    });
  });
});

test("records deleted in the primary store should be automatically deleted in the backup store", function() {
  expect(6);

  equal(primaryStore.length('planet'), 0, 'primary store should be empty');
  equal(backupStore.length('planet'), 0, 'backup store should be empty');

  stop();
  primaryStore.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(primaryStore.length('planet'), 1, 'primary store should contain one record');
    equal(backupStore.length('planet'), 1, 'backup store should contain one record');

    primaryStore.remove('planet', planet.__id).then(function() {
      start();
      equal(primaryStore.length('planet'), 0, 'primary store should be empty');
      equal(backupStore.length('planet'), 0, 'backup store should be empty');
    });
  });
});
