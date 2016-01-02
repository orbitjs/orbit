import Orbit from 'orbit/main';
import Store from './store';
import { assert } from 'orbit/lib/assert';
import { coalesceOperations } from 'orbit-common/lib/operations';

/**
 `Transaction` is a form of `Store` that isolates changes from a base
 store.

 A transaction has its own internal cache. By default, this cache will
 `retrieve` data from the base store if it's not defined. Alternatively, a
 transaction can be completely isolated from the base store by setting the
 `isolated` option to `true`. An isolated transaction's cache must be
 manually managed.

 Transactions are "begun" immediately by default. This means that they
 immediately begin tracking transforms applied to them. When `commit` is
 invoked, the transforms applied to the transaction will be coalesced and
 applied to the base store.

 @class Transaction
 @extends Store
 @namespace OC
 @param {OC.Schema} schema
 @param {Object}    [options]
 @param {OC.Store}  [options.baseStore] The transaction's base store (required).
 @param {Boolean}   [options.active=true] Should this transaction begin immediately on creation?
 @param {Boolean}   [options.isolated=false] Should this transaction's cache be completely isolated from the base source?
 @constructor
 */
var Transaction = Store.extend({
  active: false,
  isolated: false,
  operations: null,
  inverseOperations: null,

  init: function(options) {
    assert('Transaction constructor requires `options`', options);
    assert('`baseStore` must be supplied as an option when constructing a Transaction.', options.baseStore);
    var baseStore = this.baseStore = options.baseStore;

    options.schema = baseStore.schema;

    this.isolated = options.isolated === undefined ? false : options.isolated;

    if (!this.isolated) {
      options.cacheOptions = options.cacheOptions || {};
      options.cacheOptions.fallback = baseStore.cache;
    }

    this._super(options);

    if (options.active !== false) {
      this.begin();
    }
  },

  begin: function() {
    this.operations = [];
    this.inverseOperations = [];

    this._activate();
  },

  commit: function() {
    this._deactivate();

    var operations = this.operations;

    if (operations.length > 0) {
      operations = coalesceOperations(operations);
      return this.baseStore.transform(operations);
    } else {
      return Orbit.Promise.resolve();
    }
  },

  _activate: function() {
    if (!this.active) {
      this.cache.on('patch', this._processOperation, this);
      this.active = true;
    }
  },

  _deactivate: function() {
    if (this.active) {
      this.cache.off('patch', this._processOperation, this);
      this.active = false;
    }
  },

  _processOperation: function(operation) {
    this.operations.push(operation);
  }
});

export default Transaction;
