import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { isArray, isObject, isNone, clone, merge } from 'orbit/lib/objects';
import Source from './source';
import { RecordNotFoundException, LinkNotFoundException } from './lib/exceptions';

/**
 Source for storing in-memory data

 @class MemorySource
 @namespace OC
 @extends OC.Source
 @param schema
 @param options
 @constructor
 */
var MemorySource = Source.extend({
  init: function(schema, options) {
    assert('MemorySource requires Orbit.Promise to be defined', Orbit.Promise);
    this._super.apply(this, arguments);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    // Transform the cache
    // Note: the cache's didTransform event will trigger this source's
    // didTransform event.
    var inverse = this._cache.transform(operation);

    this.didTransform(operation, inverse);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id, options) {
    var _this = this,
        modelSchema = this.schema.models[type],
        pk = modelSchema.primaryKey.name,
        result;

    options = options || {};

    return new Orbit.Promise(function(resolve, reject) {
      if (isNone(id)) {
        result = _this._filter.call(_this, type);

      } else if (isArray(id)) {
        var res,
            resId,
            notFound;

        result = [];
        notFound = [];

        for (var i = 0, l = id.length; i < l; i++) {
          resId = id[i];

          res = _this.retrieve([type, resId]);

          if (res) {
            result.push(res);
          } else {
            notFound.push(resId);
          }
        }

        if (notFound.length > 0) {
          result = null;
          id = notFound;
        }
        else if (options.include) {
          _this._fetchRecords(type, id, options);
        }

      } else if (id !== null && typeof id === 'object') {
        if (id[pk]) {
          result = _this._fetchRecord(type, id[pk], options);

        } else {
          result = _this._filter.call(_this, type, id);
        }

      } else {
        result = _this._fetchRecord(type, id, options);
      }

      if (result) {
        resolve(result);
      } else {
        reject(new RecordNotFoundException(type, id));
      }
    });
  },

  _fetchRecords: function(type, ids, options) {
    var records = [];

    for (var i = 0, l = ids.length; i < l; i++) {
      var record = this._fetchRecord(type, ids[i], options);
      records.push(record);
    }

    return records;
  },

  _fetchRecord: function(type, id, options) {
    var _this = this;
    var record = this.retrieve([type, id]);
    if (!record) throw new RecordNotFoundException(type, id);

    var include = this._parseInclude(options.include);

    if (include) {
      Object.keys(include).forEach(function(link) {
        _this._fetchLinked(type, id, link, merge(options, {include: include[link]}));
      });
    }

    return record;
  },

  _fetchLinked: function(type, id, link, options) {
    var linkType = this.schema.models[type].links[link].model;
    var linkValue = this.retrieveLink(type, id, link);

    if (linkValue === undefined) throw new LinkNotFoundException(type, id, link);
    if (linkValue === null) return null;

    return isArray(linkValue)
           ? this._fetchRecords(linkType, linkValue, options)
           : this._fetchRecord(linkType, linkValue, options);
  },

  _parseInclude: function(include) {
    if (!include) return undefined;
    if (isObject(include) && !isArray(include)) return include;
    if (!isArray(include)) include = [include];

    var parsed = {};

    include.forEach(function(inclusion) {
      var current = parsed;
      inclusion.split(".").forEach(function(link) {
        current[link] = current[link] || {};
        current = current[link];
      });
    });

    return parsed;
  },

  _findLink: function(type, id, link) {
    var _this = this;

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

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _filter: function(type, query) {
    var all = [],
        dataForType,
        i,
        prop,
        match,
        record;

    dataForType = this.retrieve([type]);

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        if (query === undefined) {
          match = true;
        } else {
          match = false;
          for (prop in query) {
            if (record[prop] === query[prop]) {
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
  },

  _filterOne: function(type, prop, value) {
    var dataForType,
        i,
        record;

    dataForType = this.retrieve([type]);

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        if (record[prop] === value) {
          return record;
        }
      }
    }
  }
});

export default MemorySource;
