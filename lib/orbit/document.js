import { clone, isArray } from './lib/objects';
import { diffs } from './lib/diffs';
import { eq } from './lib/eq';
import { PathNotFoundException } from './lib/exceptions';
import { splitPath } from './lib/paths';

/**
 `Document` is a complete implementation of the JSON PATCH spec detailed in
 [RFC 6902](http://tools.ietf.org/html/rfc6902).

 A document can be manipulated via a `patch` method that accepts an `operation`,
 or with the methods `add`, `remove`, `replace`, `move`, `copy` and `test`.

 Data at a particular path can be retrieved from a `Document` with `get()`.

 @class Document
 @namespace Orbit
 @param {Object}  [data] The initial data for the document
 @constructor
 */
export default class Document {
  constructor(data) {
    this.reset(data);
  }

  /**
   Reset the contents of the whole document.

   If no data is specified, the contents of the document will be reset to an
   empty object.

   @method reset
   @param {Object} [data] New root object
   */
  reset(data) {
    this._data = data || {};
  }

  /**
   Retrieve the value at a path.

   If the path does not exist in the document, returns `undefined`.

   @method get
   @param {Array or String} [path]
   @returns {Object} Value at the specified `path` or `undefined`
   */
  get(path) {
    return this._get(splitPath(path), true);
  }

  /**
   Sets the value at a path.

   If the target location specifies an array index, inserts a new value
   into the array at the specified index.

   If the target location specifies an object member that does not
   already exist, adds a new member to the object.

   If the target location specifies an object member that does exist,
   replaces that member's value.

   If the target location does not exist, throws `PathNotFoundException`.

   @method add
   @param {Array or String} path
   @param {Object} value
   @param {Boolean} [invert=false] Return the inverse operations?
   @returns {Array} Array of inverse operations if `invert === true`
   */
  add(path, value, invert) {
    return this._add(splitPath(path), value, invert);
  }

  /**
   Removes the value from a path.

   If removing an element from an array, shifts any elements above the
   specified index one position to the left.

   If the target location does not exist, throws `PathNotFoundException`.

   @method remove
   @param {Array or String} path
   @param {Boolean} [invert=false] Return the inverse operations?
   @returns {Array} Array of inverse operations if `invert === true`
   */
  remove(path, invert) {
    return this._remove(splitPath(path), invert);
  }

  /**
   Replaces the value at a path.

   This operation is functionally identical to a "remove" operation for
   a value, followed immediately by an "add" operation at the same
   location with the replacement value.

   If the target location does not exist, throws `PathNotFoundException`.

   @method replace
   @param {Array or String} path
   @param {Object} value
   @param {Boolean} [invert=false] Return the inverse operations?
   @returns {Array} Array of inverse operations if `invert === true`
   */
  replace(path, value, invert) {
    return this._replace(splitPath(path), value, invert);
  }

  /**
   Moves an object from one path to another.

   Identical to calling `remove()` followed by `add()`.

   Throws `PathNotFoundException` if either path does not exist in the document.

   @method move
   @param {Array or String} fromPath
   @param {Array or String} toPath
   @param {Boolean} [invert=false] Return the inverse operations?
   @returns {Array} Array of inverse operations if `invert === true`
   */
  move(fromPath, toPath, invert) {
    return this._move(splitPath(fromPath), splitPath(toPath), invert);
  }

  /**
   Copies an object at one path and adds it to another.

   Identical to calling `add()` with the value at `fromPath`.

   Throws `PathNotFoundException` if either path does not exist in the document.

   @method copy
   @param {Array or String} fromPath
   @param {Array or String} toPath
   @param {Boolean} [invert=false] Return the inverse operations?
   @returns {Array} Array of inverse operations if `invert === true`
   */
  copy(fromPath, toPath, invert) {
    return this._copy(splitPath(fromPath), splitPath(toPath), invert);
  }

  /**
   Tests that the value at a path matches an expectation.

   Uses `Orbit.eq` to test equality.

   Returns `true` if a path does not exist and `value === undefined`.

   @method test
   @param {Array or String} [path]
   @param {Object} [value] Expected value to test
   @returns {Boolean} Does the value at `path` equal `value`?
   */
  test(path, value) {
    return eq(this._get(splitPath(path), true), value);
  }

  /**
   Patches the document with an RFC 6902-compliant operation.

   Throws `PathNotFoundException` if the path does not exist in the document.

   @method patch
   @param {Object} operation
   @param {String} operation.op Must be "add", "remove", "replace", "move", "copy", or "test"
   @param {Array or String} operation.path Path to target location
   @param {Array or String} operation.from Path to source target location. Required for "copy" and "move"
   @param {Object} operation.value Value to set. Required for "add", "replace" and "test"
   @param {Boolean} [invert=false] Return the inverse operations?
   @returns {Array} Array of inverse operations if `invert === true`
   */
  patch(operation, invert) {
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
  }

  /////////////////////////////////////////////////////////////////////////////
  // Internals
  /////////////////////////////////////////////////////////////////////////////

  _pathNotFound(path, quiet) {
    if (quiet) {
      return undefined;
    } else {
      throw new PathNotFoundException(path);
    }
  }

  _get(path, quiet) {
    let ptr = this._data;
    let segment;

    if (path) {
      for (var i = 0, len = path.length; i < len; i++) {
        segment = path[i];
        if (isArray(ptr)) {
          if (segment === '-') {
            ptr = ptr[ptr.length - 1];
          } else {
            ptr = ptr[parseInt(segment, 10)];
          }
        } else {
          ptr = ptr[segment];
        }
        if (ptr === undefined) {
          return this._pathNotFound(path, quiet);
        }
      }
    }
    return ptr;
  }

  _add(path, value, invert) {
    var inverse;
    value = clone(value);
    if (path.length > 0) {
      var parentKey = path[path.length - 1];
      if (path.length > 1) {
        var grandparent = this._get(path.slice(0, -1));
        if (isArray(grandparent)) {
          if (parentKey === '-') {
            if (invert) {
              inverse = [{ op: 'remove', path: path }];
            }
            grandparent.push(value);
          } else {
            var parentIndex = parseInt(parentKey, 10);
            if (parentIndex > grandparent.length) {
              this._pathNotFound(path);
            } else {
              if (invert) {
                inverse = [{ op: 'remove', path: path }];
              }
              grandparent.splice(parentIndex, 0, value);
            }
          }
        } else {
          if (invert) {
            if (grandparent.hasOwnProperty(parentKey)) {
              inverse = [{ op: 'replace', path: path, value: clone(grandparent[parentKey]) }];
            } else {
              inverse = [{ op: 'remove', path: path }];
            }
          }
          grandparent[parentKey] = value;
        }
      } else {
        if (invert) {
          if (this._data.hasOwnProperty(parentKey)) {
            inverse = [{ op: 'replace', path: path, value: clone(this._data[parentKey]) }];
          } else {
            inverse = [{ op: 'remove', path: path }];
          }
        }
        this._data[parentKey] = value;
      }
    } else {
      if (invert) {
        inverse = [{ op: 'replace', path: [], value: clone(this._data) }];
      }
      this._data = value;
    }
    return inverse;
  }

  _remove(path, invert) {
    var inverse;
    if (path.length > 0) {
      var parentKey = path[path.length - 1];
      if (path.length > 1) {
        var grandparent = this._get(path.slice(0, -1));
        if (isArray(grandparent)) {
          if (grandparent.length > 0) {
            if (parentKey === '-') {
              if (invert) {
                inverse = [{ op: 'add', path: path, value: clone(grandparent.pop()) }];
              } else {
                grandparent.pop();
              }
            } else {
              var parentIndex = parseInt(parentKey, 10);
              if (grandparent[parentIndex] === undefined) {
                this._pathNotFound(path);
              } else {
                if (invert) {
                  inverse = [{ op: 'add', path: path, value: clone(grandparent.splice(parentIndex, 1)[0]) }];
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
            inverse = [{ op: 'add', path: path, value: clone(grandparent[parentKey]) }];
          }
          delete grandparent[parentKey];
        }
      } else if (this._data[parentKey] === undefined) {
        this._pathNotFound(path);
      } else {
        if (invert) {
          inverse = [{ op: 'add', path: path, value: clone(this._data[parentKey]) }];
        }
        delete this._data[parentKey];
      }
    } else {
      if (invert) {
        inverse = [{ op: 'add', path: path, value: clone(this._data) }];
      }
      this._data = {};
    }
    return inverse;
  }

  _replace(path, value, invert) {
    var inverse;
    value = clone(value);
    if (path.length > 0) {
      var parentKey = path[path.length - 1];
      if (path.length > 1) {
        var grandparent = this._get(path.slice(0, -1));
        if (isArray(grandparent)) {
          if (grandparent.length > 0) {
            if (parentKey === '-') {
              if (invert) {
                inverse = [{ op: 'replace', path: path, value: clone(grandparent[grandparent.length - 1]) }];
              }
              grandparent[grandparent.length - 1] = value;
            } else {
              var parentIndex = parseInt(parentKey, 10);
              if (grandparent[parentIndex] === undefined) {
                this._pathNotFound(path);
              } else {
                if (invert) {
                  inverse = [{ op: 'replace', path: path, value: clone(grandparent.splice(parentIndex, 1, value)[0]) }];
                } else {
                  grandparent.splice(parentIndex, 1, value);
                }
              }
            }
          } else {
            this._pathNotFound(path);
          }
        } else {
          if (invert) {
            inverse = [{ op: 'replace', path: path, value: clone(grandparent[parentKey]) }];
          }
          grandparent[parentKey] = value;
        }
      } else {
        if (invert) {
          inverse = [{ op: 'replace', path: path, value: clone(this._data[parentKey]) }];
        }
        this._data[parentKey] = value;
      }
    } else {
      if (invert) {
        inverse = [{ op: 'replace', path: [], value: clone(this._data) }];
      }
      this._data = value;
    }
    return inverse;
  }

  _move(fromPath, toPath, invert) {
    if (eq(fromPath, toPath)) {
      if (invert) { return []; }
      return;
    } else {
      var value = this._get(fromPath);
      if (invert) {
        return this._remove(fromPath, true)
            .concat(this._add(toPath, value, true))
            .reverse();
      } else {
        this._remove(fromPath);
        this._add(toPath, value);
      }
    }
  }

  _copy(fromPath, toPath, invert) {
    if (eq(fromPath, toPath)) {
      if (invert) { return []; }
      return;
    } else {
      return this._add(toPath, this._get(fromPath), invert);
    }
  }
}
