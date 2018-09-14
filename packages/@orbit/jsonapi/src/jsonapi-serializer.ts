import { isArray, isObject, dasherize, camelize, deepSet, Dict } from '@orbit/utils';
import {
  Schema,
  KeyMap,
  Record,
  RecordIdentity,
  RecordRelationship
} from '@orbit/data';
import {
  Resource,
  ResourceIdentity,
  ResourceHasManyRelationship,
  ResourceHasOneRelationship,
  ResourceRelationship,
  JSONAPIDocument
} from './jsonapi-document';

export interface DeserializedDocument {
  data: Record | Record[]
  included?: Record[]
}

export interface JSONAPISerializerSettings {
  schema: Schema;
  keyMap?: KeyMap;
}

export default class JSONAPISerializer {
  protected _schema: Schema;
  protected _keyMap: KeyMap;

  constructor(settings: JSONAPISerializerSettings) {
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  resourceKey(type: string): string {
    return 'id';
  }

  resourceType(type: string): string {
    return dasherize(this.schema.pluralize(type));
  }

  resourceRelationship(type: string, relationship: string): string {
    return dasherize(relationship);
  }

  resourceAttribute(type: string, attr: string): string {
    return dasherize(attr);
  }

  resourceIdentity(identity: RecordIdentity): ResourceIdentity {
    return {
      type: this.resourceType(identity.type),
      id: this.resourceId(identity.type, identity.id)
    };
  }

  resourceIds(type: string, ids: string[]): string[] {
    return ids.map(id => this.resourceId(type, id));
  }

  resourceId(type: string, id: string): string {
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      return id;
    } else {
      return this.keyMap.idToKey(type, resourceKey, id);
    }
  }

  recordId(type: string, resourceId: string): string {
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      return resourceId;
    }

    let existingId = this.keyMap.keyToId(type, resourceKey, resourceId);

    if (existingId) {
      return existingId;
    }

    return this._generateNewId(type, resourceKey, resourceId);
  }

  recordType(resourceType: string): string {
    return camelize(this.schema.singularize(resourceType));
  }

  recordIdentity(resourceIdentity: ResourceIdentity): RecordIdentity {
    let type = this.recordType(resourceIdentity.type);
    let id = this.recordId(type, resourceIdentity.id);
    return { type, id };
  }

  recordAttribute(type: string, resourceAttribute: string): string {
    return camelize(resourceAttribute);
  }

  recordRelationship(type: string, resourceRelationship: string): string {
    return camelize(resourceRelationship);
  }

  serializeDocument(data: Record | Record[]): JSONAPIDocument {
    return {
      data: isArray(data) ? this.serializeRecords(<Record[]>data) : this.serializeRecord(<Record>data)
    };
  }

  serializeRecords(records: Record[]): Resource[] {
    return records.map(record => this.serializeRecord(record));
  }

  serializeRecord(record: Record): Resource {
    let resource: Resource = {
      type: this.resourceType(record.type)
    };

    this.serializeId(resource, record);
    this.serializeAttributes(resource, record);
    this.serializeRelationships(resource, record);

    return resource;
  }

  serializeId(resource: Resource, record: RecordIdentity): void {
    let value = this.resourceId(record.type, record.id);
    if (value !== undefined) {
      resource.id = value;
    }
  }

  serializeAttributes(resource: Resource, record: Record): void {
    if (record.attributes) {
      Object.keys(record.attributes).forEach(attr => {
        this.serializeAttribute(resource, record, attr);
      });
    }
  }

  serializeAttribute(resource: Resource, record: Record, attr: string): void {
    let value: any = record.attributes[attr];
    if (value !== undefined) {
      deepSet(resource, ['attributes', this.resourceAttribute(record.type, attr)], value);
    }
  }

  serializeRelationships(resource: Resource, record: Record): void {
    if (record.relationships) {
      Object.keys(record.relationships).forEach(relationship => {
        this.serializeRelationship(resource, record, relationship);
      });
    }
  }

  serializeRelationship(resource: Resource, record: Record, relationship: string): void {
    const value = record.relationships[relationship].data;

    if (value !== undefined) {
      let data;

      if (isArray(value)) {
        data = (value as RecordIdentity[]).map(id => this.resourceIdentity(id));
      } else if (value !== null) {
        data = this.resourceIdentity(value as RecordIdentity);
      } else {
        data = null;
      }

      const resourceRelationship = this.resourceRelationship(record.type, relationship);

      deepSet(resource, ['relationships', resourceRelationship, 'data'], data);
    }
  }

  deserializeDocument(document: JSONAPIDocument, primaryRecordData?: Record | Record[]): DeserializedDocument {
    let result: DeserializedDocument;

    let data;
    if (isArray(document.data)) {
      if (primaryRecordData !== undefined) {
        data = (<Resource[]>document.data).map((entry, i) => {
          return this.deserializeResource(entry, primaryRecordData[i]);
        });
      } else {
        data = (<Resource[]>document.data).map((entry, i) => this.deserializeResource(entry));
      }
    } else if (document.data !== null) {
      if (primaryRecordData !== undefined) {
        data = this.deserializeResource(<Resource>document.data, (<Record>primaryRecordData));
      } else {
        data = this.deserializeResource(<Resource>document.data);
      }
    } else {
      data = null;
    }
    result = { data };

    if (document.included) {
      result.included = document.included.map(e => this.deserializeResource(e));
    }

    return result;
  }

  deserializeResource(resource: Resource, primaryRecord?: Record): Record {
    let record: Record;
    let type: string = this.recordType(resource.type);
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      record = { type, id: resource.id };
    } else {
      let id: string;
      let keys: Dict<string>;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id = (primaryRecord && primaryRecord.id) ||
             this.keyMap.idFromKeys(type, keys) ||
             this.schema.generateId(type);
      } else {
        id = (primaryRecord && primaryRecord.id) ||
             this.schema.generateId(type);
      }

      record = { type, id };

      if (keys) {
        record.keys = keys;
      }
    }

    this.deserializeAttributes(record, resource);
    this.deserializeRelationships(record, resource);

    if (this.keyMap) {
      this.keyMap.pushRecord(record);
    }

    return record;
  }

  deserializeAttributes(record: Record, resource: Resource): void {
    if (resource.attributes) {
      Object.keys(resource.attributes).forEach(resourceAttribute => {
        let attribute = this.recordAttribute(record.type, resourceAttribute);
        if (this.schema.hasAttribute(record.type, attribute)) {
          let value = resource.attributes[resourceAttribute];
          this.deserializeAttribute(record, attribute, value);
        }
      });
    }
  }

  deserializeAttribute(record: Record, attr: string, value: any): void {
    record.attributes = record.attributes || {};
    record.attributes[attr] = value;
  }

  deserializeRelationships(record: Record, resource: Resource): void {
    if (resource.relationships) {
      Object.keys(resource.relationships).forEach(resourceRel => {
        let relationship = this.recordRelationship(record.type, resourceRel);
        if (this.schema.hasRelationship(record.type, relationship)) {
          let value = resource.relationships[resourceRel];
          this.deserializeRelationship(record, relationship, value);
        }
      });
    }
  }

  deserializeRelationship(record: Record, relationship: string, value: ResourceRelationship) {
    let resourceData = value.data;

    if (resourceData !== undefined) {
      let data;

      if (resourceData === null) {
        data = null;
      } else if (isArray(resourceData)) {
        data = (resourceData as ResourceIdentity[]).map(resourceIdentity => this.recordIdentity(resourceIdentity));
      } else {
        data = this.recordIdentity(resourceData as ResourceIdentity);
      }

      record.relationships = record.relationships || {};
      record.relationships[relationship] = { data };
    }
  }

  protected _generateNewId(type: string, keyName: string, keyValue: string) {
    let id = this.schema.generateId(type);

    this.keyMap.pushRecord({
      type,
      id,
      keys: {
        [keyName]: keyValue
      }
    });

    return id;
  }
}
