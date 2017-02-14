import { Identity } from './identity';
import { Record } from './record';

export interface Operation {
  op: string;
  record?: Record;
  attribute?: string;
  relationship?: string;
  relatedRecord?: Identity;
  relatedRecords?: Identity[];
  value?: any;
  _deleted?: boolean;
}
