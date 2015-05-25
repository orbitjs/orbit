import { Class, isObject } from 'orbit/lib/objects';
import { OperationNotAllowed } from 'orbit-common/lib/exceptions';

export default Class.extend({
  init: function(schema){
    this._schema = schema;
  },

  identify: function(operation){
    var op = operation.op;
    var path = operation.path;
    var value = operation.value;

    if(['add', 'replace', 'remove'].indexOf(op) === -1) throw new OperationNotAllowed("Op must be add, replace or remove (was " + op + ")", operation);

    if(path.length === 2) return op + "Record";
    if(path.length === 3) return op + "Attribute";

    if(path[2] === '__rel'){
      var linkType = this._schema.linkDefinition(path[0], path[3]).type;

      if(linkType === 'hasMany'){
        if(path.length === 4){
          if(isObject(value) && ['add', 'replace'].indexOf(op) !== -1) return op + 'HasMany';
          if(op === 'remove') return 'removeHasMany';
        }
        else if(path.length === 5){
          if(op === 'add') return 'addToHasMany';
          if(op === 'remove') return 'removeFromHasMany';
        }
      }
      else if (linkType === 'hasOne'){
        if(op === 'replace') return 'replaceHasOne';
      }
      else {
        throw new OperationNotAllowed("Only hasMany and hasOne links area supported (was " + linkType + ")", operation);
      }
    }

    throw new OperationNotAllowed("Invalid operation", operation);
  }
});
