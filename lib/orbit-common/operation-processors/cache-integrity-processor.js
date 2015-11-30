import { Class, isArray, isObject, isNone } from 'orbit/lib/objects';
import Operation from 'orbit/operation';
import OperationProcessor from './operation-processor';
import { toIdentifier, parseIdentifier } from './../lib/identifiers';
import { operationType } from './../lib/operations';

/**
 An operation processor that ensures that a cache's data is consistent and
 doesn't contain any dead references.

 This is achieved by maintaining a mapping of reverse relationships for each record.
 When a record is removed, any references to it can also be identified and
 removed.

 @class CacheIntegrityProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Cache} [cache] Cache that is monitored.
 @constructor
 */
export default OperationProcessor.extend({
  init: function(cache) {
    this._super.apply(this, arguments);
    this._rev = {};
  },

  _rev: null,

  reset: function(data) {
    this._rev = {};

    if (data) {
      Object.keys(data).forEach(function(type) {
        var typeData = data[type];
        Object.keys(typeData).forEach(function(id) {
          this._recordAdded(type, id, typeData[id]);
        }, this);
      }, this);
    }
  },

  before: function(operation) {
    var path = operation.path;

    switch (operationType(operation)) {
      case 'addRecord':
        return this._beforeRecordAdded(path[0], path[1]);

      default:
        return [];
    }
  },

  after: function(operation) {
    var path = operation.path;
    var type = path[0];
    var id = path[1];

    switch (operationType(operation)) {
      case 'replaceHasOne':
      case 'replaceHasMany':
        return this._relationshipRemoved(type, id, path[3]);

      case 'removeFromHasMany':
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
      case 'replaceHasOne':
      case 'replaceHasMany':
        return this._relationshipAdded(type, id, path[3], value);

      case 'addToHasMany':
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
      var relIds = this._idsFromValue(value);
      var relId;

      for (var i = 0; i < relIds.length; i++) {
        relId = relIds[i];
        this._addRevLink(type, id, relationship, relId);
      }
    }

    return ops;
  },

  _relationshipRemoved: function(type, id, relationship, value) {
    var ops = [];
    var relationshipDef = this.cache.schema.relationshipDefinition(type, relationship);

    if (relationshipDef.inverse) {
      if (value === undefined) {
        value = this.cache.get([type, id, 'relationships', relationship, 'data']);
      }

      if (value) {
        var relIds = this._idsFromValue(value);
        var relId;

        for (var i = 0; i < relIds.length; i++) {
          relId = relIds[i];
          this._removeRevLink(type, id, relationship, relId);
        }
      }
    }

    return ops;
  },

  _beforeRecordAdded: function(type, id, record) {
    var ops = [];

    var modelRootPath = [type];
    if (!this.cache.get(modelRootPath)) {
      ops.push(new Operation({
        op: 'add',
        path: modelRootPath,
        value: {}
      }));
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
          var relIds = this._idsFromValue(relationshipValue);
          var relId;

          for (var i = 0; i < relIds.length; i++) {
            relId = relIds[i];
            this._addRevLink(type, id, relationship, relId);
          }
        }
      }, this);
    }

    return ops;
  },

  _recordRemoved: function(type, id) {
    var ops = [];
    var revLink = this._revLink(type, id);

    if (revLink) {
      Object.keys(revLink).forEach(function(path) {
        path = path.split('/');

        if (path.length === 4) {
          ops.push(new Operation({
            op: 'replace',
            path: path,
            value: undefined
          }));
        } else {
          const isHasMany = path.length === 6;

          if (isHasMany) {
            ops.push(new Operation({
              op: 'remove',
              path: path
            }));
          } else {
            ops.push(new Operation({
              op: 'replace',
              path: path,
              value: null
            }));
          }
        }
      }, this);

      delete this._rev[type][id];
    }

    // when a whole record is removed, remove references corresponding to each relationship
    var relationships = this.cache.get([type, id, 'relationships']);
    if (relationships) {
      var relationshipValue;

      Object.keys(relationships).forEach(function(relationship) {
        relationshipValue = relationships[relationship] && relationships[relationship].data;
        if (relationshipValue) {
          var relIds = this._idsFromValue(relationshipValue);
          var relId;

          for (var i = 0; i < relIds.length; i++) {
            relId = relIds[i];
            this._removeRevLink(type, id, relationship, relId);
          }
        }
      }, this);
    }

    return ops;
  },

  _idsFromValue: function(value) {
    if (isArray(value)) {
      return value;
    } else if (isObject(value)) {
      return Object.keys(value);
    } else {
      return [value];
    }
  },

  _revLink: function(type, id) {
    var revForType = this._rev[type];
    if (revForType === undefined) {
      revForType = this._rev[type] = {};
    }
    var rev = revForType[id];
    if (rev === undefined) {
      rev = revForType[id] = {};
    }
    return rev;
  },

  _addRevLink: function(type, id, relationship, value) {
    // console.log('_addRevLink', type, id, relationship, value);

    if (value) {
      var relatedIdentifier = parseIdentifier(value);
      var relationshipDef = this.cache.schema.relationshipDefinition(type, relationship);
      var relationshipPath = [type, id, 'relationships', relationship, 'data'];

      if (relationshipDef.type === 'hasMany') {
        relationshipPath.push(value);
      }
      relationshipPath = relationshipPath.join('/');

      var revLink = this._revLink(relatedIdentifier.type, relatedIdentifier.id);
      revLink[relationshipPath] = true;
    }
  },

  _removeRevLink: function(type, id, relationship, value) {
    // console.log('_removeRevLink', type, id, relationship, value);

    if (value) {
      var relatedIdentifier = parseIdentifier(value);
      var relationshipDef = this.cache.schema.relationshipDefinition(type, relationship);
      var relationshipPath = [type, id, 'relationships', relationship, 'data'];

      if (relationshipDef.type === 'hasMany') {
        relationshipPath.push(value);
      }
      relationshipPath = relationshipPath.join('/');

      var revLink = this._revLink(relatedIdentifier.type, relatedIdentifier.id);
      delete revLink[relationshipPath];
    }
  }
});
