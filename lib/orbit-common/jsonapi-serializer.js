import Serializer from './serializer';
import { clone, isArray, isObject } from 'orbit/lib/objects';

var JSONAPISerializer = Serializer.extend({
  resourceKey: function(type) {
    return 'id';
  },

  resourceType: function(type) {
    return this.schema.pluralize(type);
  },

  resourceLink: function(type, link) {
    return link;
  },

  resourceAttr: function(type, attr) {
    return attr;
  },

  typeFromResourceType: function(resourceType) {
    return this.schema.singularize(resourceType);
  },

  resourceId: function(type, id) {
    if (isArray(id)) {
      var ids = [];
      for (var i = 0, l = id.length; i < l; i++) {
        ids.push(this.resourceId(type, id[i]));
      }

      return ids;
    }

    var primaryKey = this.schema.models[type].primaryKey.name;
    var resourceKey = this.resourceKey(type);

    if (isObject(id)) {
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
    var primaryKey = this.schema.models[type].primaryKey;
    var pk = primaryKey.name;
    var rk = this.resourceKey(type);

    if (resourceId !== null && typeof resourceId === 'object') {
      if (resourceId[pk]) {
        return resourceId[pk];
      }
      resourceId = resourceId[rk];
    }

    var id;

    if (rk === pk) {
      id = resourceId;
    } else {
      id = this.schema.secondaryToPrimaryKey(type, rk, resourceId, true);
    }

    return id;
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

    for (var i = 0, len = records.length; i < len; ++i) {
      json.push(this.serializeRecord(type, records[i]));
    }

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
    var attrs = Object.keys(modelSchema.attributes);
    for (var i = 0, len = attrs.length; i < len; ++i) {
      this.serializeAttribute(type, record, attrs[i], json);
    }
  },

  serializeAttribute: function(type, record, attr, json) {
    json[this.resourceAttr(type, attr)] = record[attr];
  },

  serializeLinks: function(type, record, json) {
    var modelSchema = this.schema.models[type];
    var linkNames = Object.keys(modelSchema.links);

    if (linkNames.length > 0) {
      json.links = {};

      for (var i = 0, len = linkNames.length, link, linkDef, value; i < len; ++i) {
        link = linkNames[i];
        linkDef = modelSchema.links[link];
        value = record.__rel[link];

        if (linkDef.type === 'hasMany') {
          value = Object.keys(value);
        }

        json.links[link] = value;

      }
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
      records.linked = {};

      for (var i = 0, attrs = Object.keys(linkedData), len = attrs.length, linkedResourceType, relType, relData; i < len; ++i) {
        linkedResourceType = attrs[i];
        relType = this.typeFromResourceType(linkedResourceType);
        relData = linkedData[linkedResourceType];
        records.linked[relType] = this.deserializeRecords(relType, null, relData);
      }

    }

    this.assignLinks(type, records);

    return records;
  },

  deserializeLink: function(type, data) {
    var resourceType = this.resourceType(type);
    return data[resourceType];
  },

  deserializeRecords: function(type, ids, data) {
    var records = [];
    for (var i = 0, len = data.length, id; i < len; ++i) {
      id = ids && ids[i] ? ids[i] : null;
      records.push(this.deserializeRecord(type, id, data[i]));
    }

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
      for (var i = 0, linkedTypes = Object.keys(linkedData), len = linkedTypes.length; i < len; ++i) {
        this.assignLinksToRecords(linkedTypes[i], linkedData[linkedTypes[i]]);
      }
    }
  },

  assignLinksToRecords: function(model, records) {
    for (var i = 0, len = records.length; i < len; ++i) {
      this.assignLinksToRecord(model, records[i]);
    }
  },

  assignLinksToRecord: function(model, record) {
    if (record.links) {
      record.__meta.links = record.__meta.links || {};

      var meta = record.__meta.links;
      var schema = this.schema;

      for (var i = 0, links = Object.keys(record.links), len = links.length, linkSchema, linkValue, id, link; i < len; ++i) {
        link = links[i];
        linkValue = record.links[link];
        linkSchema = schema.models[model].links[link];

        if (!linkSchema) return;

        if (linkSchema.type === 'hasMany' && isArray(linkValue)) {
          record.__rel[link] = record.__rel[link] || [];

          for (var j = 0, len1 = linkValue.length; j < len1; ++j) {
            id = this.idFromResourceId(linkSchema.model, linkValue[j]);
            record.__rel[link][id] = true;
          }

        } else if (linkSchema.type === 'hasOne' && (typeof linkValue === 'string' || typeof linkValue === 'number')) {
          id = this.idFromResourceId(linkSchema.model, linkValue);
          record.__rel[link] = id;

        } else {
          meta[link] = linkValue;
        }

      }

      delete record.links;
    }
  }
});

export default JSONAPISerializer;
