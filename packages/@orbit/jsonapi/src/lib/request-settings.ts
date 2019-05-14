import { clone, deepGet, deepMerge, deepSet, isArray } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-request-processor';
import Orbit, { Source, Query, Transform } from '@orbit/data';

const { deprecate } = Orbit;

export interface Filter {
  [filterOn: string]: any;
}

export interface RequestOptions {
  filter?: Filter[];
  sort?: any;
  page?: any;
  include?: any;
  settings?: FetchSettings;
}

export function buildFetchSettings(options: RequestOptions = {}, customSettings?: FetchSettings): FetchSettings {
  let settings = options.settings ? clone(options.settings) : {};

  if (customSettings) {
    deepMerge(settings, customSettings);
  }

  ['filter', 'include', 'page', 'sort'].forEach(param => {
    let value = (options as any)[param];
    if (value) {
      if (param === 'include' && isArray(value)) {
        value = value.join(',');
      }

      deepSet(settings, ['params', param], value);
    }
  });

  let timeout = (options as any)['timeout'];
  if (timeout) {
    deprecate("JSONAPI: Specify `timeout` option inside a `settings` object.")
    settings.timeout = timeout;
  }

  return settings;
}
