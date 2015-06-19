import Serializer from './serializer';
import { clone, isArray, isObject } from 'orbit/lib/objects';

export default Serializer.extend({
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

  attrFromResourceAttr: function(type, resourceAttr) {
    return resourceAttr;
  },

  linkFromResourceLink: function(type, resourceLink) {
    return resourceLink;
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
    var json = {};

    if (isArray(records)) {
      json.data = this.serializeRecords(type, records);
    } else {
      json.data = this.serializeRecord(type, records);
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

    this.serializeId(type, record, json);
    this.serializeType(type, record, json);
    this.serializeAttributes(type, record, json);
    this.serializeLinks(type, record, json);

    return json;
  },

  serializeId: function(type, record, json) {
    json.id = this.resourceId(type, record);
  },

  serializeType: function(type, record, json) {
    json.type = this.resourceType(type);
  },

  serializeAttributes: function(type, record, json) {
    var modelSchema = this.schema.models[type];

    if (json.attributes === undefined) {
      json.attributes = {};
    }

    Object.keys(modelSchema.attributes).forEach(function(attr) {
      this.serializeAttribute(type, record, attr, json);
    }, this);
  },

  serializeAttribute: function(type, record, attr, json) {
    json.attributes[this.resourceAttr(type, attr)] = record[attr];
  },

  serializeLinks: function(type, record, json) {
    var modelSchema = this.schema.models[type];
    var linkNames = Object.keys(modelSchema.links);

    if (linkNames.length > 0 && record.__rel) {
      json.relationships = {};

      linkNames.forEach(function (link) {
        var linkDef = modelSchema.links[link];
        var value = record.__rel[link];

        if (linkDef.type === 'hasMany') {
          value = Object.keys(value);
        }

        json.relationships[link] = {
          data: value
        };

      }, this);
    }
  },

  serializeRelationshipIdentifier: function(type, id) {
    return {
      type: this.resourceType(type),
      id: this.resourceId(type, id)
    };
  },

  deserialize: function(type, id, data) {
    var records = {};

    if (isArray(data.data)) {
      records.primary = this.deserializeRecords(type, id, data.data);
    } else {
      records.primary = this.deserializeRecord(type, id, data.data);
    }

    if (data.included) {
      records.included = {};

      data.included.forEach(function(recordData) {
        var recordType = this.typeFromResourceType(recordData.type);
        if (records.included[recordType] === undefined) {
          records.included[recordType] = [];
        }
        records.included[recordType].push(this.deserializeRecord(recordType, null, recordData));
      }, this);
    }

    this.assignLinks(type, records);

    return records;
  },

  deserializeLink: function(data) {
    if (isObject(data)) {
      if (isArray(data)) {
        return data.map(function(linkData) {
          return this.deserializeRelationshipIdentifier(linkData);
        }, this);
      } else {
        return this.deserializeRelationshipIdentifier(data);
      }

    } else {
      return data;
    }
  },

  deserializeRelationshipIdentifier: function(data) {
    var type = this.typeFromResourceType(data.type);
    return {
      type: type,
      id: this.idFromResourceId(type, data.id)
    };
  },

  deserializeRecords: function(type, ids, data) {
    return data.map(function(recordData, i) {
      var id = ids && ids[i] ? ids[i] : null;
      return this.deserializeRecord(type, id, recordData);
    }, this);
  },

  deserializeRecord: function(type, id, data) {
    var record = {};
    var attributes;
    var relationships;
    var pk = this.schema.models[type].primaryKey.name;

    if (id) {
      record[pk] = id;
    }

    if (pk !== 'id') {
      record.id = data.id;
    }

    if (data.attributes) {
      attributes = data.attributes;
      this.deserializeAttributes(type, record, attributes);
    }

    if (data.relationships) {
      // temporarily assign relationships as __relationships
      record.__relationships = data.relationships;
    }

    return this.schema.normalize(type, record);
  },

  deserializeAttributes: function(type, record, json) {
    var modelSchema = this.schema.models[type];
    Object.keys(modelSchema.attributes).forEach(function(attr) {
      var resourceAttr = this.resourceAttr(type, attr);
      var value = json[resourceAttr];
      if (value !== undefined) {
        this.deserializeAttribute(type, record, attr, value);
      }
    }, this);
  },

  deserializeAttribute: function(type, record, attr, value) {
    record[attr] = value;
  },

  assignLinks: function(type, records) {
    if (isArray(records.primary)) {
      this.assignLinksToRecords(type, records.primary);
    } else {
      this.assignLinksToRecord(type, records.primary);
    }

    if (records.included) {
      Object.keys(records.included).forEach(function(includedType) {
        this.assignLinksToRecords(includedType, records.included[includedType]);
      }, this);
    }
  },

  assignLinksToRecords: function(type, records) {
    records.forEach(function(record) {
      this.assignLinksToRecord(type, record);
    }, this);
  },

  assignLinksToRecord: function(type, record) {
    if (record.__relationships) {
      record.__meta.links = record.__meta.links || {};

      var meta = record.__meta.links;
      var schema = this.schema;
      var linkSchema;
      var linkValue;
      var id;

      Object.keys(record.__relationships).forEach(function(link) {
        linkValue = record.__relationships[link].data;
        linkSchema = schema.models[type].links[link];

        if (!linkSchema) return;

        if (linkSchema.type === 'hasMany' && isArray(linkValue)) {
          record.__rel[link] = record.__rel[link] || [];

          var rels = record.__rel[link];
          linkValue.forEach(function(resourceId) {
            id = this.idFromResourceId(linkSchema.model, resourceId.id);
            record.__rel[link][id] = true;
          }, this);

        } else if (linkSchema.type === 'hasOne' && isObject(linkValue)) {
          id = this.idFromResourceId(linkSchema.model, linkValue.id);
          record.__rel[link] = id;

        } else {
          meta[link] = linkValue;
        }

      }, this);

      delete record.__relationships;
    }
  }
});
