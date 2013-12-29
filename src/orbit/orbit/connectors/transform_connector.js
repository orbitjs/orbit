import Orbit from 'orbit/core';
import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';
import eq from 'orbit/lib/eq';

var TransformConnector = function(source, target, options) {
  var _this = this;

  this.source = source;
  this.target = target;

  options = options || {};
// TODO - allow filtering of transforms
//  if (options.actions) this.actions = Orbit.arrayToOptions(options.actions);
//  if (options.types) this.types = Orbit.arrayToOptions(options.types);
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

  _processTransform: function(operation) {
// TODO - add filtering back in
//    if (this.actions && !this.actions[action]) return;
//    if (this.types && !this.types[type]) return;

//    console.log(this.target.id, 'processTransform', operation);
    if (this.blocking) {
      return this._transformTarget(operation);

    } else {
      this._transformTarget(operation);
    }
  },

  _transformTarget: function(operation) {
//TODO-log    console.log('****', ' transform from ', this.source.id, ' to ', this.target.id, operation);

    if (this.target.isDeleted && this.target.isDeleted(operation.path)) return;

    if (this.target.retrieve) {
      var currentValue = this.target.retrieve(operation.path);

      if (currentValue) {
        if (operation.op === 'add' || operation.op === 'replace') {
          if (eq(currentValue, operation.value)) {
//TODO-log            console.log('==', ' transform from ', this.source.id, ' to ', this.target.id, operation);
            return;
          } else {
            return this._resolveConflicts(operation.path, currentValue, operation.value);
          }
        }
      }
    }

    return this.target.transform(operation);
  },

  _resolveConflicts: function(path, currentValue, updatedValue) {
    var ops = diffs(currentValue, updatedValue, {basePath: path});

//TODO-log    console.log(this.target.id, 'resolveConflicts', path, currentValue, updatedValue, ops);

    return this.target.transform(ops);
  }
};

export default TransformConnector;