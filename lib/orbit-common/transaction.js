import Orbit from 'orbit/main';
import MemorySource from './memory-source';
import { assert } from 'orbit/lib/assert';
import { coalesceOperations } from 'orbit/lib/operations';

/**
 `Transaction` is a form of `MemorySource` that isolates changes from a base
 source.

 A transaction has its own internal cache. By default, this cache will
 `retrieve` data from the base source if it's not defined. Alternatively, a
 transaction can be completely isolated from the base source by setting the
 `isolated` option to `true`. An isolated transaction's cache must be
 manually managed.

 Transactions are "begun" immediately by default. This means that they
 immediately begin tracking transforms applied to them. When `commit` is
 invoked, the transforms applied to the transaction will be coalesced and
 applied to the base source.

 @class Transaction
 @extends MemorySource
 @namespace OC
 @param {OC.Schema} schema
 @param {Object}    [options]
 @param {OC.Source} [options.baseSource] The transaction's base source (required).
 @param {Boolean}   [options.active=true] Should this transaction begin immediately on creation?
 @param {Boolean}   [options.isolated=false] Should this transaction's cache be completely isolated from the base source?
 @constructor
 */
var Transaction = MemorySource.extend({
  active: false,
  isolated: false,
  operations: null,
  inverseOperations: null,

  init: function(options) {
    assert('Transaction constructor requires `options`', options);
    assert('`baseSource` must be supplied as an option when constructing a Transaction.', options.baseSource);
    var baseSource = this.baseSource = options.baseSource;

    options.schema = baseSource.schema;

    this._super(options);

    if (options.isolated !== undefined) {
      this.isolated = options.isolated;
    }

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
      return this.baseSource.transform(operations);

    } else {
      return Orbit.Promise.resolve();
    }
  },

  retrieve: function(path) {
    var result = this._super.apply(this, arguments);
    if (result === undefined && !this.isolated) {
      result = this.baseSource.retrieve(path);
      if (result !== undefined) {
        this._cloneData(path, result);
      }
    }
    return result;
  },

  _cloneData: function(path, value) {
    this.cache.transform([{
      op: 'add',
      path: path,
      value: value
    }]);
  },

  _activate: function() {
    if (!this.active) {
      this.on('didTransform', this._processTransform, this);
      this.active = true;
    }
  },

  _deactivate: function() {
    if (this.active) {
      this.off('didTransform', this._processTransform, this);
      this.active = false;
    }
  },

  _processTransform: function(transform, result) {
    Array.prototype.push.apply(this.operations, result.operations);
    Array.prototype.push.apply(this.inverseOperations, result.inverseOperations);
  }
});

export default Transaction;
