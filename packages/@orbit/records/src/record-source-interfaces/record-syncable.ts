import { Syncable } from '@orbit/data';
import { RecordOperation } from '../record-operation';
import { RecordTransformBuilder } from '../record-transform-builder';

export type RecordSyncable = Syncable<RecordOperation, RecordTransformBuilder>;
