import Schema from 'orbit-common/schema';
import Store from 'orbit-common/store';
import Network from 'orbit-common/network';
import Transaction from 'orbit-common/transaction';
import { uuid } from 'orbit/lib/uuid';
import {
  addRecord,
  replaceAttribute
} from 'orbit-common/transform/operators';

///////////////////////////////////////////////////////////////////////////////

let store;
let network;

module('OC - Transaction', {
  setup: function() {
    let schema = new Schema({
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

    network = new Network(schema);
    store = new Store({ network });
  },

  teardown: function() {
    network = null;
    store = null;
  }
});

test('requires the `baseStore` option', function(assert) {
  assert.throws(
    function() {
      // eslint-disable-next-line no-new
      new Transaction({});
    },
    new Error('Assertion failed: `baseStore` must be supplied as an option when constructing a Transaction.')
  );
});

test('automatically begins by default', function(assert) {
  let transaction = store.createTransaction();
  assert.equal(transaction.active, true);
});

test('starts with the same cache contents as the base store', function(assert) {
  const jupiter = network.initializeRecord({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  return store.update(addRecord(jupiter))
    .then(() => {
      assert.deepEqual(store.cache.get(['planet', jupiter.id]), jupiter, 'planet should be jupiter');

      let transaction = store.createTransaction();

      assert.deepEqual(transaction.cache.get(['planet', jupiter.id]), jupiter, 'planet should be jupiter');
    });
});

test('does not auto-begin if the `active` option = false', function(assert) {
  let transaction = store.createTransaction({ active: false });
  assert.equal(transaction.active, false);
});

test('once begun, tracks operations performed', function(assert) {
  assert.expect(3);

  const jupiter = network.initializeRecord({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });
  const transaction = store.createTransaction();

  assert.equal(transaction.operations.length, 0, 'transaction has no operations');

  return transaction.update(addRecord(jupiter))
    .then(transforms => {
      const operations = transforms.map(t => t.operations).reduce((a, b) => a.concat(b));

      assert.equal(transaction.operations.length, 1, 'transaction has one operation');
      assert.deepEqual(transaction.operations,
        operations,
        'transaction tracked `add` operation');
    });
});

test('#commit applies coalesced operations to `baseStore`', function(assert) {
  assert.expect(2);

  const jupiter = network.initializeRecord({ type: 'planet', attributes: { name: 'Jupiter', classification: 'gas giant' } });

  const transaction = store.createTransaction();

  return transaction.update([
    addRecord(jupiter),
    replaceAttribute(jupiter, 'classification', 'terrestrial')
  ])
    .then(() => transaction.commit())
    .then(() => {
      assert.equal(transaction.operations.length, 1, 'operations have been coalesced');
      assert.equal(store.cache.get(['planet', jupiter.id]).id, jupiter.id, 'base store has added planet');
    });
});

// test('an unisolated transaction will retrieve missing data from its `baseStore`', function(assert) {
//   assert.expect(2);
//
//   const transaction = store.createTransaction();
//   assert.equal(transaction.isolated, false, 'transactions are not isolated by default');
//
//   return store.addRecord({ type: 'planet', name: 'Jupiter', classification: 'gas giant' })
//     .then(planet => {
//       assert.deepEqual(transaction.cache.get(['planet', planet.id]), planet, 'planet matches');
//     });
// });
//
// test('an isolated transaction won\'t retrieve any data from its `baseStore`', function(assert) {
//   assert.expect(2);
//
//   var transaction = store.createTransaction({ isolated: true });
//
//   assert.equal(transaction.isolated, true, 'transaction is isolated');
//
//   return store
//     .addRecord({ type: 'planet', name: 'Jupiter', classification: 'gas giant' })
//     .then(planet => {
//       assert.ok(!transaction.cache.get(['planet', planet.id]), 'transaction has no planets defined');
//     });
// });
