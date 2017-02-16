import { Record, RecordIdentity } from './record';

export interface Operation {
  op: string;
  record?: Record;
  attribute?: string;
  relationship?: string;
  relatedRecord?: RecordIdentity;
  relatedRecords?: RecordIdentity[];
  value?: any;
  _deleted?: boolean;
}
