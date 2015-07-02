import { isArray, isObject, isNone } from 'orbit/lib/objects';
import OperationProcessor from './operation-processor';

/**
 An operation processor that ensures that a cache's data is consistent with
 its associated schema.

 This includes maintenance of inverse links and dependent links.

 @class SchemaConsistencyProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Schema} [schema] Schema used to define the data structure and relationships.
 @param {Function}  [retrieve] Function used to retrieve data at a specific `path`.
 @constructor
 */
export default OperationProcessor.extend({
  after: function(operation) {
    var path = operation.path;
    var type = path[0];
    var id = path[1];
    var operationType = this._schema.operationEncoder.identify(operation);

    switch (operationType) {
      case 'replaceHasOne':
      case 'replaceHasMany':
      case 'removeHasOne':
      case 'removeHasMany':
        return this._linkRemoved(operation, type, id, path[3]);

      case 'removeFromHasMany':
        return this._linkRemoved(operation, type, id, path[3], path[4]);

      case 'removeRecord':
        return this._recordRemoved(operation, type, id);

      default:
        return [];
    }
  },

  finally: function(operation) {
    var path = operation.path;
    var type = path[0];
    var id = path[1];
    var value = operation.value;
    var operationType = this._schema.operationEncoder.identify(operation);

    switch (operationType) {
      case 'replaceHasOne':
      case 'replaceHasMany':
      case 'addHasOne':
      case 'addHasMany':
        return this._linkAdded(operation, type, id, path[3], value);

      case 'addToHasMany':
        return this._linkAdded(operation, type, id, path[3], path[4]);

      case 'addRecord':
        return this._recordAdded(operation, type, id, value);

      default:
        return [];
    }
  },

  _relatedOp: function(op, linkDef) {
    var relatedLinkDef = this._schema.linkDefinition(linkDef.model, linkDef.inverse);
    if (relatedLinkDef.type === 'hasMany' && op === 'replace') return 'add';
    return op;
  },

  _linkAdded: function(parentOperation, type, id, link, value) {
    var ops = [];
    var linkDef = this._schema.linkDefinition(type, link);

    if (linkDef.inverse && !isNone(value)) {
      var relatedOp = this._relatedOp(parentOperation.op, linkDef);
      var relIds = this._idsFromValue(value);
      var relId;
      var op;

      for (var i = 0; i < relIds.length; i++) {
        relId = relIds[i];
        op = this._relatedLinkOp(parentOperation, relatedOp, linkDef.model, relId, linkDef.inverse, id);
        if (op) ops.push(op);
      }
    }
    return ops;
  },

  _linkRemoved: function(parentOperation, type, id, link, value) {
    var ops = [];
    var linkDef = this._schema.linkDefinition(type, link);

    if (linkDef.inverse) {
      if (value === undefined) {
        value = this._document.retrieve([type, id, '__rel', link]);
      }

      if (!isNone(value)) {
        var relIds = this._idsFromValue(value);
        var relId;
        var op;

        for (var i = 0; i < relIds.length; i++) {
          relId = relIds[i];
          op = this._relatedLinkOp(parentOperation, 'remove', linkDef.model, relId, linkDef.inverse, id);
          if (op) ops.push(op);
        }
      }
    }

    return ops;
  },

  _recordAdded: function(parentOperation, type, id, record) {
    var ops = [];
    var links = record.__rel;

    if (links) {
      var linkValue;

      Object.keys(links).forEach(function(link) {
        linkValue = links[link];
        if (linkValue) {
          ops = ops.concat(this._linkAdded(parentOperation, type, id, link, linkValue));
        }
      }, this);
    }

    return ops;
  },

  _recordRemoved: function(parentOperation, type, id) {
    var ops = [];
    var links = this._document.retrieve([type, id, '__rel']);

    if (links) {
      var linkDef;
      var linkValue;

      Object.keys(links).forEach(function(link) {
        linkValue = links[link];
        if (linkValue) {
          linkDef = this._schema.linkDefinition(type, link);

          if (linkDef.dependent === 'remove') {
            ops = ops.concat(this._removeDependentRecords(parentOperation, linkDef.model, linkValue));
          } else {
            ops = ops.concat(this._linkRemoved(parentOperation, type, id, link, linkValue));
          }
        }
      }, this);
    }

    return ops;
  },

  _removeDependentRecords: function(parentOperation, type, idOrIds) {
    var ops = [];
    var ids = this._idsFromValue(idOrIds);
    var id;
    var dependentPath;

    for (var i = 0; i < ids.length; i++) {
      id = ids[i];
      dependentPath = [type, id];
      if (this._document.retrieve(dependentPath)) {
        ops.push(parentOperation.spawn({
          op: 'remove',
          path: dependentPath
        }));
      }
    }

    return ops;
  },

  _idsFromValue: function(value) {
    if (isArray(value)) {
      return value;
    } else if (isObject(value)) {
      return Object.keys(value);
    } else {
      return [ value ];
    }
  },

  _relatedLinkOp: function(parentOperation, op, type, id, link, value) {
    // console.log('_relatedLinkOp', op, type, id, link, value);
    if (this._document.retrieve([type, id])) {
      var operation = this._schema.operationEncoder.linkOp(op, type, id, link, value);

      // Apply operation only if necessary
      if (this._retrieve(operation.path) !== operation.value) {
        // console.log('_relatedLinkOp - necessary', op, type, id, link, value);
        return parentOperation.spawn(operation);
      }
    }
  }
});
