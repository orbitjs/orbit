import { Class, isArray, isObject, isNone } from 'orbit/lib/objects';
import OperationEncoder from 'orbit-common/operation-encoder';

export default Class.extend({
  init: function(schema, cache){
    this._schema = schema;
    this._cache = cache;
    this._operationEncoder = new OperationEncoder(schema);
  },

  process: function(operation, condemnedPaths) {
    var _this = this;
    var op = operation.op;
    var path = operation.path;
    var value = operation.value;
    var type = path[0];
    var record;
    var key;
    var linkDef;
    var linkValue;
    var inverseLinkOp;
    var relId;
    var ops = [];
    var schema = this._schema;
    var operationType = this._operationEncoder.identify(operation);

    function pushOps(newOps){
      for(var i = 0; i < newOps.length; i++){
        ops.push(newOps[i]);
      }
    }

    function relatedAddLinkOps(linkValue, linkDef){
      linkDef = linkDef || schema.linkDefinition(type, path[3]);
      return _this._relatedAddLinkOps(linkDef, linkValue, path[1], operation);
    }

    function relatedRemoveLinkOps(linkValue, linkDef){
      linkDef = linkDef || schema.linkDefinition(type, path[3]);
      return _this._relatedRemoveLinkOps(linkDef, linkValue, path[1], operation, condemnedPaths);
    }

    function addRelatedLinksOpsForRecord(record){
      if (!record.__rel) return;

      Object.keys(record.__rel).forEach(function(link) {
        linkDef = schema.linkDefinition(type, link);

        if (linkDef.inverse) {
          var linkValue = linkDef.type === 'hasMany' ? Object.keys(record.__rel[link]) : record.__rel[link];
          pushOps(relatedAddLinkOps(linkValue, linkDef));
        }
      });
    }

    function removeRelatedLinksOpsForRecord(record){
      if (!record.__rel) return [];

      Object.keys(record.__rel).forEach(function(link) {
        linkDef = schema.linkDefinition(type, link);

        if (linkDef.inverse) {
          var linkValue = linkDef.type === 'hasMany' ? Object.keys(record.__rel[link]) : record.__rel[link];
          pushOps(relatedRemoveLinkOps(Object.keys(record.__rel[link]), linkDef));
        }
      });
    }

    if (operationType === 'addToHasMany') return relatedAddLinkOps(path[4]);
    if (operationType === 'addHasOne') return relatedAddLinkOps(value);
    if (operationType === 'addHasMany') return relatedAddLinkOps(Object.keys(operation.value));
    if (operationType === 'removeHasOne') return relatedRemoveLinkOps(this._retrieve(path));
    if (operationType === 'removeHasMany') return relatedRemoveLinkOps(Object.keys(this._retrieve(path)));
    if (operationType === 'removeFromHasMany') return relatedRemoveLinkOps(path[4]);

    // if (operationType === 'replaceHasOne') throw new Error('not implemented');
    // if (operationType === 'replaceRecord') throw new Error('not implemented');
    // if (operationType === 'replaceHasMany') throw new Error('not implemented');

    if (operationType === 'addRecord') {
      addRelatedLinksOpsForRecord(operation.value);

    } else if (operationType === 'removeRecord') {
      removeRelatedLinksOpsForRecord(this._retrieve(path));

    }

    return ops;
  },

  _relatedAddLinkOps: function(linkDef, linkValue, value, operation){
    if(isNone(linkValue)) return [];
    var relIds = isArray(linkValue) ? linkValue : [linkValue];
    var linkOps = [];
    var linkOp;

    if (linkDef.inverse) {
      for(var i = 0; i < relIds.length; i++){
        linkOp = this._relatedAddLinkOp(linkDef.model, relIds[i], linkDef.inverse, value, operation);
        linkOps.push(linkOp);
      }
    }

    return linkOps;
  },

  _relatedAddLinkOp: function(type, id, link, value, parentOperation) {
    // console.log('_relatedAddLinkOp', type, id, link, value);

    if (this._retrieve([type, id])) {
      var op = this._operationEncoder.addLinkOp(type, id, link, value);

      // Apply operation only if necessary
      if (this._retrieve(op.path) !== op.value) {
        return parentOperation.spawn(op);
      }
    }
  },

  _relatedRemoveLinkOps: function(linkDef, linkValue, value, operation, condemnedPaths){
    if(isNone(linkValue)) return [];
    var relIds = isArray(linkValue) ? linkValue : [linkValue];
    var linkOps = [];
    var linkOp;

    if (linkDef.inverse) {
      for(var i = 0; i < relIds.length; i++){
        linkOp = this._relatedRemoveLinkOp(linkDef.model, relIds[i], linkDef.inverse, value, operation, condemnedPaths);
        linkOps.push(linkOp);
      }
    }

    return linkOps;
  },

  _relatedRemoveLinkOp: function(type, id, key, value, parentOperation, condemnedPaths) {
    // console.log('_relatedRemoveLinkOp', type, id, key, value);

    var op = this._operationEncoder.removeLinkOp(type, id, key, value);
    var path = op.path.join("/");
    var isCondemnedPath = condemnedPaths.indexOf(path) > -1;

    // Apply operation only if necessary
    if (this._retrieve(op.path) && !isCondemnedPath) {
      return parentOperation.spawn(op);
    }
  },

  _retrieve: function(path){
    return this._cache.retrieve(path);
  }
});
