import { Orbit } from '@orbit/core';
import { FullResponse, RequestOptions } from '@orbit/data';
import { ImmutableMap } from '@orbit/immutable';
import {
  RecordCacheQueryOptions,
  RecordCacheTransformOptions,
  RecordCacheUpdateDetails,
  RecordRelationshipIdentity,
  RecordTransformBuffer,
  SimpleRecordTransformBuffer,
  SyncRecordCache,
  SyncRecordCacheSettings
} from '@orbit/record-cache';
import {
  equalRecordIdentities,
  InitializedRecord,
  RecordIdentity,
  RecordOperation,
  RecordQueryBuilder,
  RecordTransform,
  RecordTransformBuilder,
  RecordTransformResult
} from '@orbit/records';
import { clone, Dict, toArray } from '@orbit/utils';

const { assert } = Orbit;

export interface MemoryCacheMergeOptions {
  coalesce?: boolean;
}

export interface MemoryCacheSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends SyncRecordCacheSettings<QO, TO, QB, TB> {
  base?: MemoryCache<QO, TO, QB, TB, QRD, TRD>;
  trackUpdateOperations?: boolean;
}

export interface MemoryCacheClass<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> {
  new (settings: MemoryCacheSettings<QO, TO, QB, TB, QRD, TRD>): MemoryCache<
    QO,
    TO,
    QB,
    TB,
    QRD,
    TRD
  >;
}

/**
 * A cache used to access records in memory.
 *
 * Because data is stored in immutable maps, this type of cache can be forked
 * efficiently.
 */
export class MemoryCache<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends SyncRecordCache<QO, TO, QB, TB, QRD, TRD> {
  protected _records!: Dict<ImmutableMap<string, InitializedRecord>>;
  protected _inverseRelationships!: Dict<
    ImmutableMap<string, RecordRelationshipIdentity[]>
  >;
  protected _updateOperations!: RecordOperation[];
  protected _isTrackingUpdateOperations: boolean;

  constructor(settings: MemoryCacheSettings<QO, TO, QB, TB, QRD, TRD>) {
    super(settings);

    // Track update operations if explicitly told to do so, or if a `base`
    // cache has been specified.
    this._isTrackingUpdateOperations =
      settings.trackUpdateOperations ?? settings.base !== undefined;

    this.reset(settings.base);
  }

  getRecordSync(identity: RecordIdentity): InitializedRecord | undefined {
    return this._records[identity.type].get(identity.id);
  }

  getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): InitializedRecord[] {
    if (typeOrIdentities === undefined) {
      const types = Object.keys(this.schema.models);
      const records: InitializedRecord[] = [];
      types.forEach((type) =>
        Array.prototype.push.apply(
          records,
          Array.from(this._records[type].values())
        )
      );
      return records;
    } else if (typeof typeOrIdentities === 'string') {
      const type: string = typeOrIdentities;
      return Array.from(this._records[type].values());
    } else {
      const records: InitializedRecord[] = [];
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let identity of identities) {
        let record = this.getRecordSync(identity);
        if (record) {
          records.push(record);
        }
      }
      return records;
    }
  }

  setRecordSync(record: InitializedRecord): void {
    this._records[record.type].set(record.id, record);
  }

  setRecordsSync(records: InitializedRecord[]): void {
    let typedMap: any = {};
    for (let record of records) {
      typedMap[record.type] = typedMap[record.type] || [];
      typedMap[record.type].push([record.id, record]);
    }
    for (let type in typedMap) {
      this._records[type].setMany(typedMap[type]);
    }
  }

  removeRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined {
    const recordMap = this._records[recordIdentity.type];
    const record = recordMap.get(recordIdentity.id);
    if (record) {
      recordMap.remove(recordIdentity.id);
      return record;
    } else {
      return undefined;
    }
  }

  removeRecordsSync(recordIdentities: RecordIdentity[]): InitializedRecord[] {
    const records = [];
    const typedIds: any = {};
    for (let recordIdentity of recordIdentities) {
      let record = this.getRecordSync(recordIdentity);
      if (record) {
        records.push(record);
        typedIds[record.type] = typedIds[record.type] || [];
        typedIds[record.type].push(recordIdentity.id);
      }
    }
    for (let type in typedIds) {
      this._records[type].removeMany(typedIds[type]);
    }
    return records;
  }

  getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[] {
    const results: RecordRelationshipIdentity[] = [];
    const identities: RecordIdentity[] = Array.isArray(
      recordIdentityOrIdentities
    )
      ? recordIdentityOrIdentities
      : [recordIdentityOrIdentities];

    for (let identity of identities) {
      const result = this._inverseRelationships[identity.type].get(identity.id);
      if (result) {
        Array.prototype.push.apply(results, result);
      }
    }

    return results;
  }

  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    relationships.forEach((r) => {
      let rels = this._inverseRelationships[r.relatedRecord.type].get(
        r.relatedRecord.id
      );
      rels = rels ? [...rels, clone(r)] : [clone(r)];
      this._inverseRelationships[r.relatedRecord.type].set(
        r.relatedRecord.id,
        rels
      );
    });
  }

  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    relationships.forEach((r) => {
      let rels = this._inverseRelationships[r.relatedRecord.type].get(
        r.relatedRecord.id
      );
      if (rels) {
        let newRels = rels.filter(
          (rel) =>
            !(
              equalRecordIdentities(rel.record, r.record) &&
              rel.relationship === r.relationship
            )
        );
        this._inverseRelationships[r.relatedRecord.type].set(
          r.relatedRecord.id,
          newRels
        );
      }
    });
  }

  /**
   * Resets the cache's state to be either empty or to match the state of
   * another cache.
   *
   * @example
   * ``` javascript
   * cache.reset(); // empties cache
   * cache.reset(cache2); // clones the state of cache2
   * ```
   */
  reset(base?: MemoryCache<QO, TO, QB, TB, QRD, TRD>): void {
    this._records = {};
    this._updateOperations = [];

    Object.keys(this._schema.models).forEach((type) => {
      let baseRecords = base && base._records[type];

      this._records[type] = new ImmutableMap<string, InitializedRecord>(
        baseRecords
      );
    });

    this._resetInverseRelationships(base);

    this._processors.forEach((processor) => processor.reset(base));

    this.emit('reset');
  }

  /**
   * Upgrade the cache based on the current state of the schema.
   */
  upgrade(): void {
    Object.keys(this._schema.models).forEach((type) => {
      if (!this._records[type]) {
        this._records[type] = new ImmutableMap<string, InitializedRecord>();
      }
    });

    this._resetInverseRelationships();

    for (let processor of this._processors) {
      processor.upgrade();
    }
  }

  get isTrackingUpdateOperations(): boolean {
    return this._isTrackingUpdateOperations;
  }

  getAllUpdateOperations(): RecordOperation[] {
    assert(
      'MemoryCache#getAllUpdateOperations: requires that cache be configured with `trackUpdateOperations: true`.',
      this._isTrackingUpdateOperations
    );

    return this._updateOperations;
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _update<
    RequestData extends RecordTransformResult = RecordTransformResult
  >(
    transform: RecordTransform,
    options?: TO
  ): FullResponse<RequestData, TRD, RecordOperation> {
    if (this._isTrackingUpdateOperations) {
      Array.prototype.push.apply(
        this._updateOperations,
        toArray(transform.operations)
      );
    }
    return super._update<RequestData>(transform, options);
  }

  /**
   * Override `_getTransformBuffer` on base `SyncRecordCache` to provide a
   * `transformBuffer` if a custom one hasn't been provided via the constructor
   * setting.
   */
  protected _getTransformBuffer(): RecordTransformBuffer {
    if (this._transformBuffer === undefined) {
      const { schema, keyMap } = this;
      this._transformBuffer = new SimpleRecordTransformBuffer({
        schema,
        keyMap
      });
    }
    return this._transformBuffer;
  }

  protected _resetInverseRelationships(
    base?: MemoryCache<QO, TO, QB, TB, QRD, TRD>
  ): void {
    const inverseRelationships: Dict<
      ImmutableMap<string, RecordRelationshipIdentity[]>
    > = {};
    Object.keys(this._schema.models).forEach((type) => {
      let baseRelationships = base && base._inverseRelationships[type];
      inverseRelationships[type] = new ImmutableMap(baseRelationships);
    });
    this._inverseRelationships = inverseRelationships;
  }
}
