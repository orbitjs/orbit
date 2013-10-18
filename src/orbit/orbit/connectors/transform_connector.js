import Orbit from 'orbit/core';

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

  _processTransform: function(action, type, record) {
    if (this.actions && !this.actions[action]) return;
    if (this.types && !this.types[type]) return;

    //console.log('* processTransform - ', action, type, this.target, record);
    if (this.activeTransform || this._queueEnabled) {
      this._enqueueTransform(action, type, record);

    } else {
      var promise = this._transformTarget(action, type, record);
      if (promise) {
        if (this.blocking) {
          return promise;
        } else {
          this._resolveTransform(promise);
        }
      }
    }
  },

  _enqueueTransform: function(action, type, record) {
    //console.log('_enqueueTransform', action, type, this.target, record);
    this.queue.push({
      action: action,
      type: type,
      record: Orbit.clone(record)
    });
  },

  _dequeueTransform: function() {
    //console.log('_dequeueTransform');
    var transform = this.queue.shift();
    if (transform) {
      //console.log('_dequeueTransform', transform);
      this._processTransform(transform.action, transform.type, transform.record);
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

  _transformTarget: function(action, type, record) {
    if (this.target.retrieve) {
      var targetRecord = this.target.retrieve(type, record);
      if (targetRecord) {
        if (targetRecord.deleted) return;

        if (action === 'insert' || action === 'update' || action === 'patch') {
          if (this._recordsMatch(targetRecord, record)) {
            return;
          } else {
            return this._resolveConflicts(type, targetRecord, record);
          }
        }
      }
    }
    return this.target.transform(action, type, Orbit.clone(record));
  },

  _recordsMatch: function(record1, record2) {
    return record1.__ver !== undefined && record1.__ver === record2.__ver;
  },

  _resolveConflicts: function(type, targetRecord, updatedRecord) {
    //console.log('* resolveConflicts - ', action, type, this.target, targetRecord, updatedRecord);

    var delta = Orbit.delta(targetRecord, updatedRecord, [Orbit.versionField]);
    if (delta) {
      delta[Orbit.idField] = updatedRecord[Orbit.idField];

      //console.log('* resolveConflicts - delta - ', delta);

      return this.target.transform('patch', type, delta);
    }
  }
};

export default TransformConnector;