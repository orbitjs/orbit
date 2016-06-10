import Serializer from '../serializer';
import { isArray, isObject } from 'orbit/lib/objects';
import { dasherize, camelize } from 'orbit/lib/strings';
import { parseIdentifier, toIdentifier } from '../lib/identifiers';

export default class JSONAPISerializer extends Serializer {
  resourceKey(/* type */) {
    return 'id';
  }

  resourceType(type) {
    return dasherize(this.network.schema.pluralize(type));
  }

  resourceRelationship(type, relationship) {
    return dasherize(relationship);
  }

  resourceAttr(type, attr) {
    return dasherize(attr);
  }

  typeFromResourceType(resourceType) {
    return camelize(this.network.schema.singularize(resourceType));
  }

  attrFromResourceAttr(type, resourceAttr) {
    return camelize(resourceAttr);
  }

  relationshipFromResourceRelationship(type, resourceRelationship) {
    return camelize(resourceRelationship);
  }

  resourceId(type, id) {
    if (isArray(id)) {
      let ids = [];
      for (var i = 0, l = id.length; i < l; i++) {
        ids.push(this.resourceId(type, id[i]));
      }

      return ids;
    }

    let resourceKey = this.resourceKey(type);

    if (isObject(id)) {
      if (id.keys && id.keys[resourceKey]) {
        return id.keys[resourceKey];
      }
      id = id.id;
    }

    if (resourceKey === 'id') {
      return id;
    } else {
      return this.network.keyMap.idToKey(type, resourceKey, id);
    }
  }

  idFromResourceId(type, resourceId) {
    let resourceKey = this.resourceKey(type);

    if (isObject(resourceId)) {
      if (resourceId.id) {
        return resourceId.id;
      }
      resourceId = resourceId[resourceKey];
    }

    if (resourceKey === 'id') {
      return resourceId;
    }

    let existingId = this.keyMap.keyToId(type, resourceKey, resourceId);

    if (existingId) {
      return existingId;
    }

    return this.generateNewId(type, resourceKey, resourceId);
  }

  serialize(records) {
    let json = {};

    if (isArray(records)) {
      json.data = records.map(this.serializeRecords);
    } else {
      json.data = this.serializeRecord(records);
    }

    return json;
  }

  serializeRecord(record) {
    let json = {};

    this.serializeId(record, json);
    this.serializeType(record, json);
    this.serializeAttributes(record, json);
    this.serializeRelationships(record, json);

    return json;
  }

  serializeId(record, json) {
    let value = this.resourceId(record.type, record);
    if (value !== undefined) {
      json.id = value;
    }
  }

  serializeType(record, json) {
    json.type = this.resourceType(record.type);
  }

  serializeAttributes(record, json) {
    if (record.attributes) {
      Object.keys(record.attributes).forEach(attr => {
        this.serializeAttribute(record, attr, json);
      });
    }
  }

  serializeAttribute(record, attr, json) {
    let value = record.attributes[attr];
    if (value !== undefined) {
      json.attributes = json.attributes || {};
      json.attributes[this.resourceAttr(record.type, attr)] = value;
    }
  }

  serializeRelationships(record, json) {
    if (record.relationships) {
      Object.keys(record.relationships).forEach(relationship => {
        this.serializeRelationship(record, relationship, json);
      });
    }
  }

  serializeRelationship(record, relationship, json) {
    let value = record.relationships[relationship].data;
    if (value !== undefined) {
      json.relationships = json.relationships || {};

      if (isObject(value)) {
        value = Object.keys(value).map(id => {
          return this.serializeIdentifier(parseIdentifier(id));
        });
      } else if (value !== null) {
        value = this.serializeIdentifier(parseIdentifier(value));
      }

      const resourceRelationship = this.resourceRelationship(record.type, relationship);

      json.relationships[resourceRelationship] = {
        data: value
      };
    }
  }

  serializeIdentifier(identifier) {
    return {
      type: this.resourceType(identifier.type),
      id: this.resourceId(identifier.type, identifier.id)
    };
  }

  deserialize(json) {
    let records = {};

    if (isArray(json.data)) {
      records.primary = json.data.map(this.deserializeRecord, this);
    } else {
      records.primary = this.deserializeRecord(json.data);
    }

    if (json.included) {
      records.included = json.included.map(this.deserializeRecord, this);
    }

    return records;
  }

  deserializeRecord(data) {
    let record = {
      type: this.typeFromResourceType(data.type)
    };

    this.deserializeKey(record, data);
    this.deserializeAttributes(record, data);
    this.deserializeRelationships(record, data);

    return this.initializeRecord(record);
  }

  initializeRecord(record) {
    if (!record.id) {
      record.id = this.keyMap.findIdForRecord(record);
    }

    this.schema.normalize(record);

    if (record.id) {
      this.keyMap.pushRecord(record);
    }

    return record;
  }

  deserializeKey(record, data) {
    let resourceKey = this.resourceKey(record.type);
    let resourceId = data.id;

    if (resourceKey === 'id') {
      record.id = resourceId;
    } else {
      record.keys = record.keys || {};
      record.keys[resourceKey] = resourceId;
    }
  }

  deserializeAttributes(record, json) {
    if (json.attributes) {
      Object.keys(json.attributes).forEach(resourceAttr => {
        var value = json.attributes[resourceAttr];
        if (value !== undefined) {
          let attr = this.attrFromResourceAttr(record.type, resourceAttr);
          this.deserializeAttribute(record, attr, value);
        }
      });
    }
  }

  deserializeAttribute(record, attr, value) {
    record.attributes = record.attributes || {};
    record.attributes[attr] = value;
  }

  deserializeRelationships(record, json) {
    if (json.relationships) {
      Object.keys(json.relationships).forEach(resourceRel => {
        var value = json.relationships[resourceRel] && json.relationships[resourceRel].data;
        if (value !== undefined) {
          var relationship = this.relationshipFromResourceRelationship(record.type, resourceRel);
          this.deserializeRelationship(record, relationship, value);
        }
      });
    }
  }

  deserializeRelationship(record, relationship, value) {
    let data;

    if (isArray(value)) {
      data = {};
      value.forEach(each => {
        data[this.deserializeIdentifier(each)] = true;
      });
    } else if (isObject(value)) {
      data = this.deserializeIdentifier(value);
    }

    record.relationships = record.relationships || {};
    record.relationships[relationship] = { data };
  }

  deserializeIdentifier(resourceIdentifier) {
    var type = this.typeFromResourceType(resourceIdentifier.type);
    var id = this.idFromResourceId(type, resourceIdentifier.id);
    return toIdentifier(type, id);
  }

  generateNewId(type, keyName, keyValue) {
    let newId = this.schema.generateDefaultId(type, keyName);

    this.keyMap.pushRecord({
      type,
      id: newId,
      keys: {
        [keyName]: keyValue
      }
    });

    return newId;
  }
}
