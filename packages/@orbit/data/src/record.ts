import { Dict, isObject, isNone, merge } from '@orbit/utils';

export interface LinkObject {
  href: string;
  meta?: Dict<any>;
}

export type Link = string | LinkObject;

export interface RecordIdentity {
  type: string;
  id: string;
}

export interface RecordHasOneRelationship {
  data?: RecordIdentity | null;
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface RecordHasManyRelationship {
  data?: RecordIdentity[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export type RecordRelationship =
  | RecordHasOneRelationship
  | RecordHasManyRelationship;

export interface Record extends RecordIdentity {
  keys?: Dict<string>;
  attributes?: Dict<any>;
  relationships?: Dict<RecordRelationship>;
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface RecordInitializer {
  initializeRecord(record: Record): void;
}

export function cloneRecordIdentity(identity: RecordIdentity): RecordIdentity {
  const { type, id } = identity;
  return { type, id };
}

export function equalRecordIdentities(
  record1: RecordIdentity,
  record2: RecordIdentity
): boolean {
  return (
    (isNone(record1) && isNone(record2)) ||
    (isObject(record1) &&
      isObject(record2) &&
      record1.type === record2.type &&
      record1.id === record2.id)
  );
}

export function equalRecordIdentitySets(
  set1: RecordIdentity[],
  set2: RecordIdentity[]
): boolean {
  if (set1.length === set2.length) {
    if (set1.length === 0) {
      return true;
    }

    const serialized1 = serializeRecordIdentities(set1);
    const serialized2 = serializeRecordIdentities(set2);

    return (
      exclusiveIdentities(serialized1, serialized2).length === 0 &&
      exclusiveIdentities(serialized2, serialized1).length === 0
    );
  }
  return false;
}

export function uniqueRecordIdentities(
  set1: RecordIdentity[],
  set2: RecordIdentity[]
): RecordIdentity[] {
  return exclusiveIdentities(
    serializeRecordIdentities(set1),
    serializeRecordIdentities(set2)
  ).map(id => deserializeRecordIdentity(id));
}

export function recordsInclude(
  records: RecordIdentity[],
  match: RecordIdentity
): boolean {
  for (let r of records) {
    if (equalRecordIdentities(r, match)) {
      return true;
    }
  }
  return false;
}

export function recordsIncludeAll(
  records: RecordIdentity[],
  match: RecordIdentity[]
): boolean {
  return (
    exclusiveIdentities(
      serializeRecordIdentities(match),
      serializeRecordIdentities(records)
    ).length === 0
  );
}

export function mergeRecords(current: Record | null, updates: Record): Record {
  if (current) {
    let record: any = cloneRecordIdentity(current);
    let currentRecord: any = current;
    let updatedRecord: any = updates;

    ['attributes', 'keys', 'relationships'].forEach(grouping => {
      if (currentRecord[grouping] && updatedRecord[grouping]) {
        record[grouping] = merge(
          {},
          currentRecord[grouping],
          updatedRecord[grouping]
        );
      } else if (currentRecord[grouping]) {
        record[grouping] = merge({}, currentRecord[grouping]);
      } else if (updatedRecord[grouping]) {
        record[grouping] = merge({}, updatedRecord[grouping]);
      }
    });

    return record;
  } else {
    return updates;
  }
}

export function serializeRecordIdentity(record: RecordIdentity): string {
  return `${record.type}:${record.id}`;
}

export function deserializeRecordIdentity(identity: string): RecordIdentity {
  const [type, id] = identity.split(':');
  return { type, id };
}

function serializeRecordIdentities(
  recordIdentities: RecordIdentity[]
): string[] {
  return recordIdentities.map(r => serializeRecordIdentity(r));
}

function exclusiveIdentities(
  identities1: string[],
  identities2: string[]
): string[] {
  return identities1.filter(i => !identities2.includes(i));
}
