import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var RestStore = function(idField) {
  Orbit.assert('RestStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('RestStore requires Orbit.ajax be defined', Orbit.ajax);

  this.idField = idField || 'id';
  this.headers = undefined;

  this._cache = {};

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

RestStore.prototype = {
  constructor: RestStore,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _insertRecord: function(data) {
    var _this = this;
    var orbitId = data[Orbit.idField];

    return this.ajax(this.buildURL(), 'POST', {data: this.serialize(data)}).then(
      function(raw) {
        var record = _this.deserialize(raw);

        if (orbitId) {
          record[Orbit.idField] = orbitId;
          _this._cache[orbitId] = record;
        }

        return record;
      }
    );
  },

  _updateRecord: function(data) {
    var _this = this;
    var orbitId = data[Orbit.idField];

    return this.ajax(this.buildURL(data[this.idField]), 'PUT', {data: data}).then(
      function(raw) {
        var record = _this.deserialize(raw);

        if (orbitId) {
          record[Orbit.idField] = orbitId;
          _this._cache[orbitId] = record;
        }

        return record;
      }
    );
  },

  _patchRecord: function(data) {
    var _this = this;
    var orbitId = data[Orbit.idField];

    return this.ajax(this.buildURL(data[this.idField]), 'PATCH', {data: data}).then(
      function(raw) {
        var record = _this.deserialize(raw);

        if (orbitId) {
          record[Orbit.idField] = orbitId;
          _this._cache[orbitId] = record;
        }

        return record;
      }
    );
  },

  _destroyRecord: function(data) {
    return this.ajax(this.buildURL(data[this.idField]), 'DELETE');
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(id) {
    return this.ajax(this.buildURL(id), 'GET');
  },

  _create: function(data) {
    return this.insertRecord(data);
  },

  _update: function(data) {
    return this.updateRecord(data);
  },

  _patch: function(data) {
    return this.patchRecord(data);
  },

  _destroy: function(data) {
    return this.destroyRecord(data);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Public
  /////////////////////////////////////////////////////////////////////////////

  retrieve: function(id) {
    if (typeof id === 'object') {
      id = id[Orbit.idField];
    }
    return this._cache[id];
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  ajax: function(url, type, hash) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      hash = hash || {};
      hash.url = url;
      hash.type = type;
      hash.dataType = 'json';
      hash.context = _this;

      if (hash.data && type !== 'GET') {
        hash.contentType = 'application/json; charset=utf-8';
        hash.data = JSON.stringify(hash.data);
      }

      if (_this.headers !== undefined) {
        var headers = _this.headers;
        hash.beforeSend = function (xhr) {
          for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
        };
      }

      hash.success = function(json) {
        console.log('ajax success', json);
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }
        console.log('ajax error', jqXHR);

        reject(jqXHR);
      };

      Orbit.ajax(hash);
    });
  },

  buildURL: function(id) {
    var host = this.host,
        namespace = this.namespace,
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    if (id) { url.push(id); }

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  serialize: function(data) {
    var serialized = Orbit.clone(data);
    delete serialized[Orbit.idField];
    return serialized;
  },

  deserialize: function(data) {
    return data;
  }
};

export default RestStore;