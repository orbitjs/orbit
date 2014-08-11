import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { isArray, isNone } from 'orbit/lib/objects';
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
    this._cache.transform(operation);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    var _this = this,
        modelSchema = this.schema.models[type],
        pk = modelSchema.primaryKey.name,
        result;

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
          resId =  id[i];

          res =  _this.retrieve([type, resId]);

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

      } else if (id !== null && typeof id === 'object') {
        if (id[pk]) {
          result = _this.retrieve([type, id[pk]]);

        } else {
          result = _this._filter.call(_this, type, id);
        }

      } else {
        result = _this.retrieve([type, id]);
      }

      if (result) {
        resolve(result);
      } else {
        reject(new RecordNotFoundException(type, id));
      }
    });
  },

  _findLink: function(type, id, key) {
    var _this = this,
        pk = this.schema.models[type].primaryKey.name,
        record;

    return new Orbit.Promise(function(resolve, reject) {
      if (id !== null && typeof id === 'object') {
        record = _this.retrieve([type, id[pk]]);

      } else {
        record = _this.retrieve([type, id]);
      }

      if (record) {
        var result;

        if (record.__rel) {
          result = record.__rel[key];

          if (result) {
            var linkDef = _this.schema.models[type].links[key],
                relatedModel = linkDef.model;

            if (linkDef.type === 'hasMany') {
              var relatedIds = Object.keys(result),
                  relatedRecord,
                  notFound;

              result = [];
              notFound = [];

              relatedIds.forEach(function(relatedId) {
                relatedRecord = _this.retrieve([relatedModel, relatedId]);
                if (relatedRecord) {
                  result.push(relatedRecord);
                } else {
                  notFound.push(relatedRecord);
                }
              });

              if (notFound.length > 0) {
                result = null;
              }

            } else {
              result = _this.retrieve([relatedModel, result]);
            }
          }
        }

        if (result) {
          resolve(result);

        } else {
          reject(new LinkNotFoundException(type, id, key));
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
