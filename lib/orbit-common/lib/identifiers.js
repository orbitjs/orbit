function toIdentifier(type, id) {
  return type + ':' + id;
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
