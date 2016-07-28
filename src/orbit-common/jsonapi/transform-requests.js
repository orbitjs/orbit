import Transform from 'orbit/transform';
import { clone } from 'orbit/lib/objects';
import { toIdentifier, identity, eqIdentity } from '../lib/identifiers';
import { recordDiffs } from '../lib/operations';

export const TransformRequestProcessors = {
  addRecord(source, request) {
    const { serializer } = source;
    const record = serializer.initializeRecord(request.record);
    const json = serializer.serialize(record);

    return source.fetch(source.resourceURL(record.type), { method: 'POST', json })
      .then((raw) => {
        let data = serializer.deserialize(raw);
        let updatedRecord = data.primary;

        let updateOps = recordDiffs(record, updatedRecord);
        if (updateOps.length > 0) {
          return [Transform.from(updateOps)];
        }
      });
  },

  removeRecord(source, request) {
    const { type, id } = request.record;

    return source.fetch(source.resourceURL(type, id), { method: 'DELETE' })
      .then(() => []);
  },

  replaceRecord(source, request) {
    const { type, id } = request.record;
    const json = source.serializer.serialize(request.record);

    return source.fetch(source.resourceURL(type, id), { method: 'PATCH', json })
      .then(() => []);
  },

  addToHasMany(source, request) {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'POST', json })
      .then(() => []);
  },

  removeFromHasMany(source, request) {
    const { type, id } = request.record;
    const { relationship } = request;
    const json = {
      data: request.relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'DELETE', json })
      .then(() => []);
  },

  replaceHasOne(source, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecord } = request;
    const json = {
      data: relatedRecord ? source.serializer.serializeIdentifier(relatedRecord) : null
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'PATCH', json })
      .then(() => []);
  },

  replaceHasMany(source, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecords } = request;
    const json = {
      data: relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.fetch(source.resourceRelationshipURL(type, id, relationship), { method: 'PATCH', json })
      .then(() => []);
  }
};

export function getTransformRequests(transform) {
  const requests = [];
  let prevRequest;

  transform.operations.forEach(operation => {
    let request;
    let newRequestNeeded = true;

    if (prevRequest && eqIdentity(prevRequest.record, operation.record)) {
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
        prevRequest.relatedRecords.push(identity(operation.relatedRecord));
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
  addRecord(operation) {
    return {
      op: 'addRecord',
      record: clone(operation.record)
    };
  },

  removeRecord(operation) {
    return {
      op: 'removeRecord',
      record: identity(operation.record)
    };
  },

  replaceAttribute(operation) {
    const record = identity(operation.record);

    replaceRecordAttribute(record, operation.attribute, operation.value);

    return {
      op: 'replaceRecord',
      record
    };
  },

  replaceRecord(operation) {
    return {
      op: 'replaceRecord',
      record: clone(operation.record)
    };
  },

  addToHasMany(operation) {
    return {
      op: 'addToHasMany',
      record: identity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [identity(operation.relatedRecord)]
    };
  },

  removeFromHasMany(operation) {
    return {
      op: 'removeFromHasMany',
      record: identity(operation.record),
      relationship: operation.relationship,
      relatedRecords: [identity(operation.relatedRecord)]
    };
  },

  replaceHasOne(operation) {
    const record = identity(operation.record);
    record.relationships = {};
    record.relationships[operation.relationship] = {};
    record.relationships[operation.relationship].data = toIdentifier(operation.relatedRecord);

    return {
      op: 'replaceRecord',
      record
    };
  },

  replaceHasMany(operation) {
    const record = identity(operation.record);
    const relationshipData = {};
    operation.relatedRecords.forEach(r => {
      relationshipData[toIdentifier(r)] = true;
    });
    record.relationships = {};
    record.relationships[operation.relationship] = { data: relationshipData };

    return {
      op: 'replaceRecord',
      record
    };
  }
};

function replaceRecordAttribute(record, attribute, value) {
  record.attributes = record.attributes || {};
  record.attributes[attribute] = value;
}

function replaceRecordHasOne(record, relationship, relatedRecord) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  record.relationships[relationship].data = relatedRecord ? identity(relatedRecord) : null;
}

function replaceRecordHasMany(record, relationship, relatedRecords) {
  record.relationships = record.relationships || {};
  record.relationships[relationship] = record.relationships[relationship] || {};
  record.relationships[relationship].data = relatedRecords.map(r => identity(r));
}
