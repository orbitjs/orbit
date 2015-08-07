import { Class, isArray, isObject, isNone } from 'orbit/lib/objects';
import Operation from 'orbit/operation';
import OperationProcessor from './operation-processor';

/**
 An operation processor that ensures that a cache's data is consistent and
 doesn't contain any dead references.

 This is achieved by maintaining a mapping of reverse links for each record.
 When a record is removed, any references to it can also be identified and
 removed.

 @class CacheIntegrityProcessor
 @namespace OC
 @extends OperationProcessor
 @param {OC.Schema} [schema] Schema used to define the data structure and relationships.
 @param {Function}  [retrieve] Function used to retrieve data at a specific `path`.
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
    var type = path[0];
    var id = path[1];
    var operationType = this.cache.schema.operationEncoder.identify(operation);

    switch (operationType) {
      case 'addRecord':
        return this._beforeRecordAdded(type, id);

      default:
        return [];
    }
  },

  after: function(operation) {
    var path = operation.path;
    var type = path[0];
    var id = path[1];
    var operationType = this.cache.schema.operationEncoder.identify(operation);

    switch (operationType) {
      case 'replaceHasOne':
      case 'replaceHasMany':
      case 'removeHasOne':
      case 'removeHasMany':
        return this._linkRemoved(type, id, path[3]);

      case 'removeFromHasMany':
        return this._linkRemoved(type, id, path[3], path[4]);

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
    var operationType = this.cache.schema.operationEncoder.identify(operation);

    switch (operationType) {
      case 'replaceHasOne':
      case 'replaceHasMany':
      case 'addHasOne':
      case 'addHasMany':
        return this._linkAdded(type, id, path[3], value);

      case 'addToHasMany':
        return this._linkAdded(type, id, path[3], path[4]);

      case 'addRecord':
        return this._recordAdded(type, id, value);

      default:
        return [];
    }
  },

  _linkAdded: function(type, id, link, value) {
    var ops = [];
    var linkDef = this.cache.schema.linkDefinition(type, link);

    if (linkDef.inverse && !isNone(value)) {
      var relIds = this._idsFromValue(value);
      var relId;

      for (var i = 0; i < relIds.length; i++) {
        relId = relIds[i];
        this._addRevLink(type, id, link, relId);
      }
    }

    return ops;
  },

  _linkRemoved: function(type, id, link, value) {
    var ops = [];
    var linkDef = this.cache.schema.linkDefinition(type, link);

    if (linkDef.inverse) {
      if (value === undefined) {
        value = this.cache.retrieve([type, id, '__rel', link]);
      }

      if (!isNone(value)) {
        var relIds = this._idsFromValue(value);
        var relId;

        for (var i = 0; i < relIds.length; i++) {
          relId = relIds[i];
          this._removeRevLink(type, id, link, relId);
        }
      }
    }

    return ops;
  },

  _beforeRecordAdded: function(type, id, record) {
    var ops = [];

    var modelRootPath = [type];
    if (!this.cache.retrieve(modelRootPath)) {
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
    var links = record.__rel;

    if (links) {
      var linkValue;

      Object.keys(links).forEach(function(link) {
        linkValue = links[link];
        if (linkValue) {
          var relIds = this._idsFromValue(linkValue);
          var relId;

          for (var i = 0; i < relIds.length; i++) {
            relId = relIds[i];
            this._addRevLink(type, id, link, relId);
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
            value: null
          }));

        } else {
          ops.push(new Operation({
            op: 'remove',
            path: path
          }));
        }
      }, this);

      delete this._rev[type][id];
    }

    // when a whole record is removed, remove references corresponding to each link
    var links = this.cache.retrieve([type, id, '__rel']);
    if (links) {
      var linkValue;

      Object.keys(links).forEach(function(link) {
        linkValue = links[link];
        if (linkValue) {
          var relIds = this._idsFromValue(linkValue);
          var relId;

          for (var i = 0; i < relIds.length; i++) {
            relId = relIds[i];
            this._removeRevLink(type, id, link, relId);
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
      return [ value ];
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

  _addRevLink: function(type, id, link, value) {
    // console.log('_addRevLink', type, id, link, value);

    if (value) {
      var linkDef = this.cache.schema.linkDefinition(type, link);
      var linkPath = [type, id, '__rel', link];

      if (linkDef.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = linkPath.join('/');

      var revLink = this._revLink(linkDef.model, value);
      revLink[linkPath] = true;
    }
  },

  _removeRevLink: function(type, id, link, value) {
    // console.log('_removeRevLink', type, id, link, value);

    if (value) {
      var linkDef = this.cache.schema.linkDefinition(type, link);
      var linkPath = [type, id, '__rel', link];

      if (linkDef.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = linkPath.join('/');

      var revLink = this._revLink(linkDef.model, value);
      delete revLink[linkPath];
    }
  }
});
