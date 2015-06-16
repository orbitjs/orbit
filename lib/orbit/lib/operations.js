import { isObject, merge } from 'orbit/lib/objects';
import Document from 'orbit/document';
import { eq } from 'orbit/lib/eq';
import Operation from 'orbit/operation';

function _requiresMerge(superceded, superceding) {
  return (
    superceded.path.join("/").indexOf(superceding.path.join("/")) === 0 ||
    superceding.path.join("/").indexOf(superceded.path.join("/")) === 0
  );
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
 Coalesces operations into a minimal set of equivalent operations

 @method coalesceOperations
 @for Orbit
 @param {Array} operations
 @returns {Array}
 */
function coalesceOperations(operations) {
  var coalesced = [];
  var superceding;

  operations.forEach(function(superceding) {
    coalesced.slice(0).forEach(function(superceded) {

      if (_requiresMerge(superceded, superceding)) {
        var index = coalesced.indexOf(superceded);
        coalesced.splice(index, 1);
        superceding = _merge(superceded, superceding);
      }

    });
    coalesced.push(superceding);
  });

  return coalesced;
}

export { coalesceOperations };
