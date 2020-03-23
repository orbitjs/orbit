import { Options } from './options';

export interface RequestOptions extends Options {
  sources?: { [name: string]: { [key: string]: unknown } };
}

/**
 * Merges general request options with those specific to a source. The more
 * specific options override the general options.
 */
export function requestOptionsForSource(
  options: RequestOptions,
  source: string
): Options {
  if (options.sources) {
    let { sources, ...rest } = options;

    if (sources && sources[source]) {
      return {
        ...rest,
        ...sources[source]
      };
    } else {
      return rest;
    }
  } else {
    return options;
  }
}
