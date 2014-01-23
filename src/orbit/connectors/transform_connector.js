import Orbit from 'orbit/core';
import ActionQueue from 'orbit/action_queue';
import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';
import eq from 'orbit/lib/eq';

var TransformConnector = function(source, target, options) {
  this.source = source;
  this.target = target;
  this.transformQueue = new ActionQueue(this.transform, this, {autoProcess: false});

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
    this.target.transformQueue.on('didComplete', this.transformQueue.process, this.transformQueue);

    this._active = true;
  },

  deactivate: function() {
    this.source.off('didTransform',  this._processTransform,  this);
    this.target.transformQueue.off('didComplete', this.transformQueue.process, this.transformQueue);

    this._active = false;
  },

  isActive: function() {
    return this._active;
  },

  transform: function(operation) {
    //TODO-log  console.log('****', ' transform from ', this.source.id, ' to ', this.target.id, operation);

    if (this.target.retrieve) {
      var currentValue = this.target.retrieve(operation.path);

      if (currentValue) {
        if (operation.op === 'add' || operation.op === 'replace') {
          if (eq(currentValue, operation.value)) {
            //TODO-log  console.log('==', ' transform from ', this.source.id, ' to ', this.target.id, operation);
            return;
          } else {
            return this.resolveConflicts(operation.path, currentValue, operation.value);
          }
        }
      } else if (operation.op === 'remove') {
        return;
      }
    }

    return this.target.transform(operation);
  },

  resolveConflicts: function(path, currentValue, updatedValue) {
    var ops = diffs(currentValue, updatedValue, {basePath: path});

    //TODO-log  console.log(this.target.id, 'resolveConflicts', path, currentValue, updatedValue, ops);

    return this.target.transform(ops);
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
      return this._applyOrQueueTransform(operation);

    } else {
      this._applyOrQueueTransform(operation);
    }
  },

  _applyOrQueueTransform: function(operation) {
    // If the target's transformQueue is processing, then we should queue up the
    // transform on the connector instead of on the target.
    // This ensures that comparisons are made against the target's most up to
    // date state. Note that this connector's queue processing is triggered
    // by the `didComplete` event for the target's queue.
    if (this.target.transformQueue.processing) {
      return this.transformQueue.push(operation);
    }

    return this.transform(operation);
  }
};

export default TransformConnector;