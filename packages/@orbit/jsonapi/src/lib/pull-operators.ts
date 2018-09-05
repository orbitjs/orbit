import { Dict, toArray } from '@orbit/utils';
import {
  Query,
  Transform,
  buildTransform,
} from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { GetOperators } from "./get-operators";

function deserialize(source: JSONAPISource, document: JSONAPIDocument): Transform[] {
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

  return [buildTransform(operations)];
}

export interface PullOperator {
  (source: JSONAPISource, query: Query): any;
}

export const PullOperators: Dict<PullOperator> = {
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
