import { isObject, merge } from 'orbit/lib/objects';
import { eq } from 'orbit/lib/eq';
import Document from 'orbit/document';
import Operation from 'orbit/operation';

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
  if (path[2] === '__rel') return 'link';
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

  record.__rel = record.__rel || {};

  if (linkType === 'hasMany') {
    record.__rel[linkName] = record.__rel[linkName] || {};
    record.__rel[linkName][linkId] = true;

  }
  else if (linkType === 'hasOne') {
    record.__rel[linkName] = superceding.value;

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

  record.__rel = record.__rel || {};

  if (linkType === 'hasMany') {
    record.__rel[linkName] = record.__rel[linkName] || {};
    record.__rel[linkName][linkId] = true;

  }
  else if (linkType === 'hasOne') {
    record.__rel[linkName] = record.__rel[linkName] || superceded.value;

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
    if (attribute !== '__rel') {
      target[attribute] = attributeValue;
    }
  });

  source.__rel = source.__rel || {};
  target.__rel = target.__rel || {};

  var sourceLinks = Object.keys(source.__rel);
  var targetLinks = Object.keys(target.__rel);
  var links = sourceLinks.concat(targetLinks);

  links.forEach( function(link) {
    var linkType = _valueTypeForLinkValue(source.__rel[link] || target.__rel[link]);

    if (linkType === 'hasOne') {
      target.__rel[link] = source.__rel[link];
    } else if (linkType === 'unknown') {
      target.__rel[link] = null;
    } else {
      target.__rel[link] = target.__rel[link] || {};
      target.__rel[link] = merge(target.__rel[link], source.__rel[link]);
    }
  });

  return target;
}

function _mergeRecordWithRecord(superceded, superceding) {
  var mergedRecord = { id: superceded.id, __rel: {} },
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

export { coalesceOperations, normalizeOperation, normalizeOperations };
