import { isObject, isNone } from './lib/objects';
import { Dict } from './lib/dict';

export interface RecordIdentity {
  type: string;
  id: string;
}

export interface RecordKey {
  string;
}

export interface RecordIdentifier {
  string;
}

export interface RecordAttribute {
  any;
}

export interface RecordHasOneRelationship {
  data: null | RecordIdentifier;
}

export interface RecordHasManyRelationship {
  data: Dict<RecordIdentifier>;
}

export type RecordRelationship = RecordHasOneRelationship | RecordHasManyRelationship;

export interface Record extends RecordIdentity {
  keys?: Dict<RecordKey>;
  attributes?: Dict<RecordAttribute>;
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
