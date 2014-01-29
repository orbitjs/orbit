import Orbit from 'orbit/main';
import Schema from 'orbit_common/schema';
import MemorySource from 'orbit_common/memory_source';
import Transaction from 'orbit/transaction';
import { Promise, all } from 'rsvp';

var source;

///////////////////////////////////////////////////////////////////////////////

module("Integration - Transaction", {
  setup: function() {
    Orbit.Promise = Promise;

    // Create schema
    var schema = new Schema({
      models: {
        planet: {}
      }
    });

    // Create source
    source = new MemorySource(schema);
  },

  teardown: function() {
    source = null;
    Orbit.Promise = null;
  }
});

test("can track operations when records are added to an empty source", function() {
  expect(4);

  var transaction = new Transaction(source);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    start();
    equal(source.length('planet'), 3, 'source should contain 3 records');
    transaction.commit();
    equal(transaction.ops.length, 3, 'transaction should contain operations');
    equal(transaction.inverseOps.length, 3, 'transaction should contain inverse operations');
  });
});

test("can track and invert operations when records are added to an empty source", function() {
  expect(5);

  var transaction = new Transaction(source);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');
    equal(transaction.ops.length, 3, 'transaction should contain operations');
    equal(transaction.inverseOps.length, 3, 'transaction should contain inverse operations');

    transaction.rollback().then(function() {
      start();
      equal(source.length('planet'), 0, 'source should be empty');
    });
  });
});

test("can track and invert operations performed after records are already present in a source", function() {
  expect(6);

  equal(source.length('planet'), 0, 'source should be empty');

  stop();
  all([
    source.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
    source.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true}),
    source.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})
  ]).then(function() {
    equal(source.length('planet'), 3, 'source should contain 3 records');

    var transaction = new Transaction(source);

    all([
      source.add('planet', {name: 'Saturn', classification: 'gas giant', atmosphere: true}),
      source.add('planet', {name: 'Mars', classification: 'terrestrial', atmosphere: false})
    ]).then(function() {
      equal(source.length('planet'), 5, 'source should contain records');
      equal(transaction.ops.length, 2, 'transaction should contain operations');
      equal(transaction.inverseOps.length, 2, 'transaction should contain inverse operations');

      transaction.rollback().then(function() {
        start();
        equal(source.length('planet'), 3, 'source should contain records added before transaction began');
      });
    });
  });
});
