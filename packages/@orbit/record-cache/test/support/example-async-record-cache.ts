/* eslint-disable valid-jsdoc */
import { clone, deepGet, deepSet, Dict, objectValues } from '@orbit/utils';
import {
  InitializedRecord,
  RecordIdentity,
  equalRecordIdentities
} from '@orbit/records';
import { RecordRelationshipIdentity } from '../../src/record-accessor';
import {
  AsyncRecordCache,
  AsyncRecordCacheSettings
} from '../../src/async-record-cache';

/**
 * A minimal implementation of `AsyncRecordCache`.
 */
export class ExampleAsyncRecordCache extends AsyncRecordCache {
  protected _records: Dict<Dict<InitializedRecord>>;
  protected _inverseRelationships: Dict<Dict<RecordRelationshipIdentity[]>>;

  constructor(settings: AsyncRecordCacheSettings) {
    super(settings);

    this._records = {};
    this._inverseRelationships = {};

    Object.keys(this._schema.models).forEach((type) => {
      this._records[type] = {};
      this._inverseRelationships[type] = {};
    });
  }

  async getRecordAsync(
    identity: RecordIdentity
  ): Promise<InitializedRecord | undefined> {
    return deepGet(this._records, [identity.type, identity.id]);
  }

  async getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<InitializedRecord[]> {
    if (typeof typeOrIdentities === 'string') {
      return objectValues(this._records[typeOrIdentities]);
    } else if (Array.isArray(typeOrIdentities)) {
      const records: InitializedRecord[] = [];
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let i of identities) {
        let record = await this.getRecordAsync(i);
        if (record) {
          records.push(record);
        }
      }
      return records;
    } else {
      throw new Error('typeOrIdentities must be specified in getRecordsAsync');
    }
  }

  async setRecordAsync(record: InitializedRecord): Promise<void> {
    deepSet(this._records, [record.type, record.id], record);
  }

  async setRecordsAsync(records: InitializedRecord[]): Promise<void> {
    for (let record of records) {
      deepSet(this._records, [record.type, record.id], record);
    }
  }

  async removeRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<InitializedRecord | undefined> {
    const record = await this.getRecordAsync(recordIdentity);
    if (record) {
      delete this._records[recordIdentity.type][recordIdentity.id];
      return record;
    } else {
      return undefined;
    }
  }

  async removeRecordsAsync(
    recordIdentities: RecordIdentity[]
  ): Promise<InitializedRecord[]> {
    const records = [];
    for (let recordIdentity of recordIdentities) {
      let record = await this.getRecordAsync(recordIdentity);
      if (record) {
        records.push(record);
        delete this._records[recordIdentity.type][recordIdentity.id];
      }
    }
    return records;
  }

  async getInverseRelationshipsAsync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): Promise<RecordRelationshipIdentity[]> {
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

  async addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
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

  async removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void> {
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
