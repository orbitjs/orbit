import Operation from 'orbit/operation';

function normalizeOperation(operation) {
  if (operation instanceof Operation) {
    return operation;
  } else {
    return new Operation(operation);
  }
}

function normalizeOperations(operations) {
  return operations.map(normalizeOperation);
}

function toOperation(op, path, value) {
  var data = {
    op: op,
    path: path
  };

  if (value !== undefined) {
    data.value = value;
  }

  return new Operation(data);
}

export { toOperation, normalizeOperation, normalizeOperations };
