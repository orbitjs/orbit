import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { isArray, isObject, isNone } from 'orbit/lib/objects';
import Source from './source';
import { RecordNotFoundException, LinkNotFoundException } from './lib/exceptions';

/**
 Source for storing in-memory data

 @class MemorySource
 @namespace OC
 @extends OC.Source
 @param schema
 @param options
 @constructor
 */
var MemorySource = Source.extend({
  init: function(schema, options) {
    assert('MemorySource requires Orbit.Promise to be defined', Orbit.Promise);
    this._super.apply(this, arguments);
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    // Delete inverse links related to this operation
    if (operation.op === 'remove') {
      this._transformRelatedInverseLinks(operation);

    } else if (operation.op === 'replace') {
      this._transformRelatedInverseLinks(operation.spawn({
        op: 'remove',
        path: operation.path
      }));

      this._transformRelatedInverseLinks(operation);
    }

    // Transform the cache
    // Note: the cache's didTransform event will trigger this source's
    // didTransform event.
    this._cache.transform(operation);

    // Add inverse links related to this operation
    if (operation.op === 'replace') {
      this._transformRelatedInverseLinks(operation.spawn({
        op: 'add',
        path: operation.path,
        value: operation.value
      }));

    } else if (operation.op === 'add') {
      this._transformRelatedInverseLinks(operation);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    var _this = this,
        modelSchema = this.schema.models[type],
        pk = modelSchema.primaryKey.name,
        result;
    return new Orbit.Promise(function(resolve, reject) {
      if (isNone(id)) {
        result = _this._filter.call(_this, type);

      } else if (isArray(id)) {
        var res,
            resId,
            notFound;

        result = [];
        notFound = [];

        for (var i = 0, l = id.length; i < l; i++) {
          resId = id[i];

          res = _this.retrieve([type, resId]);

          if (res) {
            result.push(res);
          } else {
            notFound.push(resId);
          }
        }

        if (notFound.length > 0) {
          result = null;
          id = notFound;
        }

      } else if (id !== null && typeof id === 'object') {
        if (id[pk]) {
          result = _this.retrieve([type, id[pk]]);

        } else {
          result = _this._filter.call(_this, type, id);
        }

      } else {
        result = _this.retrieve([type, id]);
      }

      if (result) {
        resolve(result);
      } else {
        reject(new RecordNotFoundException(type, id));
      }
    });
  },

  _findLink: function(type, id, link) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      id = _this.getId(type, id);

      var record = _this.retrieve([type, id]);

      if (record) {
        var relId;

        if (record.__rel) {
          relId = record.__rel[link];

          if (relId) {
            var linkDef = _this.schema.models[type].links[link];
            if (linkDef.type === 'hasMany') {
              if(!linkDef.actsAsOrderedSet){
                relId = Object.keys(relId);
              }
            }
          }
        }

        if (relId) {
          resolve(relId);

        } else {
          reject(new LinkNotFoundException(type, id, link));
        }

      } else {
        reject(new RecordNotFoundException(type, id));
      }
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _transformRelatedInverseLinks: function(operation) {
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

    if (op === 'add') {
      if (path.length > 3 && path[2] === '__rel') {

        key = path[3];
        linkDef = this.schema.models[type].links[key];

        if (linkDef.inverse) {
          if (linkDef.actsAsOrderedSet){
            relId = operation.value;
          } else if (path.length > 4) {
            relId = path[4];
          } else {
            relId = value;
          }

          if (isArray(relId)){
            relId.forEach(function(id) {
              _this._transformAddLink(
                linkDef.model,
                id,
                linkDef.inverse,
                path[1],
                operation
              );
            });            
          }
          else if (isObject(relId)) {
            Object.keys(relId).forEach(function(id) {
              _this._transformAddLink(
                linkDef.model,
                id,
                linkDef.inverse,
                path[1],
                operation
              );
            });

          } else {
            _this._transformAddLink(
              linkDef.model,
              relId,
              linkDef.inverse,
              path[1],
              operation
            );
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
                  _this._transformAddLink(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  );
                });

              } else {
                var id = record.__rel[key];

                if (!isNone(id)) {
                  _this._transformAddLink(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  );
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
          if (linkDef.type === 'hasMany' && !linkDef.actsAsOrderedSet && !linkDef.actsAsSet) {
            relId = path[4];
          } else {
            relId = this.retrieve(path);
          }

          if (relId || relId === 0) {
            if (isObject(relId)) {
              Object.keys(relId).forEach(function(id) {
                _this._transformRemoveLink(
                  linkDef.model,
                  id,
                  linkDef.inverse,
                  path[1],
                  operation
                );
              });
            }
            else {
              _this._transformRemoveLink(
                linkDef.model,
                relId,
                linkDef.inverse,
                path[1],
                operation
              );
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
                  _this._transformRemoveLink(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  );
                });

              } else {
                var id = record.__rel[key];

                if (!isNone(id)) {
                  _this._transformRemoveLink(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1],
                    operation
                  );
                }
              }
            }
          });
        }
      }
    }
  },

  _transformAddLink: function(type, id, key, value, parentOperation) {
    if (this._cache.retrieve([type, id])) {
      var op = this._addLinkOp(type, id, key, value);

      // Apply operation only if necessary
      if (!this._cache.retrieve(op.path)) {
        this._cache.transform(parentOperation.spawn(op));
      }
    }
  },

  _transformRemoveLink: function(type, id, key, value, parentOperation) {
    var op = this._removeLinkOp(type, id, key, value);

    // Apply operation only if necessary
    if (this._cache.retrieve(op.path)) {
      this._cache.transform(parentOperation.spawn(op));
    }
  },

  _transformUpdateLink: function(type, id, key, value, parentOperation) {
    if (this._cache.retrieve([type, id])) {
      var op = this._updateLinkOp(type, id, key, value);

      // Apply operation only if necessary
      if (!this._cache.retrieve(op.path)) {
        this._cache.transform(parentOperation.spawn(op));
      }
    }
  },

  _filter: function(type, query) {
    var all = [],
        dataForType,
        i,
        prop,
        match,
        record;

    dataForType = this.retrieve([type]);

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        if (query === undefined) {
          match = true;
        } else {
          match = false;
          for (prop in query) {
            if (record[prop] === query[prop]) {
              match = true;
            } else {
              match = false;
              break;
            }
          }
        }
        if (match) all.push(record);
      }
    }
    return all;
  },

  _filterOne: function(type, prop, value) {
    var dataForType,
        i,
        record;

    dataForType = this.retrieve([type]);

    for (i in dataForType) {
      if (dataForType.hasOwnProperty(i)) {
        record = dataForType[i];
        if (record[prop] === value) {
          return record;
        }
      }
    }
  }
});

export default MemorySource;
