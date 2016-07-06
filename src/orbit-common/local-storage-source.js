/* eslint-disable valid-jsdoc */
import Orbit from 'orbit/main';
import Source from './source';
import Fetchable from 'orbit/fetchable';
import Updatable from 'orbit/updatable';
import { assert } from 'orbit/lib/assert';
import TransformOperators from './local-storage/transform-operators';
import FetchOperators from './local-storage/fetch-operators';

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

    Fetchable.extend(this);
    Updatable.extend(this); // implicitly extends Transformable

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
    transform.operations.forEach(operation => {
      TransformOperators[operation.op](this, operation);
    });

    return Orbit.Promise.resolve([transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Fetchable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _fetch(query) {
    const transforms = FetchOperators[query.expression.op](this, query.expression);

    return Orbit.Promise.resolve(transforms);
  }
}
