import { isObject, isArray, merge } from 'orbit/lib/objects';
import { eq } from 'orbit/lib/eq';
import { OperationNotAllowed } from 'orbit-common/lib/exceptions';
import { identity } from './identifiers';

// function _shouldMerge(supercededOp, supercedingOp, consecutiveOps) {
//   var pathsOverlap = (
//     supercededOp.path.join('/').indexOf(supercedingOp.path.join('/')) === 0 ||
//     supercedingOp.path.join('/').indexOf(supercededOp.path.join('/')) === 0
//   );
//
//   // In order to allow merging of operations, their paths must overlap
//   // and the operations must either be consecutive or the superceding
//   // operation must only change a field (not a relationship).
//   return pathsOverlap &&
//          (consecutiveOps || _valueTypeForPath(supercedingOp.path) === 'field');
// }
//
// function _valueTypeForPath(path) {
//   if (path[2] === 'relationships') { return 'link'; }
//   if (path.length === 2) { return 'record'; }
//   return 'field';
// }
//
// function _linkTypeFor(path) {
//   return path.length === 4 ? 'hasOne' : 'hasMany';
// }
//
// function _mergeAttributeWithRecord(superceded, superceding) {
//   var record = superceded.value;
//   var fieldName = superceding.path[2];
//   record[fieldName] = superceding.value;
//   return { op: 'add', path: superceded.path, value: record };
// }
//
// function _mergeRecordWithAttribute(superceded, superceding) {
//   let record = superceding.value;
//   let recordPath = superceding.path;
//   var fieldName = superceded.path[2];
//   record[fieldName] = record[fieldName] || superceded.value;
//   return { op: 'add', path: recordPath, value: record };
// }
//
// function _mergeLinkWithRecord(superceded, superceding) {
//   var record = superceded.value;
//   var linkName = superceding.path[3];
//   var linkId = superceding.path[4];
//   var linkType = _linkTypeFor(superceding.path);
//
//   record.relationships = record.relationships || {};
//
//   if (linkType === 'hasMany') {
//     record.relationships[linkName] = record.relationships[linkName] || {};
//     record.relationships[linkName][linkId] = true;
//   } else if (linkType === 'hasOne') {
//     record.relationships[linkName] = superceding.value;
//   } else {
//     throw new Error('linkType not supported: ' + linkType);
//   }
//
//   return { op: 'add', path: superceded.path, value: record };
// }
//
// function _mergeRecordWithLink(superceded, superceding) {
//   var record = superceding.value;
//   var linkName = superceded.path[3];
//   var linkId = superceded.path[4];
//   var linkType = _linkTypeFor(superceded.path);
//
//   record.relationships = record.relationships || {};
//
//   if (linkType === 'hasMany') {
//     record.relationships[linkName] = record.relationships[linkName] || {};
//     record.relationships[linkName][linkId] = true;
//   } else if (linkType === 'hasOne') {
//     record.relationships[linkName] = record.relationships[linkName] || superceded.value;
//   } else {
//     throw new Error('linkType not supported: ' + linkType);
//   }
//
//   return { op: 'add', path: superceding.path, value: record };
// }
//
// function _valueTypeForLinkValue(value) {
//   if (!value) { return 'unknown'; }
//   if (isObject(value)) { return 'hasMany'; }
//   return 'hasOne';
// }
//
// function _mergeRecords(target, source) {
//   Object.keys(source).forEach(function(attribute) {
//     var attributeValue = source[attribute];
//     if (attribute !== 'relationships') {
//       target[attribute] = attributeValue;
//     }
//   });
//
//   source.relationships = source.relationships || {};
//   target.relationships = target.relationships || {};
//
//   var sourceLinks = Object.keys(source.relationships);
//   var targetLinks = Object.keys(target.relationships);
//   var links = sourceLinks.concat(targetLinks);
//
//   links.forEach(function(link) {
//     var linkType = _valueTypeForLinkValue(source.relationships[link] || target.relationships[link]);
//
//     if (linkType === 'hasOne') {
//       target.relationships[link] = source.relationships[link];
//     } else if (linkType === 'unknown') {
//       target.relationships[link] = null;
//     } else {
//       target.relationships[link] = target.relationships[link] || {};
//       target.relationships[link] = merge(target.relationships[link], source.relationships[link]);
//     }
//   });
//
//   return target;
// }
//
// function _mergeRecordWithRecord(superceded, superceding) {
//   let mergedRecord = { id: superceded.id, relationships: {} };
//   let supercededRecord = superceded.value;
//   let supercedingRecord = superceding.value;
//   let record;
//
//   record = _mergeRecords({}, supercededRecord);
//   record = _mergeRecords(record, supercedingRecord);
//
//   return { op: 'add', path: superceding.path, value: record };
// }
//
// function _merge(superceded, superceding) {
//   let supercedingType = _valueTypeForPath(superceding.path);
//   let supercededType = _valueTypeForPath(superceded.path);
//
//   if (supercededType === 'record' && supercedingType === 'field') {
//     return _mergeAttributeWithRecord(superceded, superceding);
//   } else if (supercededType === 'field' && supercedingType === 'record') {
//     return _mergeRecordWithAttribute(superceded, superceding);
//   } else if (supercededType === 'record' && supercedingType === 'link') {
//     return _mergeLinkWithRecord(superceded, superceding);
//   } else if (supercededType === 'link' && supercedingType === 'record') {
//     return _mergeRecordWithLink(superceded, superceding);
//   } else if (supercededType === 'record' && supercedingType === 'record') {
//     return _mergeRecordWithRecord(superceded, superceding);
//   } else {
//     return superceding;
//   }
// }

/**
 Coalesces operations into a minimal set of equivalent operations.

 This method respects the order of the operations array and does not allow
 reordering of operations that affect relationships.

 @method coalesceOperations
 @for Orbit
 @param {Array} operations
 @returns {Array}
 */
export function coalesceOperations(operations) {
  var coalescedOps = [];
  var currentOp;
  var nextOp;
  var consecutiveOps;

  for (var i = 0, l = operations.length; i < l; i++) {
    currentOp = operations[i];

    // TODO
    // if (currentOp) {
    //   consecutiveOps = true;
    //
    //   for (var j = i + 1; j < l; j++) {
    //     nextOp = operations[j];
    //     if (nextOp) {
    //       if (_shouldMerge(currentOp, nextOp, consecutiveOps)) {
    //         currentOp = _merge(currentOp, nextOp);
    //         operations[j] = undefined;
    //       } else {
    //         consecutiveOps = false;
    //       }
    //     }
    //   }
    //
    //   coalescedOps.push(currentOp);
    // }
  }

  return coalescedOps;
}

// function relationshipOperationType(operation) {
//   const { op, path, value } = operation;
//   const valueType = value === null ? 'null' : (typeof value);
//
//   const operationPattern = `${op}/${path.length}/${valueType}`;
//
//   switch (operationPattern) {
//     case 'add/6/boolean': return 'addToHasMany';
//     case 'replace/5/object': return 'replaceHasMany';
//     case 'replace/5/string': return 'replaceHasOne';
//     case 'replace/5/null': return 'replaceHasOne';
//     case 'remove/6/undefined': return 'removeFromHasMany';
//     default: throw new Error(`relationship operation not handled: ${op} ${path.join('/')} ${value}`);
//   }
// }

export function recordDiffs(record, updatedRecord) {
  const diffs = [];

  if (record && updatedRecord) {
    const recordIdentity = identity(record);

    if (updatedRecord.attributes) {
      Object.keys(updatedRecord.attributes).forEach(attribute => {
        let value = updatedRecord.attributes[attribute];
        if (record.attributes === undefined || !eq(record.attributes[attribute], value)) {
          diffs.push({
            op: 'replaceAttribute',
            record: recordIdentity,
            attribute,
            value
          });
        }
      });
    }

    if (updatedRecord.keys) {
      Object.keys(updatedRecord.keys).forEach(key => {
        let value = updatedRecord.keys[key];
        if (record.keys === undefined || !eq(record.keys[key], value)) {
          diffs.push({
            op: 'replaceKey',
            record: recordIdentity,
            key,
            value
          });
        }
      });
    }

    // TODO - handle relationships
  }

  return diffs;
}
