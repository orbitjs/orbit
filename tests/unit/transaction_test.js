import Orbit from 'orbit/core';
import MemoryStore from 'orbit/sources/memory_store';
import Transaction from 'orbit/transaction';
import RSVP from 'rsvp';

var store;

///////////////////////////////////////////////////////////////////////////////

module("Unit - Transaction", {
  setup: function() {
    Orbit.Promise = RSVP.Promise;

    var schema = {
      models: {
        planet: {
        }
      }
    };

    store = new MemoryStore({schema: schema});
  },

  teardown: function() {
    store = null;
    Orbit.Promise = null;
  }
});

test("can track operations when records are added to an empty store", function() {
  expect(4);

  var transaction = new Transaction(store);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  RSVP.all([
    store.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    store.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    store.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    start();
    equal(store.length('planet'), 3, 'store should contain 3 records');
    transaction.commit();
    equal(transaction.ops.length, 3, 'transaction should contain operations');
    equal(transaction.inverseOps.length, 3, 'transaction should contain inverse operations');
  });
});

test("can track and invert operations when records are added to an empty store", function() {
  expect(5);

  var transaction = new Transaction(store);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  RSVP.all([
    store.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    store.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    store.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(store.length('planet'), 3, 'store should contain 3 records');
    equal(transaction.ops.length, 3, 'transaction should contain operations');
    equal(transaction.inverseOps.length, 3, 'transaction should contain inverse operations');

    transaction.rollback().then(function() {
      start();
      equal(store.length('planet'), 0, 'store should be empty');
    });
  });
});

test("can track and invert operations performed after records are already present in a store", function() {
  expect(6);

  equal(store.length('planet'), 0, 'store should be empty');

  stop();
  RSVP.all([
    store.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    store.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    store.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(store.length('planet'), 3, 'store should contain 3 records');

    var transaction = new Transaction(store);

    RSVP.all([
      store.add('planet', {name: 'Saturn', classification: 'gas giant', atmosphere: true}),
      store.add('planet', {name: 'Mars', classification: 'terrestrial', atmosphere: false})
    ]).then(function() {
      equal(store.length('planet'), 5, 'store should contain records');
      equal(transaction.ops.length, 2, 'transaction should contain operations');
      equal(transaction.inverseOps.length, 2, 'transaction should contain inverse operations');

      transaction.rollback().then(function() {
        start();
        equal(store.length('planet'), 3, 'store should contain records added before transaction began');
      });
    });
  });
});
