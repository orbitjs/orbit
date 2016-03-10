import Orbit from 'orbit/main';
import Transform from 'orbit/transform';
import { clone } from 'orbit/lib/objects';
import { identity } from '../lib/identifiers';
import { recordDiffs } from '../lib/operations';

export const UpdateRequestProcessors = {
  addRecord(source, request) {
    const { serializer, schema } = source;

    let record = schema.normalize(request.record);
    let json = serializer.serialize(record);

    return source.ajax(source.resourceURL(record.type), 'POST', { data: json })
      .then((raw) => {
        let resourceKey = serializer.resourceKey(record.type);
        if (resourceKey) {
          schema.registerKeyMapping(record.type, record.id, resourceKey, raw.data.id);
        }

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
    return source.ajax(source.resourceURL(type, id), 'DELETE')
      .then(() => []);
  },

  replaceRecord(source, request) {
    const { type, id } = request.record;
    const json = source.serializer.serialize(request.record);

    return source.ajax(source.resourceURL(type, id), 'PATCH', { data: json })
      .then(() => []);
  },

  addToHasMany(source, request) {
    const { type, id } = request.record;
    const { relationship } = request;

    const json = {
      data: request.relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'POST', { data: json })
      .then(() => []);
  },

  removeFromHasMany(source, request) {
    const { type, id } = request.record;
    const { relationship } = request;

    const json = {
      data: request.relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'DELETE', { data: json })
      .then(() => []);
  },

  replaceHasOne(source, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecord } = request;

    const json = {
      data: relatedRecord ? source.serializer.serializeIdentifier(relatedRecord) : null
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'PATCH', { data: json })
      .then(() => []);
  },

  replaceHasMany(source, request) {
    const { type, id } = request.record;
    const { relationship, relatedRecords } = request;

    const json = {
      data: relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'PATCH', { data: json })
      .then(() => []);
  }
};

const OperationToUpdateRequestMap = {
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
    const record = {
      type: operation.record.type,
      id: operation.record.id,
      attributes: {}
    };

    record.attributes[operation.attribute] = operation.value;

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
    return {
      op: 'replaceHasOne',
      record: identity(operation.record),
      relationship: operation.relationship,
      relatedRecord: operation.relatedRecord ? identity(operation.relatedRecord) : null
    };
  },

  replaceHasMany(operation) {
    return {
      op: 'replaceHasMany',
      record: identity(operation.record),
      relationship: operation.relationship,
      relatedRecords: operation.relatedRecords.map(r => identity(r))
    };
  }
};

function eqIdentity(record1, record2) {
  return record1.type === record2.type && record1.id === record2.id;
}

export function getUpdateRequests(transform) {
  const requests = [];
  let request;

  transform.operations.forEach(operation => {
    // if (request) {
    // switch(request.op) {
    //   case 'addRecord':
    //     if (operation.op === 'addRecord') {
    //
    //     }
    //     if (eqIdentity(operation.record))
    //
    //     request = {
    //       op: operation.op,
    //       record: operation.record
    //     }
    //   case 'removeRecord':
    //
    //     request = {
    //       op: operation.op,
    //       record: operation.record
    //     }
    //
    // }
    // } else {
    // }
    request = OperationToUpdateRequestMap[operation.op](operation);
    requests.push(request);
  });

  return requests;
}
