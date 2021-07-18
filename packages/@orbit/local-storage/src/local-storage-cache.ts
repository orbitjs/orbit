import { Orbit } from '@orbit/core';
import {
  InitializedRecord,
  RecordIdentity,
  equalRecordIdentities,
  RecordQueryBuilder,
  RecordTransformBuilder
} from '@orbit/records';
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
import { RequestOptions } from '@orbit/data';

export interface LocalStorageCacheSettings<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder
> extends SyncRecordCacheSettings<QO, TO, QB, TB> {
  delimiter?: string;
  namespace?: string;
}

export interface LocalStorageCacheClass<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> {
  new (settings: LocalStorageCacheSettings<QO, TO, QB, TB>): LocalStorageCache<
    QO,
    TO,
    QB,
    TB,
    QRD,
    TRD
  >;
}

/**
 * A cache used to access records in local storage.
 *
 * Because local storage access is synchronous, this cache extends `SyncRecordCache`.
 */
export class LocalStorageCache<
  QO extends RequestOptions = RecordCacheQueryOptions,
  TO extends RequestOptions = RecordCacheTransformOptions,
  QB = RecordQueryBuilder,
  TB = RecordTransformBuilder,
  QRD = unknown,
  TRD extends RecordCacheUpdateDetails = RecordCacheUpdateDetails
> extends SyncRecordCache<QO, TO, QB, TB, QRD, TRD> {
  protected _namespace: string;
  protected _delimiter: string;

  constructor(settings: LocalStorageCacheSettings<QO, TO, QB, TB>) {
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

  getKeyForRecord(record: RecordIdentity | InitializedRecord): string {
    return [this.namespace, record.type, record.id].join(this.delimiter);
  }

  getKeyForRecordInverses(record: RecordIdentity | InitializedRecord): string {
    return [this.namespace, 'inverseRels', record.type, record.id].join(
      this.delimiter
    );
  }

  getRecordSync(identity: RecordIdentity): InitializedRecord | undefined {
    const key = this.getKeyForRecord(identity);
    const item: string | undefined = Orbit.globals.localStorage.getItem(key);

    if (item) {
      const record: InitializedRecord = JSON.parse(item);

      if (this._keyMap) {
        this._keyMap.pushRecord(record);
      }

      return record;
    }

    return undefined;
  }

  getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): InitializedRecord[] {
    const records: InitializedRecord[] = [];

    if (
      typeOrIdentities === undefined ||
      typeof typeOrIdentities === 'string'
    ) {
      const type: string | undefined = typeOrIdentities;
      for (let key in Orbit.globals.localStorage) {
        if (key.indexOf(this.namespace + this.delimiter) === 0) {
          let typesMatch = type === undefined;

          if (!typesMatch) {
            let fragments = key.split(this.delimiter);
            let recordType = fragments[1];
            typesMatch =
              recordType === type &&
              this.schema.models[recordType] !== undefined;
          }

          if (typesMatch) {
            let record = JSON.parse(Orbit.globals.localStorage.getItem(key));

            if (this.keyMap) {
              this.keyMap.pushRecord(record);
            }

            records.push(record);
          }
        }
      }
    } else {
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let identity of identities) {
        let record = this.getRecordSync(identity);
        if (record) {
          records.push(record);
        }
      }
    }

    return records;
  }

  setRecordSync(record: InitializedRecord): void {
    const key = this.getKeyForRecord(record);

    if (this._keyMap) {
      this._keyMap.pushRecord(record);
    }

    Orbit.globals.localStorage.setItem(key, JSON.stringify(record));
  }

  setRecordsSync(records: InitializedRecord[]): void {
    for (let record of records) {
      this.setRecordSync(record);
    }
  }

  removeRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined {
    const record = this.getRecordSync(recordIdentity);
    if (record) {
      const key = this.getKeyForRecord(record);
      Orbit.globals.localStorage.removeItem(key);
      return record;
    } else {
      return undefined;
    }
  }

  removeRecordsSync(recordIdentities: RecordIdentity[]): InitializedRecord[] {
    const records = [];
    for (let recordIdentity of recordIdentities) {
      let record = this.getRecordSync(recordIdentity);
      if (record) {
        records.push(record);
        const key = this.getKeyForRecord(record);
        Orbit.globals.localStorage.removeItem(key);
      }
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
      const key = this.getKeyForRecordInverses(identity);
      const item = Orbit.globals.localStorage.getItem(key);

      if (item) {
        Array.prototype.push.apply(results, JSON.parse(item));
      }
    }

    return results;
  }

  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    for (let relationship of relationships) {
      const key = this.getKeyForRecordInverses(relationship.relatedRecord);
      const item = Orbit.globals.localStorage.getItem(key);
      let rels = item ? JSON.parse(item) : [];
      rels.push(relationship);
      Orbit.globals.localStorage.setItem(key, JSON.stringify(rels));
    }
  }

  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    for (let relationship of relationships) {
      const key = this.getKeyForRecordInverses(relationship.relatedRecord);
      const item = Orbit.globals.localStorage.getItem(key);
      if (item) {
        let rels: RecordRelationshipIdentity[] = item ? JSON.parse(item) : [];
        let newRels = rels.filter(
          (rel) =>
            !(
              equalRecordIdentities(rel.record, relationship.record) &&
              rel.relationship === relationship.relationship
            )
        );
        Orbit.globals.localStorage.setItem(key, JSON.stringify(newRels));
      }
    }
  }

  reset(): void {
    for (let key in Orbit.globals.localStorage) {
      if (key.indexOf(this.namespace + this.delimiter) === 0) {
        Orbit.globals.localStorage.removeItem(key);
      }
    }

    for (let processor of this._processors) {
      processor.reset();
    }
  }

  upgrade(): void {
    for (let processor of this._processors) {
      processor.upgrade();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

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
}
