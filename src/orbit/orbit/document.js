import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';

var Document = function(data) {
  this.reset(data);
};

Document.prototype = {
  constructor: Document,

  reset: function(data) {
    this._data = data || {};
  },

  retrieve: function(path) {
    path = this._normalizePath(path);
    var ptr = this._data;
    if (path) {
      for (var i = 0; i < path.length; i++) {
        ptr = ptr[path[i]];
        if (ptr === undefined) {
          throw new Document.PathNotFoundException(path.join('/'));
        }
      }
    }
    return ptr;
  },

  _add: function(path, value) {
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this.retrieve(path[path.length-2]);
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (parent === '-') {
            grandparent.push(value);
          } else {
            var parentIndex = parseInt(parent);
            if (parentIndex >= grandparent.length) {
              throw new Document.PathNotFoundException(path.join('/'));
            } else {
              grandparent.splice(parentIndex, 0, value);
            }
          }
        } else {
          grandparent[parent] = value;
        }
      } else {
        this._data[parent] = value;
      }
    } else {
      this._data = value;
    }
  },

  _remove: function(path) {
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this.retrieve(path[path.length-2]);
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parent === '-') {
              grandparent.pop();
            } else {
              var parentIndex = parseInt(parent);
              if (grandparent[parentIndex] === undefined) {
                throw new Document.PathNotFoundException(path.join('/'));
              } else {
                grandparent.splice(parentIndex, 1);
              }
            }
          } else {
            throw new Document.PathNotFoundException(path.join('/'));
          }

        } else if (grandparent[parent] === undefined) {
          throw new Document.PathNotFoundException(path.join('/'));

        } else {
          delete grandparent[parent];
        }
      } else if (this._data[parent] === undefined) {
        throw new Document.PathNotFoundException(path.join('/'));

      } else {
        delete this._data[parent];
      }
    } else {
      this._data = {};
    }
  },

  _replace: function(path, value) {
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this.retrieve(path[path.length-2]);
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parent === '-') {
              grandparent[grandparent.length-1] = value;
            } else {
              var parentIndex = parseInt(parent);
              if (grandparent[parentIndex] === undefined) {
                throw new Document.PathNotFoundException(path.join('/'));
              } else {
                grandparent.splice(parentIndex, 1, value);
              }
            }
          } else {
            throw new Document.PathNotFoundException(path.join('/'));
          }

        } else if (grandparent[parent] === undefined) {
          throw new Document.PathNotFoundException(path.join('/'));

        } else {
          grandparent[parent] = value;
        }
      } else if (this._data[parent] === undefined) {
        throw new Document.PathNotFoundException(path.join('/'));

      } else {
        this._data[parent] = value;
      }
    } else {
      this._data = value;
    }
  },

  transform: function(diff) {
    var path = this._normalizePath(diff.path);

    if (diff.op === 'add') {
      this._add(path, diff.value);

    } else if (diff.op === 'remove') {
      this._remove(path);

    } else if (diff.op === 'replace') {
      this._replace(path, diff.value);
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _normalizePath: function(path) {
    if (typeof path === 'string') {
      if (path.indexOf('/') === 0) path = path.substr(1);
      if (path.length === 0) {
        return undefined;
      } else {
        return path.split('/');
      }
    }
    return path;
  }
};

Document.PathNotFoundException = function(path) {
  this.path = path;
};
Document.PathNotFoundException.prototype = {
  constructor: 'PathNotFoundException'
};

export default Document;