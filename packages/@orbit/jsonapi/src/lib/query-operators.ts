import { Dict, toArray } from '@orbit/utils';
import {
  Query,
  Operation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  buildTransform,
  FindRelatedRecord,
  FindRelatedRecords,
  Record,
  Transform
} from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { GetOperators } from "./get-operators";
import { DeserializedDocument } from '../jsonapi-serializer';

function operationsFromDeserializedDocument(deserialized: DeserializedDocument): Operation[] {
  const records = [];
  Array.prototype.push.apply(records, toArray(deserialized.data));

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

export interface QueryOperatorResponse {
  transforms: Transform[];
  primaryData: Record|Record[];
}

export interface QueryOperator {
  (source: JSONAPISource, query: Query): Promise<QueryOperatorResponse>;
}

export const QueryOperators: Dict<QueryOperator> = {
  async findRecord(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const document = await GetOperators.findRecord(source, query);
    const deserialized = source.serializer.deserializeDocument(document);
    const operations = operationsFromDeserializedDocument(deserialized);
    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRecords(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
    const document = await GetOperators.findRecords(source, query);
    const deserialized = source.serializer.deserializeDocument(document);
    const operations = operationsFromDeserializedDocument(deserialized);
    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRelatedRecord(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
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

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  },

  async findRelatedRecords(source: JSONAPISource, query: Query): Promise<QueryOperatorResponse> {
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

    const transforms = [buildTransform(operations)];
    const primaryData = deserialized.data;

    return { transforms, primaryData };
  }
};
