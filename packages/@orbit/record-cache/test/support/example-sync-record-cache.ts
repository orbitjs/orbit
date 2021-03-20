/* eslint-disable valid-jsdoc */
import { clone, deepGet, deepSet, Dict, objectValues } from '@orbit/utils';
import {
  InitializedRecord,
  RecordIdentity,
  equalRecordIdentities
} from '@orbit/records';
import { RecordRelationshipIdentity } from '../../src/record-accessor';
import {
  SyncRecordCache,
  SyncRecordCacheSettings
} from '../../src/sync-record-cache';

/**
 * A minimal implementation of `SyncRecordCache`.
 */
export class ExampleSyncRecordCache extends SyncRecordCache {
  protected _records: Dict<Dict<InitializedRecord>>;
  protected _inverseRelationships: Dict<Dict<RecordRelationshipIdentity[]>>;

  constructor(settings: SyncRecordCacheSettings) {
    super(settings);

    this._records = {};
    this._inverseRelationships = {};

    Object.keys(this._schema.models).forEach((type) => {
      this._records[type] = {};
      this._inverseRelationships[type] = {};
    });
  }

  getRecordSync(identity: RecordIdentity): InitializedRecord | undefined {
    return deepGet(this._records, [identity.type, identity.id]);
  }

  getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): InitializedRecord[] {
    if (typeof typeOrIdentities === 'string') {
      return objectValues(this._records[typeOrIdentities]);
    } else if (Array.isArray(typeOrIdentities)) {
      const records: InitializedRecord[] = [];
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let i of identities) {
        let record = this.getRecordSync(i);
        if (record) {
          records.push(record);
        }
      }
      return records;
    } else {
      throw new Error('typeOrIdentities must be specified in getRecordsSync');
    }
  }

  setRecordSync(record: InitializedRecord): void {
    deepSet(this._records, [record.type, record.id], record);
  }

  setRecordsSync(records: InitializedRecord[]): void {
    for (let record of records) {
      deepSet(this._records, [record.type, record.id], record);
    }
  }

  removeRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined {
    const record = this.getRecordSync(recordIdentity);
    if (record) {
      delete this._records[recordIdentity.type][recordIdentity.id];
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
        delete this._records[recordIdentity.type][recordIdentity.id];
      }
    }
    return records;
  }

  getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[] {
    if (Array.isArray(recordIdentityOrIdentities)) {
      let inverseRelationships: RecordRelationshipIdentity[] = [];
      recordIdentityOrIdentities.forEach((record) => {
        let rirs = this._getInverseRelationships(record);
        Array.prototype.push.apply(inverseRelationships, rirs);
      });
      return inverseRelationships;
    } else {
      return this._getInverseRelationships(recordIdentityOrIdentities);
    }
  }

  _getInverseRelationships(
    recordIdentity: RecordIdentity
  ): RecordRelationshipIdentity[] {
    return (
      deepGet(this._inverseRelationships, [
        recordIdentity.type,
        recordIdentity.id
      ]) ?? []
    );
  }

  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    for (let relationship of relationships) {
      let rels: any = deepGet(this._inverseRelationships, [
        relationship.relatedRecord.type,
        relationship.relatedRecord.id
      ]);
      rels = rels ? clone(rels) : [];
      rels.push(relationship);
      deepSet(
        this._inverseRelationships,
        [relationship.relatedRecord.type, relationship.relatedRecord.id],
        rels
      );
    }
  }

  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    for (let relationship of relationships) {
      let rels: any = deepGet(this._inverseRelationships, [
        relationship.relatedRecord.type,
        relationship.relatedRecord.id
      ]);
      if (rels) {
        let newRels: any = rels.filter(
          (rel: any) =>
            !(
              equalRecordIdentities(rel.record, relationship.record) &&
              rel.relationship === relationship.relationship
            )
        );
        deepSet(
          this._inverseRelationships,
          [relationship.relatedRecord.type, relationship.relatedRecord.id],
          newRels
        );
      }
    }
  }
}
