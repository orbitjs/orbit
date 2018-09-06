import { Dict, toArray } from '@orbit/utils';
import { Query, Transform, buildTransform, Record } from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { GetOperators } from "./get-operators";
import { DeserializedDocument } from "../jsonapi-serializer";



function deserialize(source: JSONAPISource, document: JSONAPIDocument): QueryOperatorResponse {

  const deserialized = source.serializer.deserializeDocument(document);
  const records = toArray(deserialized.data);

  if (deserialized.included) {
    Array.prototype.push.apply(records, deserialized.included);
  }

  const operations = records.map(record => {
    return {
      op: 'replaceRecord',
      record
    };
  });

  let transforms = [buildTransform(operations)];
  let primaryData = deserialized.data;

  return { transforms, primaryData };
}

export interface QueryOperatorResponse {
  transforms: Transform[];
  primaryData: Record|Record[];
}

export interface QueryOperator {
  (source: JSONAPISource, query: Query): Promise<QueryOperatorResponse>;
}

export const QueryOperators: Dict<QueryOperator> = {
  findRecord(source: JSONAPISource, query: Query) {
    return GetOperators.findRecord(source, query)
      .then(data => deserialize(source, data));
  },

  findRecords(source: JSONAPISource, query: Query) {
    return GetOperators.findRecords(source, query)
      .then(data => deserialize(source, data));
  },

  findRelatedRecord(source: JSONAPISource, query: Query) {
    return GetOperators.findRelatedRecord(source, query)
      .then(data => deserialize(source, data));
  },

  findRelatedRecords(source: JSONAPISource, query: Query) {
    return GetOperators.findRelatedRecords(source, query)
      .then(data => deserialize(source, data));
  }
};
