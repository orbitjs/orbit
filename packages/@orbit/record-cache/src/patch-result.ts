import { Record, RecordIdentity, RecordOperation } from '@orbit/data';

export type PatchResultData = Record | RecordIdentity | null;

export interface PatchResult {
  inverse: RecordOperation[];
  data: PatchResultData[];
}
