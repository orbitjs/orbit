import { Dict, toArray } from '@orbit/utils';
import {
  Query,
  Operation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  FindRelatedRecords,
  FindRelatedRecord
} from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { GetOperators } from "./get-operators";
import { DeserializedDocument } from '../jsonapi-serializer';

function operationsFromDeserializedDocument(deserialized: DeserializedDocument): Operation[] {
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

export interface PullOperator {
  (source: JSONAPISource, query: Query): any;
}

export const PullOperators: Dict<PullOperator> = {
  async findRecord(source: JSONAPISource, query: Query) {
    const document = await GetOperators.findRecord(source, query);
    const deserialized = source.serializer.deserializeDocument(document);
    const operations = operationsFromDeserializedDocument(deserialized);
    return [buildTransform(operations)];
  },

  async findRecords(source: JSONAPISource, query: Query) {
    const document = await GetOperators.findRecords(source, query);
    const deserialized = source.serializer.deserializeDocument(document);
    const operations = operationsFromDeserializedDocument(deserialized);
    return [buildTransform(operations)];
  },

  async findRelatedRecord(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRelatedRecord;
    const { record, relationship } = expression;

    const document = await GetOperators.findRelatedRecord(source, query);
    const deserialized = source.serializer.deserializeDocument(document);
    const relatedRecord = deserialized.data;

    const operations = operationsFromDeserializedDocument(deserialized);
    operations.push({
      op: 'replaceRelatedRecord',
      record,
      relationship,
      relatedRecord
    } as ReplaceRelatedRecordOperation);

    return [buildTransform(operations)];
  },

  async findRelatedRecords(source: JSONAPISource, query: Query) {
    const expression = query.expression as FindRelatedRecords;
    const { record, relationship } = expression;

    const document = await GetOperators.findRelatedRecords(source, query);
    const deserialized = source.serializer.deserializeDocument(document);
    const relatedRecords = deserialized.data;

    const operations = operationsFromDeserializedDocument(deserialized);
    operations.push({
      op: 'replaceRelatedRecords',
      record,
      relationship,
      relatedRecords
    } as ReplaceRelatedRecordsOperation);

    return [buildTransform(operations)];
  }
};
