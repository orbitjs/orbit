import Orbit from 'orbit/core';

var failHandler = function(e) {
  console.log('FAIL', e);
};

var TransformConnector = function(source, target, options) {
  var _this = this;

  this.source = source;
  this.target = target;
  this.queue = [];

  options = options || {};
  this.async = options['async'] !== undefined ? options['async'] : false;
  this._queueEnabled = options['queue'] !== undefined ? options['queue'] : false;
  var active = options['active'] !== undefined ? options['active'] : true;
  if (active) this.activate();
};

TransformConnector.prototype = {
  constructor: TransformConnector,

  activate: function() {
    var _this = this;

    if (this._active) return;

    this.source.on('didInsertRecord',  this._onInsert,  this);
    this.source.on('didUpdateRecord',  this._onUpdate,  this);
    this.source.on('didPatchRecord',   this._onPatch,   this);
    this.source.on('didDestroyRecord', this._onDestroy, this);

    this._active = true;
  },

  deactivate: function() {
    this.source.off('didInsertRecord',  this._onInsert,  this);
    this.source.off('didUpdateRecord',  this._onUpdate,  this);
    this.source.off('didPatchRecord',   this._onPatch,   this);
    this.source.off('didDestroyRecord', this._onDestroy, this);

    this._active = false;
  },

  isActive: function() {
    return this._active;
  },

  resolveConflicts: function(type, data, targetRecord, record) {
    // TODO - this is a naive default conflict resolver
    if (data.__ver && targetRecord.__ver && data.__ver !== targetRecord.__ver) {
      console.log('resolveConflicts - versions differ', type, this.target, data, targetRecord, record);

      var originalDelta = Orbit.delta(data, record, [Orbit.versionField]);
      var currentDelta = Orbit.delta(targetRecord, record, [Orbit.versionField]);

      console.log('originalDelta', originalDelta);
      console.log('currentDelta', currentDelta);

      originalDelta[Orbit.idField] = targetRecord[Orbit.idField];
      return this._patchTargetRecord(targetRecord, originalDelta);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _onInsert: function(data, record) {
    // TODO - queue if needed
    return this._handleInsert(data, record);
  },

  _onUpdate: function(data, record) {
    // TODO - queue if needed
    return this._handleUpdate(data, record);
  },

  _onPatch: function(data, record) {
    // TODO - queue if needed
    return this._handlePatch(data, record);
  },

  _onDestroy: function(data, record) {
    // TODO - queue if needed
    return this._handleDestroy(data, record);
  },

  _handleInsert: function(data, record) {
    var promise,
        targetRecord = this._targetRecord(record);

    console.log('insert', this.target, data, targetRecord, record);

    if (targetRecord) {
      promise = this.resolveConflicts('insert', data, targetRecord, record);
      if (promise === undefined) {
        promise = this._patchTargetRecord(targetRecord, record);
      }
    } else {
      promise = this.target.insertRecord(Orbit.clone(record));
    }

    if (!this.async) return promise;
  },

  _handleUpdate: function(data, record) {
    var promise,
        targetRecord = this._targetRecord(record);

    console.log('update', this.target, data, targetRecord, record);

    if (targetRecord) {
      promise = this.resolveConflicts('update', data, targetRecord, record);
      if (promise === undefined) {
        promise = this._patchTargetRecord(targetRecord, record);
      }
    } else {
      promise = this.target.updateRecord(Orbit.clone(record));
    }

    if (!this.async) return promise;
  },

  _handlePatch: function(data, record) {
    var promise,
        targetRecord = this._targetRecord(record);

    console.log('patch', this.target, data, targetRecord, record);

    if (targetRecord) {
      promise = this.resolveConflicts('patch', data, targetRecord, record);
      if (promise === undefined) {
        promise = this._patchTargetRecord(targetRecord, record);
      }
    } else {
      promise = this.target.patchRecord(Orbit.clone(record));
    }

    if (!this.async) return promise;
  },

  _handleDestroy: function(data, record) {
    var _this = this,
        promise,
        targetRecord = this._targetRecord(record);

    console.log('destroy', this.target, data, targetRecord, record);

    if (targetRecord) {
      promise = this.resolveConflicts('destroy', data, targetRecord, record);
      if (promise === undefined) {
        promise = _this.target.destroyRecord(Orbit.clone(record)).then(null, failHandler);
      }
    }

    if (!this.async) return promise;
  },

  _targetRecord: function(record) {
    if (this.target.retrieve) {
      return this.target.retrieve(record);
    }
  },

  _patchTargetRecord: function(targetRecord, record) {
    var delta = Orbit.delta(targetRecord, record, [Orbit.versionField]);
    if (delta) {
      var orbitIdField = Orbit.idField,
          targetIdField = this.target.idField;

      if (record[targetIdField]) delta[targetIdField] = record[targetIdField];
      if (targetIdField !== orbitIdField) delta[orbitIdField] = record[orbitIdField];

      console.log('patch-delta', delta);

      return this.target.patchRecord(delta).then(null, failHandler);
    }
  }
};

export default TransformConnector;