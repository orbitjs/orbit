import Orbit from 'orbit/core';

var failHandler = function(e) {
  debugger;
  console.log('FAIL', e);
};

var TransformConnector = function(source, target, options) {
  var _this = this;

  this.source = source;
  this.target = target;
  this.queue = [];

  options = options || {};
  this.blocking = options['blocking'] !== undefined ? options['blocking'] : true;
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

  resolveConflicts: function(action, type, record, updatedRecord) {
    // TODO - this is a naive default conflict resolver
    if (record.__ver &&
        updatedRecord.__ver &&
        record.__ver !== updatedRecord.__ver) {

      //console.log('* resolveConflicts - ', action, type, this.target, record, updatedRecord);

      return this._patchTargetRecord(type, record, updatedRecord);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _processTransform: function(action, type, record) {
    //console.log('* processTransform - ', action, type, this.target, record);
    if (this.activeTransform || this._queueEnabled) {
      this._enqueueTransform(action, type, record);

    } else {
      var promise = this._transform(action, type, record);
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

  _onInsert: function(type, record) {
    return this._processTransform('insert', type, record);
  },

  _onUpdate: function(type, record) {
    return this._processTransform('update', type, record);
  },

  _onPatch: function(type, record) {
    return this._processTransform('patch', type, record);
  },

  _onDestroy: function(type, record) {
    return this._processTransform('destroy', type, record);
  },

  _transform: function(action, type, record) {
    return this['_' + action].call(this, type, record);
  },

  _insert: function(type, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('insert', type, targetRecord, record) ||
               this._patchTargetRecord(type, targetRecord, record);
      }
    } else {
      return this.target.insertRecord(type, Orbit.clone(record));
    }
  },

  _update: function(type, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('update', type, targetRecord, record) ||
               this._patchTargetRecord(type, targetRecord, record);
      }
    } else {
      return this.target.updateRecord(type, Orbit.clone(record));
    }
  },

  _patch: function(type, record) {
    var targetRecord = this._targetRecord(type, record);

    if (targetRecord) {
      if (!targetRecord.deleted) {
        return this.resolveConflicts('patch', type, targetRecord, record) ||
               this._patchTargetRecord(type, targetRecord, record);
      }
    } else {
      return this.target.patchRecord(type, Orbit.clone(record));
    }
  },

  _destroy: function(type, record) {
    var targetRecord = this._targetRecord(type, record);

    if (! (targetRecord && targetRecord.deleted)) {
      return this.target.destroyRecord(type, Orbit.clone(record));
    }
  },

  _targetRecord: function(type, record) {
    if (this.target.retrieve && type && record) {
      //console.log('targetRecord', this.target, this.target.retrieve(type, record));
      return this.target.retrieve(type, record);
    }
  },

  _patchTargetRecord: function(type, targetRecord, updatedRecord) {
    var delta = Orbit.delta(targetRecord, updatedRecord, [Orbit.versionField]);
    if (delta) {
      var orbitIdField = Orbit.idField,
          targetIdField = this.target.idField;

      if (updatedRecord[targetIdField]) delta[targetIdField] = updatedRecord[targetIdField];
      if (targetIdField !== orbitIdField) delta[orbitIdField] = updatedRecord[orbitIdField];

      //console.log('* patchTargetRecord -', delta);

      return this.target.patchRecord(type, delta).then(null, failHandler);
    }
  }
};

export default TransformConnector;