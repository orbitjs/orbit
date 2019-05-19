import { Dict } from '@orbit/utils';
import {
  Link,
  Record
} from '@orbit/data';

export interface RecordDocument {
  data: Record | Record[];
  included?: Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}
