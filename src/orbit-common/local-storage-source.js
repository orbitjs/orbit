/* eslint-disable valid-jsdoc */
import Orbit from 'orbit/main';
import Source from './source';
import Pullable from 'orbit/interfaces/pullable';
import Pushable from 'orbit/interfaces/pushable';
import Transformable from 'orbit/interfaces/transformable';
import { assert } from 'orbit/lib/assert';
import TransformOperators from './local-storage/transform-operators';
import { QueryOperators } from './local-storage/queries';

var supportsLocalStorage = function() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
};

/**
 Source for storing data in local storage

 @class LocalStorageSource
 @extends Source
 @namespace OC
 @param {Object}    [options]
 @param {OC.Schema} [options.schema] Schema for source (required)
 @constructor
 */
export default class LocalStorageSource extends Source {
  constructor(options = {}) {
    assert('LocalStorageSource\'s `schema` must be specified in `options.schema` constructor argument', options.schema);
    assert('Your browser does not support local storage!', supportsLocalStorage());

    super(options);

    this.name      = options.name || 'localStorage';
    this.namespace = options['namespace'] || 'orbit'; // local storage namespace
    this.delimiter = options['delimiter'] || '/'; // local storage key
  }

  getKeyForRecord(record) {
    return [this.namespace, record.type, record.id].join(this.delimiter);
  }

  getRecord(record) {
    const key = this.getKeyForRecord(record);

    return JSON.parse(window.localStorage.getItem(key));
  }

  putRecord(record) {
    const key = this.getKeyForRecord(record);

    // console.log('LocalStorageSource#putRecord', key, JSON.stringify(record));

    window.localStorage.setItem(key, JSON.stringify(record));
  }

  removeRecord(record) {
    const key = this.getKeyForRecord(record);

    // console.log('LocalStorageSource#removeRecord', key, JSON.stringify(record));

    window.localStorage.removeItem(key);
  }

  reset() {
    for (let key in window.localStorage) {
      if (key.indexOf(this.namespace) === 0) {
        window.localStorage.removeItem(key);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Transformable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _transform(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform) {
    this._applyTransform(transform);
    return Orbit.Promise.resolve([transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  _pull(query) {
    const transforms = QueryOperators[query.expression.op](this, query.expression);

    return Orbit.Promise.resolve(transforms);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Private
  /////////////////////////////////////////////////////////////////////////////

  _applyTransform(transform) {
    transform.operations.forEach(operation => {
      TransformOperators[operation.op](this, operation);
    });
  }
}

Pullable.extend(LocalStorageSource.prototype);
Pushable.extend(LocalStorageSource.prototype);
Transformable.extend(LocalStorageSource.prototype);
