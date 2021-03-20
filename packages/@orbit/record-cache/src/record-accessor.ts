import {
  RecordKeyMap,
  InitializedRecord,
  RecordSchema,
  RecordIdentity
} from '@orbit/records';

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
  name?: string;
  keyMap?: RecordKeyMap;
  schema: RecordSchema;
}

export interface RecordChangeset {
  setRecords?: InitializedRecord[];
  removeRecords?: RecordIdentity[];
  addInverseRelationships?: RecordRelationshipIdentity[];
  removeInverseRelationships?: RecordRelationshipIdentity[];
}

export interface SyncRecordAccessor extends BaseRecordAccessor {
  // Getters
  getRecordSync(recordIdentity: RecordIdentity): InitializedRecord | undefined;
  getRecordsSync(
    typeOrIdentities?: string | RecordIdentity[]
  ): InitializedRecord[];
  getRelatedRecordSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity | null | undefined;
  getRelatedRecordsSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity[] | undefined;
  getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[];

  // Setters
  setRecordSync(record: InitializedRecord): void;
  setRecordsSync(records: InitializedRecord[]): void;
  removeRecordSync(
    recordIdentity: RecordIdentity
  ): InitializedRecord | undefined;
  removeRecordsSync(recordIdentities: RecordIdentity[]): InitializedRecord[];
  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  applyRecordChangesetSync(changeset: RecordChangeset): void;
}

export interface AsyncRecordAccessor extends BaseRecordAccessor {
  // Getters
  getRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<InitializedRecord | undefined>;
  getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<InitializedRecord[]>;
  getRelatedRecordAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity | null | undefined>;
  getRelatedRecordsAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity[] | undefined>;
  getInverseRelationshipsAsync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): Promise<RecordRelationshipIdentity[]>;

  // Setters
  setRecordAsync(record: InitializedRecord): Promise<void>;
  setRecordsAsync(records: InitializedRecord[]): Promise<void>;
  removeRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<InitializedRecord | undefined>;
  removeRecordsAsync(
    recordIdentities: RecordIdentity[]
  ): Promise<InitializedRecord[]>;
  addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
  removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
  applyRecordChangesetAsync(changeset: RecordChangeset): Promise<void>;
}
