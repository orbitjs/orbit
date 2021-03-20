import {
  InitializedRecord,
  cloneRecordIdentity,
  RecordIdentity,
  RecordOperation
} from '@orbit/records';

export interface RecordChange extends RecordIdentity {
  keys: string[];
  attributes: string[];
  relationships: string[];
  meta: string[];
  links: string[];
  remove: boolean;
}

export function recordOperationChange(
  operation: RecordOperation
): RecordChange {
  const record = operation.record as InitializedRecord;
  const change: RecordChange = {
    ...cloneRecordIdentity(record),
    remove: false,
    keys: [],
    attributes: [],
    relationships: [],
    meta: [],
    links: []
  };

  switch (operation.op) {
    case 'addRecord':
    case 'updateRecord':
      if (record.keys) {
        change.keys = Object.keys(record.keys);
      }
      if (record.attributes) {
        change.attributes = Object.keys(record.attributes);
      }
      if (record.relationships) {
        change.relationships = Object.keys(record.relationships);
      }
      if (record.meta) {
        change.meta = Object.keys(record.meta);
      }
      if (record.links) {
        change.links = Object.keys(record.links);
      }
      break;
    case 'replaceAttribute':
      change.attributes = [operation.attribute];
      break;
    case 'replaceKey':
      change.keys = [operation.key];
      break;
    case 'replaceRelatedRecord':
    case 'replaceRelatedRecords':
    case 'addToRelatedRecords':
    case 'removeFromRelatedRecords':
      change.relationships = [operation.relationship];
      break;
    case 'removeRecord':
      change.remove = true;
      break;
  }

  return change;
}
