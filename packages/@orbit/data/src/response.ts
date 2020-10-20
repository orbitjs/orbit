import { Operation } from './operation';
import { RequestOptions } from './request';
import { Transform } from './transform';

export type DataOrFullResponse<D, R, O extends Operation> =
  | D
  | FullResponse<D, R, O>;

export type TransformsOrFullResponse<D, R, O extends Operation> =
  | Transform<O>[]
  | FullResponse<D, R, O>;

export type NamedResponse<D, R, O extends Operation> = [
  string,
  DataOrFullResponse<D, R, O>
];

export interface NamedResponseMap<D, R, O extends Operation> {
  [name: string]: DataOrFullResponse<D, R, O>;
}

export interface FullResponse<D, R, O extends Operation> {
  data?: D;
  details?: R;
  transforms?: Transform<O>[];

  // Note: Response `data` and `details` from other sources do not necessarily
  // match the types of the primary response
  sources?: NamedResponseMap<unknown, unknown, O>;
}

export interface ResponseHints<D> {
  data?: D;
}

export function mapNamedResponses<D, R, O extends Operation>(
  namedResponses: NamedResponse<D, R, O>[]
): NamedResponseMap<D, R, O> {
  let map: NamedResponseMap<D, R, O> = {};
  for (let r of namedResponses) {
    map[r[0] as string] = r[1];
  }
  return map;
}

export function createRequestedResponse<D, R, O extends Operation>(
  response: FullResponse<D, R, O>,
  otherResponses?: NamedResponse<unknown, unknown, O>[],
  options?: RequestOptions
): DataOrFullResponse<D, R, O> {
  if (options?.fullResponse) {
    return createRequestedFullResponse<D, R, O>(
      response,
      otherResponses,
      options
    );
  } else {
    return response.data as D;
  }
}

export function createRequestedFullResponse<D, R, O extends Operation>(
  response: FullResponse<D, R, O>,
  otherResponses?: NamedResponse<unknown, unknown, O>[],
  options?: RequestOptions
): FullResponse<D, R, O> {
  const { data, transforms } = response;
  const fullResponse = {} as FullResponse<D, R, O>;

  if (data !== undefined) {
    fullResponse.data = data;
  }

  if (transforms !== undefined) {
    fullResponse.transforms = transforms;
  }

  if (options?.includeDetails) {
    fullResponse.details = response.details;
  }

  if (options?.includeSources) {
    fullResponse.sources = otherResponses
      ? mapNamedResponses<unknown, unknown, O>(otherResponses)
      : {};
  }

  return fullResponse;
}
