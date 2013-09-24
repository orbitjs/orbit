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

test("it can insert records and assign ids", function() {
  expect(7);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');
    ok(dog.id, 'id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;

  }).then(function(dog) {
    deepEqual(JSON.parse(window.localStorage.getItem(store.namespace)),
              {1: dog},
              'data in local storage matches expectations');
    store.find(dog.id).then(function(foundDog) {
      start();
      equal(foundDog.id, dog.id, 'record can be looked up by id');
    });
  });
});

test("it can update records", function() {
  expect(9);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    store.updateRecord({id: dog.id, name: 'Beatrice', gender: 'f'}).then(function(updatedDog) {
      equal(updatedDog.id, dog.id, 'id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'f', 'gender has been updated');
    });
    return dog;

  }).then(function(dog) {
    store.find(dog.id).then(function(foundDog) {
      start();
      deepEqual(JSON.parse(window.localStorage.getItem(store.namespace)),
                {1: dog},
                'data in local storage matches expectations');
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.id, dog.id, 'record can be looked up by id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'f', 'gender has been updated');
    });
  });
});

test("it can patch records", function() {
  expect(9);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    return dog;

  }).then(function(dog) {
    return store.patchRecord({id: dog.id, name: 'Beatrice'}).then(function(updatedDog) {
      equal(updatedDog.id, dog.id, 'id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'm', 'gender has not been updated');
      return updatedDog;
    });

  }).then(function(dog) {
    store.find(dog.id).then(function(foundDog) {
      start();
      deepEqual(JSON.parse(window.localStorage.getItem(store.namespace)),
                {1: dog},
                'data in local storage matches expectations');
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.id, dog.id, 'record can be looked up by id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'm', 'gender has not been updated');
    });
  });
});

test("it can destroy records", function() {
  expect(4);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');

    store.destroyRecord({id: dog.id}).then(function() {
      start();
      deepEqual(JSON.parse(window.localStorage.getItem(store.namespace)),
                {},
                'data in local storage matches expectations');
      equal(store.length, 0, 'store should be empty');
    });
  });
});

test("it can find all records", function() {
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

test("it can use a custom id field", function() {
  expect(2);

  store.idField = '_localStoreId';

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    ok(dog._localStoreId, 'custom id should be defined');
    return dog;

  }).then(function(dog) {
    store.find(dog._localStoreId).then(function(foundDog) {
      start();
      equal(foundDog._localStoreId, dog._localStoreId, 'record can be looked up by id');
    });
  });
});

test("it can use a custom local storage namespace for storing data", function() {
  expect(1);

  store.namespace = 'dogs';

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    start();
    deepEqual(JSON.parse(window.localStorage.getItem('dogs')), {1: dog});
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

    deepEqual(JSON.parse(window.localStorage.getItem(store.namespace)),
              null,
              'local storage should still be empty');

    store.enableAutosave();

    deepEqual(JSON.parse(window.localStorage.getItem(store.namespace)),
              {1: dog},
              'local storage should contain data');
  });
});

