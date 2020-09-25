import { Record, RecordIdentity, RecordOperation } from '@orbit/data';

export type PatchResultData = Record | RecordIdentity | null | undefined;

export interface PatchResult {
  inverse: RecordOperation[];
  data: PatchResultData[];
}
