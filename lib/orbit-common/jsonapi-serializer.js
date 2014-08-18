import Serializer from './serializer';
import { clone, isArray } from 'orbit/lib/objects';

var JSONAPISerializer = Serializer.extend({
  resourceKey: function(type) {
    return 'id';
  },

  resourceType: function(type) {
    return this.schema.pluralize(type);
  },

  typeFromResourceType: function(resourceType) {
    return this.schema.singularize(resourceType);
  },

  resourceId: function(type, id) {
    var primaryKey = this.schema.models[type].primaryKey.name;
    var resourceKey = this.resourceKey(type);

    if (id !== null && typeof id === 'object') {
      if (id[resourceKey]) {
        return id[resourceKey];
      }
      id = id[primaryKey];
    }

    if (resourceKey === primaryKey) {
      return id;
    } else {
      return this.schema.primaryToSecondaryKey(type, resourceKey, id);
    }
  },

  idFromResourceId: function(type, resourceId) {
    var primaryKey = this.schema.models[type].primaryKey.name;
    var resourceKey = this.resourceKey(type);

    if (resourceId !== null && typeof resourceId === 'object') {
      if (resourceId[primaryKey]) {
        return resourceId[primaryKey];
      }
      resourceId = resourceId[resourceKey];
    }

    if (resourceKey === primaryKey) {
      return resourceId;
    } else {
      return this.schema.secondaryToPrimaryKey(type, resourceKey, resourceId);
    }
  },

  serialize: function(type, records) {
    var json = {},
        resourceType = this.resourceType(type);

    if (isArray(records)) {
      json[resourceType] = this.serializeRecords(type, records);
    } else {
      json[resourceType] = this.serializeRecord(type, records);
    }

    return json;
  },

  serializeRecords: function(type, records) {
    var json = [];

    records.forEach(function(record) {
      json.push(this.serializeRecord(type, record));
    }, this);

    return json;
  },

  serializeRecord: function(type, record) {
    var json = {};

    this.serializeKeys(type, record, json);
    this.serializeAttributes(type, record, json);
    this.serializeLinks(type, record, json);

    return json;
  },

  serializeKeys: function(type, record, json) {
    var modelSchema = this.schema.models[type];
    var resourceKey = this.resourceKey(type);
    var value = record[resourceKey];

    if (value) {
      json[resourceKey] = value;
    }
  },

  serializeAttributes: function(type, record, json) {
    var modelSchema = this.schema.models[type];

    Object.keys(modelSchema.attributes).forEach(function(attr) {
      json[attr] = this.serializeAttribute(type, record, attr);
    }, this);
  },

  serializeAttribute: function(type, record, attr) {
    return record[attr];
  },

  serializeLinks: function(type, record, json) {
    var modelSchema = this.schema.models[type];
    var linkNames = Object.keys(modelSchema.links);

    if (linkNames.length > 0) {
      json.links = {};

      linkNames.forEach(function (link) {
        var linkDef = modelSchema.links[link];
        var value = record.__rel[link];

        if (linkDef.type === 'hasMany') {
          json.links[link] = Object.keys(value);

        } else {
          json.links[link] = value;
        }

      }, this);
    }
  },

  deserialize: function(type, id, data) {
    var records = {};
    var schema = this.schema;
    var resourceType = this.resourceType(type);
    var primaryData = data[resourceType];

    if (isArray(primaryData)) {
      records[type] = this.deserializeRecords(type, id, primaryData);
    } else {
      records[type] = this.deserializeRecord(type, id, primaryData);
    }

    var linkedData = data.linked;

    if (linkedData) {
      var relType;
      var relKey;
      var relData;

      records.linked = {};

      Object.keys(linkedData).forEach(function(linkedResourceType) {
        relType = this.typeFromResourceType(linkedResourceType);
        relData = linkedData[linkedResourceType];
        records.linked[relType] = this.deserializeRecords(relType, null, relData);
      }, this);
    }

    this.assignLinks(type, records);

    return records;
  },

  deserializeRecords: function(type, ids, data) {
    var records = [];

    data.forEach(function(recordData, i) {
      var id = ids && ids[i] ? ids[i] : null;

      records.push(this.deserializeRecord(type, id, recordData));
    }, this);

    return records;
  },

  deserializeRecord: function(type, id, data) {
    if (id) {
      data[this.schema.models[type].primaryKey.name] = id;
    }
    return this.schema.normalize(type, data);
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
      Object.keys(linkedData).forEach(function(linkedType) {
        this.assignLinksToRecords(linkedType, linkedData[linkedType]);
      }, this);
    }
  },

  assignLinksToRecords: function(model, records) {
    records.forEach(function(record) {
      this.assignLinksToRecord(model, record);
    }, this);
  },

  assignLinksToRecord: function(model, record) {
    if (record.links) {
      record.__meta.links = record.__meta.links || {};

      var meta = record.__meta.links;
      var schema = this.schema;
      var linkSchema;
      var linkValue;
      var id;

      Object.keys(record.links).forEach(function(link) {
        linkValue = record.links[link];
        linkSchema = schema.models[model].links[link];

        if (linkSchema.type === 'hasMany' && isArray(linkValue)) {
          record.__rel[link] = record.__rel[link] || [];

          var rels = record.__rel[link];
          linkValue.forEach(function(resourceId) {
            id = this.idFromResourceId(linkSchema.model, resourceId);
            record.__rel[link][id] = id;
          }, this);

        } else if (linkSchema.type === 'hasOne' && (typeof linkValue === 'string' || typeof linkValue === 'number')) {
          id = this.idFromResourceId(linkSchema.model, linkValue);
          record.__rel[link] = id;

        } else {
          meta[link] = linkValue;
        }

      }, this);

      delete record.links;
    }
  }
});

export default JSONAPISerializer;
