import { SyncRecordUpdatable } from '@orbit/records';
import { RecordChangeset, SyncRecordAccessor } from './record-accessor';
import { RecordCacheUpdateDetails } from './response';

export interface RecordTransformBuffer
  extends SyncRecordUpdatable<RecordCacheUpdateDetails>,
    SyncRecordAccessor {
  resetState(): void;
  startTrackingChanges(): void;
  stopTrackingChanges(): RecordChangeset;
}
