import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';
import RSVP from 'rsvp';

var primaryStore,
    backupStore;

///////////////////////////////////////////////////////////////////////////////

module("Integration - MemoryStore Sync without Connector", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    primaryStore = new MemoryStore();
    backupStore = new MemoryStore();

    primaryStore.on('didInsertRecord',  function(data, record) { backupStore.insertRecord(record); });
    primaryStore.on('didUpdateRecord',  function(data, record) { backupStore.updateRecord(record); });
    primaryStore.on('didPatchRecord',   function(data, record) { backupStore.patchRecord(record); });
    primaryStore.on('didDestroyRecord', function(data, record) { backupStore.destroyRecord(record); });
  },

  teardown: function() {
    primaryStore = backupStore = null;
  }
});

test("both sources exist and are empty", function() {
  ok(primaryStore);
  ok(backupStore);

  equal(primaryStore.length, 0, 'store should be empty');
  equal(backupStore.length, 0, 'store should be empty');
});

test("records inserted into the primary store should be automatically copied to the backup store", function() {
  expect(9);

  var originalDog;

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    originalDog = dog;

    equal(primaryStore.length, 1, 'primary store should contain one record');
    equal(backupStore.length, 1, 'backup store should contain one record');

    ok(dog.__id, 'primary id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');

    backupStore.find(dog.__id).then(function(backupDog) {
      start();
      notStrictEqual(backupDog, originalDog, 'not the same object as the one originally inserted');
      equal(backupDog.__id, dog.__id, 'backup record has the same primary id');
      equal(backupDog.name, 'Hubert', 'backup record has the same name');
      equal(backupDog.gender, 'm',    'backup record has the same gender');
    });
  });
});

test("updates to records in the primary store should be automatically copied to the backup store", function() {
  expect(7);

  var originalDog;

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    originalDog = dog;

    primaryStore.updateRecord({__id: dog.__id, name: 'Beatrice', gender: 'f'}).then(function(updatedDog) {
      equal(updatedDog.__id, dog.__id, 'primary id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'f', 'gender has been updated');

    }).then(function() {
      backupStore.find(dog.__id).then(function(backupDog) {
        start();
        notStrictEqual(backupDog, originalDog, 'not the same object as the one originally inserted');
        equal(backupDog.__id, dog.__id, 'backup record has the same primary id');
        equal(backupDog.name, 'Beatrice', 'backup record has updated name');
        equal(backupDog.gender, 'f',      'backup record has udpated gender');
      });
    });
  });
});

test("patches to records in the primary store should be automatically copied to the backup store", function() {
  expect(7);

  var originalDog;

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    originalDog = dog;

    primaryStore.patchRecord({__id: dog.__id, name: 'Beatrice'}).then(function(updatedDog) {
      equal(updatedDog.__id, dog.__id, 'primary id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'm', 'gender has not been updated');

    }).then(function() {
      backupStore.find(dog.__id).then(function(backupDog) {
        start();
        notStrictEqual(backupDog, originalDog, 'not the same object as the one originally inserted');
        equal(backupDog.__id, dog.__id, 'backup record has the same primary id');
        equal(backupDog.name, 'Beatrice', 'backup record has updated name');
        equal(backupDog.gender, 'm',      'backup record has not udpated gender');
      });
    });
  });
});

test("records destroyed in the primary store should be automatically destroyed in the backup store", function() {
  expect(6);

  equal(primaryStore.length, 0, 'primary store should be empty');
  equal(backupStore.length, 0, 'backup store should be empty');

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(primaryStore.length, 1, 'primary store should contain one record');
    equal(backupStore.length, 1, 'backup store should contain one record');

    primaryStore.destroyRecord(dog.__id).then(function() {
      start();
      equal(primaryStore.length, 0, 'primary store should be empty');
      equal(backupStore.length, 0, 'backup store should be empty');
    });
  });
});
