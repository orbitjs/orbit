import {
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
  AddToRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform
} from '@orbit/data';
import { clone, deepSet } from '@orbit/utils';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { DeserializedDocument } from '../jsonapi-serializer';
import { RequestOptions, buildFetchSettings } from './request-settings';

export const TransformRequestProcessors = {
  addRecord(source: JSONAPISource, request) {
    const { serializer } = source;
    const record = request.record;
    const requestDoc: JSONAPIDocument = serializer.serializeDocument(record);
    const settings = buildFetchSettings(request, { method: 'POST', json: requestDoc });

    return source.fetch(source.resourceURL(record.type), settings)
      .then((raw: JSONAPIDocument) => {
        let responseDoc: DeserializedDocument = serializer.deserializeDocument(raw);
        let updatedRecord: Record = <Record>responseDoc.data;

        let updateOps = recordDiffs(record, updatedRecord);
        if (updateOps.length > 0) {
          return [buildTransform(updateOps)];
        }
      });
  },

  removeRecord(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const settings = buildFetchSettings(request, { method: 'DELETE' });

    return source.fetch(source.resourceURL(type, id), settings)
      .then(() => []);
  },

  replaceRecord(source: JSONAPISource, request) {
    const record = request.record;
    const { type, id } = record;
    const requestDoc: JSONAPIDocument = source.serializer.serializeDocument(record);
    const settings = buildFetchSettings(request, { method: 'PATCH', json: requestDoc });

    return source.fetch(source.resourceURL(type, id), settings)
      .then(() => []);
  },

  addToRelatedRecords(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => source.serializer.resourceIdentity(r))
    };
    const settings = buildFetchSettings(request, { method: 'POST', json });

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), settings)
      .then(() => []);
  },

  removeFromRelatedRecords(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => source.serializer.resourceIdentity(r))
    };
    const settings = buildFetchSettings(request, { method: 'DELETE', json });

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), settings)
      .then(() => []);
  },

  replaceRelatedRecord(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecord } = request;
    const json = {
      data: relatedRecord ? source.serializer.resourceIdentity(relatedRecord) : null
    };
    const settings = buildFetchSettings(request, { method: 'PATCH', json });

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), settings)
      .then(() => []);
  },

  replaceRelatedRecords(source: JSONAPISource, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecords } = request;
    const json = {
      data: relatedRecords.map(r => source.serializer.resourceIdentity(r))
    };
    const settings = buildFetchSettings(request, { method: 'PATCH', json });

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), settings)
      .then(() => []);
  }
};

export function getTransformRequests(source: JSONAPISource, transform: Transform) {
  const operations: RecordOperation[] = <RecordOperation[]>transform.operations;
  const requests = [];
  let prevRequest;

  const options = (transform.options && transform.options.sources && transform.options.sources[source.name]) || {};

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
        } else if (operation.op === 'replaceRelatedRecord') {
          newRequestNeeded = false;
          replaceRecordHasOne(prevRequest.record, operation.relationship, operation.relatedRecord);
        } else if (operation.op === 'replaceRelatedRecords') {
          newRequestNeeded = false;
          replaceRecordHasMany(prevRequest.record, operation.relationship, operation.relatedRecords);
        }
      } else if (prevRequest.op === 'addToRelatedRecords' &&
                 operation.op === 'addToRelatedRecords' &&
                 prevRequest.relationship === operation.relationship) {
        newRequestNeeded = false;
        prevRequest.relatedRecords.push(cloneRecordIdentity(operation.relatedRecord));
      }
    }

    if (newRequestNeeded) {
      request = OperationToRequestMap[operation.op](operation);
    }

    if (request) {
      if (options.include) {
        request.include = options.include.join(',');
      }

      if (options.timeout) {
        request.timeout = options.timeout;
      }

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

  addToRelatedRecords(operation: AddToRelatedRecordsOperation) {
    return {
      op: 'addToRelatedRecords',
      record: cloneRecordIdentity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [cloneRecordIdentity(operation.relatedRecord)]
    };
  },

  removeFromRelatedRecords(operation: RemoveFromRelatedRecordsOperation) {
    return {
      op: 'removeFromRelatedRecords',
      record: cloneRecordIdentity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [cloneRecordIdentity(operation.relatedRecord)]
    };
  },

  replaceRelatedRecord(operation: ReplaceRelatedRecordOperation) {
    const record: Record = {
      type: operation.record.type,
      id: operation.record.id
    };

    deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecord);

    return {
      op: 'replaceRecord',
      record
    };
  },

  replaceRelatedRecords(operation: ReplaceRelatedRecordsOperation) {
    const record = cloneRecordIdentity(operation.record);
    deepSet(record, ['relationships', operation.relationship, 'data'], operation.relatedRecords);

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
