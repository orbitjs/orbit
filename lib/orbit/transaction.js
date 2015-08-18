import { Class } from './lib/objects';

var Transaction = Class.extend({
  operations: null,
  inverseOperations: null,

  init: function(source, options) {
    this.source = source;

    options = options || {};
    var active = options.active !== undefined ? options.active : true;
    if (active) this.begin();
  },

  begin: function() {
    this.operations = [];
    this.inverseOperations = [];
    this._activate();
  },

  commit: function() {
    this._deactivate();
  },

  rollback: function() {
    this._deactivate();
    return this.source.transform(this.inverseOperations);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _activate: function() {
    this.source.on('didTransform', this._processTransform, this);
    this.active = true;
  },

  _deactivate: function() {
    this.source.off('didTransform', this._processTransform, this);
    this.active = false;
  },

  _processTransform: function(transform, result) {
    Array.prototype.push.apply(this.operations, result.operations);
    Array.prototype.push.apply(this.inverseOperations, result.inverseOperations);
  }
});

export default Transaction;
