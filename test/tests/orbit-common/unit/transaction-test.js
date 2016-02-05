import { equalOps } from 'tests/test-helper';
import Orbit from 'orbit/main';
import Schema from 'orbit-common/schema';
import Store from 'orbit-common/store';
import Transaction from 'orbit-common/transaction';
import { uuid } from 'orbit/lib/uuid';
import { Promise, all } from 'rsvp';
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

let store;
let schema;
let transaction;

module('OC - Transaction', {
  setup: function() {
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

    store = new Store({ schema });
  },

  teardown: function() {
    schema = null;
    store = null;
  }
});

test('requires the `baseStore` option', function(assert) {
  assert.throws(
    function() {
      let transaction = new Transaction({});
    },
    new Error('Assertion failed: `baseStore` must be supplied as an option when constructing a Transaction.')
  );
});

test('automatically begins by default', function(assert) {
  let transaction = store.createTransaction();
  assert.equal(transaction.active, true);
});

test('does not auto-begin if the `active` option = false', function(assert) {
  let transaction = store.createTransaction({ active: false });
  assert.equal(transaction.active, false);
});

test('once begun, tracks operations performed and inverse operations', function(assert) {
  assert.expect(3);
  const transaction = store.createTransaction();

  assert.equal(transaction.operations.length, 0, 'transaction has no operations');
  assert.equal(transaction.inverseOperations.length, 0, 'transaction has no inverse operations');

  return transaction
    .addRecord({ type: 'planet', name: 'Jupiter', attributes: { classification: 'gas giant' } })
    .then(planet => {
      equalOps(transaction.operations,
        [{ op: 'add', path: 'planet/' + planet.id, value: planet }],
        'transaction tracked `add` operation');
    });
});

test('`commit` applies operations to `baseStore`', function(assert) {
  assert.expect(1);
  const transaction = store.createTransaction();

  return transaction
    .addRecord({ type: 'planet', name: 'Jupiter', classification: 'gas giant' })
    .tap(() => transaction.commit())
    .then(jupiter => {
      assert.equal(store.cache.get(['planet', jupiter.id]).id, jupiter.id, 'base store has added planet');
    });
});

test('an unisolated transaction will retrieve missing data from its `baseStore`', function(assert) {
  assert.expect(2);

  const transaction = store.createTransaction();
  assert.equal(transaction.isolated, false, 'transactions are not isolated by default');

  return store.addRecord({ type: 'planet', name: 'Jupiter', classification: 'gas giant' })
    .then(planet => {
      assert.deepEqual(transaction.cache.get(['planet', planet.id]), planet, 'planet matches');
    });
});

test('an isolated transaction won\'t retrieve any data from its `baseStore`', function(assert) {
  assert.expect(2);

  var transaction = store.createTransaction({ isolated: true });

  assert.equal(transaction.isolated, true, 'transaction is isolated');

  return store
    .addRecord({ type: 'planet', name: 'Jupiter', classification: 'gas giant' })
    .then(planet => {
      assert.ok(!transaction.cache.get(['planet', planet.id]), 'transaction has no planets defined');
    });
});
