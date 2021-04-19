import {
  InitializedRecord,
  RecordIdentity,
  UninitializedRecord
} from './record';

export interface RecordNormalizer<
  RT = string,
  RI = RecordIdentity,
  R = UninitializedRecord
> {
  normalizeRecordType(recordType: RT): string;
  normalizeRecordIdentity(recordIdentity: RI): RecordIdentity;
  normalizeRecord(record: R): InitializedRecord;
}
