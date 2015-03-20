import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { isArray, isObject } from 'orbit/lib/objects';
import Operation from 'orbit/operation';
import Source from './source';
import Serializer from './serializer';
import JSONAPISerializer from './jsonapi-serializer';
import { OperationNotAllowed, RecordNotFoundException, RecordAlreadyExistsException } from './lib/exceptions';

/**
 Source for accessing a JSON API compliant RESTful API with AJAX

 @class JSONAPISource
 @extends Source
 @namespace OC
 @param schema
 @param options
 @constructor
 */
var JSONAPISource = Source.extend({

  init: function(schema, options) {
    assert('JSONAPISource requires Orbit.Promise be defined', Orbit.Promise);
    assert('JSONAPISource requires Orbit.ajax be defined', Orbit.ajax);

    this._super.apply(this, arguments);

    options = options || {};
    this.namespace        = options.namespace || this.namespace;
    this.host             = options.host || this.host;
    this.headers          = options.headers || this.headers;
    this.usePatch         = options.usePatch !== undefined ? options.usePatch : this.usePatch;
    this.SerializerClass  = options.SerializerClass || this.SerializerClass;

    // If `SerializerClass` is obtained through the _super chain, dereference
    // its wrapped function, which will be the constructor.
    //
    // Note: This is only necessary when retrieving a *constructor* from a
    //       class hierarchy. Otherwise, `superWrapper` "just works".
    if (this.SerializerClass && this.SerializerClass.wrappedFunction) {
      this.SerializerClass = this.SerializerClass.wrappedFunction;
    }

    this.serializer = new this.SerializerClass(schema);

    assert('Serializer must be an instance of OC.Serializer', this.serializer instanceof Serializer);
  },

  namespace: null,
  host: null,
  headers: null,
  SerializerClass: JSONAPISerializer,
  usePatch: false,

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var _this = this;
    var op    = operation.op;
    var path  = operation.path;

    if (path.length > 2) {
      if (path[2] === '__rel') {
        if (op === 'add') {
          return _this._transformAddLink(operation);
        } else if (op === 'remove') {
          return _this._transformRemoveLink(operation);
        } else if (op === 'replace') {
          return _this._transformReplaceLink(operation);
        }
      } else {
        return _this._transformUpdateAttribute(operation);
      }

    } else if (path.length > 1) {
      if (op === 'add') {
        return _this._transformAdd(operation);

      } else if (op === 'replace') {
        return _this._transformReplace(operation);

      } else if (op === 'remove') {
        return _this._transformRemove(operation);
      }
    }

    throw new OperationNotAllowed('JSONAPISource#transform could not process operation: ' + operation.op +
                                  ' with path: ' + operation.path.join('/'));
  },


  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    if (id && (typeof id === 'number' || typeof id === 'string')) {
      return this._findOne(type, id);

    } else if (id && isArray(id)) {
      return this._findMany(type, id);

    } else {
      var resourceKey = this.serializer.resourceKey(type);

      if (id && typeof id === 'object' && id[resourceKey]) {
        return this._findOne(type, id);

      } else {
        return this._findQuery(type, id);
      }
    }
  },

  _findLink: function(type, id, link) {
    var _this = this;
    return this.ajax(this.resourceLinkURL(type, id, link), 'GET').then(
      function(raw) {
        var linkDef = _this.schema.models[type].links[link];
        var relId = _this.serializer.deserializeLink(linkDef.model, raw);

        return _this.settleTransforms().then(function() {
          return relId;
        });
      }
    );
  },

// TODO - Override `_findLinked` to use meta-data stored about links
//
//  _findLinked: function(type, id, link, relId) {
//    if (relId === undefined) {
//      id = this.getId(type, id);
//
//      var record = this.retrieve([type, id]);
//      if (record) {
//        relId = record.__rel[link];
//        if (record.__meta.links && record.__meta.links[link]) {
//          var linkMeta = record.__meta.links[link];
//
//          // find linked from meta
//        }
//      }
//    }
//
//    return this._super.apply(this, arguments);
//  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _transformAdd: function(operation) {
    if (this.usePatch) {
      return this._transformAddWithPatch(operation);
    } else {
      return this._transformAddStd(operation);
    }
  },

  _transformAddStd: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var json = this.serializer.serialize(type, operation.value);

    return this.ajax(this.resourceURL(type), 'POST', {data: json}).then(
      function(raw) {
        _this.deserialize(type, id, raw, operation);
      }
    );
  },

  _transformAddWithPatch: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];

    var remoteOp = {
      op: 'add',
      path: '/-',
      value: this.serializer.serializeRecord(type, operation.value)
    };

    return this.ajax(this.resourceURL(type), 'PATCH', {data: [ remoteOp ]}).then(
      function(raw) {
        if (raw && isArray(raw)) {
          _this.deserialize(type, id, raw[0], operation);
        } else {
          _this._transformCache(operation);
        }
      }
    );
  },

  _transformReplace: function(operation) {
    if (this.usePatch) {
      return this._transformReplaceWithPatch(operation);
    } else {
      return this._transformReplaceStd(operation);
    }
  },

  _transformReplaceStd: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var value = operation.value;

    var json = this.serializer.serialize(type, value);

    return this.ajax(this.resourceURL(type, id), 'PUT', {data: json}).then(
      function(raw) {
        // TODO - better 204 (no content) checking
        if (raw && Object.keys(raw).length > 0) {
          _this.deserialize(type, id, raw, operation);
        } else {
          _this._transformCache(operation);
        }
      }
    );
  },

  _transformReplaceWithPatch: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var value = operation.value;

    var remoteOp = {
      op: 'replace',
      path: '/',
      value: this.serializer.serializeRecord(type, value)
    };

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: [ remoteOp ]}).then(
      function(raw) {
        if (raw && isArray(raw)) {
          _this.deserialize(type, id, raw[0], operation);
        } else {
          _this._transformCache(operation);
        }
      }
    );
  },

  _transformRemove: function(operation) {
    if (this.usePatch) {
      return this._transformRemoveWithPatch(operation);
    } else {
      return this._transformRemoveStd(operation);
    }
  },

  _transformRemoveStd: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];

    return this.ajax(this.resourceURL(type, id), 'DELETE').then(function() {
      _this._transformCache({op: 'remove', path: [type, id]});
    });
  },

  _transformRemoveWithPatch: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];

    var remoteOp = {
      op: 'remove',
      path: '/'
    };

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: [ remoteOp ]}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformAddLink: function(operation) {
    if (this.usePatch) {
      return this._transformAddLinkWithPatch(operation);
    } else {
      return this._transformAddLinkStd(operation);
    }
  },

  _transformAddLinkStd: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;

    var linkDef = this.schema.models[type].links[link];
    var relType = linkDef.model;
    var relResourceType = this.serializer.resourceType(relType);
    var relResourceId = this.serializer.resourceId(relType, relId);

    var method = 'POST';
    var json = {};
    json[relResourceType] = relResourceId;

    return this.ajax(this.resourceLinkURL(type, id, link), method, {data: json}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformAddLinkWithPatch: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;
    var linkDef = this.schema.models[type].links[link];
    var relType = linkDef.model;
    var relResourceId = this.serializer.resourceId(relType, relId);
    var remoteOp;

    if (linkDef.type === 'hasMany') {
      remoteOp = {
        op: 'add',
        path: '/-',
        value: relResourceId
      };
    } else {
      remoteOp = {
        op: 'replace',
        path: '/',
        value: relResourceId
      };
    }

    return this.ajax(this.resourceLinkURL(type, id, link), 'PATCH', {data: [ remoteOp ]}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformRemoveLink: function(operation) {
    if (this.usePatch) {
      return this._transformRemoveLinkWithPatch(operation);
    } else {
      return this._transformRemoveLinkStd(operation);
    }
  },

  _transformRemoveLinkStd: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4];

    return this.ajax(this.resourceLinkURL(type, id, link, relId), 'DELETE').then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformRemoveLinkWithPatch: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var linkDef = this.schema.models[type].links[link];
    var remoteOp;

    if (linkDef.type === 'hasMany') {
      var relId = operation.path[4];
      var relType = linkDef.model;
      var relResourceId = this.serializer.resourceId(relType, relId);

      remoteOp = {
        op: 'remove',
        path: '/' + relResourceId
      };
    } else {
      remoteOp = {
        op: 'remove',
        path: '/'
      };
    }

    return this.ajax(this.resourceLinkURL(type, id, link), 'PATCH', {data: [ remoteOp ]}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformReplaceLink: function(operation) {
    if (this.usePatch) {
      return this._transformReplaceLinkWithPatch(operation);
    } else {
      return this._transformReplaceLinkStd(operation);
    }
  },

  _transformReplaceLinkStd: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;

    // Convert a map of ids to an array
    if (isObject(relId)) {
      relId = Object.keys(relId);
    }

    var linkDef = this.schema.models[type].links[link];
    var relType = linkDef.model;
    var relResourceType = this.serializer.resourceType(relType);
    var relResourceId = this.serializer.resourceId(relType, relId);

    var method = 'PUT';
    var json = {};
    json[relResourceType] = relResourceId;

    return this.ajax(this.resourceLinkURL(type, id, link), method, {data: json}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformReplaceLinkWithPatch: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;

    // Convert a map of ids to an array
    if (isObject(relId)) {
      relId = Object.keys(relId);
    }

    var linkDef = this.schema.models[type].links[link];
    var relType = linkDef.model;
    var relResourceId = this.serializer.resourceId(relType, relId);
    var remoteOp;

    remoteOp = {
      op: 'replace',
      path: '/',
      value: relResourceId
    };

    return this.ajax(this.resourceLinkURL(type, id, link), 'PATCH', {data: [ remoteOp ]}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _transformUpdateAttribute: function(operation) {
    if (this.usePatch) {
      return this._transformUpdateAttributeWithPatch(operation);
    } else {
      return this._transformUpdateAttributeStd(operation);
    }
  },

  _transformUpdateAttributeStd: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var attr = operation.path[2];

    var record = {};
    record[attr] = operation.value;

    var serialized = {};
    this.serializer.serializeAttribute(type, record, attr, serialized);

    var json = {};
    var resourceType = this.serializer.resourceType(type);
    json[resourceType] = serialized;

    return this.ajax(this.resourceURL(type, id), 'PUT', {data: json}).then(
      function(raw) {
        _this._transformCache(operation);
      }
    );
  },

  _transformUpdateAttributeWithPatch: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];
    var attr = operation.path[2];

    var remoteOp = {
      op: 'replace',
      path: '/' + attr,
      value: operation.value
    };

    return this.ajax(this.resourceURL(type, id), 'PATCH', {data: [ remoteOp ]}).then(
      function() {
        _this._transformCache(operation);
      }
    );
  },

  _addRecordsToCache: function(type, records, parentOperation) {
    var _this = this;
    records.forEach(function(record) {
      _this._addRecordToCache(type, record, parentOperation);
    });
  },

  _addRecordToCache: function(type, record, parentOperation) {
    var operation = {
      op: 'add',
      path: [type, this.getId(type, record)],
      value: record
    };

    if (parentOperation) operation = parentOperation.spawn(operation);

    this._transformCache(operation);
  },

  _findOne: function(type, id) {
    var _this = this;
    return this.ajax(this.resourceURL(type, id), 'GET').then(
      function(raw) {
        var record = _this.deserialize(type, null, raw);
        return _this.settleTransforms().then(function() {
          return record;
        });
      }
    );
  },

  _findMany: function(type, ids) {
    var _this = this;
    return this.ajax(this.resourceURL(type, ids), 'GET').then(
      function(raw) {
        var records = _this.deserialize(type, null, raw);
        return _this.settleTransforms().then(function() {
          return isArray(records) ? records : [records];
        });
      }
    );
  },

  _findQuery: function(type, query) {
    var _this = this;

    return this.ajax(this.resourceURL(type), 'GET', {data: query}).then(
      function(raw) {
        var records = _this.deserialize(type, null, raw);
        return _this.settleTransforms().then(function() {
          return records;
        });
      }
    );
  },

  _transformCache: function(operation) {
    var pathToVerify,
        inverse;

    if (operation.op === 'add') {
      pathToVerify = operation.path.slice(0, operation.path.length - 1);
    } else {
      pathToVerify = operation.path;
    }

    if (this.retrieve(pathToVerify) !== null) {
      // transforming the cache will trigger a call to `_cacheDidTransform`,
      // which will then trigger `didTransform`
      this._cache.transform(operation);

    } else if (operation.op === 'replace') {
      // try adding instead of replacing if the cache does not yet contain
      // the data
      operation.op = 'add';
      this._transformCache(operation);

    } else {
      // if the cache can't be transformed because, still trigger `didTransform`
      //
      // NOTE: this is not an error condition, since the local cache will often
      // be sparsely populated compared with the remote store
      this.didTransform(operation, []);
    }
  },

  _resourceIdURLSegment: function(type, id) {
    var resourceId = this.serializer.resourceId(type, id);
    if (isArray(resourceId)) {
      resourceId = resourceId.join(',');
    }
    return resourceId;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Publicly accessible methods particular to JSONAPISource
  /////////////////////////////////////////////////////////////////////////////

  ajax: function(url, method, hash) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      hash = hash || {};
      hash.url = url;
      hash.type = method;
      hash.dataType = 'json';
      hash.context = _this;

      // console.log('ajax start', method);

      if (hash.data && method !== 'GET') {
        // If contentType has not been specified, use the appropriate type
        // according to the JSON API spec
        if (!hash.contentType) {
          if (method === 'PATCH') {
            hash.contentType = 'application/json-patch+json; charset=utf-8';
          } else {
            hash.contentType = 'application/vnd.api+json; charset=utf-8';
          }
        }
        hash.data = JSON.stringify(hash.data);
      }

      if (_this.ajaxHeaders) {
        var headers = _this.ajaxHeaders();
        hash.beforeSend = function (xhr) {
          for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
              xhr.setRequestHeader(key, headers[key]);
            }
          }
        };
      }

      hash.success = function(json) {
        // console.log('ajax success', method, json);
        resolve(json);
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR) {
          jqXHR.then = null;
        }
        // console.log('ajax error', method, jqXHR);

        reject(jqXHR);
      };

      Orbit.ajax(hash);
    });
  },

  ajaxHeaders: function() {
    return this.headers;
  },

  resourceNamespace: function(type) {
    return this.namespace;
  },

  resourceHost: function(type) {
    return this.host;
  },

  resourcePath: function(type, id) {
    var path = [this.serializer.resourceType(type)];
    if (id) {
      path.push(this._resourceIdURLSegment(type, id));
    }
    return path.join('/');
  },

  resourceURL: function(type, id) {
    var host = this.resourceHost(type),
        namespace = this.resourceNamespace(type),
        url = [];

    if (host) { url.push(host); }
    if (namespace) { url.push(namespace); }
    url.push(this.resourcePath(type, id));

    url = url.join('/');
    if (!host) { url = '/' + url; }

    return url;
  },

  resourceLinkURL: function(type, id, link, relId) {
    var url = this.resourceURL(type, id);
    url += '/links/' + this.serializer.resourceLink(type, link);

    if (relId) {
      var linkDef = this.schema.models[type].links[link];

      url += '/' + this._resourceIdURLSegment(linkDef.model, relId);
    }

    return url;
  },

  deserialize: function(type, id, data, parentOperation) {
    var deserialized = this.serializer.deserialize(type, id, data);
    var primaryRecords = deserialized[type];

    // Create a new parent operation, if necessary, to ensure that subsequent
    // operations are related and will be settled together in the same
    // transformation.
    //
    // Note: this parent operation is not actually performed on this source.
    // It is only created to establish a common ancestor.
    if (!parentOperation) {
      parentOperation = new Operation();
    }

    if (this._cache) {
      if (isArray(primaryRecords)) {
        this._addRecordsToCache(type, primaryRecords, parentOperation);
      } else {
        this._addRecordToCache(type, primaryRecords, parentOperation);
      }

      if (deserialized.linked) {
        Object.keys(deserialized.linked).forEach(function(relType) {
          var relRecords = deserialized.linked[relType];
          this._addRecordsToCache(relType, relRecords, parentOperation);
        }, this);
      }
    }

    return primaryRecords;
  }
});

export default JSONAPISource;
