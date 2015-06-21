import Document from 'orbit/document';
import Operation from 'orbit/operation';
import { Class, clone, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';
import { eq } from 'orbit/lib/eq';
import { deprecate } from 'orbit/lib/deprecate';
import RelatedInverseLinksProcessor from 'orbit-common/operation-processors/related-inverse-links';

/**
 `Cache` provides a thin wrapper over an internally maintained instance of a
 `Document`.

 `Cache` prepares records to be cached according to a specified schema. The
 schema also determines the paths at which records will be stored.

 Once cached, data can be accessed at a particular path with `retrieve`. The
 size of data at a path can be accessed with `length`.

 @class Cache
 @namespace OC
 @param {OC.Schema} schema
 @param {Object}  [options]
 @param {Boolean} [options.maintainRevLinks=true] Should reverse links be maintained for each record, indicating which other records reference them?
 @param {Boolean} [options.maintainInverseLinks=true] Should inverse links be maintained for relationships?
 @param {Boolean} [options.maintainDependencies=true] Should dependencies between related records (e.g. `dependent: 'remove'`) be maintained?
 @constructor
 */
var Cache = Class.extend({
  init: function(schema, options) {
    options = options || {};

    if (options.trackRevLinks !== undefined && options.maintainRevLinks === undefined) {
      deprecate('Please convert usage of the Cache option `trackRevLinks` to `maintainRevLinks`.');
      options.maintainRevLinks = options.trackRevLinks;
    }

    this.maintainRevLinks = options.maintainRevLinks !== undefined ? options.maintainRevLinks : true;
    this.maintainInverseLinks = options.maintainInverseLinks !== undefined ? options.maintainRevLinks : true;
    this.maintainDependencies = options.maintainDependencies !== undefined ? options.maintainDependencies : true;

    this._doc = new Document(null, {arrayBasedPaths: true});

    if (this.maintainRevLinks) {
      this._rev = {};
    }

    this.schema = schema;
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._registerModel(model);
      }
    }

    this._relatedInverseLinksProcessor = new RelatedInverseLinksProcessor(schema, this);

    // TODO - clean up listener
    this.schema.on('modelRegistered', this._registerModel, this);
  },

  _registerModel: function(model) {
    var modelRootPath = [model];
    if (!this.retrieve(modelRootPath)) {
      this._doc.add(modelRootPath, {});
    }
  },

  reset: function(data) {
    this._doc.reset(data);
    this.schema.registerAllKeys(data);
  },

  /**
   Return the size of data at a particular path

   @method length
   @param path
   @returns {Number}
   */
  length: function(path) {
    var data = this.retrieve(path);
    if (data === null || data === undefined) {
      return data;
    } else if (isArray(data)) {
      return data.length;
    } else {
      return Object.keys(data).length;
    }
  },

  /**
   Return data at a particular path.

   Returns `undefined` if the path does not exist in the document.

   @method retrieve
   @param path
   @returns {Object}
   */
  retrieve: function(path) {
    return this._doc.retrieve(path, true);
  },

  /**
   * Retrieves a link value.  Returns a null value for empty links.
   * For hasOne links will return a string id value of the link.
   * For hasMany links will return an array of id values.
   *
   * @param  {String} type Model Type.
   * @param  {String} id   Model ID.
   * @param  {String} link Link Key.
   * @return {Array|String|null}      The value of the link
   */
  retrieveLink: function(type, id, link) {
    var val = this.retrieve([type, id, '__rel', link]);
    if (val !== null && typeof val === 'object') {
      val = Object.keys(val);
    }
    return val;
  },


  /**
   Returns whether a path exists in the document.

   @method exists
   @param path
   @returns {Boolean}
   */
  exists: function(path) {
    return !!this._doc.retrieve(path, true);
  },

  /**
   Transforms the document with an RFC 6902-compliant operation.

   Currently limited to `add`, `remove` and `replace` operations.

   @method transform
   @param {Object} operation
   @param {String} operation.op Must be "add", "remove", or "replace"
   @param {Array or String} operation.path Path to target location
   @param {Object} operation.value Value to set. Required for "add" and "replace"
   @returns {Array or undefined} Array of inverse operations
   */
  transform: function(operation) {
    var normalizedOperation;
    if (operation instanceof Operation) {
      normalizedOperation = operation;
    } else {
      normalizedOperation = new Operation(operation);
    }

    var op = normalizedOperation.op;
    var path = normalizedOperation.path;
    var value = normalizedOperation.value;
    var currentValue = this.retrieve(path);
    var _this = this;
    var dependentOperations = [];
    var pushOps = function(ops) {
      if (ops) {
        if (ops.forEach) {
          ops.forEach(function(op) {
            if (op) dependentOperations.push(op);
          });
        } else {
          dependentOperations.push(op);
        }
      }
      return dependentOperations;
    };

    var performDependentOps = function() {
      dependentOperations.forEach(function(operation) {
        _this.transform(operation);
      });
      dependentOperations = [];
    };
    var inverse;

    // console.log('Cache#transform', op, path.join('/'), value);

    if (op !== 'add' && op !== 'remove' && op !== 'replace') {
      throw new OperationNotAllowed('Cache#transform requires an "add", "remove" or "replace" operation.');
    }

    if (path.length < 2) {
      throw new OperationNotAllowed('Cache#transform requires an operation with a path >= 2 segments.');
    }

    if (op === 'add' || op === 'replace') {
      if (!this.exists(path.slice(0, path.length - 1))) {
        return;
      }
    }

    if (eq(currentValue, value)) return;

    if (this.maintainDependencies) {
      pushOps(this._dependentOps(normalizedOperation));
    }

    if (op === 'remove' || op === 'replace') {
      if (this.maintainInverseLinks) {
        if (op === 'replace') {
          pushOps(this._relatedInverseLinkOps(normalizedOperation.spawn({
            op: 'remove',
            path: path
          })));
        }

        pushOps(this._relatedInverseLinkOps(normalizedOperation));
      }

      if (this.maintainRevLinks) {
        this._removeRevLinks(path, normalizedOperation);
      }
    }

    inverse = this._doc.transform(normalizedOperation, true);

    performDependentOps();

    if (op === 'add' || op === 'replace') {
      if (this.maintainRevLinks) {
        this._addRevLinks(path, value, normalizedOperation);
      }

      if (this.maintainInverseLinks) {
        if (op === 'replace') {
          pushOps(this._relatedInverseLinkOps(normalizedOperation.spawn({
            op: 'add',
            path: path,
            value: value
          })));

        } else {
          pushOps(this._relatedInverseLinkOps(normalizedOperation));
        }
      }
    }

    performDependentOps();

    return inverse;
  },

  _dependentOps: function(operation) {
    var operationType = this.schema.operationEncoder.identify(operation);
    var operations = [];
    if (operationType === 'removeRecord') {
      var _this = this,
        type = operation.path[0],
        id = operation.path[1],
        links = _this.schema.models[type].links;

      Object.keys(links).forEach(function(link) {
        var linkSchema = links[link];
        if (linkSchema.dependent !== 'remove') {
          return;
        }

        var linkValue = _this.retrieveLink(type, id, link);
        if (linkValue) {
          [].concat(linkValue).forEach(function(value) {
            var dependentPath = [linkSchema.model, value];
            if (_this.retrieve(dependentPath)) {
              operations.push(operation.spawn({
                op: 'remove',
                path: dependentPath
              }));
            }
          });
        }
      });

    }

    return operations;
  },

  _addRevLinks: function(path, value, operation) {
    // console.log('_addRevLinks', path, value);
    if (value) {
      var type = path[0],
          id = path[1],
          operationType = this.schema.operationEncoder.identify(operation);

      switch(operationType) {
        case 'addRecord': return this._addRecordRevLinks(type, value);
        case 'replaceRecord': return this._addRecordRevLinks(type, value);
        case 'addHasOne': return this._addLinkRevLink(type, id, path[3], value);
        case 'replaceHasOne': return this._addLinkRevLink(type, id, path[3], value);
        case 'addToHasMany': return this._addLinkRevLink(type, id, path[3], path[4]);
        case 'addHasMany': return this._addLinkRevLink(type, id, path[3], value);
        case 'replaceHasMany': return this._addLinkRevLink(type, id, path[3], value);
      }
    }
  },

  _addLinkRevLink: function(type, id, link, linkValue) {
    var linkSchema = this.schema.linkDefinition(type, link);
    this._addRevLink(linkSchema, type, id, link, linkValue);
  },

  _addRecordRevLinks: function(type, record) {
    var id = record.id;
    var linkValue;
    var linkSchema;
    var _this = this;

    if (record.__rel) {
      Object.keys(record.__rel).forEach(function(link) {
        linkSchema = _this.schema.linkDefinition(type, link);
        linkValue = record.__rel[link];

        if (linkSchema.type === 'hasMany') {
          Object.keys(linkValue).forEach(function(relId) {
            _this._addRevLink(linkSchema, type, id, link, relId);
          });

        } else {
          _this._addRevLink(linkSchema, type, id, link, linkValue);
        }
      });
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

  _addRevLink: function(linkSchema, type, id, link, value) {
    // console.log('_addRevLink', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, '__rel', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = linkPath.join('/');

      var revLink = this._revLink(linkSchema.model, value);
      revLink[linkPath] = true;
    }
  },

  _removeRevLinks: function(path, parentOperation) {
    // console.log('_removeRevLinks', path);
    var value = this.retrieve(path);
    if (value) {
      var type = path[0],
          id = path[1],
          operationType = this.schema.operationEncoder.identify(parentOperation);

      switch(operationType) {
        case 'removeRecord': return this._removeRecordRevLinks(type, id, value, parentOperation);
        case 'replaceRecord': return this._removeRecordRevLinks(type, id, value, parentOperation);
        case 'removeHasOne': return this._removeLinkRevLink(type, id, path[3], path[4]);
        case 'replaceHasOne': return this._removeLinkRevLink(type, id, path[3], path[4]);
        case 'removeHasMany': return this._removeLinkRevLink(type, id, path[3], value);
        case 'replaceHasMany': return this._removeLinkRevLink(type, id, path[3], value);
        case 'removeFromHasMany': return this._removeLinkRevLink(type, id, path[3], path[4]);
      }
    }
  },

  _removeLinkRevLink: function(type, id, link, linkValue) {
    var linkSchema = this.schema.linkDefinition(type, link);
    this._removeRevLink(linkSchema, type, id, link, linkValue);
  },

  _removeRecordRevLinks: function(type, id, value, parentOperation) {
    // when a whole record is removed, remove any links that reference it
    if (this.maintainRevLinks) {
      var _this = this;
      var revLink = this._revLink(type, id);
      var operation;
      var linkSchema;
      var linkValue;

      Object.keys(revLink).forEach(function(path) {
        path = _this._doc.deserializePath(path);

        if (path.length === 4) {
          operation = parentOperation.spawn({
            op: 'replace',
            path: path,
            value: null
          });
        } else {
          operation = parentOperation.spawn({
            op: 'remove',
            path: path
          });
        }

        _this.transform(operation);
      });

      delete this._rev[type][id];
    }

    // when a whole record is removed, remove references corresponding to each link
    if (value.__rel) {
      Object.keys(value.__rel).forEach(function(link) {
        linkSchema = _this.schema.linkDefinition(type, link);
        linkValue = value.__rel[link];

        if (linkSchema.type === 'hasMany') {
          Object.keys(linkValue).forEach(function(v) {
            _this._removeRevLink(linkSchema, type, id, link, v);
          });

        } else {
          _this._removeRevLink(linkSchema, type, id, link, linkValue);
        }
      });
    }
  },

  _removeRevLink: function(linkSchema, type, id, link, value) {
    // console.log('_removeRevLink', linkSchema, type, id, link, value);

    if (value && typeof value === 'string') {
      var linkPath = [type, id, '__rel', link];
      if (linkSchema.type === 'hasMany') {
        linkPath.push(value);
      }
      linkPath = linkPath.join('/');

      var revLink = this._revLink(linkSchema.model, id);
      delete revLink[linkPath];
    }
  },

  _relatedInverseLinkOps: function(operation) {
    return this._relatedInverseLinksProcessor.process(operation);
  }
});

export default Cache;
