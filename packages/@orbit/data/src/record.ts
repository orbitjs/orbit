import { Dict, isObject, isNone, merge } from '@orbit/utils';

export interface LinkObject {
  href: string;
  meta?: any;
}

export interface RecordRelationshipLinks {
  self?: string | LinkObject;
  related?: string | LinkObject;
}

export interface RecordLinks {
  self?: string | LinkObject;
}

export interface RecordIdentity {
  type: string;
  id: string;
}

export interface RecordHasOneRelationship {
  data?: RecordIdentity | null;
  links?: RecordRelationshipLinks;
}

export interface RecordHasManyRelationship {
  data?: RecordIdentity[];
  links?: RecordRelationshipLinks;
}

export type RecordRelationship = RecordHasOneRelationship | RecordHasManyRelationship;

export interface Record extends RecordIdentity {
  keys?: Dict<string>;
  attributes?: Dict<any>;
  relationships?: Dict<RecordRelationship>;
  links?: RecordLinks;
}

export interface RecordInitializer {
  initializeRecord(record: Record): void;
}

export function cloneRecordIdentity(identity: RecordIdentity): RecordIdentity {
  const { type, id } = identity;
  return { type, id };
}

export function equalRecordIdentities(record1: RecordIdentity, record2: RecordIdentity): boolean {
  return (isNone(record1) && isNone(record2)) ||
    (isObject(record1) && isObject(record2) &&
      record1.type === record2.type &&
      record1.id === record2.id);
}

export function mergeRecords(current: Record | null, updates: Record): Record {
  if (current) {
    let record = cloneRecordIdentity(current);

    ['attributes', 'keys', 'relationships'].forEach(grouping => {
      if (current[grouping] && updates[grouping]) {
        record[grouping] = merge({}, current[grouping], updates[grouping]);
      } else if (current[grouping]) {
        record[grouping] = merge({}, current[grouping]);
      } else if (updates[grouping]) {
        record[grouping] = merge({}, updates[grouping]);
      }
    });

    return record;
  } else {
    return updates;
  }
}
