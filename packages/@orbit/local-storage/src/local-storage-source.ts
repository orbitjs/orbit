import { Orbit } from '@orbit/core';
import {
  buildTransform,
  Operation,
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
  Record,
  RecordIdentity,
  RecordOperation,
  Response,
  UpdateRecordOperation,
  FullResponse,
  RecordQueryExpressionResult
} from '@orbit/data';
import { supportsLocalStorage } from './lib/local-storage';
import {
  LocalStorageCache,
  LocalStorageCacheSettings
} from './local-storage-cache';

const { assert } = Orbit;

export interface LocalStorageSourceSettings extends SourceSettings {
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
  extends Source
  implements Pullable<undefined>, Pushable<undefined>, Resettable, Syncable {
  protected _cache: LocalStorageCache;

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

  constructor(settings: LocalStorageSourceSettings = {}) {
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

  async _sync(transform: Transform): Promise<void> {
    if (!this.transformLog.contains(transform.id)) {
      this._cache.patch(transform.operations as RecordOperation[]);
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
      this._cache.patch(transform.operations as RecordOperation[]);
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
