import { deepSet } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-source';

export interface RequestOptions {
  filter?: any;
  sort?: any;
  page?: any;
  include?: any;
  timeout?: number;
}

export function buildFetchSettings(options: RequestOptions, settings: FetchSettings = {}): FetchSettings {
  ['filter', 'include', 'page', 'sort'].forEach(param => {
    if (options[param]) {
      deepSet(settings, ['params', param], options[param]);
    }
  });

  if (options.timeout) {
    settings.timeout = options.timeout;
  }

  return settings;
}
