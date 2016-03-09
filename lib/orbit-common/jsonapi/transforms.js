import Orbit from 'orbit/main';
import { recordDiffs } from '../lib/operations';
import Transform from 'orbit/transform';

export default {
  addRecord(source, op) {
    const { serializer, schema } = source;

    let record = schema.normalize(op.record);
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

  removeRecord(source, op) {
    const { type, id } = op.record;
    return source.ajax(source.resourceURL(type, id), 'DELETE');
  },

  replaceAttribute(source, op) {
    const { type, id } = op.record;
    const { attribute, value } = op;

    let record = {
      type,
      id,
      attributes: {}
    };
    record.attributes[attribute] = value;

    let json = source.serializer.serialize(record);

    return source.ajax(source.resourceURL(type, id), 'PATCH', { data: json });
  },

  addToHasMany(source, op) {
    const { type, id } = op.record;
    const { relationship } = op;

    let relatedRecords = op.relatedRecords ? op.relatedRecords : [op.relatedRecord];
    let json = {
      data: relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'POST', { data: json });
  },

  removeFromHasMany(source, op) {
    const { type, id } = op.record;
    const { relationship } = op;

    let relatedRecords = op.relatedRecords ? op.relatedRecords : [op.relatedRecord];
    let json = {
      data: relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'DELETE', { data: json });
  },

  replaceHasOne(source, op) {
    const { type, id } = op.record;
    const { relationship, relatedRecord } = op;

    let json = {
      data: relatedRecord ? source.serializer.serializeIdentifier(relatedRecord) : null
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'PATCH', { data: json });
  },

  replaceHasMany(source, op) {
    const { type, id } = op.record;
    const { relationship, relatedRecords } = op;

    let json = {
      data: relatedRecords.map(r => source.serializer.serializeIdentifier(r))
    };

    return source.ajax(source.resourceRelationshipURL(type, id, relationship), 'PATCH', { data: json });
  }
};
