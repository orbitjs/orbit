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

  resolveConflicts: function(action, type, record, updatedRecord) {
    // TODO - this is a naive default conflict resolver
    if ((action === 'insert' || action === 'update' || action === 'patch') &&
        !record.deleted &&
        record.__ver &&
        updatedRecord.__ver &&
        record.__ver !== updatedRecord.__ver) {

      //console.log('* resolveConflicts - ', action, type, this.target, record, updatedRecord);

      var delta = Orbit.delta(record, updatedRecord, [Orbit.versionField]);
      if (delta) {
        var orbitIdField = Orbit.idField,
            targetIdField = this.target.idField;

        if (updatedRecord[targetIdField]) delta[targetIdField] = updatedRecord[targetIdField];
        if (targetIdField !== orbitIdField) delta[orbitIdField] = updatedRecord[orbitIdField];

        //console.log('* resolveConflicts - delta - ', delta);

        return this.target.transform('patch', type, delta).then(null, failHandler);
      }
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

  _transform: function(action, type, record) {
    var targetRecord;
    if (this.target.retrieve) {
      targetRecord = this.target.retrieve(type, record);
    }

    if (action === 'insert' || action === 'update' || action === 'patch') {
      if (targetRecord) {
        return this.resolveConflicts(action, type, targetRecord, record);
      } else {
        return this.target.transform(action, type, Orbit.clone(record));
      }

    } else if (action === 'delete') {
      if (! (targetRecord && targetRecord.deleted)) {
        return this.target.transform('delete', type, Orbit.clone(record));
      }
    }
  }
};

export default TransformConnector;