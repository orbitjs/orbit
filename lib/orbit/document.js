import { clone } from 'orbit/lib/objects';
import { diffs } from 'orbit/lib/diffs';
import { eq } from 'orbit/lib/eq';
import { PathNotFoundException } from 'orbit/lib/exceptions';

var Document = function() {
  this.init.apply(this, arguments);
};

Document.prototype = {
  constructor: Document,

  init: function(data, options) {
    options = options || {};
    this.arrayBasedPaths = options.arrayBasedPaths !== undefined ? options.arrayBasedPaths : false;
    this.reset(data);
  },

  reset: function(data) {
    this._data = data || {};
  },

  retrieve: function(path) {
    return this._retrieve(this.deserializePath(path));
  },

  add: function(path, value, invert) {
    return this._add(this.deserializePath(path), value, invert);
  },

  remove: function(path, invert) {
    return this._remove(this.deserializePath(path), invert);
  },

  replace: function(path, value, invert) {
    return this._replace(this.deserializePath(path), value, invert);
  },

  move: function(fromPath, toPath, invert) {
    return this._move(this.deserializePath(fromPath), this.deserializePath(toPath), invert);
  },

  copy: function(fromPath, toPath, invert) {
    return this._copy(this.deserializePath(fromPath), this.deserializePath(toPath), invert);
  },

  test: function(path, value) {
    return eq(this._retrieve(this.deserializePath(path)), value);
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

  serializePath: function(path) {
    if (this.arrayBasedPaths) {
      return path;

    } else {
      if (path.length === 0) {
        return '/';
      } else {
        return '/' + path.join('/');
      }
    }
  },

  deserializePath: function(path) {
    if (typeof path === 'string') {
      if (path.indexOf('/') === 0) {
        path = path.substr(1);
      }

      if (path.length === 0) {
        return [];
      } else {
        return path.split('/');
      }

    } else {
      return path;
    }
  },

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _pathNotFound: function(path) {
    throw new PathNotFoundException(this.serializePath(path));
  },

  _retrieve: function(path) {
    var ptr = this._data,
        segment;
    if (path) {
      for (var i = 0, len = path.length; i < len; i++) {
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
    value = clone(value);
    if (path.length > 0) {
      var parentKey = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, -1));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (parentKey === '-') {
            if (invert) {
              inverse = [{op: 'remove', path: this.serializePath(path)}];
            }
            grandparent.push(value);
          } else {
            var parentIndex = parseInt(parentKey, 10);
            if (parentIndex > grandparent.length) {
              this._pathNotFound(path);
            } else {
              if (invert) {
                inverse = [{op: 'remove', path: this.serializePath(path)}];
              }
              grandparent.splice(parentIndex, 0, value);
            }
          }
        } else {
          if (invert) {
            if (grandparent.hasOwnProperty(parentKey)) {
              inverse = [{op: 'replace', path: this.serializePath(path), value: clone(grandparent[parentKey])}];
            } else {
              inverse = [{op: 'remove', path: this.serializePath(path)}];
            }
          }
          grandparent[parentKey] = value;
        }
      } else {
        if (invert) {
          if (this._data.hasOwnProperty(parentKey)) {
            inverse = [{op: 'replace', path: this.serializePath(path), value: clone(this._data[parentKey])}];
          } else {
            inverse = [{op: 'remove', path: this.serializePath(path)}];
          }
        }
        this._data[parentKey] = value;
      }
    } else {
      if (invert) {
        inverse = [{op: 'replace', path: this.serializePath([]), value: clone(this._data)}];
      }
      this._data = value;
    }
    return inverse;
  },

  _remove: function(path, invert) {
    var inverse;
    if (path.length > 0) {
      var parentKey = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, -1));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parentKey === '-') {
              if (invert) {
                inverse = [{op: 'add', path: this.serializePath(path), value: clone(grandparent.pop())}];
              } else {
                grandparent.pop();
              }
            } else {
              var parentIndex = parseInt(parentKey, 10);
              if (grandparent[parentIndex] === undefined) {
                this._pathNotFound(path);
              } else {
                if (invert) {
                  inverse = [{op: 'add', path: this.serializePath(path), value: clone(grandparent.splice(parentIndex, 1)[0])}];
                } else {
                  grandparent.splice(parentIndex, 1);
                }
              }
            }
          } else {
            this._pathNotFound(path);
          }

        } else if (grandparent[parentKey] === undefined) {
          this._pathNotFound(path);

        } else {
          if (invert) {
            inverse = [{op: 'add', path: this.serializePath(path), value: clone(grandparent[parentKey])}];
          }
          delete grandparent[parentKey];
        }
      } else if (this._data[parentKey] === undefined) {
        this._pathNotFound(path);

      } else {
        if (invert) {
          inverse = [{op: 'add', path: this.serializePath(path), value: clone(this._data[parentKey])}];
        }
        delete this._data[parentKey];
      }
    } else {
      if (invert) {
        inverse = [{op: 'add', path: this.serializePath(path), value: clone(this._data)}];
      }
      this._data = {};
    }
    return inverse;
  },

  _replace: function(path, value, invert) {
    var inverse;
    value = clone(value);
    if (path.length > 0) {
      var parentKey = path[path.length-1];
      if (path.length > 1) {
        var grandparent = this._retrieve(path.slice(0, -1));
        if (Object.prototype.toString.call(grandparent) === '[object Array]') {
          if (grandparent.length > 0) {
            if (parentKey === '-') {
              if (invert) {
                inverse = [{op: 'replace', path: this.serializePath(path), value: clone(grandparent[grandparent.length-1])}];
              }
              grandparent[grandparent.length-1] = value;
            } else {
              var parentIndex = parseInt(parentKey, 10);
              if (grandparent[parentIndex] === undefined) {
                this._pathNotFound(path);
              } else {
                if (invert) {
                  inverse = [{op: 'replace', path: this.serializePath(path), value: clone(grandparent.splice(parentIndex, 1, value)[0])}];
                } else {
                  grandparent.splice(parentIndex, 1, value);
                }
              }
            }
          } else {
            this._pathNotFound(path);
          }

        } else if (grandparent[parentKey] === undefined) {
          this._pathNotFound(path);

        } else {
          if (invert) {
            inverse = [{op: 'replace', path: this.serializePath(path), value: clone(grandparent[parentKey])}];
          }
          grandparent[parentKey] = value;
        }
      } else if (this._data[parentKey] === undefined) {
        this._pathNotFound(path);

      } else {
        if (invert) {
          inverse = [{op: 'replace', path: this.serializePath(path), value: clone(this._data[parentKey])}];
        }
        this._data[parentKey] = value;
      }
    } else {
      if (invert) {
        inverse = [{op: 'replace', path: this.serializePath([]), value: clone(this._data)}];
      }
      this._data = value;
    }
    return inverse;
  },

  _move: function(fromPath, toPath, invert) {
    if (eq(fromPath, toPath)) {
      if (invert) return [];
      return;

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
      if (invert) return [];
      return;

    } else {
      return this._add(toPath, this._retrieve(fromPath), invert);
    }
  }
};

export default Document;