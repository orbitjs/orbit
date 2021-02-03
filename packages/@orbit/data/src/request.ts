import { Options } from './options';

export interface RequestOptions extends Options {
  fullResponse?: true;
  includeSources?: boolean | string[];
  sources?: { [name: string]: RequestOptions };
}

export type DefaultRequestOptions = Exclude<RequestOptions, 'fullResponse'>;

export interface FullRequestOptions extends RequestOptions {
  fullResponse: true;
}

/**
 * Merges general request options with those specific to a source. The more
 * specific options override the general options. If an array of options is
 * provided, they will be merged to a single set.
 */
export function requestOptionsForSource(
  options: RequestOptions | undefined | (RequestOptions | undefined)[],
  source?: string
): RequestOptions | undefined {
  let result: RequestOptions | undefined;

  if (options !== undefined) {
    if (Array.isArray(options)) {
      for (let o of options) {
        if (o) {
          let so = extractRequestOptionsForSource(o, source);
          if (result) {
            result = {
              ...result,
              ...so
            };
          } else {
            result = so;
          }
        }
      }
    } else {
      result = extractRequestOptionsForSource(options, source);
    }
  }

  return result;
}

function extractRequestOptionsForSource(
  options: RequestOptions,
  source?: string
): RequestOptions {
  if (options.sources) {
    let { sources, ...rest } = options;

    if (source && sources[source]) {
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
