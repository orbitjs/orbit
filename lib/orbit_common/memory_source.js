import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { extend, isArray, isNone } from 'orbit/lib/objects';
import Source from './source';
import { RecordNotFoundException } from './lib/exceptions';

/**
 Source for storing in-memory data

 @class MemorySource
 @namespace OC
 @extends OC.Source
 @param schema
 @param options
 @constructor
 */
var MemorySource = function() {
  this.init.apply(this, arguments);
};

extend(MemorySource.prototype, Source.prototype, {
  constructor: MemorySource,

  init: function(schema, options) {
    assert('MemorySource requires Orbit.Promise to be defined', Orbit.Promise);

    Source.prototype.init.apply(this, arguments);
  },

  initRecord: function(type, record) {
    this.schema.initRecord(type, record);
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
        remoteIdField = this.schema.remoteIdField,
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

          if (typeof resId === 'object' && resId[remoteIdField]) {
            res = _this._findFirst.call(_this, type, remoteIdField, resId[remoteIdField]);
          } else {
            res =  _this.retrieve([type, resId]);
          }

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

      } else if (typeof id === 'object') {
        if (id[remoteIdField]) {
          result = _this._findFirst.call(_this, type, remoteIdField, id[remoteIdField]);
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

  _findFirst: function(type, prop, value) {
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