import Document from 'orbit/document';
import Evented from 'orbit/evented';
import Operation from 'orbit/operation';
import { Class, clone, expose, isArray, isObject, isNone } from 'orbit/lib/objects';
import { OperationNotAllowed } from './lib/exceptions';
import { eq } from 'orbit/lib/eq';
import { diffs } from 'orbit/lib/diffs';
import { deprecate } from 'orbit/lib/deprecate';

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
 @param {Boolean} [options.trackChanges=true] Should the `didTransform` event be triggered after calls to `transform`?
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

    this.trackChanges = options.trackChanges !== undefined ? options.trackChanges : true;
    this.maintainRevLinks = options.maintainRevLinks !== undefined ? options.maintainRevLinks : true;
    this.maintainInverseLinks = options.maintainInverseLinks !== undefined ? options.maintainRevLinks : true;
    this.maintainDependencies = options.maintainDependencies !== undefined ? options.maintainDependencies : true;

    this._doc = new Document(null, {arrayBasedPaths: true});

    if (this.maintainRevLinks) {
      this._rev = {};
    }

    this._pathsToRemove = [];

    Evented.extend(this);

    this.schema = schema;
    for (var model in schema.models) {
      if (schema.models.hasOwnProperty(model)) {
        this._registerModel(model);
      }
    }

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

   Returns `null` if the path does not exist in the document.

   @method retrieve
   @param path
   @returns {Object}
   */
  retrieve: function(path) {
    try {
      // console.log('Cache#retrieve', path, this._doc.retrieve(path));
      return this._doc.retrieve(path);
    } catch(e) {
      return undefined;
    }
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
    try {
      this._doc.retrieve(path);
      return true;
    } catch(e) {
      return false;
    }
  },

  /**
   Transforms the document with an RFC 6902-compliant operation.

   Currently limited to `add`, `remove` and `replace` operations.

   Throws `PathNotFoundException` if the path does not exist in the document.

   @method transform
   @param {Object} operation
   @param {String} operation.op Must be "add", "remove", or "replace"
   @param {Array or String} operation.path Path to target location
   @param {Object} operation.value Value to set. Required for "add" and "replace"
   @returns {Boolean} true if operation is applied or false
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

    if (op === 'add') {
      if (!this.exists(path.slice(0, path.length - 1))) {
        return false;
      }

    } else if (op === 'replace') {
      if (currentValue !== undefined && !operation.minimized) {
        var ops = diffs(currentValue, value, { basePath: path });
        if (ops.length === 0) {
          return false;

        } else {
          ops.forEach(function(o) {
            o.minimized = true;
            this.transform(o);
          }, this);

          return true;
        }

      } else if (!this.exists(path.slice(0, path.length - 1))) {
        return false;
      }

    } else if (op === 'remove') {
      if (this._isMarkedForRemoval(path)) {
        // console.log('remove op not required because marked for removal', path);
        return false;
      }
    }

    if (eq(currentValue, value)) return false;

    if (this.maintainDependencies) {
      pushOps(this._dependentOps(normalizedOperation));
    }

    if (op === 'remove' || op === 'replace') {
      this._markForRemoval(path);

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

    if (this.trackChanges) {
      inverse = this._doc.transform(normalizedOperation, true);
      this.emit('didTransform',
                normalizedOperation,
                inverse);

    } else {
      this._doc.transform(normalizedOperation, false);
    }

    performDependentOps();

    if (op === 'remove' || op === 'replace') {
      this._unmarkForRemoval(path);
    }

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

    return true;
  },

  _markForRemoval: function(path) {
    path = path.join('/');
    // console.log('_markForRemoval', path);
    this._pathsToRemove.push(path);
  },

  _unmarkForRemoval: function(path) {
    path = path.join('/');
    var i = this._pathsToRemove.indexOf(path);
    // console.log('_unmarkForRemoval', path, i);
    if (i > -1) this._pathsToRemove.splice(i, 1);
  },

  _isMarkedForRemoval: function(path) {
    path = path.join('/');
    // console.log('_isMarkedForRemoval', path);
    return (this._pathsToRemove.indexOf(path) > -1);
  },

  _isOperationRequired: function(operation) {
    if (operation.op === 'remove') {
      if (this._isMarkedForRemoval(operation.path)) {
        // console.log('remove op not required because marked for removal', operation.path);
        return false;
      }
    }

    var currentValue = this.retrieve(operation.path);
    var desiredValue = operation.value;

    // console.log('op required', !eq(currentValue, desiredValue), operation);

    return !eq(currentValue, desiredValue);
  },

  _dependentOps: function(operation) {
    var operations = [];
    if (operation.op === 'remove' && operation.path.length === 2) {
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

  _addRevLinks: function(path, value) {
    // console.log('_addRevLinks', path, value);

    if (value) {
      var _this = this,
          type = path[0],
          id = path[1],
          linkSchema,
          linkValue;

      if (path.length === 2) {
        // when a whole record is added, add inverse links for every link
        if (value.__rel) {
          Object.keys(value.__rel).forEach(function(link) {
            linkSchema = _this.schema.models[type].links[link];
            linkValue = value.__rel[link];

            if (linkSchema.type === 'hasMany') {
              Object.keys(linkValue).forEach(function(v) {
                _this._addRevLink(linkSchema, type, id, link, v);
              });

            } else {
              _this._addRevLink(linkSchema, type, id, link, linkValue);
            }
          });
        }

      } else if (path.length > 3) {
        var link = path[3];

        linkSchema = _this.schema.models[type].links[link];

        if (path.length === 5) {
          linkValue = path[4];
        } else {
          linkValue = value;
        }

        this._addRevLink(linkSchema, type, id, link, linkValue);
      }
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
      var _this = this,
          type = path[0],
          id = path[1],
          linkSchema,
          linkValue;

      if (path.length === 2) {
        // when a whole record is removed, remove any links that reference it
        if (this.maintainRevLinks) {
          var revLink = this._revLink(type, id);
          var operation;

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
            linkSchema = _this.schema.models[type].links[link];
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

      } else if (path.length > 3) {
        var link = path[3];

        linkSchema = _this.schema.models[type].links[link];

        if (path.length === 5) {
          linkValue = path[4];
        } else {
          linkValue = value;
        }

        this._removeRevLink(linkSchema, type, id, link, linkValue);
      }
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

    if (op === 'add') {
      if (path.length > 3 && path[2] === '__rel') {

        key = path[3];
        linkDef = this.schema.models[type].links[key];

        if (linkDef.inverse) {
          if (path.length > 4) {
            relId = path[4];
          } else {
            relId = value;
          }

          if (isObject(relId)) {
            Object.keys(relId).forEach(function(id) {
              ops.push(_this._relatedAddLinkOp(
                linkDef.model,
                id,
                linkDef.inverse,
                path[1],
                operation
              ));
            });

          } else {
            ops.push(_this._relatedAddLinkOp(
              linkDef.model,
              relId,
              linkDef.inverse,
              path[1],
              operation
            ));
          }
        }

      } else if (path.length === 2) {

        record = operation.value;
        if (record.__rel) {
          Object.keys(record.__rel).forEach(function(key) {
            linkDef = _this.schema.models[type].links[key];

            if (linkDef.inverse) {
              if (linkDef.type === 'hasMany') {
                Object.keys(record.__rel[key]).forEach(function(id) {
                  ops.push(_this._relatedAddLinkOp(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  ));
                });

              } else {
                var id = record.__rel[key];

                if (!isNone(id)) {
                  ops.push(_this._relatedAddLinkOp(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  ));
                }
              }
            }
          });
        }
      }

    } else if (op === 'remove') {

      if (path.length > 3 && path[2] === '__rel') {

        key = path[3];
        linkDef = this.schema.models[type].links[key];

        if (linkDef.inverse) {
          if (path.length > 4) {
            relId = path[4];
          } else {
            relId = this.retrieve(path);
          }

          if (relId) {
            if (isObject(relId)) {
              Object.keys(relId).forEach(function(id) {
                ops.push(_this._relatedRemoveLinkOp(
                  linkDef.model,
                  id,
                  linkDef.inverse,
                  path[1],
                  operation
                ));
              });

            } else {
              ops.push(_this._relatedRemoveLinkOp(
                linkDef.model,
                relId,
                linkDef.inverse,
                path[1],
                operation
              ));
            }
          }
        }

      } else if (path.length === 2) {

        record = this.retrieve(path);
        if (record.__rel) {
          Object.keys(record.__rel).forEach(function(key) {
            linkDef = _this.schema.models[type].links[key];

            if (linkDef.inverse) {
              if (linkDef.type === 'hasMany') {
                Object.keys(record.__rel[key]).forEach(function(id) {
                  ops.push(_this._relatedRemoveLinkOp(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  ));
                });

              } else {
                var id = record.__rel[key];

                if (!isNone(id)) {
                  ops.push(_this._relatedRemoveLinkOp(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  ));
                }
              }
            }
          });
        }
      }
    }
    return ops;
  },

  _relatedAddLinkOp: function(type, id, key, value, parentOperation) {
    // console.log('_relatedAddLinkOp', type, id, key, value);

    if (this.retrieve([type, id])) {
      var op = this._addLinkOp(type, id, key, value);

      // Apply operation only if necessary
      if (this.retrieve(op.path) !== op.value) {
        return parentOperation.spawn(op);
      }
    }
  },

  _relatedRemoveLinkOp: function(type, id, key, value, parentOperation) {
    // console.log('_relatedRemoveLinkOp', type, id, key, value);

    var op = this._removeLinkOp(type, id, key, value);

    // Apply operation only if necessary
    if (this.retrieve(op.path) && !this._isMarkedForRemoval(op.path)) {
      return parentOperation.spawn(op);
    }
  },

  _addLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];
    var op;

    if (linkDef.type === 'hasMany') {
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

  _removeLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];
    var op;

    if (linkDef.type === 'hasMany') {
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
  },

  _updateLinkOp: function(type, id, key, value) {
    var linkDef = this.schema.models[type].links[key];
    var path = [type, id, '__rel', key];

    if (linkDef.type === 'hasMany' &&
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
  }
});

export default Cache;
