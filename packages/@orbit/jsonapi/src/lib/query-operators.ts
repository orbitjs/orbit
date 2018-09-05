import { Dict } from '@orbit/utils';
import {
  Query,
} from '@orbit/data';
import JSONAPISource from '../jsonapi-source';
import { JSONAPIDocument } from '../jsonapi-document';
import { GetOperators } from "./get-operators";
import { DeserializedDocument } from "../jsonapi-serializer";

function deserialize(source: JSONAPISource, document: JSONAPIDocument): DeserializedDocument {
  return source.serializer.deserializeDocument(document);
}

export interface QueryOperator {
  (source: JSONAPISource, query: Query): Promise<DeserializedDocument>;
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
