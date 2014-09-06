import Orbit from 'orbit/main';
import { assert } from 'orbit/lib/assert';
import { isArray, isNone } from 'orbit/lib/objects';
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
    this._transformRelatedInverseLinks(operation);
    this._cache.transform(operation);
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
          resId =  id[i];

          res =  _this.retrieve([type, resId]);

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
              relId = Object.keys(relId);
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
    var path = operation.path;
    var type = path[0];
    var record;
    var key;
    var linkDef;
    var linkValue;
    var inverseLinkOp;

    if (operation.op === 'add') {
      if (path.length > 3 && path[2] === '__rel') {

        key = path[3];
        linkDef = this.schema.models[type].links[key];

        if (linkDef.inverse) {
          _this._transformAddLink(
            linkDef.model,
            linkDef.type === 'hasMany' ? path[4] : operation.value,
            linkDef.inverse,
            path[1]
          );
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
                    path[1]
                  );
                });

              } else {
                var id = record.__rel[key];

                if (!isNone(id)) {
                  _this._transformAddLink(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1]
                  );
                }
              }
            }
          });
        }
      }

    } else if (operation.op === 'remove') {

      if (path.length > 3 && path[2] === '__rel') {

        key = path[3];
        linkDef = this.schema.models[type].links[key];

        if (linkDef.inverse) {
          var relId;
          if (linkDef.type === 'hasMany') {
            relId = path[4];
          } else {
            relId = this.retrieve(path);
          }

          if (relId) {
            _this._transformRemoveLink(
              linkDef.model,
              relId,
              linkDef.inverse,
              path[1]
            );
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
                    path[1]
                  );
                });

              } else {
                var id = record.__rel[key];

                if (!isNone(id)) {
                  _this._transformRemoveLink(
                    linkDef.model,
                    id,
                    linkDef.inverse,
                    path[1]
                  );
                }
              }
            }
          });
        }
      }
    }
  },

  _transformAddLink: function(type, id, key, value) {
    if (this._cache.retrieve([type, id])) {
      this._cache.transform(this._addLinkOp(type, id, key, value));
    }
  },

  _transformRemoveLink: function(type, id, key, value) {
    var op = this._removeLinkOp(type, id, key, value);
    if (this._cache.retrieve(op.path)) {
      this._cache.transform(op);
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
