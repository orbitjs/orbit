import Orbit from 'orbit/core';
import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';

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

    console.log('* processTransform - ', this.target, operation, record);
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
    console.log('_enqueueTransform', this.target, operation, record);
    this.queue.push({
      operation: clone(operation),
      record: clone(record)
    });
  },

  _dequeueTransform: function() {
    console.log('_dequeueTransform');
    var transform = this.queue.shift();
    if (transform) {
      console.log('_dequeueTransform', transform);
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
    console.log('_transformTarget', this.target, operation, updatedValue);
    if (this.target.retrieve) {
      var currentValue = this.target.retrieve(operation.path);
      if (currentValue) {
//TODO?        if (currentValue.deleted) return;
        console.log('_transformTarget - currentValue', currentValue);
        if (operation.op === 'add' || operation.op === 'replace') {
          if (this._valuesMatch(currentValue, updatedValue)) {
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

  _valuesMatch: function(value1, value2) {
    console.log('_valuesMatch', value1, value2, value1 === value2 || (value2.__ver !== undefined && value1.__ver === value2.__ver));
    return value1 === value2 || (value2.__ver !== undefined && value1.__ver === value2.__ver);
  },

  _resolveConflicts: function(path, currentValue, updatedValue) {
    console.log('* resolveConflicts - ', path, currentValue, updatedValue);

    var ops = diffs(currentValue, updatedValue,
                    {basePath: path,
                     ignore:   [Orbit.versionField]});

    console.log('* resolveConflicts - ops - ', ops);
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