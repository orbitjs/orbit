import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var RestStore = function(options) {
  Orbit.assert('RestStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('RestStore requires Orbit.ajax be defined', Orbit.ajax);

  options = options || {};
  this.idField = options['idField'] || 'id';
  this.namespace = options['namespace'];
  this.headers = options['headers'];

  this._cache = {};

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

RestStore.prototype = {
  constructor: RestStore,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _insertRecord: function(type, data) {
    var _this = this,
        orbitId = data[Orbit.idField];

    return this.ajax(this.buildURL(type), 'POST', {data: this.serialize(type, data)}).then(
      function(raw) {
        var record = _this.deserialize(type, raw);

        // If the record has already been deleted by the time the POST response
        // returns, we need to immediately destroy it.
        var recordInCache = _this.retrieve(type, orbitId);
        if (recordInCache && recordInCache.deleted) {
          // Add the inserted record to the cache, since it will contain
          // the latest data from the server (including an `id` field)
          record.deleted = true;
          _this._addToCache(type, record, orbitId);
          Orbit.incrementVersion(record);

          // Immediate destroy the record
          return _this.destroyRecord(type, record);

        } else {
          _this._addToCache(type, record, orbitId);
          Orbit.incrementVersion(record);
          return record;
        }
      }
    );
  },

  _updateRecord: function(type, data) {
    var _this = this,
        orbitId = data[Orbit.idField],
        id = this._lookupId(type, data);

    if (!id) throw new Orbit.NotFoundException(data);

    return this.ajax(this.buildURL(type, id), 'PUT', {data: this.serialize(type, data)}).then(
      function(raw) {
        var record = _this.deserialize(type, raw);
        _this._addToCache(type, record, orbitId);
        Orbit.incrementVersion(record);
        return record;
      }
    );
  },

  _patchRecord: function(type, data) {
    var _this = this,
        orbitId = data[Orbit.idField],
        id = this._lookupId(type, data);

    if (!id) throw new Orbit.NotFoundException(data);

    // no need to transmit `id` along with a patched record
    delete data[this.idField];

    return this.ajax(this.buildURL(type, id), 'PATCH', {data: this.serialize(type, data)}).then(
      function(raw) {
        var record = _this.deserialize(type, raw);
        _this._addToCache(type, record, orbitId);
        Orbit.incrementVersion(record);
        return record;
      }
    );
  },

  _destroyRecord: function(type, data) {
    var _this = this,
        orbitId = data[Orbit.idField],
        id = this._lookupId(type, data);

    if (!id) throw new Orbit.NotFoundException(data);

    return this.ajax(this.buildURL(type, id), 'DELETE').then(
      function() {
        if (orbitId) {
          var record = _this.retrieve(type, orbitId);
          if (!record) {
            record = {};
            _this._addToCache(type, record, orbitId);
          }
          record.deleted = true;
          Orbit.incrementVersion(record);
          return record;
        }
      }
    );
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    return this.ajax(this.buildURL(type, id), 'GET');
  },

  _create: function(type, data) {
    return this.insertRecord(type, data);
  },

  _update: function(type, data) {
    return this.updateRecord(type, data);
  },

  _patch: function(type, data) {
    return this.patchRecord(type, data);
  },

  _destroy: function(type, data) {
    return this.destroyRecord(type, data);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Public
  /////////////////////////////////////////////////////////////////////////////

  retrieve: function(type, id) {
    var dataForType = this._cache[type];
    if (id && typeof id === 'object') id = id[Orbit.idField];
    if (dataForType) return dataForType[id];
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _lookupId: function(type, data) {
    var id = data[this.idField];
    if (!id) {
      var record = this.retrieve(type, data);
      if (record) {
        id = record[this.idField];
      }
    }
    return id;
  },

  _addToCache: function(type, record, orbitId) {
    if (orbitId === undefined) {
      orbitId = Orbit.generateId();
    }
    record[Orbit.idField] = orbitId;

    var dataForType = this._cache[type];
    if (dataForType) {
      var recordInCache = dataForType[orbitId];
      if (recordInCache && recordInCache.deleted) {
        recordInCache[this.idField] = record[this.idField];
      }
    } else {
      dataForType = this._cache[type] = {};
    }
    dataForType[orbitId] = record;
  },

  ajax: function(url, method, hash) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      hash = hash || {};
      hash.url = url;
      hash.type = method;
      hash.dataType = 'json';
      hash.context = _this;

      console.log('ajax start', method);

      if (hash.data && method !== 'GET') {
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
        console.log('ajax success', method, json);
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }
        console.log('ajax error', method, jqXHR);

        reject(jqXHR);
      };

      Orbit.ajax(hash);
    });
  },

  buildURL: function(type, id) {
    var host = this.host,
        namespace = this.namespace,
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.pluralize(type));
    if (id) { url.push(id); }

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  pluralize: function(name) {
    // TODO - allow for pluggable inflector
    return name + 's';
  },

  serialize: function(type, data) {
    var serialized = Orbit.clone(data);
    delete serialized[Orbit.idField];
    delete serialized[Orbit.versionField];
    return serialized;
  },

  deserialize: function(type, data) {
    return data;
  }
};

export default RestStore;