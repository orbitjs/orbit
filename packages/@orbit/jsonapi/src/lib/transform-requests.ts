import {
  serializeRecordIdentity,
  cloneRecordIdentity,
  equalRecordIdentities,
  recordDiffs,
  Record,
  RecordIdentity,
  RecordOperation,
  Transform,
  AddRecordOperation,
  RemoveRecordOperation,
  ReplaceAttributeOperation,
  ReplaceRecordOperation,
  AddToHasManyOperation,
  RemoveFromHasManyOperation,
  ReplaceHasOneOperation,
  ReplaceHasManyOperation
} from '@orbit/data';
import { clone, deepSet } from '@orbit/utils';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { DeserializedDocument } from '../jsonapi-serializer';

export const TransformRequestProcessors = {
  addRecord(source: JSONAPISource, op: AddRecordOperation) {
    const { serializer } = source;
    const record = op.record;
    const requestDoc: JSONAPIDocument = serializer.serializeDocument(record);

    return source.fetch(source.resourceURL(record.type), { method: 'POST', json: requestDoc })
      .then((raw: JSONAPIDocument) => {
        let responseDoc: DeserializedDocument = serializer.deserializeDocument(raw);
        let updatedRecord: Record = <Record>responseDoc.data;

        let updateOps = recordDiffs(record, updatedRecord);
        if (updateOps.length > 0) {
          return [Transform.from(updateOps)];
        }
      });
  },

  removeRecord(source: JSONAPISource, request) {
    const { type, id } = request.record;

    return source.fetch(source.resourceURL(type, id), { method: 'DELETE' })
      .then(() => []);
  },

  replaceRecord(source: JSONAPISource, request) {
    const record = request.record;
    const { type, id } = record;
    const requestDoc: JSONAPIDocument = source.serializer.serializeDocument(record);

    return source.fetch(source.resourceURL(type, id), { method: 'PATCH', json: requestDoc })
      .then(() => []);
  },

  addToHasMany(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => source.serializer.resourceIdentity(r))
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'POST', json })
      .then(() => []);
  },

  removeFromHasMany(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => source.serializer.resourceIdentity(r))
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'DELETE', json })
      .then(() => []);
  },

  replaceHasOne(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecord } = request;
    const json = {
      data: relatedRecord ? source.serializer.resourceIdentity(relatedRecord) : null
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'PATCH', json })
      .then(() => []);
  },

  replaceHasMany(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecords } = request;
    const json = {
      data: relatedRecords.map(r => source.serializer.resourceIdentity(r))
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'PATCH', json })
      .then(() => []);
  }
};

export function getTransformRequests(transform: Transform) {
  const operations: RecordOperation[] = <RecordOperation[]>transform.operations;
  const requests = [];
  let prevRequest;

  transform.operations.forEach((operation: RecordOperation) => {
    let request;
    let newRequestNeeded = true;

    if (prevRequest && equalRecordIdentities(prevRequest.record, operation.record)) {
      if (operation.op === 'removeRecord') {
        newRequestNeeded = false;

        if (prevRequest.op !== 'removeRecord') {
          prevRequest = null;
          requests.pop();
        }
      } else if (prevRequest.op === 'addRecord' || prevRequest.op === 'replaceRecord') {
        if (operation.op === 'replaceAttribute') {
          newRequestNeeded = false;
          replaceRecordAttribute(prevRequest.record, operation.attribute, operation.value);
        } else if (operation.op === 'replaceHasOne') {
          newRequestNeeded = false;
          replaceRecordHasOne(prevRequest.record, operation.relationship, operation.relatedRecord);
        } else if (operation.op === 'replaceHasMany') {
          newRequestNeeded = false;
          replaceRecordHasMany(prevRequest.record, operation.relationship, operation.relatedRecords);
        }
      } else if (prevRequest.op === 'addToHasMany' &&
                 operation.op === 'addToHasMany' &&
                 prevRequest.relationship === operation.relationship) {
        newRequestNeeded = false;
        prevRequest.relatedRecords.push(cloneRecordIdentity(operation.relatedRecord));
      }
    }

    if (newRequestNeeded) {
      request = OperationToRequestMap[operation.op](operation);
    }

    if (request) {
      requests.push(request);
      prevRequest = request;
    }
  });

  return requests;
}

const OperationToRequestMap = {
  addRecord(operation: AddRecordOperation) {
    return {
      op: 'addRecord',
      record: clone(operation.record)
    };
  },

  removeRecord(operation: RemoveRecordOperation) {
    return {
      op: 'removeRecord',
      record: cloneRecordIdentity(operation.record)
    };
  },

  replaceAttribute(operation: ReplaceAttributeOperation) {
    const record = cloneRecordIdentity(operation.record);

    replaceRecordAttribute(record, operation.attribute, operation.value);

    return {
      op: 'replaceRecord',
      record
    };
  },

  replaceRecord(operation: ReplaceRecordOperation) {
    return {
      op: 'replaceRecord',
      record: clone(operation.record)
    };
  },

  addToHasMany(operation: AddToHasManyOperation) {
    return {
      op: 'addToHasMany',
      record: cloneRecordIdentity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [cloneRecordIdentity(operation.relatedRecord)]
    };
  },

  removeFromHasMany(operation: RemoveFromHasManyOperation) {
    return {
      op: 'removeFromHasMany',
      record: cloneRecordIdentity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [cloneRecordIdentity(operation.relatedRecord)]
    };
  },

  replaceHasOne(operation: ReplaceHasOneOperation) {
    const record: Record = {
      type: operation.record.type,
      id: operation.record.id
    };

    deepSet(record, ['relationships', operation.relationship, 'data'], serializeRecordIdentity(operation.relatedRecord));

    return {
      op: 'replaceRecord',
      record
    };
  },

  replaceHasMany(operation: ReplaceHasManyOperation) {
    const record = cloneRecordIdentity(operation.record);
    const relationshipData = {};
    operation.relatedRecords.forEach(r => {
      relationshipData[serializeRecordIdentity(r)] = true;
    });
    deepSet(record, ['relationships', operation.relationship, 'data'], relationshipData);

    return {
      op: 'replaceRecord',
      record
    };
  }
};

function replaceRecordAttribute(record: RecordIdentity, attribute: string, value: any) {
  deepSet(record, ['attributes', attribute], value);
}

function replaceRecordHasOne(record: RecordIdentity, relationship: string, relatedRecord: RecordIdentity) {
  deepSet(record, ['relationships', relationship, 'data'], relatedRecord ? cloneRecordIdentity(relatedRecord) : null);
}

function replaceRecordHasMany(record: RecordIdentity, relationship: string, relatedRecords: RecordIdentity[]) {
  deepSet(record, ['relationships', relationship, 'data'], relatedRecords.map(r => cloneRecordIdentity(r)));
}
