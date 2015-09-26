import { isArray, isObject, isNone } from 'orbit/lib/objects';
import Operation from 'orbit/operation';
import OperationProcessor from './operation-processor';
import { toIdentifier, parseIdentifier } from './../lib/identifiers';
import {
  operationType,
  addToRelationshipOperation,
  removeFromRelationshipOperation,
  replaceRelationshipOperation
} from './../lib/operations';

/**
 An operation processor that ensures that a cache's data is consistent with
 its associated schema.

 This includes maintenance of inverse and dependent relationships.

 @class SchemaConsistencyProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Cache} [cache] Cache that is monitored.
 @constructor
 */
export default OperationProcessor.extend({
  after: function(operation) {
    var path = operation.path;
    var type = path[0];
    var id = path[1];

    switch (operationType(operation)) {
      case 'replaceRelationship':
        return this._relationshipRemoved(type, id, path[3]);

      case 'removeFromRelationship':
        return this._relationshipRemoved(type, id, path[3], path[5]);

      case 'removeRecord':
        return this._recordRemoved(type, id);

      default:
        return [];
    }
  },

  finally: function(operation) {
    var path = operation.path;
    var type = path[0];
    var id = path[1];
    var value = operation.value;

    switch (operationType(operation)) {
      case 'replaceRelationship':
        return this._relationshipAdded(type, id, path[3], value);

      case 'addToRelationship':
        return this._relationshipAdded(type, id, path[3], path[5]);

      case 'addRecord':
        return this._recordAdded(type, id, value);

      default:
        return [];
    }
  },

  _relationshipAdded: function(type, id, relationship, value) {
    var ops = [];
    var relationshipDef = this.cache.schema.relationshipDefinition(type, relationship);

    if (relationshipDef.inverse && !isNone(value)) {
      var inverseRelationshipDef;
      var relIds = this._idsFromValue(value);
      var relId;
      var relObject;
      var op;

      for (var i = 0; i < relIds.length; i++) {
        relId = relIds[i];
        relObject = parseIdentifier(relId);
        inverseRelationshipDef = this.cache.schema.relationshipDefinition(relObject.type, relationshipDef.inverse);

        if (inverseRelationshipDef.type === 'hasMany') {
          op = addToRelationshipOperation(relObject, relationshipDef.inverse, {type: type, id: id});

        } else {
          op = replaceRelationshipOperation(relObject, relationshipDef.inverse, {type: type, id: id});
        }

        ops.push(op);
      }
    }
    return ops;
  },

  _relationshipRemoved: function(type, id, relationship, value) {
    var ops = [];
    var relationshipDef = this.cache.schema.relationshipDefinition(type, relationship);

    if (relationshipDef.inverse) {
      if (value === undefined) {
        value = this.cache.retrieve([type, id, 'relationships', relationship, 'data']);
      }

      if (value) {
        var inverseRelationshipDef;
        var relIds = this._idsFromValue(value);
        var relId;
        var relObject;
        var op;

        for (var i = 0; i < relIds.length; i++) {
          relId = relIds[i];
          relObject = parseIdentifier(relId);
          inverseRelationshipDef = this.cache.schema.relationshipDefinition(relObject.type, relationshipDef.inverse);

          if (inverseRelationshipDef.type === 'hasMany') {
            op = removeFromRelationshipOperation(relObject, relationshipDef.inverse, {type: type, id: id});

          } else {
            op = replaceRelationshipOperation(relObject, relationshipDef.inverse, null);
          }

          ops.push(op);
        }
      }
    }

    return ops;
  },

  _recordAdded: function(type, id, record) {
    var ops = [];
    var relationships = record.relationships;

    if (relationships) {
      var relationshipValue;

      Object.keys(relationships).forEach(function(relationship) {
        relationshipValue = relationships[relationship] && relationships[relationship].data;
        if (relationshipValue) {
          ops = ops.concat(this._relationshipAdded(type, id, relationship, relationshipValue));
        }
      }, this);
    }

    return ops;
  },

  _recordRemoved: function(type, id) {
    var ops = [];
    var relationships = this.cache.retrieve([type, id, 'relationships']);

    if (relationships) {
      var relationshipDef;
      var relationshipValue;

      Object.keys(relationships).forEach(function(relationship) {
        relationshipValue = relationships[relationship] && relationships[relationship].data;
        if (relationshipValue) {
          relationshipDef = this.cache.schema.relationshipDefinition(type, relationship);

          if (relationshipDef.dependent === 'remove') {
            // TODO - needs test!
            ops = ops.concat(this._removeDependentRecords(relationshipValue));
          } else {
            ops = ops.concat(this._relationshipRemoved(type, id, relationship, relationshipValue));
          }
        }
      }, this);
    }

    return ops;
  },

  _removeDependentRecords: function(idOrIds) {
    var ops = [];
    var ids = this._idsFromValue(idOrIds);
    var identifier;
    var dependentPath;

    for (var i = 0; i < ids.length; i++) {
      identifier = parseIdentifier(ids[i]);
      dependentPath = [identifier.type, identifier.id];
      if (this.cache.retrieve(dependentPath)) {
        ops.push({
          op: 'remove',
          path: dependentPath
        });
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
  }

});
