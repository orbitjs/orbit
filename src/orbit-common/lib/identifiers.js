import { isObject, isNone } from 'orbit/lib/objects';

function toIdentifier(type, id) {
  if (type) {
    if (isObject(type)) {
      return type.type + ':' + type.id;
    } else {
      return type + ':' + id;
    }
  } else {
    return null;
  }
}

function parseIdentifier(identifier) {
  const [type, id] = identifier.split(':');
  return { type, id };
}

function identity(record) {
  const { type, id } = record;
  return { type, id };
}

function eqIdentity(record1, record2) {
  return (isNone(record1) && isNone(record2)) ||
         (isObject(record1) && isObject(record2) &&
          record1.type === record2.type &&
          record1.id === record2.id);
}

export { toIdentifier, parseIdentifier, identity, eqIdentity };
