import { Dict, objectValues } from '@orbit/utils';
import {
  deserializeRecordIdentity,
  InitializedRecord,
  RecordIdentity,
  serializeRecordIdentity
} from '@orbit/records';
import { RecordChangeset, RecordRelationshipIdentity } from './record-accessor';
import { SyncRecordCache, SyncRecordCacheSettings } from './sync-record-cache';
import { RecordTransformBuffer } from './record-transform-buffer';

function serializeRecordRelationshipIdentity(
  rri: RecordRelationshipIdentity
): string {
  return `${serializeRecordIdentity(rri.record)}::${rri.relationship}`;
}

function deserializeRecordRelationshipIdentity(
  rri: string
): { record: RecordIdentity; relationship: string } {
  const [record, relationship] = rri.split('::');
  return { record: deserializeRecordIdentity(record), relationship };
}

export interface SimpleRecordTransformBufferState {
  records: Dict<InitializedRecord | null>;
  inverseRelationships: Dict<Dict<RecordRelationshipIdentity | null>>;
}

export class SimpleRecordTransformBuffer
  extends SyncRecordCache
  implements RecordTransformBuffer {
  protected _state!: SimpleRecordTransformBufferState;
  protected _delta?: SimpleRecordTransformBufferState;

  constructor(settings: SyncRecordCacheSettings) {
    super(settings);
    this.resetState();
  }

  resetState(): void {
    this._state = {
      records: {},
      inverseRelationships: {}
    };
  }

  startTrackingChanges(): void {
    this._delta = {
      records: {},
      inverseRelationships: {}
    };
  }

  stopTrackingChanges(): RecordChangeset {
    if (this._delta === undefined) {
      throw new Error(
        `Changes are not being tracked. Call 'startTrackingChanges' before 'stopTrackingChanges'`
      );
    }

    let { records, inverseRelationships } = this._delta;
    let changeset: RecordChangeset = {};

    for (let rid of Object.keys(records)) {
      let rv = records[rid];
      if (rv === null) {
        changeset.removeRecords = changeset.removeRecords ?? [];
        changeset.removeRecords.push(deserializeRecordIdentity(rid));
      } else {
        changeset.setRecords = changeset.setRecords ?? [];
        changeset.setRecords.push(rv);
      }
    }

    for (let rid of Object.keys(inverseRelationships)) {
      let relatedRecord = deserializeRecordIdentity(rid);
      let rels = inverseRelationships[rid];
      for (let rel of Object.keys(rels)) {
        let rv = rels[rel];
        let { record, relationship } = deserializeRecordRelationshipIdentity(
          rel
        );
        let rri = { relatedRecord, record, relationship };
        if (rv === null) {
          changeset.removeInverseRelationships =
            changeset.removeInverseRelationships ?? [];
          changeset.removeInverseRelationships.push(rri);
        } else {
          changeset.addInverseRelationships =
            changeset.addInverseRelationships ?? [];
          changeset.addInverseRelationships.push(rri);
        }
      }
    }

    this._delta = undefined;

    return changeset;
  }

  getRecordSync(identity: RecordIdentity): InitializedRecord | undefined {
    return this._state.records[serializeRecordIdentity(identity)] ?? undefined;
  }

  getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): InitializedRecord[] {
    if (typeof typeOrIdentities === 'string') {
      return objectValues(this._state.records[typeOrIdentities]);
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
    this._state.records[serializeRecordIdentity(record)] = record;
    if (this._delta) {
      this._delta.records[serializeRecordIdentity(record)] = record;
    }
  }

  setRecordsSync(records: InitializedRecord[]): void {
    records.forEach((record) => this.setRecordSync(record));
  }

  removeRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined {
    const record = this.getRecordSync(recordIdentity);
    if (record) {
      delete this._state.records[serializeRecordIdentity(record)];
      if (this._delta) {
        this._delta.records[serializeRecordIdentity(record)] = null;
      }
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
        delete this._state.records[serializeRecordIdentity(record)];
        if (this._delta) {
          this._delta.records[serializeRecordIdentity(record)] = null;
        }
      }
    }
    return records;
  }

  getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[] {
    if (Array.isArray(recordIdentityOrIdentities)) {
      let relationships: RecordRelationshipIdentity[] = [];
      recordIdentityOrIdentities.forEach((record) => {
        Array.prototype.push(
          relationships,
          this._getInverseRelationshipsSync(record)
        );
      });
      return relationships;
    } else {
      return this._getInverseRelationshipsSync(recordIdentityOrIdentities);
    }
  }

  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    for (let relationship of relationships) {
      const ri = serializeRecordIdentity(relationship.relatedRecord);
      const rri = serializeRecordRelationshipIdentity(relationship);
      const rels = this._state.inverseRelationships[ri] ?? {};
      rels[rri] = relationship;
      this._state.inverseRelationships[ri] = rels;
      if (this._delta) {
        const rels = this._delta.inverseRelationships[ri] ?? {};
        rels[rri] = relationship;
        this._delta.inverseRelationships[ri] = rels;
      }
    }
  }

  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    for (let relationship of relationships) {
      const ri = serializeRecordIdentity(relationship.relatedRecord);
      const rri = serializeRecordRelationshipIdentity(relationship);
      const rels = this._state.inverseRelationships[ri];

      if (rels) {
        rels[rri] = null;
        if (this._delta) {
          const rels = this._delta.inverseRelationships[ri] ?? {};
          rels[rri] = null;
        }
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _getInverseRelationshipsSync(
    recordIdentity: RecordIdentity
  ): RecordRelationshipIdentity[] {
    let relationships = this._state.inverseRelationships[
      serializeRecordIdentity(recordIdentity)
    ];
    if (relationships) {
      return objectValues(relationships).filter((r) => r !== null);
    } else {
      return [];
    }
  }
}
