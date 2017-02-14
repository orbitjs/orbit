import { isObject, isNone } from './lib/objects';

export interface Identity {
  type: string;
  id: string;
}

export function toIdentifier(identity: Identity): string {
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

export function parseIdentifier(identifier: string): Identity {
  const [type, id] = identifier.split(':');
  return { type, id };
}

export function identity(record: Identity): Identity {
  const { type, id } = record;
  return { type, id };
}

export function eqIdentity(record1: Identity, record2: Identity): boolean {
  return (isNone(record1) && isNone(record2)) ||
         (isObject(record1) && isObject(record2) &&
          record1.type === record2.type &&
          record1.id === record2.id);
}
