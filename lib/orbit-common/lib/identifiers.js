function toIdentifier(type, id) {
  return type + ':' + id;
}

function parseIdentifier(str) {
  var parts = str.split(':');

  return {
    type: parts[0],
    id: parts[1]
  };
}

export { toIdentifier, parseIdentifier };
