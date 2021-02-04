import { RequestOptions } from './request';

export interface Operation {
  op: string;
  options?: RequestOptions;
}
