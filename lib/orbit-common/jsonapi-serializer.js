import Serializer from './serializer';
import { clone, isArray, isObject } from 'orbit/lib/objects';
import { dasherize, camelize } from 'orbit/lib/strings';
import { parseIdentifier, toIdentifier } from 'orbit-common/lib/identifiers';

export default Serializer.extend({
  resourceKey: function(type) {
    return 'id';
  },

  resourceType: function(type) {
    return dasherize( this.schema.pluralize(type) );
  },

  resourceRelationship: function(type, relationship) {
    return dasherize( relationship );
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

  relationshipFromResourceRelationship: function(type, resourceRelationship) {
    return camelize( resourceRelationship );
  },

  resourceId: function(type, id) {
    if (isArray(id)) {
      var ids = [];
      for (var i = 0, l = id.length; i < l; i++) {
        ids.push(this.resourceId(type, id[i]));
      }

      return ids;
    }

    var resourceKey = this.resourceKey(type);

    if (isObject(id)) {
      if (id.keys && id.keys[resourceKey]) {
        return id.keys[resourceKey];
      }
      id = id.id;
    }

    if (resourceKey === 'id') {
      return id;
    } else {
      return this.schema.idToKey(type, resourceKey, id);
    }
  },

  idFromResourceId: function(type, resourceId) {
    var resourceKey = this.resourceKey(type);

    if (isObject(resourceId)) {
      if (resourceId.id) {
        return resourceId.id;
      }
      resourceId = resourceId[resourceKey];
    }

    var id;

    if (resourceKey === 'id') {
      id = resourceId;
    } else {
      id = this.schema.keyToId(type, resourceKey, resourceId, true);
    }

    return id;
  },

  serialize: function(records) {
    var json = {};

    if (isArray(records)) {
      json.data = records.map(this.serializeRecords);
    } else {
      json.data = this.serializeRecord(records);
    }

    return json;
  },

  serializeRecord: function(record) {
    var json = {};

    this.serializeId(record, json);
    this.serializeType(record, json);
    this.serializeAttributes(record, json);
    this.serializeRelationships(record, json);

    return json;
  },

  serializeId: function(record, json) {
    var value = this.resourceId(record.type, record);
    if (value !== undefined) {
      json.id = value;
    }
  },

  serializeType: function(record, json) {
    json.type = this.resourceType(record.type);
  },

  serializeAttributes: function(record, json) {
    if (record.attributes) {
      Object.keys(record.attributes).forEach(function(attr) {
        this.serializeAttribute(record, attr, json);
      }, this);
    }
  },

  serializeAttribute: function(record, attr, json) {
    var value = record.attributes[attr];
    if (value !== undefined) {
      json.attributes = json.attributes || {};
      json.attributes[this.resourceAttr(record.type, attr)] = value;
    }
  },

  serializeRelationships: function(record, json) {
    if (record.relationships) {
      Object.keys(record.relationships).forEach(function(relationship) {
        this.serializeRelationship(record, relationship, json);
      }, this);
    }
  },

  serializeRelationship: function(record, relationship, json) {
    var value = record.relationships[relationship].data;
    if (value !== undefined) {
      json.relationships = json.relationships || {};

      if (isObject(value)) {
        value = Object.keys(value).map(function(id) {
          return this.serializeIdentifier(parseIdentifier(id));
        }, this);
      } else if (value !== null) {
        value = this.serializeIdentifier(parseIdentifier(value));
      }

      json.relationships[relationship] = {
        data: value
      };
    }
  },

  serializeIdentifier: function(identifier) {
    return {
      type: this.resourceType(identifier.type),
      id: this.resourceId(identifier.type, identifier.id)
    };
  },

  deserialize: function(json) {
    var records = {};

    if (isArray(json.data)) {
      records.primary = json.data.map(this.deserializeRecord, this);
    } else {
      records.primary = this.deserializeRecord(json.data);
    }

    if (json.included) {
      records.included = json.included.map(this.deserializeRecord, this);
    }

    return records;
  },

  deserializeRecord: function(data) {
    var record = {
      type: this.typeFromResourceType(data.type)
    };

    this.deserializeKey(record, data);
    this.deserializeAttributes(record, data);
    this.deserializeRelationships(record, data);

    return this.schema.normalize(record);
  },

  deserializeKey: function(record, data) {
    var resourceKey = this.resourceKey(record.type);
    var resourceId = data.id;

    if (resourceKey === 'id') {
      record.id = resourceId;
    } else {
      record.keys = record.keys || {};
      record.keys[resourceKey] = resourceId;
    }
  },

  deserializeAttributes: function(record, json) {
    if (json.attributes) {
      Object.keys(json.attributes).forEach(function(resourceAttr) {
        var value = json.attributes[resourceAttr];
        if (value !== undefined) {
          var attr = this.attrFromResourceAttr(record.type, resourceAttr);
          this.deserializeAttribute(record, attr, value);
        }
      }, this);
    }
  },

  deserializeAttribute: function(record, attr, value) {
    record.attributes = record.attributes || {};
    record.attributes[attr] = value;
  },

  deserializeRelationships: function(record, json) {
    if (json.relationships) {
      Object.keys(json.relationships).forEach(function(resourceRel) {
        var value = json.relationships[resourceRel] && json.relationships[resourceRel].data;
        if (value !== undefined) {
          var relationship = this.relationshipFromResourceRelationship(record.type, resourceRel);
          this.deserializeRelationship(record, relationship, value);
        }
      }, this);
    }
  },

  deserializeRelationship: function(record, relationship, value) {
    var relationshipData;

    if (isArray(value)) {
      relationshipData = {};
      value.forEach(function(each) {
        relationshipData[this.deserializeIdentifier(each)] = true;
      }, this);
    } else if (isObject(value)) {
      relationshipData = this.deserializeIdentifier(value);
    }

    record.relationships = record.relationships || {};
    record.relationships[relationship] = {
      data: relationshipData
    };
  },

  deserializeIdentifier: function(resourceIdentifier) {
    var type = this.typeFromResourceType(resourceIdentifier.type);
    var id = this.idFromResourceId(type, resourceIdentifier.id);
    return toIdentifier(type, id);
  }
});
