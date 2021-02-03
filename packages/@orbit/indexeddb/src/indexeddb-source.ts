import { Orbit } from '@orbit/core';
import {
  buildTransform,
  pullable,
  pushable,
  Resettable,
  syncable,
  QueryOrExpressions,
  RequestOptions,
  FullResponse,
  TransformsOrFullResponse,
  TransformOrOperations
} from '@orbit/data';
import {
  RecordOperation,
  UpdateRecordOperation,
  RecordQueryExpressionResult,
  RecordSourceSettings,
  RecordPullable,
  RecordPushable,
  RecordSyncable,
  RecordTransform,
  RecordQueryExpression,
  RecordQueryBuilder,
  RecordTransformResult,
  RecordTransformBuilder,
  RecordQueryResult,
  RecordSource,
  RecordQuery
} from '@orbit/records';
import { supportsIndexedDB } from './lib/indexeddb';
import { IndexedDBCache, IndexedDBCacheSettings } from './indexeddb-cache';

const { assert } = Orbit;

export interface IndexedDBSourceSettings extends RecordSourceSettings {
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
  extends RecordSource
  implements
    RecordSyncable,
    RecordPullable<unknown>,
    RecordPushable<unknown>,
    Resettable {
  protected _cache: IndexedDBCache;

  // Syncable interface stubs
  sync!: (
    transformOrTransforms: RecordTransform | RecordTransform[]
  ) => Promise<void>;

  // Pullable interface stubs
  pull!: <RO extends RequestOptions>(
    queryOrExpressions: QueryOrExpressions<
      RecordQueryExpression,
      RecordQueryBuilder
    >,
    options?: RO,
    id?: string
  ) => Promise<
    TransformsOrFullResponse<RecordQueryResult, unknown, RecordOperation, RO>
  >;

  // Pushable interface stubs
  push!: <RO extends RequestOptions>(
    transformOrOperations: TransformOrOperations<
      RecordOperation,
      RecordTransformBuilder
    >,
    options?: RO,
    id?: string
  ) => Promise<
    TransformsOrFullResponse<
      RecordTransformResult,
      unknown,
      RecordOperation,
      RO
    >
  >;

  constructor(settings: IndexedDBSourceSettings) {
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

  async _sync(transform: RecordTransform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      await this._cache.update(transform);
      await this.transformed([transform]);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pushable interface implementation
  /////////////////////////////////////////////////////////////////////////////

  async _push(
    transform: RecordTransform
  ): Promise<FullResponse<undefined, unknown, RecordOperation>> {
    const fullResponse: FullResponse<undefined, unknown, RecordOperation> = {};

    if (!this.transformLog.contains(transform.id)) {
      await this._cache.update(transform);
      fullResponse.transforms = [transform];
    }

    return fullResponse;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Pullable implementation
  /////////////////////////////////////////////////////////////////////////////

  async _pull(
    query: RecordQuery
  ): Promise<FullResponse<undefined, unknown, RecordOperation>> {
    const fullResponse: FullResponse<undefined, unknown, RecordOperation> = {};
    let operations: RecordOperation[];

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

    fullResponse.transforms = [buildTransform(operations)];

    return fullResponse;
  }

  protected _operationsFromQueryResult(
    result: RecordQueryExpressionResult
  ): RecordOperation[] {
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
