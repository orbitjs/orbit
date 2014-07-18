import Serializer from './serializer';
import { clone, isArray } from 'orbit/lib/objects';

var JSONAPISerializer = Serializer.extend({
  serialize: function(type, data) {
    var serialized = clone(data);

    delete serialized.__normalized;
    delete serialized.__rev;
    delete serialized.__meta;

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

    var primaryKey = this.keyFromType(type);
    var payload = {};
    payload[primaryKey] = serialized;

    return payload;
  },

  deserialize: function(type, data) {
    var normalized = this.normalize(type, data);

    this.assignLinks(type, normalized);

    return normalized;
  },

  keyFromType: function(type) {
    return this.schema.pluralize(type);
  },

  typeFromKey: function(key) {
    return this.schema.singularize(key);
  },

  assignLinks: function(type, data) {
    var primaryData = data[type];
    var linkedData = data.linked;

    if (isArray(primaryData)) {
      this.assignLinksToRecords(type, primaryData);
    } else {
      this.assignLinksToRecord(type, primaryData);
    }

    if (linkedData) {
      Object.keys(linkedData).forEach(function(relType) {
        this.assignLinksToRecords(relType, linkedData[relType]);
      }, this);
    }
  },

  assignLinksToRecords: function(type, records) {
    records.forEach(function(record) {
      this.assignLinksToRecord(type, record);
    }, this);
  },

  assignLinksToRecord: function(type, record) {
    if (record.links) {
      record.__meta.links = record.__meta.links || {};

      var meta = record.__meta.links;
      var schema = this.schema;
      var linkSchema;
      var linkValue;
      var id;

      Object.keys(record.links).forEach(function(link) {
        linkValue = record.links[link];
        linkSchema = schema.models[type].links[link];

        if (linkSchema.type === 'hasMany' && isArray(linkValue)) {
          record.__rel[link] = record.__rel[link] || [];

          var rels = record.__rel[link];
          linkValue.forEach(function(remoteId) {
            id = schema.remoteToLocalId(linkSchema.model, remoteId);
            record.__rel[link][id] = id;
          });

        } else if (linkSchema.type === 'hasOne' && (typeof linkValue === 'string' || typeof linkValue === 'number')) {
          id = schema.remoteToLocalId(linkSchema.model, linkValue);
          record.__rel[link] = id;

        } else {
          meta[link] = linkValue;
        }

      }, this);

      delete record.links;
    }
  },

  normalize: function(type, data) {
    var normalizedData = {};

    var schema = this.schema;
    var primaryKey = this.keyFromType(type);
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
        relType = this.typeFromKey(relKey);
        relData = linkedData[relKey];
        normalizedData.linked[relType] = this._normalizeRecords(relType, relData);
      }, this);
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