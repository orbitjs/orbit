import Orbit from 'orbit/core';
import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';
import eq from 'orbit/lib/eq';

var TransformConnector = function(source, target, options) {
  var _this = this;

  this.source = source;
  this.target = target;

  options = options || {};
  if (options.actions) this.actions = Orbit.arrayToOptions(options.actions);
  if (options.types) this.types = Orbit.arrayToOptions(options.types);
  this.blocking = options.blocking !== undefined ? options.blocking : true;
  var active = options.active !== undefined ? options.active : true;

  if (active) this.activate();
};

TransformConnector.prototype = {
  constructor: TransformConnector,

  activate: function() {
    var _this = this;

    if (this._active) return;

    this.source.on('didTransform',  this._processTransform,  this);

    this._active = true;
  },

  deactivate: function() {
    this.source.off('didTransform',  this._processTransform,  this);

    this._active = false;
  },

  isActive: function() {
    return this._active;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _processTransform: function(operation, record) {
// TODO - add filtering back in
//    if (this.actions && !this.actions[action]) return;
//    if (this.types && !this.types[type]) return;

    console.log(this.target.id, 'processTransform', operation, record);

    var promise = this._transformTarget(operation, record);

    if (promise && this.blocking) return promise;
  },

  _transformTarget: function(operation, updatedValue) {
    console.log(this.target.id, '_transformTarget', operation, updatedValue);

    if (this.target.isDeleted && this.target.isDeleted(operation.path)) return;

    if (this.target.retrieve) {
      var currentValue = this.target.retrieve(operation.path);

      if (currentValue) {
        console.log(this.target.id, '_transformTarget - currentValue', currentValue);
        if (operation.op === 'add' || operation.op === 'replace') {
          if (eq(currentValue, updatedValue)) {
            console.log(this.target.id, '_transformTarget - currentValue == updatedValue', currentValue);
            return;
          } else {
            return this._resolveConflicts(operation.path, currentValue, updatedValue);
          }
        }
      }
    }

    if (operation.op === 'add' || operation.op === 'replace') {
      return this.target.transform({op: operation.op, path: operation.path, value: updatedValue});
    } else {
      return this.target.transform(operation);
    }
  },

  _resolveConflicts: function(path, currentValue, updatedValue) {
    var _this = this;

    console.log(this.target.id, 'resolveConflicts', path, currentValue, updatedValue);

    diffs(currentValue, updatedValue, {basePath: path}).forEach(function(op) {
      _this.target.transform(op);
    });
  }
};

export default TransformConnector;