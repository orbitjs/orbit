import Orbit from 'orbit/core';
import Document from 'orbit/document';
import Transformable from 'orbit/transformable';
import Requestable from 'orbit/requestable';

var MemoryStore = function(schema) {
  Orbit.assert('MemoryStore requires Orbit.Promise to be defined', Orbit.Promise);

  this.idField = Orbit.idField;

  this._doc = new Document();

  this.configure(schema);

  Transformable.extend(this);
  Requestable.extend(this, ['find', 'add', 'update', 'patch', 'remove']);
};

MemoryStore.prototype = {
  constructor: MemoryStore,

  configure: function(schema) {
    this.schema = schema;
    schema.models.forEach(function(model) {
      this._doc.add([model], {});
    }, this);
  },

  push: function(data) {
    var ops = [],
        type,
        dataForType,
        id,
        dataForItem,
        i;

    for (type in data) {
      if (data.hasOwnProperty(type)) {
        dataForType = data[type];
        for (i = 0; i < dataForType.length; i++) {
          dataForItem = dataForType[i];
          if (dataForItem[this.idField] === undefined) {
            id = this._generateId();
            dataForItem[this.idField] = id;
          }
          Orbit.incrementVersion(dataForItem);
          ops.push({op: 'add', path: [type, id], value: dataForItem});
        }
      }
    }

    var doc = this._doc;
    return this.transform(ops).then(function() {
      var records = [];
      for (i = 0; i < ops.length; i++) {
        records.push(doc.retrieve(ops[i].path));
      }
      return records;
    });
  },

  all: function(type) {
    return this._doc.retrieve([type]);
  },

  length: function(type) {
    return Object.keys(this.all(type)).length;
  },

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform: function(operation) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (Object.prototype.toString.call(operation) === '[object Array]') {
        var inverse = [];
        for (var i = 0; i < operation.length; i++) {
          try {
            inverse.push(_this._doc.transform(operation[i], true));
          } catch(e) {
            inverse.reverse();
            for (var j = 0; j < inverse.length; j++) {
              _this._doc.transform(inverse[j]);
            }
            reject(e);
            return;
          }
        }
      } else {
        _this._doc.transform(operation);
      }
      resolve();
    });
  },

  /////////////////////////////////////////////////////////////////////////////
  // Requestable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _find: function(type, id) {
    var _this = this;

    return new Orbit.Promise(function(resolve, reject) {
      if (id === undefined || typeof id === 'object') {
        resolve(_this._filter.call(_this, type, id));
      } else {
        var record = _this._doc.retrieve([type, id]);
        if (record && !record.deleted) {
          resolve(record);
        } else {
          reject(new Orbit.NotFoundException(type, id));
        }
      }
    });
  },

  _add: function(type, data) {
    var id = this._generateId(),
        path = [type, id],
        _this = this;

    data[this.idField] = id;
    Orbit.incrementVersion(data);

    return this.transform({op: 'add', path: path, value: data}).then(function() {
      return _this._doc.retrieve(path);
    });
  },

  _update: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        _this = this;

    Orbit.incrementVersion(data);

    return this.transform({op: 'replace', path: path, value: data}).then(function() {
      return _this._doc.retrieve(path);
    });
  },

  _patch: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        ops = [],
        _this = this;

    for (var i in data) {
      if (data.hasOwnProperty(i) && i !== this.idField) {
        ops.push({op: 'replace', path: path.concat([i]), value: data[i]});
      }
    }

    return this.transform(ops).then(function() {
      return _this._doc.retrieve(path);
    }, function(e) {
      debugger;
    });
  },

  _remove: function(type, data) {
    var id = data[this.idField],
        path = [type, id],
        _this = this;

    return this.transform({op: 'remove', path: type + '/' + data[this.idField]});
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _filter: function(type, query) {
    var all = [],
        dataForType,
        i,
        prop,
        match,
        record;

    dataForType = this._doc.retrieve([type]);

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
        if (match && !record.deleted) {
          all.push(record);
        }
      }
    }
    return all;
  },

  _generateId: function() {
    return Orbit.generateId();
  }
};

export default MemoryStore;