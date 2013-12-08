import Orbit from 'orbit/core';
import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';
import eq from 'orbit/lib/eq';

var TransformConnector = function(source, target, options) {
  var _this = this;

  this.source = source;
  this.target = target;
  this.queue = [];

  options = options || {};
  if (options.actions) this.actions = Orbit.arrayToOptions(options.actions);
  if (options.types) this.types = Orbit.arrayToOptions(options.types);
  this.blocking = options.blocking !== undefined ? options.blocking : true;
  this._queueEnabled = options.queue !== undefined ? options.queue : false;
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

    console.log(this.target.id, 'processTransform', operation, record, this.activeTransform);
    if (this.activeTransform || this._queueEnabled) {
      this._enqueueTransform(operation, record);

    } else {
      var promise = this._transformTarget(operation, record);
      if (promise) {
        if (this.blocking) {
          return promise;
        } else {
          this._resolveTransform(promise);
        }
      }
    }
  },

  _enqueueTransform: function(operation, record) {
    console.log(this.target.id, '_enqueueTransform', operation, record);
    this.queue.push({
      operation: clone(operation),
      record: clone(record)
    });
  },

  _dequeueTransform: function() {
    console.log(this.target.id, '_dequeueTransform');
    var transform = this.queue.shift();
    if (transform) {
      console.log(this.target.id, '_dequeueTransform', transform);
      this._processTransform(transform.operation, transform.record);
    }
  },

  _resolveTransform: function(transform) {
    var _this = this;
    this.activeTransform = transform;
    transform.then(
      function() {
        _this.activeTransform = null;
        if (!_this._queueEnabled) {
          _this._dequeueTransform();
        }
      }
    );
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
    console.log(this.target.id, 'resolveConflicts', path, currentValue, updatedValue);

    var ops = diffs(currentValue, updatedValue, {basePath: path});

    if (ops) {
      this._applyTransforms(path, ops);
    }
  },

  _applyTransforms: function(path, ops) {
    console.log(this.target.id, '_applyTransforms - ops - ', clone(ops));
    if (ops) {
      var _this = this;

      return new Orbit.Promise(function(resolve, reject) {
        var settleEach = function() {
          if (ops.length === 0) {
            resolve();
          } else {
            var op = ops.shift();
            var response = _this.target.transform(op);

            if (response) {
              return response.then(
                function(success) {
                  settleEach();
                },
                function(error) {
                  settleEach();
                }
              );
            } else {
              settleEach();
            }
          }
        };

        settleEach();
      });
    }
  }
};

export default TransformConnector;