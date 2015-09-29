import Operation from 'orbit/operation';
import { isObject, isArray, merge } from 'orbit/lib/objects';
import { toOperation } from 'orbit/lib/operations';
import { OperationNotAllowed } from 'orbit-common/lib/exceptions';
import { toIdentifier } from './identifiers';

function _shouldMerge(supercededOp, supercedingOp, consecutiveOps) {
  var pathsOverlap = (
    supercededOp.path.join("/").indexOf(supercedingOp.path.join("/")) === 0 ||
    supercedingOp.path.join("/").indexOf(supercededOp.path.join("/")) === 0
  );

  // In order to allow merging of operations, their paths must overlap
  // and the operations must either be consecutive or the superceding
  // operation must only change a field (not a relationship).
  return pathsOverlap &&
         (consecutiveOps || _valueTypeForPath(supercedingOp.path) === 'field');
}

function _valueTypeForPath(path) {
  if (path[2] === 'relationships') return 'link';
  if (path.length === 2) return 'record';
  return 'field';
}

function _linkTypeFor(path) {
  return path.length === 4 ? 'hasOne' : 'hasMany';
}

function _mergeAttributeWithRecord(superceded, superceding) {
  var record = superceded.value;
  var fieldName = superceding.path[2];
  record[fieldName] = superceding.value;
  return new Operation({ op: 'add', path: superceded.path, value: record });
}

function _mergeRecordWithAttribute(superceded, superceding) {
  var record = superceding.value,
      recordPath = superceding.path;
  var fieldName = superceded.path[2];
  record[fieldName] = record[fieldName] || superceded.value;
  return new Operation({ op: 'add', path: recordPath, value: record });
}

function _mergeLinkWithRecord(superceded, superceding) {
  var record = superceded.value;
  var linkName = superceding.path[3];
  var linkId = superceding.path[4];
  var linkType = _linkTypeFor(superceding.path);

  record.relationships = record.relationships || {};

  if (linkType === 'hasMany') {
    record.relationships[linkName] = record.relationships[linkName] || {};
    record.relationships[linkName][linkId] = true;

  }
  else if (linkType === 'hasOne') {
    record.relationships[linkName] = superceding.value;

  }
  else {
    throw new Error("linkType not supported: " + linkType);
  }

  return new Operation({ op: 'add', path: superceded.path, value: record });
}

function _mergeRecordWithLink(superceded, superceding) {
  var record = superceding.value;
  var linkName = superceded.path[3];
  var linkId = superceded.path[4];
  var linkType = _linkTypeFor(superceded.path);

  record.relationships = record.relationships || {};

  if (linkType === 'hasMany') {
    record.relationships[linkName] = record.relationships[linkName] || {};
    record.relationships[linkName][linkId] = true;

  }
  else if (linkType === 'hasOne') {
    record.relationships[linkName] = record.relationships[linkName] || superceded.value;

  }
  else {
    throw new Error("linkType not supported: " + linkType);
  }

  return new Operation({ op: 'add', path: superceding.path, value: record });
}

function _valueTypeForLinkValue(value) {
  if (!value) return 'unknown';
  if (isObject(value)) return 'hasMany';
  return 'hasOne';
}

function _mergeRecords(target, source) {
  Object.keys(source).forEach( function(attribute) {
    var attributeValue = source[attribute];
    if (attribute !== 'relationships') {
      target[attribute] = attributeValue;
    }
  });

  source.relationships = source.relationships || {};
  target.relationships = target.relationships || {};

  var sourceLinks = Object.keys(source.relationships);
  var targetLinks = Object.keys(target.relationships);
  var links = sourceLinks.concat(targetLinks);

  links.forEach( function(link) {
    var linkType = _valueTypeForLinkValue(source.relationships[link] || target.relationships[link]);

    if (linkType === 'hasOne') {
      target.relationships[link] = source.relationships[link];
    } else if (linkType === 'unknown') {
      target.relationships[link] = null;
    } else {
      target.relationships[link] = target.relationships[link] || {};
      target.relationships[link] = merge(target.relationships[link], source.relationships[link]);
    }
  });

  return target;
}

function _mergeRecordWithRecord(superceded, superceding) {
  var mergedRecord = { id: superceded.id, relationships: {} },
      supercededRecord = superceded.value,
      supercedingRecord = superceding.value,
      record;

  record = _mergeRecords({}, supercededRecord);
  record = _mergeRecords(record, supercedingRecord);

  return new Operation({ op: 'add', path: superceding.path, value: record });
}

function _merge(superceded, superceding) {
  var supercedingType = _valueTypeForPath(superceding.path),
      supercededType = _valueTypeForPath(superceded.path);

  if (supercededType === 'record' && supercedingType === 'field') {
    return _mergeAttributeWithRecord(superceded, superceding);
  }
  else if (supercededType === 'field' && supercedingType === 'record') {
    return _mergeRecordWithAttribute(superceded, superceding);
  }
  else if (supercededType === 'record' && supercedingType === 'link') {
    return _mergeLinkWithRecord(superceded, superceding);
  }
  else if (supercededType === 'link' && supercedingType === 'record') {
    return _mergeRecordWithLink(superceded, superceding);
  }
  else if (supercededType === 'record' && supercedingType === 'record') {
    return _mergeRecordWithRecord(superceded, superceding);
  }
  else {
    return superceding;
  }
}

/**
 Coalesces operations into a minimal set of equivalent operations.

 This method respects the order of the operations array and does not allow
 reordering of operations that affect relationships.

 @method coalesceOperations
 @for Orbit
 @param {Array} operations
 @returns {Array}
 */
function coalesceOperations(operations) {
  var coalescedOps = [];
  var currentOp;
  var nextOp;
  var consecutiveOps;

  for (var i = 0, l = operations.length; i < l; i++) {
    currentOp = operations[i];

    if (currentOp) {
      consecutiveOps = true;

      for (var j = i + 1; j < l; j++) {
        nextOp = operations[j];
        if (nextOp) {
          if (_shouldMerge(currentOp, nextOp, consecutiveOps)) {
            currentOp = _merge(currentOp, nextOp);
            operations[j] = undefined;
          } else {
            consecutiveOps = false;
          }
        }
      }

      coalescedOps.push(currentOp);
    }
  }

  return coalescedOps;
}

function operationType(operation) {
  var op = operation.op;
  var path = operation.path;
  var value = operation.value;

  if (path.length < 2) {
    throw new OperationNotAllowed("Path must have at least 2 segments");

  } else if (path.length === 2) {
    if (op === 'add' || op === 'remove' || op === 'replace') {
      return op + 'Record';
    }

  } else if (path[2] === 'relationships') {
    if (path[4] === 'data') {
      if (path.length === 5 && op === 'replace') {
        return 'replaceRelationship';

      } else if (path.length === 6) {
        if (op === 'add') {
          return 'addToRelationship';

        } else if (op === 'remove') {
          return 'removeFromRelationship';

        }
      }

    }
    return op + 'Relationship';

  } else if (path[2] === 'attributes') {
    if (path.length === 4 && op === 'replace') {
      return 'replaceAttribute';
    }

  } else if (path[2] === 'keys') {
    if (path.length === 4 && (op === 'replace' || op === 'add')) {
      return op + 'Key';
    }
  }

  // TODO - many operations are now allowed but not yet identified, such as modifying meta and links
  //
  // throw new OperationNotAllowed("Invalid operation " + op + " :: " + path.join("/") + " :: " + value);
}

function addRecordOperation(record) {
  return toOperation('add', [record.type, record.id], record);
}

function replaceRecordOperation(record) {
  return toOperation('replace', [record.type, record.id], record);
}

function removeRecordOperation(record) {
  return toOperation('remove', [record.type, record.id]);
}

function replaceAttributeOperation(record, attribute, value) {
  return toOperation('replace',[record.type, record.id, 'attributes', attribute], value);
}

function addToRelationshipOperation(record, relationship, value) {
  return toOperation(
    'add',
    [record.type, record.id, 'relationships', relationship, 'data', toIdentifier(value.type, value.id)],
    true);
}

function removeFromRelationshipOperation(record, relationship, value) {
  return toOperation(
    'remove',
    [record.type, record.id, 'relationships', relationship, 'data', toIdentifier(value.type, value.id)]);
}

function replaceRelationshipOperation(record, relationship, value) {
  var data;

  if (isArray(value)) {
    data = {};
    value.forEach(function(datum) {
      data[ toIdentifier(datum.type, datum.id) ] = true;
    });

  } else if (isObject(value)) {
    data = toIdentifier(value.type, value.id);

  } else {
    data = value;
  }

  return toOperation(
    'replace',
    [record.type, record.id, 'relationships', relationship, 'data'],
    data);
}

export { operationType,
         coalesceOperations,
         addRecordOperation,
         replaceRecordOperation,
         removeRecordOperation,
         replaceAttributeOperation,
         addToRelationshipOperation,
         removeFromRelationshipOperation,
         replaceRelationshipOperation };
