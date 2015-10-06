import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { Exception } from 'orbit/lib/exceptions';
import { isArray, isObject, isNone, clone, merge } from 'orbit/lib/objects';
import { eq } from 'orbit/lib/eq';
import { parseIdentifier, toIdentifier } from 'orbit-common/lib/identifiers';
import Source from './source';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import { RecordNotFoundException, RelationshipNotFoundException } from './lib/exceptions';

/**
 Source for storing in-memory data

 @class MemorySource
 @namespace OC
 @extends OC.Source
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @param {Object}    [options.cacheOptions] Options for cache.
 @constructor
 */
var MemorySource = Source.extend({
  init: function(options) {
    assert('MemorySource constructor requires `options`', options);
    assert('MemorySource requires Orbit.Promise to be defined', Orbit.Promise);
    options.useCache = true;
    options.cacheOptions = options.cacheOptions || {};
    options.cacheOptions.processors =  options.cacheOptions.processors || [SchemaConsistencyProcessor, CacheIntegrityProcessor];
    this._super.call(this, options);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(ops) {
    return this.cache.transform(ops);
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

  _findRelationship: function(recordIdentifier, relationship, options) {
    var _this = this;
    var type = recordIdentifier.type;
    var id = recordIdentifier.id;

    if (options) throw new Exception('`MemorySource#findLink` does not support `options` argument');

    return new Orbit.Promise(function(resolve, reject) {
      var relId = _this.retrieve([recordIdentifier.type, recordIdentifier.id, 'relationships', relationship, 'data']);

      if (isObject(relId)) {
        relId = Object.keys(relId).map(function(eachId) {
          return parseIdentifier(eachId);
        });
      } else if (!isNone(relId)) {
        relId = parseIdentifier(relId);
      }

      resolve(relId);
    });
  },

  _findRelated: function(recordIdentifier, relationship, options) {
    var _this = this;

    if (options) throw new Exception('`MemorySource#findRelated` does not support `options` argument');

    return this.findRelationship(recordIdentifier, relationship)
      .then(function(result) {
        if (isArray(result)) {
          return result.map(function(each) {
            return _this.retrieve([each.type, each.id]);
          });
        } else if (isObject(result)) {
          return _this.retrieve([result.type, result.id]);
        } else {
          return result;
        }
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
      id = ids[i];
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
    var record = this.retrieve([type, id]);

    if (!record) throw new RecordNotFoundException(type, id);

    return record;
  },

  _filter: function(type, query) {
    var all = [],
        dataForType,
        i,
        dataType,
        prop,
        match,
        record;

    dataForType = this.retrieve([type]);
    if (!dataForType) throw new RecordNotFoundException(type, query);

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        match = false;

        if (query.attributes && record.attributes) {
          for (prop in query.attributes) {
            if (eq(record.attributes[prop], query.attributes[prop])) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
        }

        if (match) all.push(record);
      }
    }

    return all;
  }
});

export default MemorySource;
