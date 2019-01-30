/* eslint-disable valid-jsdoc */
import { isNone } from '@orbit/utils';
import Orbit, {
  Record,
  RecordIdentity,
  equalRecordIdentities
} from '@orbit/data';
import {
  RecordRelationshipIdentity,
  SyncRecordCache,
  SyncRecordCacheSettings
} from '@orbit/record-cache';

export interface LocalStorageCacheSettings extends SyncRecordCacheSettings {
  delimiter?: string;
  namespace?: string;
}

/**
 * A cache used to access records in local storage.
 *
 * Because local storage access is synchronous, this cache extends `SyncRecordCache`.
 */
export default class LocalStorageCache extends SyncRecordCache {
  protected _namespace: string;
  protected _delimiter: string;

  constructor(settings: LocalStorageCacheSettings) {
    super(settings);

    this._namespace = settings.namespace || 'orbit';
    this._delimiter = settings.delimiter || '/';

    this.reset();
  }

  get namespace(): string {
    return this._namespace;
  }

  get delimiter(): string {
    return this._delimiter;
  }

  getKeyForRecord(record: RecordIdentity | Record): string {
    return [this.namespace, record.type, record.id].join(this.delimiter);
  }

  getKeyForRecordInverses(record: RecordIdentity | Record): string {
    return [this.namespace, 'inverseRels', record.type, record.id].join(this.delimiter);
  }

  getRecordSync(identity: RecordIdentity): Record | null {
    const key = this.getKeyForRecord(identity);

    let result = JSON.parse(Orbit.globals.localStorage.getItem(key));

    if (result && this._keyMap) {
      this._keyMap.pushRecord(result);
    }

    return result;
  }

  getRecordsSync(typeOrIdentities?: string | RecordIdentity[]): Record[] {
    const records: Record[] = [];

    if (Array.isArray(typeOrIdentities)) {
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let identity of identities) {
        let record: Record = this.getRecordSync(identity);
        if (record) {
          records.push(record);
        }
      }
    } else {
      const type: string = typeOrIdentities;

      for (let key in Orbit.globals.localStorage) {
        if (key.indexOf(this.namespace + this.delimiter) === 0) {
          let typesMatch = isNone(type);

          if (!typesMatch) {
            let fragments = key.split(this.delimiter);
            let recordType = fragments[1];
            typesMatch = (recordType === type);
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
    }

    return records;
  }

  setRecordSync(record: Record): void {
    const key = this.getKeyForRecord(record);

    if (this._keyMap) {
      this._keyMap.pushRecord(record);
    }

    Orbit.globals.localStorage.setItem(key, JSON.stringify(record));
  }

  setRecordsSync(records: Record[]): void {
    for (let record of records) {
      this.setRecordSync(record);
    }
  }

  removeRecordSync(recordIdentity: RecordIdentity): Record | null {
    const record = this.getRecordSync(recordIdentity);
    if (record) {
      const key = this.getKeyForRecord(record);
      Orbit.globals.localStorage.removeItem(key);
      return record;
    } else {
      return null;
    }
  }

  removeRecordsSync(recordIdentities: RecordIdentity[]): Record[] {
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

  getInverseRelationshipsSync(recordIdentity: RecordIdentity): RecordRelationshipIdentity[] {
    const key = this.getKeyForRecordInverses(recordIdentity);
    const item = Orbit.globals.localStorage.getItem(key);

    if (item) {
      return JSON.parse(item);
    }

    return [];
  }

  addInverseRelationshipsSync(relationships: RecordRelationshipIdentity[]): void {
    for (let relationship of relationships) {
      const key = this.getKeyForRecordInverses(relationship.relatedRecord);
      const item = Orbit.globals.localStorage.getItem(key);
      let rels = item ? JSON.parse(item) : [];
      rels.push(relationship);
      Orbit.globals.localStorage.setItem(key, JSON.stringify(rels));
    }
  }

  removeInverseRelationshipsSync(relationships: RecordRelationshipIdentity[]): void {
    for (let relationship of relationships) {
      const key = this.getKeyForRecordInverses(relationship.relatedRecord);
      const item = Orbit.globals.localStorage.getItem(key);
      if (item) {
        let rels: RecordRelationshipIdentity[] = item ? JSON.parse(item) : [];
        let newRels = rels.filter(rel => !(equalRecordIdentities(rel.record, relationship.record) &&
                                           rel.relationship === relationship.relationship));
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

    this._processors.forEach(processor => processor.reset());
  }

  upgrade() {
    this._processors.forEach(processor => processor.upgrade());
  }
}
