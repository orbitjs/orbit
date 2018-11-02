import { Dict, toArray } from '@orbit/utils';
import {
  Query,
  Operation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  FindRelatedRecords,
  FindRelatedRecord,
  Record
} from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { GetOperators } from "./get-operators";

function deserialize(source: JSONAPISource, document: JSONAPIDocument): Operation[] {
  const deserialized = source.serializer.deserializeDocument(document);
  const records = toArray(deserialized.data);

  if (deserialized.included) {
    Array.prototype.push.apply(records, deserialized.included);
  }

  return records.map(record => {
    return {
      op: 'replaceRecord',
      record
    };
  });
}

function extractRecords(source: JSONAPISource, document: JSONAPIDocument): Record[] {
  const deserialized = source.serializer.deserializeDocument(document);
  return toArray(deserialized.data);
}


export interface PullOperator {
  (source: JSONAPISource, query: Query): any;
}

export const PullOperators: Dict<PullOperator> = {
  findRecord(source: JSONAPISource, query: Query) {
    return GetOperators.findRecord(source, query)
      .then(data => [buildTransform(deserialize(source, data))]);
  },

  findRecords(source: JSONAPISource, query: Query) {
    return GetOperators.findRecords(source, query)
      .then(data => [buildTransform(deserialize(source, data))]);
  },

  findRelatedRecord(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRelatedRecord;
    const { record, relationship } = expression;

    return GetOperators.findRelatedRecord(source, query)
      .then((data) => {
        const operations = deserialize(source, data);
        const records = extractRecords(source, data);
        operations.push({
          op: 'replaceRelatedRecord',
          record,
          relationship,
          relatedRecord: {
            type: records[0].type,
            id:   records[0].id
          }
        } as ReplaceRelatedRecordOperation);
        return [buildTransform(operations)];
      });
  },

  findRelatedRecords(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRelatedRecords;
    const { record, relationship } = expression;

    return GetOperators.findRelatedRecords(source, query)
      .then((data) => {
        const operations = deserialize(source, data);
        const records = extractRecords(source, data);
        operations.push({
          op: 'replaceRelatedRecords',
          record,
          relationship,
          relatedRecords: records.map(r => ({
            type: r.type,
            id:   r.id
          }))
        } as ReplaceRelatedRecordsOperation);
        return [buildTransform(operations)];
      });
  }
};
