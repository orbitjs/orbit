import { dasherize, camelize, deepSet, Dict } from '@orbit/utils';
import Orbit, {
  Schema,
  KeyMap,
  Record,
  RecordIdentity,
  ModelDefinition,
  RecordOperation,
  AddToRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  UpdateRecordOperation,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  AddRecordOperation,
  ReplaceAttributeOperation
} from '@orbit/data';
import {
  BooleanSerializer,
  StringSerializer,
  DateSerializer,
  DateTimeSerializer,
  Serializer,
  NumberSerializer
} from '@orbit/serializers';
import {
  AddResourceOperation,
  AddToRelatedResourcesOperation,
  RemoveFromRelatedResourcesOperation,
  RemoveResourceOperation,
  ReplaceRelatedResourceOperation,
  ReplaceRelatedResourcesOperation,
  Resource,
  ResourceDocument,
  ResourceIdentity,
  ResourceOperation,
  ResourceOperationsDocument,
  ResourceRelationship,
  UpdateResourceOperation
} from './resource-document';
import { RecordDocument } from './record-document';

const { deprecate } = Orbit;

export interface DeserializeOptions {
  primaryRecord?: Record;
  primaryRecords?: Record[];
}

export interface JSONAPISerializerSettings {
  schema: Schema;
  keyMap?: KeyMap;
  serializers?: Dict<Serializer<any, any>>;
}

export class JSONAPISerializer
  implements Serializer<RecordDocument, ResourceDocument> {
  protected _schema: Schema;
  protected _keyMap: KeyMap;
  protected _serializers: Dict<Serializer<any, any>>;

  constructor(settings: JSONAPISerializerSettings) {
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
    this._initSerializers(settings.serializers);
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  serializerFor(type: string): Serializer<any, any> {
    return this._serializers[type];
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
    return ids.map((id) => this.resourceId(type, id));
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

  serialize(document: RecordDocument): ResourceDocument {
    let data = document.data;

    return {
      data: Array.isArray(data)
        ? this.serializeRecords(data as Record[])
        : this.serializeRecord(data as Record)
    };
  }

  /**
   * @deprecated
   * @param data
   */
  serializeDocument(data: Record | Record[]): ResourceDocument {
    deprecate(
      'JSONAPISerializer: `serializeDocument()` has been deprecated. Call `serialize(document: RecordDocument)` instead.'
    );
    return this.serialize({ data });
  }

  serializeOperations(operations: RecordOperation[]): ResourceOperation[] {
    return operations.map((operation) => this.serializeOperation(operation));
  }

  serializeOperation(operation: RecordOperation): ResourceOperation {
    switch (operation.op) {
      case 'addRecord':
        return this.serializeAddRecordOperation(operation);
      case 'updateRecord':
        return this.serializeUpdateRecordOperation(operation);
      case 'removeRecord':
        return this.serializeRemoveRecordOperation(operation);
      case 'addToRelatedRecords':
        return this.serializeAddToRelatedRecordsOperation(operation);
      case 'removeFromRelatedRecords':
        return this.serializeRemoveFromRelatedRecordsOperation(operation);
      case 'replaceRelatedRecord':
        return this.serializeReplaceRelatedRecordOperation(operation);
      case 'replaceRelatedRecords':
        return this.serializeReplaceRelatedRecordsOperation(operation);
      case 'replaceAttribute':
        return this.serializeReplaceAttributeOperation(operation);
    }
  }

  serializeAddRecordOperation(
    operation: AddRecordOperation
  ): AddResourceOperation {
    const ref = {
      type: this.resourceType(operation.record.type)
    } as ResourceIdentity;
    const id = this.resourceId(operation.record.type, operation.record.id);
    if (id !== undefined) {
      ref.id = id;
    }
    return {
      op: 'add',
      ref,
      data: this.serializeRecord(operation.record)
    };
  }

  serializeUpdateRecordOperation(
    operation: UpdateRecordOperation
  ): UpdateResourceOperation {
    return {
      op: 'update',
      ref: this.serializeIdentity(operation.record),
      data: this.serializeRecord(operation.record)
    };
  }

  serializeRemoveRecordOperation(
    operation: RemoveRecordOperation
  ): RemoveResourceOperation {
    return {
      op: 'remove',
      ref: this.serializeIdentity(operation.record)
    };
  }

  serializeAddToRelatedRecordsOperation(
    operation: AddToRelatedRecordsOperation
  ): AddToRelatedResourcesOperation {
    const ref = this.serializeIdentity(operation.record);
    return {
      op: 'add',
      ref: { relationship: operation.relationship, ...ref },
      data: this.serializeIdentity(operation.relatedRecord)
    };
  }

  serializeRemoveFromRelatedRecordsOperation(
    operation: RemoveFromRelatedRecordsOperation
  ): RemoveFromRelatedResourcesOperation {
    const ref = this.serializeIdentity(operation.record);
    return {
      op: 'remove',
      ref: { relationship: operation.relationship, ...ref },
      data: this.serializeIdentity(operation.relatedRecord)
    };
  }

  serializeReplaceRelatedRecordsOperation(
    operation: ReplaceRelatedRecordsOperation
  ): ReplaceRelatedResourcesOperation {
    const ref = this.serializeIdentity(operation.record);
    return {
      op: 'update',
      ref: { relationship: operation.relationship, ...ref },
      data: operation.relatedRecords.map((record) =>
        this.serializeIdentity(record)
      )
    };
  }

  serializeReplaceRelatedRecordOperation(
    operation: ReplaceRelatedRecordOperation
  ): ReplaceRelatedResourceOperation {
    const ref = this.serializeIdentity(operation.record);
    return {
      op: 'update',
      ref: { relationship: operation.relationship, ...ref },
      data: operation.relatedRecord
        ? this.serializeIdentity(operation.relatedRecord)
        : null
    };
  }

  serializeReplaceAttributeOperation(
    operation: ReplaceAttributeOperation
  ): UpdateResourceOperation {
    const ref = this.serializeIdentity(operation.record);
    let value: any = operation.value;
    const attr = operation.attribute;
    const type = operation.record.type;
    const attrName = this.resourceAttribute(type, attr);
    const attrOptions = this.schema.getModel(type).attributes[attr];

    if (attrOptions && value !== undefined) {
      const serializer = this._serializers[attrOptions.type];
      if (serializer) {
        value = serializer.serialize(value, attrOptions.serializationOptions);
      }
    }

    return {
      op: 'update',
      ref,
      data: {
        id: ref.id,
        type: ref.type,
        attributes: {
          [attrName]: value
        }
      }
    };
  }

  serializeRecords(records: Record[]): Resource[] {
    return records.map((record) => this.serializeRecord(record));
  }

  serializeRecord(record: Record): Resource {
    const resource: Resource = {
      type: this.resourceType(record.type)
    };
    const model: ModelDefinition = this._schema.getModel(record.type);

    this.serializeId(resource, record, model);
    this.serializeAttributes(resource, record, model);
    this.serializeRelationships(resource, record, model);

    return resource;
  }

  serializeIdentity(record: Record): ResourceIdentity {
    return {
      type: this.resourceType(record.type),
      id: this.resourceId(record.type, record.id)
    };
  }

  serializeId(
    resource: Resource,
    record: RecordIdentity,
    model: ModelDefinition
  ): void {
    let value = this.resourceId(record.type, record.id);
    if (value !== undefined) {
      resource.id = value;
    }
  }

  serializeAttributes(
    resource: Resource,
    record: Record,
    model: ModelDefinition
  ): void {
    if (record.attributes) {
      Object.keys(record.attributes).forEach((attr) => {
        this.serializeAttribute(resource, record, attr, model);
      });
    }
  }

  serializeAttribute(
    resource: Resource,
    record: Record,
    attr: string,
    model: ModelDefinition
  ): void {
    let value: any = record.attributes[attr];
    if (value === undefined) {
      return;
    }
    const attrOptions = model.attributes[attr];
    if (attrOptions === undefined) {
      return;
    }
    const serializer = this._serializers[attrOptions.type];
    if (serializer) {
      value =
        value === null
          ? null
          : serializer.serialize(value, attrOptions.serializationOptions);
    }
    deepSet(
      resource,
      ['attributes', this.resourceAttribute(record.type, attr)],
      value
    );
  }

  serializeRelationships(
    resource: Resource,
    record: Record,
    model: ModelDefinition
  ): void {
    if (record.relationships) {
      Object.keys(record.relationships).forEach((relationship) => {
        this.serializeRelationship(resource, record, relationship, model);
      });
    }
  }

  serializeRelationship(
    resource: Resource,
    record: Record,
    relationship: string,
    model: ModelDefinition
  ): void {
    const value = record.relationships[relationship].data;

    if (value === undefined) {
      return;
    }
    if (model.relationships[relationship] === undefined) {
      return;
    }

    let data;

    if (Array.isArray(value)) {
      data = (value as RecordIdentity[]).map((id) => this.resourceIdentity(id));
    } else if (value !== null) {
      data = this.resourceIdentity(value as RecordIdentity);
    } else {
      data = null;
    }

    const resourceRelationship = this.resourceRelationship(
      record.type,
      relationship
    );

    deepSet(resource, ['relationships', resourceRelationship, 'data'], data);
  }

  deserialize(
    document: ResourceDocument,
    options?: DeserializeOptions
  ): RecordDocument {
    let result: RecordDocument;
    let data;

    if (Array.isArray(document.data)) {
      let primaryRecords = options && options.primaryRecords;
      if (primaryRecords) {
        data = (document.data as Resource[]).map((entry, i) => {
          return this.deserializeResource(entry, primaryRecords[i]);
        });
      } else {
        data = (document.data as Resource[]).map((entry) =>
          this.deserializeResource(entry)
        );
      }
    } else if (document.data !== null) {
      let primaryRecord = options && options.primaryRecord;
      if (primaryRecord) {
        data = this.deserializeResource(
          document.data as Resource,
          primaryRecord
        );
      } else {
        data = this.deserializeResource(document.data as Resource);
      }
    } else {
      data = null;
    }
    result = { data };

    if (document.included) {
      result.included = document.included.map((e) =>
        this.deserializeResource(e)
      );
    }

    if (document.links) {
      result.links = document.links;
    }

    if (document.meta) {
      result.meta = document.meta;
    }

    return result;
  }

  deserializeOperationsDocument(
    document: ResourceOperationsDocument
  ): RecordOperation[] {
    return this.deserializeOperations(document.operations);
  }

  deserializeOperations(operations: ResourceOperation[]): RecordOperation[] {
    return operations.map((operation) => this.deserializeOperation(operation));
  }

  deserializeOperation(operation: ResourceOperation): RecordOperation {
    if (isAddOperation(operation)) {
      return this.deserializeAddOperation(operation);
    } else if (isUpdateOperation(operation)) {
      return this.deserializeUpdateOperation(operation);
    } else if (isRemoveOperation(operation)) {
      return this.deserializeRemoveOperation(operation);
    } else {
      throw new Error(
        `JSONAPISerializer: "get" operation recieved but only "add", "update" and "remove" operations are supported as input at this time.`
      );
    }
  }

  deserializeAddOperation(
    operation: AddResourceOperation | AddToRelatedResourcesOperation
  ): AddRecordOperation | AddToRelatedRecordsOperation {
    if (isRelatedResourceOperation(operation)) {
      return {
        op: 'addToRelatedRecords',
        relationship: operation.ref.relationship,
        record: this.deserializeResourceIdentity(operation.ref),
        relatedRecord: this.deserializeResourceIdentity(
          operation.data as RecordIdentity
        )
      };
    } else {
      return {
        op: 'addRecord',
        record: this.deserializeResource(operation.data)
      };
    }
  }

  deserializeUpdateOperation(
    operation:
      | UpdateResourceOperation
      | ReplaceRelatedResourceOperation
      | ReplaceRelatedResourcesOperation
  ):
    | ReplaceRelatedRecordOperation
    | ReplaceRelatedRecordsOperation
    | UpdateRecordOperation {
    if (isRelatedResourceOperation(operation)) {
      const type = this.recordType(operation.ref.type);
      const relationshipDef = this._schema.getRelationship(
        type,
        operation.ref.relationship
      );
      if (
        relationshipDef &&
        (relationshipDef.kind || relationshipDef.type) === 'hasMany'
      ) {
        return {
          op: 'replaceRelatedRecords',
          relationship: operation.ref.relationship,
          record: this.deserializeResourceIdentity(operation.ref),
          relatedRecords: (operation.data as RecordIdentity[]).map((record) =>
            this.deserializeResourceIdentity(record)
          )
        };
      } else {
        return {
          op: 'replaceRelatedRecord',
          relationship: operation.ref.relationship,
          record: this.deserializeResourceIdentity(operation.ref),
          relatedRecord: operation.data
            ? this.deserializeResourceIdentity(operation.data as RecordIdentity)
            : null
        };
      }
    } else {
      return {
        op: 'updateRecord',
        record: this.deserializeResource(operation.data as Resource)
      };
    }
  }

  deserializeRemoveOperation(
    operation: RemoveResourceOperation | RemoveFromRelatedResourcesOperation
  ): RemoveFromRelatedRecordsOperation | RemoveRecordOperation {
    if (isRelatedResourceOperation(operation)) {
      return {
        op: 'removeFromRelatedRecords',
        relationship: operation.ref.relationship,
        record: this.deserializeResourceIdentity(operation.ref),
        relatedRecord: this.deserializeResourceIdentity(
          operation.data as RecordIdentity
        )
      };
    } else {
      return {
        op: 'removeRecord',
        record: this.deserializeResourceIdentity(operation.ref)
      };
    }
  }

  /**
   * @deprecated
   * @param document
   * @param primaryRecordData
   */
  deserializeDocument(
    document: ResourceDocument,
    primaryRecordData?: Record | Record[]
  ): RecordDocument {
    deprecate(
      'JSONAPISerializer: `deserializeDocument()` has been deprecated. Call `deserialize(document: RecordDocument, options?: DeserializeOptions)` instead.'
    );
    let options: DeserializeOptions = {};
    if (primaryRecordData) {
      if (Array.isArray(primaryRecordData)) {
        options.primaryRecords = primaryRecordData as Record[];
      } else {
        options.primaryRecord = primaryRecordData as Record;
      }
    }
    return this.deserialize(document, options);
  }

  deserializeResourceIdentity(
    resource: Resource,
    primaryRecord?: Record
  ): Record {
    let record: Record;
    const type: string = this.recordType(resource.type);
    const resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      record = { type, id: resource.id };
    } else {
      let id: string;
      let keys: Dict<string>;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id =
          (primaryRecord && primaryRecord.id) ||
          this.keyMap.idFromKeys(type, keys) ||
          this.schema.generateId(type);
      } else {
        id =
          (primaryRecord && primaryRecord.id) || this.schema.generateId(type);
      }

      record = { type, id };

      if (keys) {
        record.keys = keys;
      }
    }

    if (this.keyMap) {
      this.keyMap.pushRecord(record);
    }

    return record;
  }

  deserializeResource(resource: Resource, primaryRecord?: Record): Record {
    const record = this.deserializeResourceIdentity(resource, primaryRecord);
    const model: ModelDefinition = this._schema.getModel(record.type);

    this.deserializeAttributes(record, resource, model);
    this.deserializeRelationships(record, resource, model);
    this.deserializeLinks(record, resource, model);
    this.deserializeMeta(record, resource, model);

    return record;
  }

  deserializeAttributes(
    record: Record,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.attributes) {
      Object.keys(resource.attributes).forEach((resourceAttribute) => {
        let attribute = this.recordAttribute(record.type, resourceAttribute);
        if (this.schema.hasAttribute(record.type, attribute)) {
          let value = resource.attributes[resourceAttribute];
          this.deserializeAttribute(record, attribute, value, model);
        }
      });
    }
  }

  deserializeAttribute(
    record: Record,
    attr: string,
    value: any,
    model: ModelDefinition
  ): void {
    record.attributes = record.attributes || {};
    if (value !== undefined && value !== null) {
      const attrOptions = model.attributes[attr];
      const serializer = this._serializers[attrOptions.type];
      if (serializer) {
        value = serializer.deserialize(
          value,
          attrOptions.deserializationOptions
        );
      }
    }
    record.attributes[attr] = value;
  }

  deserializeRelationships(
    record: Record,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.relationships) {
      Object.keys(resource.relationships).forEach((resourceRel) => {
        let relationship = this.recordRelationship(record.type, resourceRel);
        if (this.schema.hasRelationship(record.type, relationship)) {
          let value = resource.relationships[resourceRel];
          this.deserializeRelationship(record, relationship, value, model);
        }
      });
    }
  }

  deserializeRelationship(
    record: Record,
    relationship: string,
    value: ResourceRelationship,
    model: ModelDefinition
  ) {
    let resourceData = value.data;

    if (resourceData !== undefined) {
      let data;

      if (resourceData === null) {
        data = null;
      } else if (Array.isArray(resourceData)) {
        data = (resourceData as ResourceIdentity[]).map((resourceIdentity) =>
          this.recordIdentity(resourceIdentity)
        );
      } else {
        data = this.recordIdentity(resourceData as ResourceIdentity);
      }

      deepSet(record, ['relationships', relationship, 'data'], data);
    }

    let { links, meta } = value;

    if (links !== undefined) {
      deepSet(record, ['relationships', relationship, 'links'], links);
    }

    if (meta !== undefined) {
      deepSet(record, ['relationships', relationship, 'meta'], meta);
    }
  }

  deserializeLinks(record: Record, resource: Resource, model: ModelDefinition) {
    if (resource.links) {
      record.links = resource.links;
    }
  }

  deserializeMeta(record: Record, resource: Resource, model: ModelDefinition) {
    if (resource.meta) {
      record.meta = resource.meta;
    }
  }

  protected _initSerializers(serializers: Dict<Serializer<any, any>> = {}) {
    this._serializers = serializers;
    serializers.boolean = serializers.boolean || new BooleanSerializer();
    serializers.string = serializers.string || new StringSerializer();
    serializers.date = serializers.date || new DateSerializer();
    serializers.datetime = serializers.datetime || new DateTimeSerializer();
    serializers.number = serializers.number || new NumberSerializer();
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

function isRelatedResourceOperation(
  operation: ResourceOperation
): operation is
  | AddToRelatedResourcesOperation
  | RemoveFromRelatedResourcesOperation
  | ReplaceRelatedResourceOperation
  | ReplaceRelatedResourcesOperation {
  return !!operation.ref.relationship;
}

function isAddOperation(
  operation: ResourceOperation
): operation is AddResourceOperation | AddToRelatedResourcesOperation {
  return operation.op === 'add';
}

function isUpdateOperation(
  operation: ResourceOperation
): operation is
  | UpdateResourceOperation
  | ReplaceRelatedResourcesOperation
  | ReplaceRelatedResourcesOperation {
  return operation.op === 'update';
}

function isRemoveOperation(
  operation: ResourceOperation
): operation is RemoveResourceOperation | RemoveFromRelatedResourcesOperation {
  return operation.op === 'remove';
}
