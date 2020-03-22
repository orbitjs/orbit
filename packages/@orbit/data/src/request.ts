import { Options } from './options';

export interface RequestOptions extends Options {
  sources?: { [name: string]: { [key: string]: unknown } };
}

