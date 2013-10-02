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
    if (data.__ver &&
        targetRecord.__ver &&
        data.__ver !== targetRecord.__ver) {

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

  _processTransform: function(transformType, data, record) {
    // console.log('processTransform', transformType, this.target, record);
    if (this.activeTransform || this._queueEnabled) {
      this._enqueueTransform(transformType, data, record);

    } else {
      var promise = this._handleTransform(transformType, data, record);
      if (promise) {
        if (this.async) {
          this._resolveTransform(promise);
        } else {
          return promise;
        }
      }
    }
  },

  _enqueueTransform: function(transformType, data, record) {
    // console.log('_enqueueTransform', transformType, this.target, record);
    this.queue.push({
      transformType: transformType,
      data: data,
      record: record
    });
  },

  _dequeueTransform: function() {
    // console.log('_dequeueTransform');
    var transform = this.queue.shift();
    if (transform) {
      // console.log('_dequeueTransform', transform);
      this._processTransform(transform.transformType, transform.data, transform.record);
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

  _handleTransform: function(transformType, data, record) {
    return this['_handle' + Orbit.capitalize(transformType)].call(this, data, record);
  },

  _onInsert: function(data, record) {
    return this._processTransform('insert', data, record);
  },

  _onUpdate: function(data, record) {
    return this._processTransform('update', data, record);
  },

  _onPatch: function(data, record) {
    return this._processTransform('patch', data, record);
  },

  _onDestroy: function(data, record) {
    return this._processTransform('destroy', data, record);
  },

  _handleInsert: function(data, record) {
    var targetRecord = this._targetRecord(record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('insert', data, targetRecord, record) ||
               this._patchTargetRecord(targetRecord, record);
      }
    } else {
      return this.target.insertRecord(Orbit.clone(record));
    }
  },

  _handleUpdate: function(data, record) {
    var targetRecord = this._targetRecord(record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('update', data, targetRecord, record) ||
               this._patchTargetRecord(targetRecord, record);
      }
    } else {
      return this.target.updateRecord(Orbit.clone(record));
    }
  },

  _handlePatch: function(data, record) {
    var targetRecord = this._targetRecord(record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('patch', data, targetRecord, record) ||
               this._patchTargetRecord(targetRecord, record);
      }
    } else {
      return this.target.patchRecord(Orbit.clone(record));
    }
  },

  _handleDestroy: function(data, record) {
    var targetRecord = this._targetRecord(record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('destroy', data, targetRecord, record) ||
               this.target.destroyRecord(Orbit.clone(record));
      }
    } else {
      return this.target.destroyRecord(Orbit.clone(record));
    }
  },

  _targetRecord: function(record) {
    if (this.target.retrieve && record) {
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

      return this.target.patchRecord(delta).then(null, failHandler);
    }
  }
};

export default TransformConnector;