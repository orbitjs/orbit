import MemoryStore from 'orbit/sources/memory_store';
import RSVP from 'rsvp';

var primaryStore,
    backupStore;

///////////////////////////////////////////////////////////////////////////////

module("Integration - MemoryStore Sync", {
  setup: function() {
    primaryStore = new MemoryStore();
    backupStore = new MemoryStore();

    primaryStore.on('didInsertRecord',  backupStore.insertRecord);
    primaryStore.on('didUpdateRecord',  backupStore.updateRecord);
    primaryStore.on('didPatchRecord',   backupStore.patchRecord);
    primaryStore.on('didDestroyRecord', backupStore.destroyRecord);
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
  expect(7);

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(primaryStore.length, 1, 'store should contain one record');
    ok(dog.id, 'id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;

  }).then(function(dog) {
    backupStore.find(dog.id).then(function(backupDog) {
      start();
      equal(backupDog.id, dog.id,     'backup record has the same id');
      equal(backupDog.name, 'Hubert', 'backup record has the same name');
      equal(backupDog.gender, 'm',    'backup record has the same gender');
    });
  });
});

test("updates to records in the primary store should be automatically copied to the backup store", function() {
  expect(7);

  var original;

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    primaryStore.updateRecord({id: dog.id, name: 'Beatrice', gender: 'f'}).then(function(updatedDog) {
      equal(updatedDog.id, dog.id, 'id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'f', 'gender has been updated');
    })
    return dog;

  }).then(function(dog) {
      backupStore.find(dog.id).then(function(backupDog) {
      start();
      strictEqual(backupDog, original, 'still the same object as the one originally inserted');
      equal(backupDog.id, dog.id, 'record can be looked up by id');
      equal(backupDog.name, 'Beatrice', 'name has been updated');
      equal(backupDog.gender, 'f', 'gender has been updated');
    });
  });
});

test("patches to records in the primary store should be automatically copied to the backup store", function() {
  expect(7);

  var original;

  stop();
  primaryStore.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    primaryStore.patchRecord({id: dog.id, name: 'Beatrice'}).then(function(updatedDog) {
      equal(updatedDog.id, dog.id, 'id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'm', 'gender has not been updated');
    })
    return dog;

  }).then(function(dog) {
    backupStore.find(dog.id).then(function(backupDog) {
      start();
      strictEqual(backupDog, original, 'still the same object as the one originally inserted');
      equal(backupDog.id, dog.id, 'record can be looked up by id');
      equal(backupDog.name, 'Beatrice', 'name has been updated');
      equal(backupDog.gender, 'm', 'gender has not been updated');
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

    primaryStore.destroyRecord({id: dog.id}).then(function() {
      start();
      equal(primaryStore.length, 0, 'primary store should be empty');
      equal(backupStore.length, 0, 'backup store should be empty');
    })
  });
});

