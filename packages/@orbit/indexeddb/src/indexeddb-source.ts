import { Orbit } from '@orbit/core';
import {
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
  RequestOptions,
  Source,
  SourceSettings,
  Transform,
  TransformOrOperations,
  RecordOperation,
  Operation,
  UpdateRecordOperation,
  FullResponse,
  RecordQueryExpressionResult,
  Response
} from '@orbit/data';
import { supportsIndexedDB } from './lib/indexeddb';
import { IndexedDBCache, IndexedDBCacheSettings } from './indexeddb-cache';

const { assert } = Orbit;

export interface IndexedDBSourceSettings extends SourceSettings {
  namespace?: string;
  cacheSettings?: Partial<IndexedDBCacheSettings>;
}

/**
 * Source for storing data in IndexedDB.
 */
@pullable
@pushable
@syncable
export class IndexedDBSource
  extends Source
  implements Pullable<undefined>, Pushable<undefined>, Resettable, Syncable {
  protected _cache: IndexedDBCache;

  // Syncable interface stubs
  sync!: (transformOrTransforms: Transform | Transform[]) => Promise<void>;

  // Pullable interface stubs
  pull!: (
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ) => Promise<Response<Transform[], undefined>>;

  // Pushable interface stubs
  push!: (
    transformOrOperations: TransformOrOperations,
    options?: RequestOptions,
    id?: string
  ) => Promise<Response<Transform[], undefined>>;

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

    let cacheSettings: Partial<IndexedDBCacheSettings> =
      settings.cacheSettings || {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder || this.transformBuilder;
    cacheSettings.namespace = cacheSettings.namespace || settings.namespace;

    this._cache = new IndexedDBCache(cacheSettings as IndexedDBCacheSettings);
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

  async _push(
    transform: Transform
  ): Promise<FullResponse<Transform[], undefined>> {
    let results: Transform[];

    if (!this.transformLog.contains(transform.id)) {
      await this._cache.patch(transform.operations as RecordOperation[]);
      results = [transform];
      await this.transformed(results);
    } else {
      results = [];
    }

    return { data: results };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(query: Query): Promise<FullResponse<Transform[], undefined>> {
    let operations: Operation[];

    const results = await this._cache.query(query);

    if (query.expressions.length === 1) {
      operations = this._operationsFromQueryResult(
        results as RecordQueryExpressionResult
      );
    } else {
      operations = [];
      for (let result of results as RecordQueryExpressionResult[]) {
        operations.push(...this._operationsFromQueryResult(result));
      }
    }

    const transforms = [buildTransform(operations)];

    await this.transformed(transforms);

    return { data: transforms };
  }

  _operationsFromQueryResult(result: RecordQueryExpressionResult): Operation[] {
    if (Array.isArray(result)) {
      return result.map((r) => {
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
