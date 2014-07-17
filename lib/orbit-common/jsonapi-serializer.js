import Serializer from './serializer';
import { clone, isArray } from 'orbit/lib/objects';

var JSONAPISerializer = Serializer.extend({
  serialize: function(type, data) {
    var serialized = clone(data);

    delete serialized.__normalized;
    delete serialized.__rev;

    if (this.schema.idField !== this.schema.remoteIdField) {
      delete serialized[this.schema.idField];
    }

    if (serialized.__rel) {
      var relKeys = Object.keys(serialized.__rel);

      if (relKeys.length > 0) {
        var links = {};

        relKeys.forEach(function(key) {
          var link = serialized.__rel[key];
          if (typeof link === 'object') {
            links[key] = Object.keys(link);
          } else {
            links[key] = link;
          }
        });

        serialized.links = links;
      }

      delete serialized.__rel;
    }

    var primaryType = this.schema.pluralize(type);
    var payload = {};
    payload[primaryType] = serialized;

    return payload;
  },

  deserialize: function(type, data) {
    var normalizedData = {};

    var _this = this;
    var schema = this.schema;
    var primaryKey = schema.pluralize(type);
    var primaryData = data[primaryKey];

    if (isArray(primaryData)) {
      normalizedData[type] = this._normalizeRecords(type, primaryData);
    } else {
      normalizedData[type] = this._normalizeRecord(type, primaryData);
    }

    var linkedData = data.linked;

    if (linkedData) {
      var relType,
          relKey,
          relData;

      normalizedData.linked = {};

      Object.keys(linkedData).forEach(function(relKey) {
        relType = schema.singularize(relKey);
        relData = linkedData[relKey];
        normalizedData.linked[relType] = _this._normalizeRecords(relType, relData);
      });
    }

    return normalizedData;
  },

  _normalizeRecords: function(type, data) {
    var _this = this,
        records = [];

    data.forEach(function(record) {
      records.push(_this._normalizeRecord(type, record));
    });

    return records;
  },

  _normalizeRecord: function(type, data) {
    return this.schema.normalize(type, data);
  }
});

export default JSONAPISerializer;