import { assert } from 'orbit/lib/assert';
import { Class } from 'orbit/lib/objects';

var IdMap = Class.extend({
  init: function(idField, remoteIdField) {
    assert("IdMap's `idField` must be specified", idField);
    assert("IdMap's `remoteIdField` must be specified", remoteIdField);

    this.idField = idField;
    this.remoteIdField = remoteIdField;
    this.reset();
  },

  reset: function() {
    this._remoteToLocal = {};
    this._localToRemote = {};
  },

  register: function(type, id, remoteId) {
    if (id && remoteId) {
      var remoteToLocal = this._remoteToLocal[type];
      if (!remoteToLocal) remoteToLocal = this._remoteToLocal[type] = {};
      remoteToLocal[remoteId] = id;

      var localToRemote = this._localToRemote[type];
      if (!localToRemote) localToRemote = this._localToRemote[type] = {};
      localToRemote[id] = remoteId;
    }
  },

  registerAll: function(data) {
    if (data) {
      var _this = this,
          remoteToLocal,
          localToRemote,
          record,
          remoteId;

      Object.keys(data).forEach(function(type) {
        remoteToLocal = _this._remoteToLocal[type];
        if (!remoteToLocal) remoteToLocal = _this._remoteToLocal[type] = {};

        localToRemote = _this._localToRemote[type];
        if (!localToRemote) localToRemote = _this._localToRemote[type] = {};

        var typeData = data[type];
        Object.keys(typeData).forEach(function(id) {
          remoteId = typeData[id][_this.remoteIdField];
          if (remoteId) {
            remoteToLocal[remoteId] = id;
            localToRemote[id] = remoteId;
          }
        });
      });
    }
  },

  remoteToLocalId: function(type, remoteId) {
    if (remoteId) {
      var mapForType = this._remoteToLocal[type];
      if (mapForType) return mapForType[remoteId];
    }
  },

  localToRemoteId: function(type, id) {
    if (id) {
      var mapForType = this._localToRemote[type];
      if (mapForType) return mapForType[id];
    }
  }
});

export default IdMap;