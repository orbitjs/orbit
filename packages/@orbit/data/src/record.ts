import { Dict, isObject, isNone } from '@orbit/utils';

export interface RecordIdentity {
  type: string;
  id: string;
}

export interface RecordHasOneRelationship {
  data: string;
}

export interface RecordHasManyRelationship {
  data: Dict<string>;
}

export type RecordRelationship = RecordHasOneRelationship | RecordHasManyRelationship;

export interface Record extends RecordIdentity {
  keys?: Dict<string>;
  attributes?: Dict<any>;
  relationships?: Dict<RecordRelationship>;
}

export function serializeRecordIdentity(identity: RecordIdentity): string {
  if (isNone(identity)) {
    return null;
  }
  const { type, id } = identity;
  if (isNone(type) || isNone(id)) {
    return null;
  } else {
    return `${type}:${id}`;
  }
}

export function deserializeRecordIdentity(identity: string): RecordIdentity {
  const [type, id] = identity.split(':');
  return { type, id };
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
