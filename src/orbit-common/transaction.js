/* eslint-disable valid-jsdoc */
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
 @param {Boolean}   [options.autoCoalesce=true] Should operations be coalesced automatically on commit?
 @constructor
 */
export default class Transaction extends Store {
  constructor(options) {
    assert('Transaction constructor requires `options`', options);
    assert('`baseStore` must be supplied as an option when constructing a Transaction.', options.baseStore);

    options.schema = options.baseStore.schema;
    options.cacheOptions = options.cacheOptions || {};
    options.cacheOptions.base = options.baseStore.cache;

    super(options);

    this.baseStore = options.baseStore;
    this.active = false;
    this.autoCoalesce = options.autoCoalesce === undefined ? true : options.autoCoalesce;

    if (options.active !== false) {
      this.begin();
    }
  }

  begin() {
    this.operations = [];

    this._activate();
  }

  commit() {
    this._deactivate();

    if (this.autoCoalesce) {
      this.coalesce();
    }

    return this.baseStore.update(this.operations);
  }

  coalesce() {
    this.operations = coalesceOperations(this.operations);
  }

  _activate() {
    if (!this.active) {
      this.cache.on('patch', this._processOperation, this);
      this.active = true;
    }
  }

  _deactivate() {
    if (this.active) {
      this.cache.off('patch', this._processOperation, this);
      this.active = false;
    }
  }

  _processOperation(operation) {
    this.operations.push(operation);
  }
}

Store.prototype.createTransaction = function(options = {}) {
  options.baseStore = this;
  return new Transaction(options);
};
