import Orbit from 'orbit/main';
import { uuid } from 'orbit/lib/uuid';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import { Promise } from 'rsvp';

var primarySource,
    backupSource;

///////////////////////////////////////////////////////////////////////////////

module("Integration - MemorySource Sync without Connector", {
  setup: function() {
    Orbit.Promise = Promise;

    // Create schema
    var schema = new Schema({
      modelDefaults: {
        keys: {
          '__id': {primaryKey: true, defaultValue: uuid},
          'id': {}
        }
      },
      models: {
        planet: {}
      }
    });

    // Create sources
    primarySource = new MemorySource(schema);
    backupSource = new MemorySource(schema);

    primarySource.on('didTransform', function(operation, inverses) {
      backupSource.transform(operation);
    });
  },

  teardown: function() {
    primarySource = backupSource = null;
  }
});

test("both sources exist and are empty", function() {
  ok(primarySource);
  ok(backupSource);

  equal(primarySource.length('planet'), 0, 'source should be empty');
  equal(backupSource.length('planet'), 0, 'source should be empty');
});

test("records inserted into the primary source should be automatically copied to the backup source", function() {
  expect(9);

  var originalPlanet;

  stop();
  primarySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    originalPlanet = planet;

    equal(primarySource.length('planet'), 1, 'primary source should contain one record');
    equal(backupSource.length('planet'), 1, 'backup source should contain one record');

    ok(planet.__id, 'primary id should be defined');
    equal(planet.name, 'Jupiter', 'name should match');
    equal(planet.classification, 'gas giant', 'classification should match');

    backupSource.find('planet', planet.__id).then(function(backupPlanet) {
      start();
      notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
      equal(backupPlanet.__id, planet.__id, 'backup record has the same primary id');
      equal(backupPlanet.name, 'Jupiter', 'backup record has the same name');
      equal(backupPlanet.classification, 'gas giant', 'backup record has the same classification');
    });
  });
});

test("updates to records in the primary source should be automatically copied to the backup source", function() {
  expect(7);

  var originalPlanet;

  stop();
  primarySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    originalPlanet = planet;

    primarySource.update('planet', {__id: planet.__id, name: 'Earth', classification: 'terrestrial'}).then(function() {
      var updatedPlanet = primarySource.retrieve(['planet', planet.__id]);
      equal(updatedPlanet.__id, planet.__id, 'primary id remains the same');
      equal(updatedPlanet.name, 'Earth', 'name has been updated');
      equal(updatedPlanet.classification, 'terrestrial', 'classification has been updated');

    }).then(function() {
      backupSource.find('planet', planet.__id).then(function(backupPlanet) {
        start();
        notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
        equal(backupPlanet.__id, planet.__id, 'backup record has the same primary id');
        equal(backupPlanet.name, 'Earth', 'backup record has updated name');
        equal(backupPlanet.classification, 'terrestrial', 'backup record has udpated classification');
      });
    });
  });
});

test("patches to records in the primary source should be automatically copied to the backup source", function() {
  expect(4);

  var originalPlanet;

  stop();
  primarySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    originalPlanet = planet;

    primarySource.patch('planet', planet.__id, 'name', 'Earth').then(function() {
      backupSource.find('planet', planet.__id).then(function(backupPlanet) {
        start();
        notStrictEqual(backupPlanet, originalPlanet, 'not the same object as the one originally inserted');
        equal(backupPlanet.__id, planet.__id, 'backup record has the same primary id');
        equal(backupPlanet.name, 'Earth', 'backup record has updated name');
        equal(backupPlanet.classification, 'gas giant', 'backup record has not udpated classification');
      });
    });
  });
});

test("records deleted in the primary source should be automatically deleted in the backup source", function() {
  expect(6);

  equal(primarySource.length('planet'), 0, 'primary source should be empty');
  equal(backupSource.length('planet'), 0, 'backup source should be empty');

  stop();
  primarySource.add('planet', {name: 'Jupiter', classification: 'gas giant'}).then(function(planet) {
    equal(primarySource.length('planet'), 1, 'primary source should contain one record');
    equal(backupSource.length('planet'), 1, 'backup source should contain one record');

    primarySource.remove('planet', planet.__id).then(function() {
      start();
      equal(primarySource.length('planet'), 0, 'primary source should be empty');
      equal(backupSource.length('planet'), 0, 'backup source should be empty');
    });
  });
});
