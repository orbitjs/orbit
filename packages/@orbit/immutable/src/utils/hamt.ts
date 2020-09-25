/**
 * Code based on: https://github.com/mattbierner/hamt
 * Author: Matt Bierner
 * MIT license
 *
 * Which is based on: https://github.com/exclipy/pdata
 */

/* eslint-disable */
function _typeof(obj: any) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

/* Configuration
 ******************************************************************************/
const SIZE = 5;

const BUCKET_SIZE = Math.pow(2, SIZE);

const MASK = BUCKET_SIZE - 1;

const MAX_INDEX_NODE = BUCKET_SIZE / 2;

const MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/*
 ******************************************************************************/
const nothing = {};

function constant(x: any) {
  return function () {
    return x;
  };
}

/**
  Get 32 bit hash of string.

  Based on:
  http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
function hash(str: any) {
  const type = typeof str === 'undefined' ? 'undefined' : _typeof(str);
  if (type === 'number') return str;
  if (type !== 'string') str += '';

  let h = 0;
  for (var i = 0, len = str.length; i < len; ++i) {
    var c = str.charCodeAt(i);
    h = (h << 5) - h + c | 0;
  }
  return h;
}

/* Bit Ops
 ******************************************************************************/
/**
  Hamming weight.

  Taken from: http://jsperf.com/hamming-weight
*/
function popcount(x: any): any {
  x -= x >> 1 & 0x55555555;
  x = (x & 0x33333333) + (x >> 2 & 0x33333333);
  x = x + (x >> 4) & 0x0f0f0f0f;
  x += x >> 8;
  x += x >> 16;
  return x & 0x7f;
}

function hashFragment(shift: any, h: any): any {
  return h >>> shift & MASK;
}

function toBitmap(x: any): any {
  return 1 << x;
}

function fromBitmap(bitmap: any, bit: any): any {
  return popcount(bitmap & bit - 1);
}

/* Array Ops
 ******************************************************************************/
/**
  Set a value in an array.

  @param mutate Should the input array be mutated?
  @param at Index to change.
  @param v New value
  @param arr Array.
*/
function arrayUpdate(mutate: boolean, at: number, v: any, arr: any[]): any[] {
  var out = arr;
  if (!mutate) {
    var len = arr.length;
    out = new Array(len);
    for (var i = 0; i < len; ++i) {
      out[i] = arr[i];
    }
  }
  out[at] = v;
  return out;
}

/**
  Remove a value from an array.

  @param mutate Should the input array be mutated?
  @param at Index to remove.
  @param arr Array.
*/
function arraySpliceOut(mutate: boolean, at: number, arr: any[]): any[] {
  var len = arr.length;
  var i = 0,
      g = 0;
  var out = arr;
  if (mutate) {
    i = g = at;
  } else {
    out = new Array(len - 1);
    while (i < at) {
      out[g++] = arr[i++];
    }++i;
  }
  while (i < len) {
    out[g++] = arr[i++];
  }return out;
}

/**
  Insert a value into an array.

  @param mutate Should the input array be mutated?
  @param at Index to insert at.
  @param v Value to insert,
  @param arr Array.
*/
function arraySpliceIn(mutate: boolean, at: number, v: any, arr: any[]): any[] {
  var len = arr.length;
  if (mutate) {
    var _i = len;
    while (_i >= at) {
      arr[_i--] = arr[_i];
    }arr[at] = v;
    return arr;
  }
  var i = 0,
      g = 0;
  var out = new Array(len + 1);
  while (i < at) {
    out[g++] = arr[i++];
  }out[at] = v;
  while (i < len) {
    out[++g] = arr[i++];
  }return out;
}

/* Node Structures
 ******************************************************************************/
const LEAF = 1;
const COLLISION = 2;
const INDEX = 3;
const ARRAY = 4;

/**
  Empty node.
*/
const empty = {
  __hamt_isEmpty: true,

  _modify(edit: any, keyEq: any, shift: any, f: any, h: any, k: any, size: any): any {
    var v = f();
    if (v === nothing) return empty;
    ++size.value;
    return Leaf(edit, h, k, v);
  }
};

function isEmptyNode(x: any): boolean {
  return x === empty || x && x.__hamt_isEmpty;
}

/**
  Leaf holding a value.

  @member edit Edit of the node.
  @member hash Hash of key.
  @member key Key.
  @member value Value stored.
*/
function Leaf(edit: any, hash: any, key: any, value: any) {
  return {
    type: LEAF,
    edit: edit,
    hash: hash,
    key: key,
    value: value,
    _modify: Leaf__modify
  };
}

/**
  Leaf holding multiple values with the same hash but different keys.

  @member edit Edit of the node.
  @member hash Hash of key.
  @member children Array of collision children node.
*/
function Collision(edit: any, hash: any, children: any) {
  return {
    type: COLLISION,
    edit: edit,
    hash: hash,
    children: children,
    _modify: Collision__modify
  };
}

/**
  Internal node with a sparse set of children.

  Uses a bitmap and array to pack children.

  @member edit Edit of the node.
  @member mask Bitmap that encode the positions of children in the array.
  @member children Array of child nodes.
*/
function IndexedNode(edit: any, mask: any, children: any) {
  return {
    type: INDEX,
    edit: edit,
    mask: mask,
    children: children,
    _modify: IndexedNode__modify
  };
}

/**
  Internal node with many children.

  @member edit Edit of the node.
  @member size Number of children.
  @member children Array of child nodes.
*/
function ArrayNode(edit: any, size: any, children: any) {
  return {
    type: ARRAY,
    edit: edit,
    size: size,
    children: children,
    _modify: ArrayNode__modify
  };
}

/**
    Is `node` a leaf node?
*/
function isLeaf(node: any): boolean {
  return node === empty || node.type === LEAF || node.type === COLLISION;
}

/* Internal node operations.
 ******************************************************************************/
/**
  Expand an indexed node into an array node.

  @param edit Current edit.
  @param frag Index of added child.
  @param child Added child.
  @param mask Index node mask before child added.
  @param subNodes Index node children before child added.
*/
function expand(edit: any, frag: any, child: any, bitmap: any, subNodes: any): any {
  var arr = [];
  var bit = bitmap;
  var count = 0;
  for (var i = 0; bit; ++i) {
      if (bit & 1) arr[i] = subNodes[count++];
      bit >>>= 1;
  }
  arr[frag] = child;
  return ArrayNode(edit, count + 1, arr);
}

/**
  Collapse an array node into a indexed node.

  @param edit Current edit.
  @param count Number of elements in new array.
  @param removed Index of removed element.
  @param elements Array node children before remove.
*/
function pack(edit: any, count: any, removed: any, elements: any): any {
  var children = new Array(count - 1);
  var g = 0;
  var bitmap = 0;
  for (var i = 0, len = elements.length; i < len; ++i) {
    if (i !== removed) {
      var elem = elements[i];
      if (elem && !isEmptyNode(elem)) {
        children[g++] = elem;
        bitmap |= 1 << i;
      }
    }
  }
  return IndexedNode(edit, bitmap, children);
}

/**
  Merge two leaf nodes.

  @param shift Current shift.
  @param h1 Node 1 hash.
  @param n1 Node 1.
  @param h2 Node 2 hash.
  @param n2 Node 2.
*/
function mergeLeaves(edit: any, shift: any, h1: any, n1: any, h2: any, n2: any): any {
  if (h1 === h2) return Collision(edit, h1, [n2, n1]);

  var subH1 = hashFragment(shift, h1);
  var subH2 = hashFragment(shift, h2);
  return IndexedNode(edit, toBitmap(subH1) | toBitmap(subH2), subH1 === subH2 ? [mergeLeaves(edit, shift + SIZE, h1, n1, h2, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1]);
}

/**
  Update an entry in a collision list.

  @param mutate Should mutation be used?
  @param edit Current edit.
  @param keyEq Key compare function.
  @param hash Hash of collision.
  @param list Collision list.
  @param f Update function.
  @param k Key to update.
  @param size Size ref.
*/
function updateCollisionList(mutate: boolean, edit: any, keyEq: any, h: any, list: any, f: any, k: any, size: any): any {
  var len = list.length;
  for (var i = 0; i < len; ++i) {
    var child = list[i];
    if (keyEq(k, child.key)) {
      var value = child.value;
      var _newValue = f(value);
      if (_newValue === value) return list;

      if (_newValue === nothing) {
        --size.value;
        return arraySpliceOut(mutate, i, list);
      }
      return arrayUpdate(mutate, i, Leaf(edit, h, k, _newValue), list);
    }
  }

  var newValue = f();
  if (newValue === nothing) return list;
  ++size.value;
  return arrayUpdate(mutate, len, Leaf(edit, h, k, newValue), list);
}

function canEditNode(edit: any, node: any): boolean {
  return edit === node.edit;
}

/* Editing
 ******************************************************************************/
function Leaf__modify(this: any, edit: any, keyEq: any, shift: any, f: any, h: any, k: any, size: any): any {
  if (keyEq(k, this.key)) {
    var _v = f(this.value);
    if (_v === this.value) return this;else if (_v === nothing) {
      --size.value;
      return empty;
    }
    if (canEditNode(edit, this)) {
      this.value = _v;
      return this;
    }
    return Leaf(edit, h, k, _v);
  }
  var v = f();
  if (v === nothing) return this;
  ++size.value;
  return mergeLeaves(edit, shift, this.hash, this, h, Leaf(edit, h, k, v));
}

function Collision__modify(this: any, edit: any, keyEq: any, shift: any, f: any, h: any, k: any, size: any): any {
  if (h === this.hash) {
    var canEdit = canEditNode(edit, this);
    var list = updateCollisionList(canEdit, edit, keyEq, this.hash, this.children, f, k, size);
    if (list === this.children) return this;

    return list.length > 1 ? Collision(edit, this.hash, list) : list[0]; // collapse single element collision list
  }
  var v = f();
  if (v === nothing) return this;
  ++size.value;
  return mergeLeaves(edit, shift, this.hash, this, h, Leaf(edit, h, k, v));
}

function IndexedNode__modify(this: any, edit: any, keyEq: any, shift: any, f: any, h: any, k: any, size: any): any {
  var mask = this.mask;
  var children = this.children;
  var frag = hashFragment(shift, h);
  var bit = toBitmap(frag);
  var indx = fromBitmap(mask, bit);
  var exists = mask & bit;
  var current = exists ? children[indx] : empty;
  var child = current._modify(edit, keyEq, shift + SIZE, f, h, k, size);

  if (current === child) return this;

  var canEdit = canEditNode(edit, this);
  var bitmap = mask;
  var newChildren = undefined;
  if (exists && isEmptyNode(child)) {
    // remove
    bitmap &= ~bit;
    if (!bitmap) return empty;
    if (children.length <= 2 && isLeaf(children[indx ^ 1])) return children[indx ^ 1]; // collapse

    newChildren = arraySpliceOut(canEdit, indx, children);
  } else if (!exists && !isEmptyNode(child)) {
    // add
    if (children.length >= MAX_INDEX_NODE) return expand(edit, frag, child, mask, children);

    bitmap |= bit;
    newChildren = arraySpliceIn(canEdit, indx, child, children);
  } else {
    // modify
    newChildren = arrayUpdate(canEdit, indx, child, children);
  }

  if (canEdit) {
    this.mask = bitmap;
    this.children = newChildren;
    return this;
  }
  return IndexedNode(edit, bitmap, newChildren);
}

function ArrayNode__modify(this: any, edit: any, keyEq: any, shift: any, f: any, h: any, k: any, size: any): any {
  var count = this.size;
  var children = this.children;
  var frag = hashFragment(shift, h);
  var child = children[frag];
  var newChild = (child || empty)._modify(edit, keyEq, shift + SIZE, f, h, k, size);

  if (child === newChild) return this;

  var canEdit = canEditNode(edit, this);
  var newChildren = undefined;
  if (isEmptyNode(child) && !isEmptyNode(newChild)) {
    // add
    ++count;
    newChildren = arrayUpdate(canEdit, frag, newChild, children);
  } else if (!isEmptyNode(child) && isEmptyNode(newChild)) {
    // remove
    --count;
    if (count <= MIN_ARRAY_NODE) return pack(edit, count, frag, children);
    newChildren = arrayUpdate(canEdit, frag, empty, children);
  } else {
    // modify
    newChildren = arrayUpdate(canEdit, frag, newChild, children);
  }

  if (canEdit) {
    this.size = count;
    this.children = newChildren;
    return this;
  }
  return ArrayNode(edit, count, newChildren);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
function tryGetHash(alt: any, hash: any, key: any, map: any): any {
  var node = map._root;
  var shift = 0;
  var keyEq = map._config.keyEq;
  while (true) {
    switch (node.type) {
      case LEAF:
        {
          return keyEq(key, node.key) ? node.value : alt;
        }
      case COLLISION:
        {
          if (hash === node.hash) {
            var children = node.children;
            for (var i = 0, len = children.length; i < len; ++i) {
              var child = children[i];
              if (keyEq(key, child.key)) return child.value;
            }
          }
          return alt;
        }
      case INDEX:
        {
          var frag = hashFragment(shift, hash);
          var bit = toBitmap(frag);
          if (node.mask & bit) {
            node = node.children[fromBitmap(node.mask, bit)];
            shift += SIZE;
            break;
          }
          return alt;
        }
      case ARRAY:
        {
          node = node.children[hashFragment(shift, hash)];
          if (node) {
            shift += SIZE;
            break;
          }
          return alt;
        }
      default:
        return alt;
    }
  }
}

/**
  Lookup the value for `key` in `map` using internal hash function.

  @see `tryGetHash`
*/
function tryGet(alt: any, key: any, map: any): any {
  return tryGetHash(alt, map._config.hash(key), key, map);
}

/**
  Lookup the value for `key` in `map` using a custom `hash`.

  Returns the value or `undefined` if none.
*/
function getHash(hash: any, key: any, map: any): any {
  return tryGetHash(undefined, hash, key, map);
}

/**
    Does an entry exist for `key` in `map`? Uses custom `hash`.
*/
function hasHash(hash: any, key: any, map: any): boolean {
  return tryGetHash(nothing, hash, key, map) !== nothing;
}

/**
  Does an entry exist for `key` in `map`? Uses internal hash function.
*/
function has(key: any, map: any): boolean {
  return hasHash(map._config.hash(key), key, map);
}

function defKeyCompare(x: any, y: any): boolean {
  return x === y;
}

/**
  Does `map` contain any elements?
*/
function isEmpty(map: any): boolean {
  return map && !!isEmptyNode(map._root);
}

/* Updates
 ******************************************************************************/
/**
    Alter the value stored for `key` in `map` using function `f` using
    custom hash.

    `f` is invoked with the current value for `k` if it exists,
    or no arguments if no such value exists. `modify` will always either
    update or insert a value into the map.

    Returns a map with the modified value. Does not alter `map`.
*/
function modifyHash(f: any, hash: any, key: any, map: any): any {
  var size = { value: map._size };
  var newRoot = map._root._modify(map._editable ? map._edit : NaN, map._config.keyEq, 0, f, hash, key, size);
  return map.setTree(newRoot, size.value);
}

/**
  Alter the value stored for `key` in `map` using function `f` using
  internal hash function.

  @see `modifyHash`
*/
function modify(f: any, key: any, map: any): any {
  return modifyHash(f, map._config.hash(key), key, map);
}

/**
  Store `value` for `key` in `map` using custom `hash`.

  Returns a map with the modified value. Does not alter `map`.
*/
function setHash(hash: any, key: any, value: any, map: any): any {
  return modifyHash(constant(value), hash, key, map);
}


/**
  Store `value` for `key` in `map` using internal hash function.

  @see `setHash`
*/
function set(key: any, value: any, map: any): any {
  return setHash(map._config.hash(key), key, value, map);
}

/**
  Remove the entry for `key` in `map`.

  Returns a map with the value removed. Does not alter `map`.
*/
const del = constant(nothing);
function removeHash(hash: any, key: any, map: any): any {
  return modifyHash(del, hash, key, map);
}

/**
  Remove the entry for `key` in `map` using internal hash function.

  @see `removeHash`
*/
function remove(key: any, map: any): any {
  return removeHash(map._config.hash(key), key, map);
}

/* Mutation
 ******************************************************************************/
/**
  Mark `map` as mutable.
 */
function beginMutation(map: any): any {
  return new HAMTMap(map._editable + 1, map._edit + 1, map._config, map._root, map._size);
}

/**
  Mark `map` as immutable.
 */
function endMutation(map: any): any {
  map._editable = map._editable && map._editable - 1;
  return map;
}

/**
  Mutate `map` within the context of `f`.
  @param f
  @param map HAMT
*/
function mutate(f: any, map: any): any {
  var transient = beginMutation(map);
  f(transient);
  return endMutation(transient);
};

/* Traversal
 ******************************************************************************/
/**
  Apply a continuation.
*/
function appk(k: any): any {
  return k && lazyVisitChildren(k[0], k[1], k[2], k[3], k[4]);
}

/**
  Recursively visit all values stored in an array of nodes lazily.
*/
function lazyVisitChildren(len: any, children: any, i: any, f: any, k: any): any {
  while (i < len) {
    var child = children[i++];
    if (child && !isEmptyNode(child)) return lazyVisit(child, f, [len, children, i, f, k]);
  }
  return appk(k);
}

/**
  Recursively visit all values stored in `node` lazily.
*/
function lazyVisit(node: any, f: any, k?: any): any {
  switch (node.type) {
    case LEAF:
      return {
        value: f(node),
        rest: k
      };

    case COLLISION:
    case ARRAY:
    case INDEX:
      var children = node.children;
      return lazyVisitChildren(children.length, children, 0, f, k);

    default:
      return appk(k);
  }
}

const DONE = {
  done: true
};

/**
  Lazily visit each value in map with function `f`.
*/
function visit(map: any, f: any): any {
  return new HAMTMapIterator(lazyVisit(map._root, f));
}

/**
  Get a Javascsript iterator of `map`.

  Iterates over `[key, value]` arrays.
*/
function buildPairs(x: any): any {
  return [x.key, x.value];
}

function entries(map: any): any {
  return visit(map, buildPairs);
};

/**
  Get array of all keys in `map`.

  Order is not guaranteed.
*/
function buildKeys(x: any): any {
  return x.key;
}
function keys(map: any): any {
  return visit(map, buildKeys);
}

/**
  Get array of all values in `map`.

  Order is not guaranteed, duplicates are preserved.
*/
function buildValues(x: any): any {
  return x.value;
}
function values(map: any): any {
  return visit(map, buildValues);
}

/* Fold
 ******************************************************************************/
/**
  Visit every entry in the map, aggregating data.

  Order of nodes is not guaranteed.

  @param f Function mapping accumulated value, value, and key to new value.
  @param z Starting value.
  @param m HAMT
*/
function fold(f: any, z: any, m: any): any {
  var root = m._root;
  if (root.type === LEAF) return f(z, root.value, root.key);

  var toVisit = [root.children];
  var children = undefined;
  while (children = toVisit.pop()) {
    for (var i = 0, len = children.length; i < len;) {
      var child = children[i++];
      if (child && child.type) {
        if (child.type === LEAF) z = f(z, child.value, child.key);else toVisit.push(child.children);
      }
    }
  }
  return z;
}

/**
  Visit every entry in the map, aggregating data.

  Order of nodes is not guaranteed.

  @param f Function invoked with value and key
  @param map HAMT
*/
function forEach(f: any, map: any): any {
  return fold(function(_: any, value: any, key: any): any {
    return f(value, key, map);
  }, null, map);
}

/* Export
 ******************************************************************************/
export class HAMTMapIterator<T> implements IterableIterator<T> {
  private v: any;

  constructor(v: any) {
    this.v = v;
  }

  next() {
    if (!this.v) return DONE;
    var v0 = this.v;
    this.v = appk(v0.rest);
    return v0;
  }

  [Symbol.iterator] () {
    return this;
  }
}

export interface HAMTMapConfig {
  keyEq?: Function, // TODO
  hash?: Function // TODO
}

export class HAMTMap {
  private _map: any;
  private _editable: boolean;
  private _edit: any;
  private _config: HAMTMapConfig;
  private _root: any;
  private _size: number;

  constructor(editable = false, edit = 0, config: HAMTMapConfig = {}, root = empty, size: number = 0) {
    this._editable = editable;
    this._edit = edit;
    this._config = {
      keyEq: config && config.keyEq || defKeyCompare,
      hash: config && config.hash || hash
    };
    this._root = root;
    this._size = size;
  }

  get size(): number {
    return this._size;
  }

  setTree(newRoot: any, newSize: number): any {
    if (this._editable) {
      this._root = newRoot;
      this._size = newSize;
      return this;
    }
    return newRoot === this._root ? this : new HAMTMap(this._editable, this._edit, this._config, newRoot, newSize);
  }

  tryGetHash(alt: any, hash: any, key: any): any {
    return tryGetHash(alt, hash, key, this);
  }

  tryGet(alt: any, key: any): any {
    return tryGet(alt, key, this);
  }

  getHash(hash: any, key: any): any {
    return getHash(hash, key, this);
  }

  get(key: any, alt?: any): any {
    return tryGet(alt, key, this);
  }

  hasHash(hash: any, key: any): boolean {
    return hasHash(hash, key, this);
  }

  has(key: any): boolean {
    return has(key, this);
  }

  isEmpty(): boolean {
    return isEmpty(this);
  }

  modifyHash(hash: any, key: any, f: any): any {
    return modifyHash(f, hash, key, this);
  }

  modify(key: any, f: any): any {
    return modify(f, key, this);
  }

  setHash(hash: any, key: any, value: any): any {
    return setHash(hash, key, value, this);
  }

  set(key: any, value: any): any {
    return set(key, value, this);
  }

  deleteHash(hash: any, key: any): any {
    return removeHash(hash, key, this);
  }

  removeHash(hash: any, key: any): any {
    return removeHash(hash, key, this);
  }

  remove(key: any): any {
    return remove(key, this);
  }

  beginMutation(): any {
    return beginMutation(this);
  }

  endMutation(): any {
    return endMutation(this);
  }

  mutate(f: any): any {
    return mutate(f, this);
  }

  entries(): any {
    return entries(this);
  }

  keys(): any {
    return keys(this);
  }

  values(): any {
    return values(this);
  }

  fold(f: any, z: any): any {
    return fold(f, z, this);
  }

  forEach(f: any): any {
    return forEach(f, this);
  }

  [Symbol.iterator] () {
    return entries(this);
  }
}
