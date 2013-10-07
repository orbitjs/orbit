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

  resolveConflicts: function(action, type, data, targetRecord, record) {
    // TODO - this is a naive default conflict resolver
    if (data.__ver &&
        targetRecord.__ver &&
        data.__ver !== targetRecord.__ver) {

      // console.log('resolveConflicts - versions differ', action, type, this.target, data, targetRecord, record);

      var originalDelta = Orbit.delta(data, record, [Orbit.versionField]);
      var currentDelta = Orbit.delta(targetRecord, record, [Orbit.versionField]);

      console.log('originalDelta', originalDelta);
      console.log('currentDelta', currentDelta);

      originalDelta[Orbit.idField] = targetRecord[Orbit.idField];
      return this._patchTargetRecord(type, targetRecord, originalDelta);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _processTransform: function(action, type, data, record) {
    // console.log('processTransform', action, type, this.target, record);
    if (this.activeTransform || this._queueEnabled) {
      this._enqueueTransform(action, type, data, record);

    } else {
      var promise = this._handleTransform(action, type, data, record);
      if (promise) {
        if (this.async) {
          this._resolveTransform(promise);
        } else {
          return promise;
        }
      }
    }
  },

  _enqueueTransform: function(action, type, data, record) {
    // console.log('_enqueueTransform', action, type, this.target, record);
    this.queue.push({
      action: action,
      type: type,
      data: data,
      record: record
    });
  },

  _dequeueTransform: function() {
    // console.log('_dequeueTransform');
    var transform = this.queue.shift();
    if (transform) {
      // console.log('_dequeueTransform', transform);
      this._processTransform(transform.action, transform.type, transform.data, transform.record);
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

  _handleTransform: function(action, type, data, record) {
    return this['_handle' + Orbit.capitalize(action)].call(this, type, data, record);
  },

  _onInsert: function(type, data, record) {
    return this._processTransform('insert', type, data, record);
  },

  _onUpdate: function(type, data, record) {
    return this._processTransform('update', type, data, record);
  },

  _onPatch: function(type, data, record) {
    return this._processTransform('patch', type, data, record);
  },

  _onDestroy: function(type, data, record) {
    return this._processTransform('destroy', type, data, record);
  },

  _handleInsert: function(type, data, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('insert', type, data, targetRecord, record) ||
               this._patchTargetRecord(type, targetRecord, record);
      }
    } else {
      return this.target.insertRecord(type, Orbit.clone(record));
    }
  },

  _handleUpdate: function(type, data, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('update', type, data, targetRecord, record) ||
               this._patchTargetRecord(type, targetRecord, record);
      }
    } else {
      return this.target.updateRecord(type, Orbit.clone(record));
    }
  },

  _handlePatch: function(type, data, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('patch', type, data, targetRecord, record) ||
               this._patchTargetRecord(type, targetRecord, record);
      }
    } else {
      return this.target.patchRecord(type, Orbit.clone(record));
    }
  },

  _handleDestroy: function(type, data, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('destroy', type, data, targetRecord, record) ||
               this.target.destroyRecord(type, Orbit.clone(record));
      }
    } else {
      return this.target.destroyRecord(type, Orbit.clone(record));
    }
  },

  _targetRecord: function(type, record) {
    if (this.target.retrieve && type && record) {
      console.log('targetRecord', this.target, this.target.retrieve(type, record));
      return this.target.retrieve(type, record);
    }
  },

  _patchTargetRecord: function(type, targetRecord, record) {
    var delta = Orbit.delta(targetRecord, record, [Orbit.versionField]);
    if (delta) {
      var orbitIdField = Orbit.idField,
          targetIdField = this.target.idField;

      if (record[targetIdField]) delta[targetIdField] = record[targetIdField];
      if (targetIdField !== orbitIdField) delta[orbitIdField] = record[orbitIdField];

      return this.target.patchRecord(type, delta).then(null, failHandler);
    }
  }
};

export default TransformConnector;