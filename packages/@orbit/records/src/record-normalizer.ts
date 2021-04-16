import {
  InitializedRecord,
  RecordIdentity,
  UninitializedRecord
} from './record';

export interface RecordNormalizer<
  RI = RecordIdentity,
  R = UninitializedRecord
> {
  normalizeRecordIdentity(recordIdentity: RI): RecordIdentity;
  normalizeRecord(record: R): InitializedRecord;
}
