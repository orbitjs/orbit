import { Class, isObject, isArray } from 'orbit/lib/objects';
import { OperationNotAllowed } from 'orbit-common/lib/exceptions';
import Operation from 'orbit/operation';

export default Class.extend({
  init: function(schema) {
    this._schema = schema;
  },

  identify: function(operation) {
    var op = operation.op;
    var path = operation.path;
    var value = operation.value;

    if (['add', 'replace', 'remove'].indexOf(op) === -1) throw new OperationNotAllowed("Op must be add, replace or remove (was " + op + ")", operation);

    if (path.length < 2) throw new OperationNotAllowed("Path must have at least 2 segments");
    if (path.length === 2) return op + "Record";
    if (path.length === 3) return op + "Attribute";

    if (path[2] === '__rel') {
      var linkType = this._schema.linkDefinition(path[0], path[3]).type;

      if (linkType === 'hasMany') {
        if (path.length === 4) {
          if (isObject(value) && ['add', 'replace'].indexOf(op) !== -1) return op + 'HasMany';
          if (op === 'remove') return 'removeHasMany';
        }
        else if (path.length === 5) {
          if (op === 'add') return 'addToHasMany';
          if (op === 'remove') return 'removeFromHasMany';
        }
      }
      else if (linkType === 'hasOne') {
        return op + 'HasOne';
      }
      else {
        throw new OperationNotAllowed("Only hasMany and hasOne links area supported (was " + linkType + ")", operation);
      }
    }

    throw new OperationNotAllowed("Invalid operation " + operation.op + ":" + operation.path.join("/") + ":" + operation.value);
  },

  addRecordOp: function(type, id, record) {
    return new Operation({op: 'add', path: [type, id], value: record});
  },

  replaceRecordOp: function(type, id, record) {
    return new Operation({op: 'replace', path: [type, id], value: record});
  },

  removeRecordOp: function(type, id) {
    return new Operation({op: 'remove', path: [type, id]});
  },

  replaceAttributeOp: function(type, id, attribute, value) {
    var path = [type, id, attribute];
    return new Operation({op: 'replace', path: path, value: value});
  },

  linkOp: function(op, type, id, key, value) {
    return this[op + 'LinkOp'](type, id, key, value);
  },

  addLinkOp: function(type, id, key, value) {
    var linkType = this._schema.linkDefinition(type, key).type;
    var path = [type, id, '__rel', key];
    var op;

    if (linkType === 'hasMany') {
      path.push(value);
      value = true;
      op = 'add';
    } else {
      op = 'replace';
    }

    return new Operation({
      op: op,
      path: path,
      value: value
    });
  },

  replaceLinkOp: function(type, id, key, value) {
    var linkType = this._schema.linkDefinition(type, key).type;
    var path = [type, id, '__rel', key];

    if (linkType === 'hasMany' &&
        isArray(value)) {
      var obj = {};
      for (var i = 0, l = value.length; i < l; i++) {
        obj[value[i]] = true;
      }
      value = obj;
    }

    return new Operation({
      op: 'replace',
      path: path,
      value: value
    });
  },

  removeLinkOp: function(type, id, key, value) {
    var linkType = this._schema.linkDefinition(type, key).type;
    var path = [type, id, '__rel', key];
    var op;

    if (linkType === 'hasMany') {
      path.push(value);
      op = 'remove';
    } else {
      op = 'replace';
      value = null;
    }

    return new Operation({
      op: op,
      path: path,
      value: value
    });
  }
});
