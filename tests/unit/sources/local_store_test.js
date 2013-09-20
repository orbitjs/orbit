import LocalStore from 'orbit/sources/local_store';
import RSVP from 'rsvp';

var dogs;

///////////////////////////////////////////////////////////////////////////////

module("Unit - LocalStore", {
  setup: function() {
    dogs = new LocalStore();
  },

  teardown: function() {
    dogs = null;
  }
});

test("it exists", function() {
  ok(dogs);
});

test("it can insert records and assign ids", function() {
  expect(6);

  equal(dogs.length, 0, 'store should be empty');

  stop();
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(dogs.length, 1, 'store should contain one record');
    ok(dog.id, 'id should be defined');
    equal(dog.name, 'Hubert', 'name should match');
    equal(dog.gender, 'm', 'gender should match');
    return dog;

  }).then(function(dog) {
    dogs.find(dog.id).then(function(foundDog) {
      start();
      equal(foundDog.id, dog.id, 'record can be looked up by id');
    });
  });
});

test("it can update records", function() {
  expect(8);

  equal(dogs.length, 0, 'store should be empty');

  var original;

  stop();
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    dogs.updateRecord({id: dog.id, name: 'Beatrice', gender: 'f'}).then(function(updatedDog) {
      equal(updatedDog.id, dog.id, 'id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'f', 'gender has been updated');
    })
    return dog;

  }).then(function(dog) {
    dogs.find(dog.id).then(function(foundDog) {
      start();
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.id, dog.id, 'record can be looked up by id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'f', 'gender has been updated');
    });
  });
});

test("it can patch records", function() {
  expect(8);

  equal(dogs.length, 0, 'store should be empty');

  var original;

  stop();
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    original = dog;
    dogs.patchRecord({id: dog.id, name: 'Beatrice'}).then(function(updatedDog) {
      equal(updatedDog.id, dog.id, 'id remains the same');
      equal(updatedDog.name, 'Beatrice', 'name has been updated');
      equal(updatedDog.gender, 'm', 'gender has not been updated');
    })
    return dog;

  }).then(function(dog) {
    dogs.find(dog.id).then(function(foundDog) {
      start();
      strictEqual(foundDog, original, 'still the same object as the one originally inserted');
      equal(foundDog.id, dog.id, 'record can be looked up by id');
      equal(foundDog.name, 'Beatrice', 'name has been updated');
      equal(foundDog.gender, 'm', 'gender has not been updated');
    });
  });
});

test("it can destroy records", function() {
  expect(3);

  equal(dogs.length, 0, 'store should be empty');

  stop();
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    equal(dogs.length, 1, 'store should contain one record');

    dogs.destroyRecord({id: dog.id}).then(function() {
      start();
      equal(dogs.length, 0, 'store should be empty');
    })
  });
});

test("it can find all records", function() {
  expect(3);

  equal(dogs.length, 0, 'store should be empty');

  stop();
  RSVP.all([
    dogs.insertRecord({name: 'Hubert', gender: 'm'}),
    dogs.insertRecord({name: 'Beatrice', gender: 'f'}),
    dogs.insertRecord({name: 'Winky', gender: 'm'})
  ]).then(function() {
    equal(dogs.length, 3, 'store should contain 3 dogs');

    dogs.find().then(function(allDogs) {
      start();
      equal(allDogs.length, 3, 'find() should return all records');
    });
  });
});

test("it can use a custom id field", function() {
  expect(2);

  dogs.idField = '_localStoreId';

  stop();
  dogs.insertRecord({name: 'Hubert', gender: 'm'}).then(function(dog) {
    ok(dog._localStoreId, 'custom id should be defined');
    return dog;

  }).then(function(dog) {
    dogs.find(dog._localStoreId).then(function(foundDog) {
      start();
      equal(foundDog._localStoreId, dog._localStoreId, 'record can be looked up by id');
    });
  });
});
