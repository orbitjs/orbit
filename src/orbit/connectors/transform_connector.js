import Orbit from 'orbit/core';

var failHandler = function(e) {
  console.log('FAIL', e);
};

var patchIfNecessary = function(record, otherwise) {
  var targetRecord;

  if (this.target.retrieve) {
    targetRecord = this.target.retrieve(record);
  }

  if (targetRecord) {
    var delta = Orbit.delta(targetRecord, record);
    if (delta) {
      delta[Orbit.idField] = record[Orbit.idField];
      return this.target.patchRecord(delta).then(null, failHandler);
    }
  } else {
    return otherwise(record);
  }
};

var TransformConnector = function(source, target) {
  var _this = this;

  this.source = source;
  this.target = target;
  this.autosync = true;
  this.queue = [];

  _this.source.on('didInsertRecord', function(data, record) {
    console.log('inserted', _this.source, record);
    return patchIfNecessary.call(_this, record, function() {
      return _this.target.insertRecord(record).then(null, failHandler);
    });
  }, failHandler);

  _this.source.on('didUpdateRecord', function(data, record) {
    console.log('updated', _this.source, record);
    return patchIfNecessary.call(_this, record, function() {
      return _this.target.updateRecord(record).then(null, failHandler);
    });
  }, failHandler);

  _this.source.on('didPatchRecord', function(data, record) {
    console.log('patched', _this.source, record);
    return patchIfNecessary.call(_this, record, function() {
      return _this.target.patchRecord(record).then(null, failHandler);
    });
  }, failHandler);

  _this.source.on('didDestroyRecord', function(data, record) {
    console.log('destroyed', _this.source, record);

    // attempt to retrieve target record to determine whether it needs to be deleted
    var targetRecordExists = true;
    if (_this.target.retrieve) {
      targetRecordExists = !!_this.target.retrieve(record);
    }

    // delete the record if we know it exists (or we're not sure)
    if (targetRecordExists) {
      return _this.target.destroyRecord(record).then(null, failHandler);
    }
  }, failHandler);
};

TransformConnector.prototype = {
  constructor: TransformConnector
};

export default TransformConnector;