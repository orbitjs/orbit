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

test("#insertRecord - can insert records and assign ids", function() {
  expect(6);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');
    ok(dog.__id, '__id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;

  }).then(function(dog) {
    store.find(dog.__id).then(function(foundDog) {
      start();
      equal(foundDog.__id, dog.__id, 'record can be looked up by __id');
      return dog;
    });
  });
});

test("#insertRecord - throws an error when a record with a duplicate id is inserted", function() {
  expect(4);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');
    ok(dog.__id, '__id should be defined');
    return dog;

  }).then(function(dog) {
    store.insertRecord({__id: dog.__id, name: 'Hubert', gender: 'm'}).then(null, function(e) {
      start();
      equal(e, Orbit.ALREADY_EXISTS, 'duplicate error');
    });
  });
});

test("#updateRecord - can update records", function() {
  expect(8);

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
  expect(8);

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
  expect(3);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');

    store.destroyRecord({__id: dog.__id}).then(function() {
      start();
      equal(store.length, 0, 'store should be empty');
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

    store.find().then(function(allDogs) {
      start();
      equal(allDogs.length, 3, 'find() should return all records');
      return allDogs;
    });
  });
});

test("#find - can find records by one or more filters", function() {
  expect(5);

  equal(store.length, 0, 'store should be empty');

  stop();
  RSVP.all([
    store.insertRecord({name: 'Hubert', gender: 'm', species: 'dog'}),
    store.insertRecord({name: 'Beatrice', gender: 'f', species: 'dog'}),
    store.insertRecord({name: 'Winky', gender: 'm', species: 'dog'}),
    store.insertRecord({name: 'Gorbypuff', gender: 'm', species: 'cat'})
  ]).then(function() {
    equal(store.length, 4, 'store should contain 4 records');

    store.find({gender: 'm', species: 'dog'}).then(function(allDogs) {
      start();
      equal(allDogs.length, 2, 'find() should return all records');
      equal(allDogs[0].name, 'Hubert', 'first male dog');
      equal(allDogs[1].name, 'Winky', 'second male dog');
      return allDogs;
    });
  });
});

test("#create - creates a record", function() {
  expect(6);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.create({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    equal(store.length, 1, 'store should contain one record');
    ok(dog.__id, '__id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;

  }).then(function(dog) {
    store.find(dog.__id).then(function(foundDog) {
      start();
      equal(foundDog.__id, original.__id, 'record can be looked up by __id');
      return dog;
    });
  });
});

test("#update - can update records", function() {
  expect(8);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    return store.update({__id: dog.__id, name: 'Beatrice', gender: 'f'}).then(function(updatedDog) {
      equal(updatedDog.__id, dog.__id, '__id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'f', 'gender has been updated');
      return dog;
    });

  }).then(function(dog) {
    store.find(dog.__id).then(function(foundDog) {
      start();
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.__id, original.__id, 'record can be looked up by __id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'f', 'gender has been updated');
      return dog;
    });
  });
});

test("#patch - can patch records", function() {
  expect(8);

  equal(store.length, 0, 'store should be empty');

  var original;

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    return dog;

  }).then(function(dog) {
    return store.patch({__id: dog.__id, name: 'Beatrice'}).then(function(updatedDog) {
      equal(updatedDog.__id, dog.__id, '__id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'm', 'gender has not been updated');
      return dog;
    });

  }).then(function(dog) {
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

test("#destroy - can destroy records", function() {
  expect(3);

  equal(store.length, 0, 'store should be empty');

  stop();
  store.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(store.length, 1, 'store should contain one record');

    store.destroy({__id: dog.__id}).then(function() {
      start();
      equal(store.length, 0, 'store should be empty');
    });
  });
});