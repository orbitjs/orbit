import { Dict } from '@orbit/utils';
import { Link, InitializedRecord } from '@orbit/records';

export interface RecordDocument {
  data: InitializedRecord | InitializedRecord[] | null;
  included?: InitializedRecord[];
  links?: Dict<Link>;
  meta?: Dict<unknown>;
}

export type RecordDocumentOrDocuments = RecordDocument | RecordDocument[];
