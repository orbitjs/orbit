import { clone, deepGet, deepMerge, deepSet, deprecate, isArray } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-source';
import { Source, Query, Transform } from '@orbit/data';

export interface RequestOptions {
  filter?: any;
  sort?: any;
  page?: any;
  include?: any;
  settings?: FetchSettings;
}

export function customRequestOptions(source: Source, queryOrTransform: Query | Transform): RequestOptions {
  return deepGet(queryOrTransform, ['options', 'sources', source.name]);
}

export function buildFetchSettings(options: RequestOptions = {}, customSettings?: FetchSettings): FetchSettings {
  let settings = options.settings ? clone(options.settings) : {};

  if (customSettings) {
    deepMerge(settings, customSettings);
  }

  ['filter', 'include', 'page', 'sort'].forEach(param => {
    if (options[param]) {
      let value = options[param];
      if (param === 'include' && isArray(value)) {
        value = value.join(',');
      }

      deepSet(settings, ['params', param], value);
    }
  });

  if (options['timeout']) {
    deprecate("JSONAPI: Specify `timeout` option inside a `settings` object.")
    settings.timeout = options['timeout'];
  }

  return settings;
}
