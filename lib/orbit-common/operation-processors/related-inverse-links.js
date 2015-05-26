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
    condemnedPaths = condemnedPaths || [];
    var path = operation.path;
    var value = operation.value;
    var type = path[0];
    var ops = [];
    var schema = this._schema;
    var operationType = this._operationEncoder.identify(operation);

    function pushOps(newOps){
      for(var i = 0; i < newOps.length; i++){
        ops.push(newOps[i]);
      }
    }

    function relatedLinkOps(linkValue, linkDef){
      linkDef = linkDef || schema.linkDefinition(type, path[3]);
      var op = operation.op;
      var ignoredPaths = op === 'remove' ? condemnedPaths : [];
      return _this._relatedLinkOps(linkDef, linkValue, path[1], operation, ignoredPaths);
    }

    function addRelatedLinksOpsForRecord(record){
      if (!record.__rel) return;
      var linkDef;

      Object.keys(record.__rel).forEach(function(link) {
        linkDef = schema.linkDefinition(type, link);

        if (linkDef.inverse) {
          var linkValue = linkDef.type === 'hasMany' ? Object.keys(record.__rel[link]) : record.__rel[link];
          pushOps(relatedLinkOps(linkValue, linkDef));
        }
      });
    }

    function removeRelatedLinksOpsForRecord(record){
      if (!record.__rel) return [];
      var linkDef;

      Object.keys(record.__rel).forEach(function(link) {
        linkDef = schema.linkDefinition(type, link);

        if (linkDef.inverse) {
          var linkValue = linkDef.type === 'hasMany' ? Object.keys(record.__rel[link]) : record.__rel[link];
          pushOps(relatedLinkOps(Object.keys(record.__rel[link]), linkDef));
        }
      });
    }

    if (operationType === 'addToHasMany') return relatedLinkOps(path[4]);
    if (operationType === 'addHasOne') return relatedLinkOps(value);
    if (operationType === 'addHasMany') return relatedLinkOps(Object.keys(operation.value));
    if (operationType === 'removeHasOne') return relatedLinkOps(this._retrieve(path));
    if (operationType === 'removeHasMany') return relatedLinkOps(Object.keys(this._retrieve(path)));
    if (operationType === 'removeFromHasMany') return relatedLinkOps(path[4]);

    // if (operationType === 'replaceHasOne') throw new Error('not implemented');
    // if (operationType === 'replaceRecord') throw new Error('not implemented');
    // if (operationType === 'replaceHasMany') throw new Error('not implemented');

    if (operationType === 'addRecord') {
      addRelatedLinksOpsForRecord(value);

    } else if (operationType === 'removeRecord') {
      removeRelatedLinksOpsForRecord(this._retrieve(path));

    }

    return ops;
  },

  _relatedLinkOps: function(linkDef, linkValue, value, parentOperation, ignoredPaths){
    if(isNone(linkValue)) return [];
    var relIds = isArray(linkValue) ? linkValue : [linkValue];
    var linkOps = [];
    var linkOp;

    if (linkDef.inverse) {
      for(var i = 0; i < relIds.length; i++){
        linkOp = this._relatedLinkOp(linkDef.model, relIds[i], linkDef.inverse, value, parentOperation, ignoredPaths);
        linkOps.push(linkOp);
      }
    }

    return linkOps;
  },

  _relatedLinkOp: function(type, id, link, value, parentOperation, ignoredPaths){
    if (this._retrieve([type, id])) {
      var op = parentOperation.op;
      var operation = this._operationEncoder.linkOp(op, type, id, link, value);
      var path = operation.path.join("/");
      var isIgnoredPath = ignoredPaths.indexOf(path) > -1;

      // Apply operation only if necessary
      if (this._retrieve(operation.path) !== operation.value && !isIgnoredPath) {
        return parentOperation.spawn(operation);
      }
    }
  },

  _retrieve: function(path){
    return this._cache.retrieve(path);
  }
});
