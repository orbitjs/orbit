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

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _onInsert: function(data, record) {
    var targetRecord = this._targetRecord(record);
    console.log('insert', this.target, data, targetRecord, record);
    return this._handleInsert(record);
  },

  _onUpdate: function(data, record) {
    var targetRecord = this._targetRecord(record);
    console.log('update', this.target, data, targetRecord, record);
    return this._handleUpdate(record);
  },

  _onPatch: function(data, record) {
    var targetRecord = this._targetRecord(record);
    console.log('patch', this.target, data, targetRecord, record);
    return this._handlePatch(record);
  },

  _onDestroy: function(data, record) {
    var targetRecord = this._targetRecord(record);
    console.log('destroy', this.target, data, targetRecord, record);
    return this._handleDestroy(record);
  },

  _handleInsert: function(record) {
    var promise,
        targetRecord = this._targetRecord(record);

    if (targetRecord) {
      promise = this._patchTargetRecord(targetRecord, record);
    } else {
      promise = this.target.insertRecord(record);
    }

    if (!this.async) return promise;
  },

  _handleUpdate: function(record) {
    var promise,
        targetRecord = this._targetRecord(record);

    if (targetRecord) {
      promise = this._patchTargetRecord(targetRecord, record);
    } else {
      promise = this.target.updateRecord(record);
    }

    if (!this.async) return promise;
  },

  _handlePatch: function(record) {
    var promise,
        targetRecord = this._targetRecord(record);

    if (targetRecord) {
      promise = this._patchTargetRecord(targetRecord, record);
    } else {
      promise = this.target.patchRecord(record);
    }

    if (!this.async) return promise;
  },

  _handleDestroy: function(record) {
    var _this = this,
        promise;

    // attempt to retrieve target record to determine whether it needs to be deleted
    var targetRecordExists = true;
    if (_this.target.retrieve) {
      targetRecordExists = !!_this.target.retrieve(record);
    }

    // delete the record if we know it exists (or we're not sure)
    if (targetRecordExists) {
      promise = _this.target.destroyRecord(record).then(null, failHandler);
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