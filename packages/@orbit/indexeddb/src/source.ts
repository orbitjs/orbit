import Orbit, {
  buildTransform,
  pullable,
  Pullable,
  pushable,
  Pushable,
  Resettable,
  syncable,
  Syncable,
  Query,
  QueryOrExpressions,
  Source,
  SourceSettings,
  Transform,
  TransformOrOperations,
  RecordOperation,
  Operation,
  UpdateRecordOperation,
  Record
} from '@orbit/data';
import { QueryResultData } from '@orbit/record-cache';
import { supportsIndexedDB } from './lib/indexeddb';
import IndexedDBCache, { IndexedDBCacheSettings } from './cache';

const { assert, deprecate } = Orbit;

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
export default class IndexedDBSource extends Source
  implements Pullable, Pushable, Resettable, Syncable {
  protected _cache: IndexedDBCache;

  // Syncable interface stubs
  sync: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Pullable interface stubs
  pull: (
    queryOrExpressions: QueryOrExpressions,
    options?: object,
    id?: string
  ) => Promise<Transform[]>;

  // Pushable interface stubs
  push: (
    transformOrOperations: TransformOrOperations,
    options?: object,
    id?: string
  ) => Promise<Transform[]>;

  constructor(settings: IndexedDBSourceSettings = {}) {
    assert(
      "IndexedDBSource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );
    assert('Your browser does not support IndexedDB!', supportsIndexedDB());

    settings.name = settings.name || 'indexedDB';
    const autoActivate = settings.autoActivate !== false;
    settings.autoActivate = false;

    super(settings);

    let cacheSettings: IndexedDBCacheSettings = settings.cacheSettings || {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder || this.transformBuilder;
    cacheSettings.namespace = cacheSettings.namespace || settings.namespace;

    this._cache = new IndexedDBCache(cacheSettings);
    if (autoActivate) {
      this.activate();
    }
  }

  get cache(): IndexedDBCache {
    return this._cache;
  }

  async upgrade(): Promise<void> {
    await this._cache.reopenDB();
  }

  protected async _activate(): Promise<void> {
    await super._activate();
    await this.cache.openDB();
  }

  async deactivate(): Promise<void> {
    await super.deactivate();
    await this.cache.closeDB();
  }

  closeDB() {
    deprecate('`closeDB()` must be called as `cache.closeDB()`.');
    return this.cache.closeDB();
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
    if (!this.transformLog.contains(transform.id)) {
      await this._cache.patch(transform.operations as RecordOperation[]);
      await this.transformed([transform]);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(transform: Transform): Promise<Transform[]> {
    let results: Transform[];

    if (!this.transformLog.contains(transform.id)) {
      await this._cache.patch(transform.operations as RecordOperation[]);
      results = [transform];
      await this.transformed(results);
    } else {
      results = [];
    }

    return results;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(query: Query): Promise<Transform[]> {
    let operations: Operation[];

    const results = await this._cache.query(query);

    if (query.expressions.length === 1) {
      operations = this._operationsFromQueryResult(results);
    } else {
      for (let result of results as QueryResultData[]) {
        operations.push(...this._operationsFromQueryResult(result));
      }
    }

    const transforms = [buildTransform(operations)];

    await this.transformed(transforms);

    return transforms;
  }

  _operationsFromQueryResult(result: Record | Record[]): Operation[] {
    if (Array.isArray(result)) {
      return result.map(r => {
        return {
          op: 'updateRecord',
          record: r
        };
      });
    } else if (result) {
      return [
        {
          op: 'updateRecord',
          record: result
        } as UpdateRecordOperation
      ];
    } else {
      return [];
    }
  }
}
