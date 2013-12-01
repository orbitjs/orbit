import clone from 'orbit/lib/clone';
import diffs from 'orbit/lib/diffs';
import eq from 'orbit/lib/eq';

var Document = function(data) {
  this.reset(data);
};

Document.prototype = {
  constructor: Document,

  reset: function(data) {
    this._data = data || {};
  },

  retrieve: function(path) {
    return this._retrieve(this._normalizePath(path));
  },

  add: function(path, value, invert) {
    return this._add(this._normalizePath(path), value, invert);
  },

  remove: function(path, invert) {
    return this._remove(this._normalizePath(path), invert);
  },

  replace: function(path, value, invert) {
    return this._replace(this._normalizePath(path), value, invert);
  },

  move: function(fromPath, toPath, invert) {
    return this._move(this._normalizePath(fromPath), this._normalizePath(toPath), invert);
  },

  copy: function(fromPath, toPath, invert) {
    return this._copy(this._normalizePath(fromPath), this._normalizePath(toPath), invert);
  },

  test: function(path, value) {
    return eq(this._retrieve(this._normalizePath(path)), value);
  },

  transform: function(operation, invert) {
    if (operation.op === 'add') {
      return this.add(operation.path, operation.value, invert);

    } else if (operation.op === 'remove') {
      return this.remove(operation.path, invert);

    } else if (operation.op === 'replace') {
      return this.replace(operation.path, operation.value, invert);

    } else if (operation.op === 'move') {
      return this.move(operation.from, operation.path, invert);

    } else if (operation.op === 'copy') {
      return this.copy(operation.from, operation.path, invert);

    } else if (operation.op === 'test') {
      return this.copy(operation.path, operation.value);
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
  },

  _serializePath: function(path) {
    if (path === undefined) {
      return '/';

    } else if (Object.prototype.toString.call(path) === '[object Array]') {
      return '/' + path.join('/');

    } else {
      return path;
    }
  },

  _pathNotFound: function(path) {
    throw new Document.PathNotFoundException(this._serializePath(path));
  },

  _operation: function(op, path, value) {
    return {op: op, path: this._serializePath(path), value: clone(value)};
  },

  _retrieve: function(path) {
    var ptr = this._data,
        segment;
    if (path) {
      for (var i = 0; i < path.length; i++) {
        segment = path[i];
        if (Object.prototype.toString.call(ptr) === '[object Array]') {
          if (segment === '-') {
            ptr = ptr[ptr.length-1];
          } else {
            ptr = ptr[parseInt(segment, 10)];
          }
        } else {
          ptr = ptr[segment];
        }
        if (ptr === undefined) {
          this._pathNotFound(path);
        }
      }
    }
    return ptr;
  },

  _add: function(path, value, invert) {
    var inverse;
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, -1));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (parent === '-') {
            if (invert) {
              inverse = [{op: 'remove', path: this._serializePath(path)}];
            }
            grandparent.push(value);
          } else {
            var parentIndex = parseInt(parent, 10);
            if (parentIndex > grandparent.length) {
              this._pathNotFound(path);
            } else {
              if (invert) {
                inverse = [{op: 'remove', path: this._serializePath(path)}];
              }
              grandparent.splice(parentIndex, 0, value);
            }
          }
        } else {
          if (invert) {
            if (grandparent.hasOwnProperty(parent)) {
              inverse = [{op: 'replace', path: this._serializePath(path), value: clone(grandparent[parent])}];
            } else {
              inverse = [{op: 'remove', path: this._serializePath(path.slice(0, -1))}];
            }
          }
          grandparent[parent] = value;
        }
      } else {
        if (invert) {
          if (this._data.hasOwnProperty(parent)) {
            inverse = [{op: 'replace', path: this._serializePath(path), value: clone(this._data[parent])}];
          } else {
            inverse = [{op: 'remove', path: this._serializePath(path)}];
          }
        }
        this._data[parent] = value;
      }
    } else {
      if (invert) {
        inverse = [{op: 'replace', path: this._serializePath(), value: clone(this._data)}];
      }
      this._data = value;
    }
    return inverse;
  },

  _remove: function(path, invert) {
    var inverse;
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, -1));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parent === '-') {
              if (invert) {
                inverse = [{op: 'add', path: this._serializePath(path), value: clone(grandparent.pop())}];
              } else {
                grandparent.pop();
              }
            } else {
              var parentIndex = parseInt(parent, 10);
              if (grandparent[parentIndex] === undefined) {
                this._pathNotFound(path);
              } else {
                if (invert) {
                  inverse = [{op: 'add', path: this._serializePath(path), value: clone(grandparent.splice(parentIndex, 1)[0])}];
                } else {
                  grandparent.splice(parentIndex, 1);
                }
              }
            }
          } else {
            this._pathNotFound(path);
          }

        } else if (grandparent[parent] === undefined) {
          this._pathNotFound(path);

        } else {
          if (invert) {
            inverse = [{op: 'add', path: this._serializePath(path), value: clone(grandparent[parent])}];
          }
          delete grandparent[parent];
        }
      } else if (this._data[parent] === undefined) {
        this._pathNotFound(path);

      } else {
        if (invert) {
          inverse = [{op: 'add', path: this._serializePath(path), value: clone(this._data[parent])}];
        }
        delete this._data[parent];
      }
    } else {
      if (invert) {
        inverse = [{op: 'add', path: this._serializePath(path), value: clone(this._data)}];
      }
      this._data = {};
    }
    return inverse;
  },

  _replace: function(path, value, invert) {
    var inverse;
    if (path) {
      var parent = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, -1));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parent === '-') {
              if (invert) {
                inverse = [{op: 'replace', path: this._serializePath(path), value: clone(grandparent[grandparent.length-1])}];
              }
              grandparent[grandparent.length-1] = value;
            } else {
              var parentIndex = parseInt(parent, 10);
              if (grandparent[parentIndex] === undefined) {
                this._pathNotFound(path);
              } else {
                if (invert) {
                  inverse = [{op: 'replace', path: this._serializePath(path), value: clone(grandparent.splice(parentIndex, 1, value)[0])}];
                } else {
                  grandparent.splice(parentIndex, 1, value);
                }
              }
            }
          } else {
            this._pathNotFound(path);
          }

        } else if (grandparent[parent] === undefined) {
          this._pathNotFound(path);

        } else {
          if (invert) {
            inverse = [{op: 'replace', path: this._serializePath(path), value: clone(grandparent[parent])}];
          }
          grandparent[parent] = value;
        }
      } else if (this._data[parent] === undefined) {
        this._pathNotFound(path);

      } else {
        if (invert) {
          inverse = [{op: 'replace', path: this._serializePath(path), value: clone(this._data[parent])}];
        }
        this._data[parent] = value;
      }
    } else {
      if (invert) {
        inverse = [{op: 'replace', path: this._serializePath(), value: clone(this._data)}];
      }
      this._data = value;
    }
    return inverse;
  },

  _move: function(fromPath, toPath, invert) {
    if (eq(fromPath, toPath)) {
      return invert ? [] : undefined;

    } else {
      var value = this._retrieve(fromPath);
      if (invert) {
        return this._remove(fromPath, true)
            .concat(this._add(toPath, value, true))
            .reverse();

      } else {
        this._remove(fromPath);
        this._add(toPath, value);
      }
    }
  },

  _copy: function(fromPath, toPath, invert) {
    if (eq(fromPath, toPath)) {
      return invert ? [] : undefined;

    } else {
      return this._add(toPath, this._retrieve(fromPath), invert);
    }
  }
};

var PathNotFoundException = function(path) {
  this.path = path;
};
PathNotFoundException.prototype = {
  constructor: PathNotFoundException
};
Document.PathNotFoundException = PathNotFoundException;

export default Document;