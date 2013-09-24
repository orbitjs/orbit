import Orbit from 'orbit/core';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var RestStore = function(idField) {
  Orbit.assert('RestStore requires Orbit.Promise be defined', Orbit.Promise);
  Orbit.assert('RestStore requires Orbit.ajax be defined', Orbit.ajax);

  this.idField = idField || 'id';
  this.headers = undefined;

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'create', 'update', 'patch', 'destroy']);
};

RestStore.prototype = {
  constructor: RestStore,

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
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }

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

  _insertRecord: function(data) {
    return this.ajax(this.buildURL(), 'POST', {data: data});
  },

  _updateRecord: function(data) {
    return this.ajax(this.buildURL(data[this.idField]), 'PUT', {data: data});
  },

  _patchRecord: function(data) {
    return this.ajax(this.buildURL(data[this.idField]), 'PATCH', {data: data});
  },

  _destroyRecord: function(data) {
    return this.ajax(this.buildURL(data[this.idField]), 'DELETE');
  },

  _find: function(id) {
    return this.ajax(this.buildURL(id), 'GET');
  },

  _create: function(data) {
    return this.insertRecord(data);
  },

  _update: function(id, data) {
    data[this.idField] = id;
    return this.updateRecord(data);
  },

  _patch: function(id, data) {
    data[this.idField] = id;
    return this.patchRecord(data);
  },

  _destroy: function(id) {
    var data = {};
    data[this.idField] = id;
    return this.destroyRecord(data);
  }
};

export default RestStore;