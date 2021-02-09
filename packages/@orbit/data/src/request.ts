import { Options } from './options';

export interface RequestOptions extends Options {
  fullResponse?: boolean;
  sources?: { [name: string]: RequestOptions };
}

export type DefaultRequestOptions<RO extends RequestOptions> = RO & {
  fullResponse?: false;
};

export type FullRequestOptions<RO extends RequestOptions> = RO & {
  fullResponse: true;
};

/**
 * Merges general request options with those specific to a source. The more
 * specific options override the general options. If an array of options is
 * provided, they will be merged to a single set.
 */
export function requestOptionsForSource<RO extends RequestOptions>(
  options: RO | undefined | (RO | undefined)[],
  source?: string
): RO | undefined {
  let result: RO | undefined;

  if (options !== undefined) {
    if (Array.isArray(options)) {
      for (let o of options) {
        if (o) {
          let so = extractRequestOptionsForSource<RO>(o, source);
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
      result = extractRequestOptionsForSource<RO>(options, source);
    }
  }

  return result;
}

function extractRequestOptionsForSource<RO extends RequestOptions>(
  options: RO,
  source?: string
): RO {
  if (options.sources) {
    let { sources, ...rest } = options;

    if (source && sources[source]) {
      return {
        ...rest,
        ...sources[source]
      } as RO;
    } else {
      return rest as RO;
    }
  } else {
    return options;
  }
}
