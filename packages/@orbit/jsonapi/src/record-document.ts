import { Dict } from '@orbit/utils';
import {
  Link,
  Record,
  RecordOperation,
  RecordQueryResult,
  RecordTransformResult
} from '@orbit/records';
import { FullResponse } from '@orbit/data';

export interface RecordDocument {
  data: Record | Record[] | null;
  included?: Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export type RecordQueryFullResponse = FullResponse<
  RecordQueryResult,
  RecordDocument,
  RecordOperation
>;

export type RecordTransformFullResponse = FullResponse<
  RecordTransformResult,
  RecordDocument,
  RecordOperation
>;
