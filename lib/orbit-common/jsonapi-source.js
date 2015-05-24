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

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var _this = this;
    var op    = operation.op;
    var path  = operation.path;

    // console.log('jsonapi#_transform', op, path, operation.value);

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
        var linkDef = _this.schema.linkDefinition(type, link);
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

  _transformReplace: function(operation) {
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

  _transformRemove: function(operation) {
    var _this = this;
    var type = operation.path[0];
    var id = operation.path[1];

    return this.ajax(this.resourceURL(type, id), 'DELETE').then(function() {
      _this._transformCache({op: 'remove', path: [type, id]});
    });
  },

  _transformAddLink: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;

    var linkDef = this.schema.linkDefinition(type, link);
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

  _transformRemoveLink: function(operation) {
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

  _transformReplaceLink: function(operation) {
    var _this = this;

    var type = operation.path[0];
    var id = operation.path[1];
    var link = operation.path[3];
    var relId = operation.path[4] || operation.value;

    // Convert a map of ids to an array
    if (isObject(relId)) {
      relId = Object.keys(relId);
    }

    var linkDef = this.schema.linkDefinition(type, link);
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

  _transformUpdateAttribute: function(operation) {
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

  _addRecordsToCache: function(type, records, parentOperation) {
    for (var i = 0, len = records.length; i < len; ++i) {
      this._addRecordToCache(type, records[i], parentOperation);
    }
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

    if (this.retrieve(pathToVerify) !== undefined) {
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

      // console.log('ajax start', method, url);

      if (hash.data && method !== 'GET') {
        if (!hash.contentType) {
          hash.contentType = _this.ajaxContentType(hash);
        }
        hash.data = JSON.stringify(hash.data);
      }

      if (_this.ajaxHeaders) {
        var headers = _this.ajaxHeaders();
        hash.beforeSend = function (xhr) {

          for(var i=0,keys=Object.keys(headers||[]),len=keys.length;i<len;++i){
            xhr.setRequestHeader(keys[i], headers[keys[i]]);
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

  ajaxContentType: function(url, method) {
    return 'application/vnd.api+json; charset=utf-8';
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
      var linkDef = this.schema.linkDefinition(type, link);

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
        for (var i = 0, relTypes = Object.keys(deserialized.linked), len = relTypes.length; i < len; ++i) {
          var relRecords = deserialized.linked[relTypes[i]];
          this._addRecordsToCache(relTypes[i], relRecords, parentOperation);
        }
      }
    }

    return primaryRecords;
  }
});

export default JSONAPISource;
