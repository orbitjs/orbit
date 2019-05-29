import { KeyMap, Record, Schema, RecordIdentity } from '@orbit/data';

export interface RelatedRecordIdentity {
  record: RecordIdentity;
  relationship: string;
}

export interface RecordRelationshipIdentity {
  record: RecordIdentity;
  relationship: string;
  relatedRecord: RecordIdentity;
}

export interface BaseRecordAccessor {
  keyMap: KeyMap;
  schema: Schema;
}

export interface SyncRecordAccessor extends BaseRecordAccessor {
  // Getters
  getRecordSync(recordIdentity: RecordIdentity): Record;
  getRecordsSync(typeOrIdentities?: string | RecordIdentity[]): Record[];
  getRelatedRecordSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity;
  getRelatedRecordsSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity[];
  getInverseRelationshipsSync(
    record: RecordIdentity
  ): RecordRelationshipIdentity[];

  // Setters
  setRecordSync(record: Record): void;
  setRecordsSync(records: Record[]): void;
  removeRecordSync(recordIdentity: RecordIdentity): Record;
  removeRecordsSync(recordIdentities: RecordIdentity[]): Record[];
  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
}

export interface AsyncRecordAccessor extends BaseRecordAccessor {
  // Getters
  getRecordAsync(recordIdentity: RecordIdentity): Promise<Record>;
  getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<Record[]>;
  getRelatedRecordAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity>;
  getRelatedRecordsAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity[]>;
  getInverseRelationshipsAsync(
    recordIdentity: RecordIdentity
  ): Promise<RecordRelationshipIdentity[]>;

  // Setters
  setRecordAsync(record: Record): Promise<void>;
  setRecordsAsync(records: Record[]): Promise<void>;
  removeRecordAsync(recordIdentity: RecordIdentity): Promise<Record>;
  removeRecordsAsync(recordIdentities: RecordIdentity[]): Promise<Record[]>;
  addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
  removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
}
