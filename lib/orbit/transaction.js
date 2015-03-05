import { Class } from './lib/objects';

var Transaction = Class.extend({
  init: function(source, options) {
    this.source = source;

    options = options || {};
    var active = options.active !== undefined ? options.active : true;
    if (active) this.begin();
  },

  begin: function() {
    this.ops = [];
    this.inverseOps = [];
    this._activate();
  },

  commit: function() {
    this._deactivate();
  },

  rollback: function() {
    this._deactivate();
    return this.source.transform(this.inverseOps);
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

  _processTransform: function(op, inverseOps) {
    this.ops.push(op);
    this.inverseOps.push.apply(this.inverseOps, inverseOps);
  }
});

export default Transaction;
