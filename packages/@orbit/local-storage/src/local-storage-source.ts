import { Orbit } from '@orbit/core';
import {
  buildTransform,
  pullable,
  pushable,
  Resettable,
  syncable,
  QueryOrExpressions,
  RequestOptions,
  TransformOrOperations,
  FullResponse,
  TransformsOrFullResponse
} from '@orbit/data';
import {
  Record,
  RecordIdentity,
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
import { supportsLocalStorage } from './lib/local-storage';
import {
  LocalStorageCache,
  LocalStorageCacheSettings
} from './local-storage-cache';

const { assert } = Orbit;

export interface LocalStorageSourceSettings extends RecordSourceSettings {
  delimiter?: string;
  namespace?: string;
  cacheSettings?: Partial<LocalStorageCacheSettings>;
}

/**
 * Source for storing data in localStorage.
 */
@pullable
@pushable
@syncable
export class LocalStorageSource
  extends RecordSource
  implements
    RecordSyncable,
    RecordPullable<unknown>,
    RecordPushable<unknown>,
    Resettable {
  protected _cache: LocalStorageCache;

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

  constructor(settings: LocalStorageSourceSettings) {
    assert(
      "LocalStorageSource's `schema` must be specified in `settings.schema` constructor argument",
      !!settings.schema
    );
    assert(
      'Your browser does not support local storage!',
      supportsLocalStorage()
    );

    settings.name = settings.name || 'localStorage';

    super(settings);

    let cacheSettings: Partial<LocalStorageCacheSettings> =
      settings.cacheSettings || {};
    cacheSettings.schema = settings.schema;
    cacheSettings.keyMap = settings.keyMap;
    cacheSettings.queryBuilder =
      cacheSettings.queryBuilder || this.queryBuilder;
    cacheSettings.transformBuilder =
      cacheSettings.transformBuilder || this.transformBuilder;
    cacheSettings.namespace = cacheSettings.namespace || settings.namespace;
    cacheSettings.delimiter = cacheSettings.delimiter || settings.delimiter;

    this._cache = new LocalStorageCache(
      cacheSettings as LocalStorageCacheSettings
    );
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

  async _sync(transform: RecordTransform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      this._cache.update(transform);
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
      this._cache.update(transform);
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

    const results = this._cache.query(query);

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
