import Orbit from 'orbit/core';
import Source from 'orbit/sources/source';

var MemorySource = function() {
  this.init.apply(this, arguments);
};

Orbit.extend(MemorySource.prototype, Source.prototype, {
  constructor: MemorySource,

  init: function(schema, options) {
    Orbit.assert('MemorySource requires Orbit.Promise to be defined', Orbit.Promise);

    Source.prototype.init.apply(this, arguments);
  },

  initRecord: function(type, record) {
    this._cache.initRecord(type, record);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var inverse = this._cache.transform(operation, true);
    this.didTransform(operation, inverse);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (id === undefined || typeof id === 'object') {
        resolve(_this._filter.call(_this, type, id));
      } else {
        var record = _this.retrieve([type, id]);
        if (record && !record.deleted) {
          resolve(record);
        } else {
          reject(new Orbit.NotFoundException(type, id));
        }
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
        if (match && !record.deleted) {
          all.push(record);
        }
      }
    }
    return all;
  }
});

export default MemorySource;