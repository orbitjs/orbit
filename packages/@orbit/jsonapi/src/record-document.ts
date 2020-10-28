import { Dict } from '@orbit/utils';
import { Link, Record } from '@orbit/records';

export interface RecordDocument {
  data: Record | Record[] | null;
  included?: Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export type RecordDocumentOrDocuments = RecordDocument | RecordDocument[];
