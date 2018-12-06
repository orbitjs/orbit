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
  RecordOperation
} from '@orbit/data';
import { assert } from '@orbit/utils';
import { supportsIndexedDB } from './lib/indexeddb';
import IndexedDBCache, { IndexedDBCacheSettings } from './cache';

export interface IndexedDBSourceSettings extends SourceSettings {
  namespace?: string;
  cacheSettings?: IndexedDBCacheSettings;
}

/**
 * Source for storing data in IndexedDB.
 */
@pullable
@pushable
@syncable
export default class IndexedDBSource extends Source implements Pullable, Pushable, Resettable, Syncable {
  protected _cache: IndexedDBCache;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Pullable interface stubs
  pull: (queryOrExpression: QueryOrExpression, options?: object, id?: string) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (transformOrOperations: TransformOrOperations, options?: object, id?: string) => Promise<Transform[]>;

  constructor(settings: IndexedDBSourceSettings = {}) {
    assert('IndexedDBSource\'s `schema` must be specified in `settings.schema` constructor argument', !!settings.schema);
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name || 'indexedDB';

    super(settings);

    let cacheSettings: IndexedDBCacheSettings = settings.cacheSettings || {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder = cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder = cacheSettings.transformBuilder || this.transformBuilder;
    cacheSettings.namespace = cacheSettings.namespace || settings.namespace;

    this._cache = new IndexedDBCache(cacheSettings);
  }

  get cache(): IndexedDBCache {
    return this._cache;
  }

  async upgrade(): Promise<void> {
    await this._cache.reopenDB();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Resettable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async reset(): Promise<void> {
    await this._cache.reset();
  }

  /////////////////////////////////////////////////////////////////////////////
  // Syncable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _sync(transform: Transform): Promise<void> {
    await this._cache.patch(transform.operations as RecordOperation[]);
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(transform: Transform): Promise<Transform[]> {
    await this._cache.patch(transform.operations as RecordOperation[]);
    return [transform];
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(query: Query): Promise<Transform[]> {
    let operations;

    const results = await this._cache.query(query);

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
