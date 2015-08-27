import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, isObject, isNone, clone, merge } from 'orbit/lib/objects';
import { eq } from 'orbit/lib/eq';
import Source from './source';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import { RecordNotFoundException, LinkNotFoundException } from './lib/exceptions';

/**
 Source for storing in-memory data

 @class MemorySource
 @namespace OC
 @extends OC.Source
 @param {OC.Schema} [schema]
 @param {Object}    [options]
 @param {Object}    [options.cacheOptions] Options for cache.
 @constructor
 */
var MemorySource = Source.extend({
  init: function(schema, options) {
    assert('MemorySource requires Orbit.Promise to be defined', Orbit.Promise);
    options = options || {};
    options.useCache = true;
    options.cacheOptions = options.cacheOptions || {};
    options.cacheOptions.processors =  options.cacheOptions.processors || [SchemaConsistencyProcessor, CacheIntegrityProcessor];
    this._super.call(this, schema, options);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(ops) {
    return this._cache.transform(ops);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id, options) {
    var _this = this;

    if (options) throw new Exception('`MemorySource#find` does not support `options` argument');

    return new Orbit.Promise(function(resolve) {
      var result;

      if (isNone(id)) {
        result = _this._fetchAll(type);

      } else if (isArray(id)) {
        result = _this._fetchMany(type, id);

      } else {
        result = _this._fetchOne(type, id);
      }

      resolve(result);
    });
  },

  _query: function(type, query, options) {
    var _this = this;

    if (options) throw new Exception('`MemorySource#query` does not support `options` argument');

    return new Orbit.Promise(function(resolve) {
      var result = _this._filter(type, query);

      resolve(result);
    });
  },

  _findLink: function(type, id, link, options) {
    var _this = this;

    if (options) throw new Exception('`MemorySource#findLink` does not support `options` argument');

    return new Orbit.Promise(function(resolve, reject) {
      id = _this.getId(type, id);

      var record = _this.retrieve([type, id]);

      if (record) {
        var relId;

        if (record.__rel) {
          relId = record.__rel[link];

          if (relId) {
            var linkDef = _this.schema.linkDefinition(type, link);
            if (linkDef.type === 'hasMany') {
              relId = Object.keys(relId);
            }
          }
        }

        if (relId) {
          resolve(relId);

        } else {
          reject(new LinkNotFoundException(type, id, link));
        }

      } else {
        reject(new RecordNotFoundException(type, id));
      }
    });
  },

  _findLinked: function(type, id, link, options) {
    var _this = this;

    if (options) throw new Exception('`MemorySource#findLinked` does not support `options` argument');

    return new Orbit.Promise(function(resolve) {
      var result = _this._fetchLinked(type, id, link);

      resolve(result);
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _fetchAll: function(type) {
    var records = [];
    var dataForType = this.retrieve([type]);

    if (!dataForType) throw new RecordNotFoundException(type);

    for (var i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        records.push( dataForType[i] );
      }
    }

    return records;
  },

  _fetchMany: function(type, ids) {
    var _this = this;
    var records = [];
    var notFound = [];
    var id;
    var record;

    for (var i = 0, l = ids.length; i < l; i++) {
      id = _this.getId(type, ids[i]);
      record = this.retrieve([type, id]);

      if (record) {
        records.push(record);
      } else {
        notFound.push(id);
      }
    }

    if (notFound.length > 0) throw new RecordNotFoundException(type, notFound);

    return records;
  },

  _fetchOne: function(type, id) {
    id = this.getId(type, id);

    var record = this.retrieve([type, id]);

    if (!record) throw new RecordNotFoundException(type, id);

    return record;
  },

  _fetchLinked: function(type, id, link) {
    id = this.getId(type, id);

    var linkType = this.schema.modelDefinition(type).links[link].model;
    var linkValue = this.retrieveLink(type, id, link);

    if (linkValue === undefined) throw new LinkNotFoundException(type, id, link);
    if (linkValue === null) return null;

    return isArray(linkValue)
           ? this._fetchMany(linkType, linkValue)
           : this._fetchOne(linkType, linkValue);
  },

  _filter: function(type, query) {
    var all = [],
        dataForType,
        i,
        prop,
        match,
        record;

    dataForType = this.retrieve([type]);
    if (!dataForType) throw new RecordNotFoundException(type, query);

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        match = false;
        for (prop in query) {
          if (eq(record[prop], query[prop])) {
            match = true;
          } else {
            match = false;
            break;
          }
        }
        if (match) all.push(record);
      }
    }

    return all;
  }
});

export default MemorySource;
