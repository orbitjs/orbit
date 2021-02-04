import {
  RecordIdentity,
  RecordOperation,
  AddToRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  UpdateRecordOperation,
  RemoveFromRelatedRecordsOperation,
  RemoveRecordOperation,
  AddRecordOperation,
  ReplaceAttributeOperation
} from '@orbit/records';
import {
  AddResourceAtomicOperation,
  AddToRelatedResourcesAtomicOperation,
  RemoveFromRelatedResourcesAtomicOperation,
  RemoveResourceAtomicOperation,
  ReplaceRelatedResourceAtomicOperation,
  ReplaceRelatedResourcesAtomicOperation,
  ResourceAtomicOperation,
  UpdateResourceAtomicOperation
} from '../resource-operations';
import { Resource, ResourceIdentity } from '../resource-document';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export class JSONAPIAtomicOperationSerializer extends JSONAPIBaseSerializer<
  RecordOperation,
  ResourceAtomicOperation,
  unknown,
  unknown
> {
  serialize(operation: RecordOperation): ResourceAtomicOperation {
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
      default:
        throw new Error(
          `JSONAPIOperationSerializer: Unrecognized operation ${operation.op}.`
        );
    }
  }

  deserialize(operation: ResourceAtomicOperation): RecordOperation {
    if (isAddOperation(operation)) {
      return this.deserializeAddOperation(operation);
    } else if (isUpdateOperation(operation)) {
      return this.deserializeUpdateOperation(operation);
    } else if (isRemoveOperation(operation)) {
      return this.deserializeRemoveOperation(operation);
    } else {
      throw new Error(
        `JSONAPIOperationSerializer: Only "add", "update" and "remove" operations are supported at this time.`
      );
    }
  }

  protected serializeAddRecordOperation(
    operation: AddRecordOperation
  ): AddResourceAtomicOperation {
    const ref = this.identitySerializer.serialize(operation.record);
    return {
      op: 'add',
      ref,
      data: this.resourceSerializer.serialize(operation.record)
    };
  }

  protected serializeUpdateRecordOperation(
    operation: UpdateRecordOperation
  ): UpdateResourceAtomicOperation {
    return {
      op: 'update',
      ref: this.identitySerializer.serialize(
        operation.record
      ) as ResourceIdentity,
      data: this.resourceSerializer.serialize(operation.record)
    };
  }

  protected serializeRemoveRecordOperation(
    operation: RemoveRecordOperation
  ): RemoveResourceAtomicOperation {
    return {
      op: 'remove',
      ref: this.identitySerializer.serialize(
        operation.record
      ) as ResourceIdentity
    };
  }

  protected serializeAddToRelatedRecordsOperation(
    operation: AddToRelatedRecordsOperation
  ): AddToRelatedResourcesAtomicOperation {
    const ref = this.identitySerializer.serialize(
      operation.record
    ) as ResourceIdentity;
    return {
      op: 'add',
      ref: { relationship: operation.relationship, ...ref },
      data: this.identitySerializer.serialize(operation.relatedRecord)
    };
  }

  protected serializeRemoveFromRelatedRecordsOperation(
    operation: RemoveFromRelatedRecordsOperation
  ): RemoveFromRelatedResourcesAtomicOperation {
    const ref = this.identitySerializer.serialize(
      operation.record
    ) as ResourceIdentity;
    return {
      op: 'remove',
      ref: { relationship: operation.relationship, ...ref },
      data: this.identitySerializer.serialize(operation.relatedRecord)
    };
  }

  protected serializeReplaceRelatedRecordsOperation(
    operation: ReplaceRelatedRecordsOperation
  ): ReplaceRelatedResourcesAtomicOperation {
    const ref = this.identitySerializer.serialize(
      operation.record
    ) as ResourceIdentity;
    return {
      op: 'update',
      ref: { relationship: operation.relationship, ...ref },
      data: operation.relatedRecords.map((record) =>
        this.identitySerializer.serialize(record)
      )
    };
  }

  protected serializeReplaceRelatedRecordOperation(
    operation: ReplaceRelatedRecordOperation
  ): ReplaceRelatedResourceAtomicOperation {
    const ref = this.identitySerializer.serialize(
      operation.record
    ) as ResourceIdentity;
    return {
      op: 'update',
      ref: { relationship: operation.relationship, ...ref },
      data: operation.relatedRecord
        ? this.identitySerializer.serialize(operation.relatedRecord)
        : null
    };
  }

  protected serializeReplaceAttributeOperation(
    operation: ReplaceAttributeOperation
  ): UpdateResourceAtomicOperation {
    const record = {
      id: operation.record.id,
      type: operation.record.type,
      attributes: {
        [operation.attribute]: operation.value
      }
    };
    const resource = this.resourceSerializer.deserialize(record);
    const ref = {
      id: resource.id,
      type: resource.type
    };

    return {
      op: 'update',
      ref,
      data: resource
    };
  }

  protected deserializeAddOperation(
    operation: AddResourceAtomicOperation | AddToRelatedResourcesAtomicOperation
  ): AddRecordOperation | AddToRelatedRecordsOperation {
    if (isRelatedResourceOperation(operation)) {
      return {
        op: 'addToRelatedRecords',
        relationship: operation.ref.relationship,
        record: this.identitySerializer.deserialize(operation.ref),
        relatedRecord: this.identitySerializer.deserialize(
          operation.data as RecordIdentity
        )
      };
    } else {
      return {
        op: 'addRecord',
        record: this.resourceSerializer.deserialize(operation.data)
      };
    }
  }

  protected deserializeUpdateOperation(
    operation:
      | UpdateResourceAtomicOperation
      | ReplaceRelatedResourceAtomicOperation
      | ReplaceRelatedResourcesAtomicOperation
  ):
    | ReplaceRelatedRecordOperation
    | ReplaceRelatedRecordsOperation
    | UpdateRecordOperation {
    if (isRelatedResourceOperation(operation)) {
      if (Array.isArray(operation.data)) {
        return {
          op: 'replaceRelatedRecords',
          relationship: operation.ref.relationship,
          record: this.identitySerializer.deserialize(operation.ref),
          relatedRecords: (operation.data as RecordIdentity[]).map((record) =>
            this.identitySerializer.deserialize(record)
          )
        };
      } else {
        return {
          op: 'replaceRelatedRecord',
          relationship: operation.ref.relationship,
          record: this.identitySerializer.deserialize(operation.ref),
          relatedRecord: operation.data
            ? this.identitySerializer.deserialize(
                operation.data as RecordIdentity
              )
            : null
        };
      }
    } else {
      return {
        op: 'updateRecord',
        record: this.resourceSerializer.deserialize(operation.data as Resource)
      };
    }
  }

  protected deserializeRemoveOperation(
    operation:
      | RemoveResourceAtomicOperation
      | RemoveFromRelatedResourcesAtomicOperation
  ): RemoveFromRelatedRecordsOperation | RemoveRecordOperation {
    if (isRelatedResourceOperation(operation)) {
      return {
        op: 'removeFromRelatedRecords',
        relationship: operation.ref.relationship,
        record: this.identitySerializer.deserialize(operation.ref),
        relatedRecord: this.identitySerializer.deserialize(
          operation.data as RecordIdentity
        )
      };
    } else {
      return {
        op: 'removeRecord',
        record: this.identitySerializer.deserialize(operation.ref)
      };
    }
  }
}

function isRelatedResourceOperation(
  operation: ResourceAtomicOperation
): operation is
  | AddToRelatedResourcesAtomicOperation
  | RemoveFromRelatedResourcesAtomicOperation
  | ReplaceRelatedResourceAtomicOperation
  | ReplaceRelatedResourcesAtomicOperation {
  return !!operation.ref.relationship;
}

function isAddOperation(
  operation: ResourceAtomicOperation
): operation is
  | AddResourceAtomicOperation
  | AddToRelatedResourcesAtomicOperation {
  return operation.op === 'add';
}

function isUpdateOperation(
  operation: ResourceAtomicOperation
): operation is
  | UpdateResourceAtomicOperation
  | ReplaceRelatedResourcesAtomicOperation
  | ReplaceRelatedResourcesAtomicOperation {
  return operation.op === 'update';
}

function isRemoveOperation(
  operation: ResourceAtomicOperation
): operation is
  | RemoveResourceAtomicOperation
  | RemoveFromRelatedResourcesAtomicOperation {
  return operation.op === 'remove';
}
