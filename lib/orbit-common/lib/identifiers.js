import { isObject } from 'orbit/lib/objects';

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
  const [ type, id ] = identifier.split(':');
  return { type, id };
}

function identity(record) {
  const { type, id } = record;
  return { type, id };
}

export { toIdentifier, parseIdentifier, identity };
