import Orbit, {
  pullable, Pullable,
  pushable, Pushable,
  syncable, Syncable,
  Query,
  Record, RecordIdentity,
  Source, SourceSettings,
  Transform
} from '@orbit/data';
import { assert } from '@orbit/utils';
import TransformOperators from './lib/transform-operators';
import { QueryOperators } from './lib/queries';
import { supportsLocalStorage } from './lib/local-storage';

declare const self: any;

export interface LocalStorageSourceSettings extends SourceSettings {
  delimiter?: string;
  namespace?: string;
}

/**
 * Source for storing data in localStorage.
 *
 * @class LocalStorageSource
 * @extends Source
 */
@pullable
@pushable
@syncable
export default class LocalStorageSource extends Source implements Pullable, Pushable, Syncable {
  protected _namespace: string;
  protected _delimiter: string;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Pullable interface stubs
  pull: (query: Query) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transform: Transform) => Promise<Transform[]>;

  /**
   * Create a new LocalStorageSource.
   *
   * @constructor
   * @param {Object} [settings]           Settings.
   * @param {Schema} [settings.schema]    Schema for source.
   * @param {String} [settings.namespace] Optional. Prefix for keys used in localStorage. Defaults to 'orbit'.
   * @param {String} [settings.delimiter] Optional. Delimiter used to separate key segments in localStorage. Defaults to '/'.
   */
  constructor(settings: LocalStorageSourceSettings = {}) {
    assert('LocalStorageSource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);
    assert('Your browser does not support local storage!', supportsLocalStorage());

    settings.name = settings.name || 'localStorage';

    super(settings);

    this._namespace = settings.namespace || 'orbit';
    this._delimiter = settings.delimiter || '/';
  }

  get namespace(): string {
    return this._namespace;
  }

  get delimiter(): string {
    return this._delimiter;
  }

  getKeyForRecord(record: RecordIdentity): string {
    return [this.namespace, record.type, record.id].join(this.delimiter);
  }

  getRecord(record: RecordIdentity): Record {
    const key = this.getKeyForRecord(record);

    return JSON.parse(self.localStorage.getItem(key));
  }

  putRecord(record: Record): void {
    const key = this.getKeyForRecord(record);

    // console.log('LocalStorageSource#putRecord', key, JSON.stringify(record));

    self.localStorage.setItem(key, JSON.stringify(record));
  }

  removeRecord(record: RecordIdentity): void {
    const key = this.getKeyForRecord(record);

    // console.log('LocalStorageSource#removeRecord', key, JSON.stringify(record));

    self.localStorage.removeItem(key);
  }

  reset(): void {
    for (let key in self.localStorage) {
      if (key.indexOf(this.namespace) === 0) {
        self.localStorage.removeItem(key);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _sync(transform: Transform): Promise<void> {
    this._applyTransform(transform);
    return Orbit.Promise.resolve();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  _push(transform: Transform): Promise<Transform[]> {
    this._applyTransform(transform);
    return Orbit.Promise.resolve([transform]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  _pull(query: Query): Promise<Transform[]> {
    const transforms = QueryOperators[query.expression.op](this, query.expression);

    return Orbit.Promise.resolve(transforms);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected
  /////////////////////////////////////////////////////////////////////////////

  protected _applyTransform(transform: Transform): void {
    transform.operations.forEach(operation => {
      TransformOperators[operation.op](this, operation);
    });
  }
}
