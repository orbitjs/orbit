import Orbit from 'orbit/core';
import LocalStore from 'orbit/sources/local_store';
import RSVP from 'rsvp';

var store;

///////////////////////////////////////////////////////////////////////////////

module("Unit - LocalStore", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;
    store = new LocalStore();
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

test("#insertRecord - can insert records and assign ids", function() {
  expect(7);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');
    ok(dog.__id, 'id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;

  }).then(function(dog) {
    verifyLocalStorageContainsRecord(store.namespace, dog);
    store.find(dog.id).then(function(foundDog) {
      start();
      equal(foundDog.id, dog.id, 'record can be looked up by id');
    });
  });
});

test("#updateRecord - can update records", function() {
  expect(9);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    return store.updateRecord({__id: dog.__id, name: 'Beatrice', gender: 'f'}).then(function(updatedDog) {
      equal(updatedDog.__id, dog.__id, '__id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'f', 'gender has been updated');
      return dog;
    });

  }).then(function(dog) {
    verifyLocalStorageContainsRecord(store.namespace, dog);
    store.find(dog.__id).then(function(foundDog) {
      start();
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.__id, dog.__id, 'record can be looked up by __id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'f', 'gender has been updated');
      return dog;
    });
  });
});

test("#patchRecord - can patch records", function() {
  expect(9);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    return dog;

  }).then(function(dog) {
    return store.patchRecord({__id: dog.__id, name: 'Beatrice'}).then(function(updatedDog) {
      equal(updatedDog.__id, dog.__id, '__id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'm', 'gender has not been updated');
      return dog;
    });

  }).then(function(dog) {
    verifyLocalStorageContainsRecord(store.namespace, dog);
    store.find(dog.__id).then(function(foundDog) {
      start();
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.__id, dog.__id, 'record can be looked up by __id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'm', 'gender has not been updated');
      return dog;
    });
  });
});

test("#destroyRecord - can destroy records", function() {
  expect(5);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');

    store.destroyRecord({__id: dog.__id}).then(function(record) {
      start();
      equal(store.length, 0, 'store should be empty');
      ok(record.deleted, 'record should be marked `deleted`');
      verifyLocalStorageContainsRecord(store.namespace, record);
    });
  });
});

test("#find - can find all records", function() {
  expect(3);

  equal(store.length, 0, 'store should be empty');

  stop();
  RSVP.all([
    store.insertRecord({name: 'Hubert', gender: 'm'}),
    store.insertRecord({name: 'Beatrice', gender: 'f'}),
    store.insertRecord({name: 'Winky', gender: 'm'})
  ]).then(function() {
    equal(store.length, 3, 'store should contain 3 records');

    store.find().then(function(dogs) {
      start();
      equal(dogs.length, 3, 'find() should return all records');
    });
  });
});

test("it can use a custom local storage namespace for storing data", function() {
  expect(1);

  store.namespace = 'dogs';

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    verifyLocalStorageContainsRecord(store.namespace, dog);
  });
});

test("autosave can be disabled to delay writing to local storage", function() {
  expect(4);

  store.disableAutosave();

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    equal(store.length, 1, 'store should contain one record');
    verifyLocalStorageIsEmpty(store.namespace);

    store.enableAutosave();
    verifyLocalStorageContainsRecord(store.namespace, dog);
  });
});

