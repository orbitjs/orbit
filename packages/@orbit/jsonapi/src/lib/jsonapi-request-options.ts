import { RequestOptions } from '@orbit/data';
import { clone, deepMerge, deepSet } from '@orbit/utils';
import { FetchSettings } from '../jsonapi-request-processor';

export interface Filter {
  [filterOn: string]: any;
}

export interface JSONAPIRequestOptions extends RequestOptions {
  raiseNotFoundExceptions?: boolean;
  filter?: Filter[];
  sort?: any;
  page?: any;
  include?: any;
  settings?: FetchSettings;
  url?: string;
}

export function buildFetchSettings(
  options: JSONAPIRequestOptions = {},
  customSettings?: FetchSettings
): FetchSettings {
  let settings = options.settings ? clone(options.settings) : {};

  if (customSettings) {
    deepMerge(settings, customSettings);
  }

  ['filter', 'include', 'page', 'sort'].forEach((param) => {
    let value = (options as any)[param];
    if (value) {
      if (param === 'include' && Array.isArray(value)) {
        value = value.join(',');
      }

      deepSet(settings, ['params', param], value);
    }
  });

  return settings;
}

export function mergeJSONAPIRequestOptions(
  options: JSONAPIRequestOptions,
  customOptions: JSONAPIRequestOptions
): JSONAPIRequestOptions {
  const result: JSONAPIRequestOptions = Object.assign(
    {},
    options,
    customOptions
  );
  if (options.include && customOptions.include) {
    result.include = mergeIncludePaths(options.include, customOptions.include);
  }
  if (options.filter && customOptions.filter) {
    result.filter = mergeFilters(options.filter, customOptions.filter);
  }
  return result;
}

function mergeIncludePaths(paths: string[], customPaths: string[]) {
  const result = clone(paths);
  for (let customPath of customPaths) {
    if (!paths.includes(customPath)) {
      result.push(customPath);
    }
  }
  return result;
}

function mergeFilters(filters: Filter[], customFilters: Filter[]) {
  const result: Filter[] = clone(filters);
  let filterKeys: string[] = filters.map((f) => filterKey(f));
  for (let customFilter of customFilters) {
    let customerFilterKey = filterKey(customFilter);
    let filterToOverride;
    if (filterKeys.includes(customerFilterKey)) {
      filterToOverride = result.find(
        (f) => filterKey(f) === customerFilterKey
      ) as Filter;
    }
    if (filterToOverride) {
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

function setFilterValue(filter: Filter, value: unknown): void {
  filter[filterKey(filter)] = value;
}
