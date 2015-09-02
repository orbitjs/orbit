import Serializer from './serializer';
import { clone, isArray, isObject } from 'orbit/lib/objects';
import { dasherize, camelize } from 'orbit/lib/strings';

export default Serializer.extend({
  resourceKey: function(type) {
    return 'id';
  },

  resourceType: function(type) {
    return dasherize( this.schema.pluralize(type) );
  },

  resourceLink: function(type, link) {
    return dasherize( link );
  },

  resourceAttr: function(type, attr) {
    return dasherize( attr );
  },

  typeFromResourceType: function(resourceType) {
    return camelize( this.schema.singularize(resourceType) );
  },

  attrFromResourceAttr: function(type, resourceAttr) {
    return camelize( resourceAttr );
  },

  linkFromResourceLink: function(type, resourceLink) {
    return camelize( resourceLink );
  },

  resourceId: function(type, id) {
    if (isArray(id)) {
      var ids = [];
      for (var i = 0, l = id.length; i < l; i++) {
        ids.push(this.resourceId(type, id[i]));
      }

      return ids;
    }

    var primaryKey = this.schema.modelDefinition(type).primaryKey.name;
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
    var primaryKey = this.schema.modelDefinition(type).primaryKey;
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
    var value = this.resourceId(type, record);
    if (value !== undefined) {
      json.id = value;
    }
  },

  serializeType: function(type, record, json) {
    json.type = this.resourceType(type);
  },

  serializeAttributes: function(type, record, json) {
    var modelDef = this.schema.modelDefinition(type);

    Object.keys(modelDef.attributes).forEach(function(attr) {
      this.serializeAttribute(type, record, attr, json);
    }, this);
  },

  serializeAttribute: function(type, record, attr, json) {
    var value = record[attr];
    if (value !== undefined) {
      if (json.attributes === undefined) {
        json.attributes = {};
      }

      json.attributes[this.resourceAttr(type, attr)] = value;
    }
  },

  serializeLinks: function(type, record, json) {
    var modelDef = this.schema.modelDefinition(type);
    var linkNames = Object.keys(modelDef.links);

    if (linkNames.length > 0 && record.__rel) {
      json.relationships = {};

      linkNames.forEach(function (link) {
        var linkDef = modelDef.links[link];
        var value = record.__rel[link];

        if (linkDef.type === 'hasMany') {
          value = Object.keys(value).map(function(id) {
            return this.serializeRelationshipIdentifier(linkDef.model, id);
          }, this);
        } else if (value) {
          value = this.serializeRelationshipIdentifier(linkDef.model, value);
        } else {
          value = null;
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
    var pk = this.schema.modelDefinition(type).primaryKey.name;

    if (id) {
      record[pk] = id;
    }

    this.deserializeKey(type, record, this.resourceKey(type), data.id);

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

  deserializeKey: function(type, record, key, value) {
    record[key] = value;
  },

  deserializeAttributes: function(type, record, json) {
    var modelDef = this.schema.modelDefinition(type);
    Object.keys(modelDef.attributes).forEach(function(attr) {
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
      var schema = this.schema;
      var linkDef;
      var linkValue;
      var id;

      Object.keys(record.__relationships).forEach(function(link) {
        linkValue = record.__relationships[link].data;
        linkDef = schema.modelDefinition(type).links[link];

        if (!linkDef) return;

        if (linkDef.type === 'hasMany' && isArray(linkValue)) {
          record.__rel[link] = record.__rel[link] || [];

          var rels = record.__rel[link];
          linkValue.forEach(function(resourceId) {
            id = this.idFromResourceId(linkDef.model, resourceId.id);
            record.__rel[link][id] = true;
          }, this);

        } else if (linkDef.type === 'hasOne' && isObject(linkValue)) {
          id = this.idFromResourceId(linkDef.model, linkValue.id);
          record.__rel[link] = id;

        }

      }, this);

      delete record.__relationships;
    }
  }
});
