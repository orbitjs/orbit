import Orbit, {
  buildTransform,
  pullable, Pullable,
  pushable, Pushable,
  Resettable,
  syncable, Syncable,
  Query,
  QueryOrExpression,
  Source, SourceSettings,
  Transform,
  TransformOrOperations,
  Record,
  RecordIdentity,
  RecordOperation
} from '@orbit/data';
import { assert } from '@orbit/utils';
import { supportsLocalStorage } from './lib/local-storage';
import LocalStorageCache, { LocalStorageCacheSettings } from './cache';

export interface LocalStorageSourceSettings extends SourceSettings {
  delimiter?: string;
  namespace?: string;
  cacheSettings?: LocalStorageCacheSettings;
}

/**
 * Source for storing data in localStorage.
 */
@pullable
@pushable
@syncable
export default class LocalStorageSource extends Source implements Pullable, Pushable, Resettable, Syncable {
  protected _cache: LocalStorageCache;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Pullable interface stubs
  pull: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<Transform[]>;

  constructor(settings: LocalStorageSourceSettings = {}) {
    assert('LocalStorageSource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);
    assert('Your browser does not support local storage!', supportsLocalStorage());

    settings.name = settings.name || 'localStorage';

    super(settings);

    let cacheSettings: LocalStorageCacheSettings = settings.cacheSettings || {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder = cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder = cacheSettings.transformBuilder || this.transformBuilder;
    cacheSettings.namespace = cacheSettings.namespace || settings.namespace;
    cacheSettings.delimiter = cacheSettings.delimiter || settings.delimiter;

    this._cache = new LocalStorageCache(cacheSettings);
  }

  get namespace(): string {
    return this._cache.namespace;
  }

  get delimiter(): string {
    return this._cache.delimiter;
  }

  getKeyForRecord(record: RecordIdentity | Record): string {
    return this._cache.getKeyForRecord(record);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Resettable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async reset(): Promise<void> {
    this._cache.reset();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: Transform): Promise<void> {
    this._cache.patch(transform.operations as RecordOperation[]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(transform: Transform): Promise<Transform[]> {
    this._cache.patch(transform.operations as RecordOperation[]);
    return [transform];
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(query: Query): Promise<Transform[]> {
    let operations;
    const results = this._cache.query(query);

    if (Array.isArray(results)) {
      operations = results.map(r => {
        return {
          op: 'replaceRecord',
          record: r
        };
      });
    } else if (results) {
      operations = [{
        op: 'replaceRecord',
        record: results
      }];
    } else {
      operations = [];
    }

    return [buildTransform(operations)];
  }
}
