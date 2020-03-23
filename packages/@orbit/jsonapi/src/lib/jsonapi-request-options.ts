import { clone, deepMerge, deepSet, merge } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-request-processor';
import Orbit from '@orbit/data';

const { deprecate } = Orbit;

export interface Filter {
  [filterOn: string]: any;
}

export interface JSONAPIRequestOptions {
  filter?: Filter[];
  sort?: any;
  page?: any;
  include?: any;
  settings?: FetchSettings;
}

export function buildFetchSettings(
  options: JSONAPIRequestOptions = {},
  customSettings?: FetchSettings
): FetchSettings {
  let settings = options.settings ? clone(options.settings) : {};

  if (customSettings) {
    deepMerge(settings, customSettings);
  }

  ['filter', 'include', 'page', 'sort'].forEach(param => {
    let value = (options as any)[param];
    if (value) {
      if (param === 'include' && Array.isArray(value)) {
        value = value.join(',');
      }

      deepSet(settings, ['params', param], value);
    }
  });

  let timeout = (options as any)['timeout'];
  if (timeout) {
    deprecate('JSONAPI: Specify `timeout` option inside a `settings` object.');
    settings.timeout = timeout;
  }

  return settings;
}

export function mergeJSONAPIRequestOptions(
  options: JSONAPIRequestOptions,
  customOptions: JSONAPIRequestOptions
) {
  let result: JSONAPIRequestOptions = merge({}, options, customOptions);
  if (options.include && customOptions.include) {
    result.include = mergeIncludePaths(options.include, customOptions.include);
  }
  if (options.filter && customOptions.filter) {
    result.filter = mergeFilters(options.filter, customOptions.filter);
  }
  return result;
}

function mergeIncludePaths(paths: string[], customPaths: string[]) {
  let result = clone(paths);
  for (let customPath of customPaths) {
    if (!paths.includes(customPath)) {
      result.push(customPath);
    }
  }
  return result;
}

function mergeFilters(filters: Filter[], customFilters: Filter[]) {
  let result: Filter[] = clone(filters);
  let filterKeys: string[] = filters.map(f => filterKey(f));
  for (let customFilter of customFilters) {
    let customerFilterKey = filterKey(customFilter);
    if (filterKeys.includes(customerFilterKey)) {
      let filterToOverride = result.find(
        f => filterKey(f) === customerFilterKey
      );
      setFilterValue(filterToOverride, filterValue(customFilter));
    } else {
      result.push(customFilter);
    }
  }
  return result;
}

function filterKey(filter: Filter): string {
  return Object.keys(filter)[0];
}

function filterValue(filter: Filter): string {
  return Object.values(filter)[0];
}

function setFilterValue(filter: Filter, value: any) {
  filter[filterKey(filter)] = value;
}
