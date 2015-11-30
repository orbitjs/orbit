import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import MemorySource from 'orbit-common/memory-source';
import Transaction from 'orbit-common/transaction';
import { uuid } from 'orbit/lib/uuid';
import { Promise, all } from 'rsvp';
import { equalOps } from 'tests/test-helper';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from 'orbit-common/lib/operations';

///////////////////////////////////////////////////////////////////////////////

var source;
var schema;
var transaction;

module('OC - Transaction', {
  setup: function() {
    Orbit.Promise = Promise;

    schema = new Schema({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' }
          },
          relationships: {
            moons: { type: 'hasMany', model: 'moon', inverse: 'planet' }
          },
          keys: {
            id: { primaryKey: true, defaultValue: uuid }
          }
        },
        moon: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
          }
        }
      }
    });

    source = new MemorySource({ schema: schema });
  },

  teardown: function() {
    schema = null;
    source = null;
    Orbit.Promise = null;
  }
});

test('it exists', function(assert) {
  var transaction = new Transaction({ baseSource: source });
  assert.ok(transaction);
});

test('requires the `baseSource` option', function(assert) {
  assert.throws(
    function() {
      var transaction = new Transaction({});
    },
    new Error('Assertion failed: `baseSource` must be supplied as an option when constructing a Transaction.')
  );
});

test('automatically begins by default', function(assert) {
  var transaction = new Transaction({ baseSource: source });
  assert.equal(transaction.active, true);
});

test('does not auto-begin if the `active` option = false', function(assert) {
  var transaction = new Transaction({ baseSource: source, active: false });
  assert.equal(transaction.active, false);
});

// TODO - Restore tests once Transaction inherits from Store
//
// test("once begun, tracks operations performed and inverse operations", function(assert) {
//   assert.expect(4);
//
//   var transaction = new Transaction({baseSource: source});
//
//   assert.equal(transaction.operations.length, 0, 'transaction has no operations');
//   assert.equal(transaction.inverseOperations.length, 0, 'transaction has no inverse operations');
//
//   return transaction.add('planet', {name: 'Jupiter', classification: 'gas giant'})
//     .then(function(planet) {
//       equalOps(transaction.operations,
//         [{op: 'add', path: 'planet/' + planet.id, value: planet}],
//         'transaction tracked `add` operation');
//
//       equalOps(transaction.inverseOperations,
//         [{op: 'remove', path: 'planet/' + planet.id}],
//         'transaction tracked inverse operations');
//     });
// });
//
// test("`commit` applies operations to `baseSource`", function(assert) {
//   assert.expect(3);
//
//   var transaction = new Transaction({baseSource: source});
//
//   assert.equal(source.length('planet'), 0, 'base source has no planets');
//
//   var jupiter;
//
//   return transaction.add('planet', {name: 'Jupiter', classification: 'gas giant'})
//     .then(function(planet) {
//       jupiter = planet;
//
//       return transaction.commit();
//     })
//     .then(function() {
//       assert.equal(source.length('planet'), 1, 'base source has a planet');
//       assert.deepEqual(source.retrieve(['planet', jupiter.id]), jupiter, 'planet matches');
//     });
// });
//
// test("an unisolated transaction will retrieve missing data from its `baseSource`", function(assert) {
//   assert.expect(3);
//
//   var transaction = new Transaction({baseSource: source});
//
//   assert.equal(transaction.isolated, false, 'transactions are not isolated by default');
//
//   return source.add('planet', {name: 'Jupiter', classification: 'gas giant'})
//     .then(function(planet) {
//       assert.equal(transaction.length('planet'), 1, 'transaction can retrieve planet from base source');
//       assert.deepEqual(transaction.retrieve(['planet', planet.id]), planet, 'planet matches');
//     });
// });
//
// test("an isolated transaction won't retrieve any data from its `baseSource`", function(assert) {
//   assert.expect(2);
//
//   var transaction = new Transaction({baseSource: source, isolated: true});
//
//   assert.equal(transaction.isolated, true, 'transaction is isolated');
//
//   return source.add('planet', {name: 'Jupiter', classification: 'gas giant'})
//     .then(function(planet) {
//       assert.equal(transaction.length('planet'), 0, 'transaction has no planets defined');
//     });
// });
