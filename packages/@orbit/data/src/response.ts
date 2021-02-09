import { Operation } from './operation';
import { Transform } from './transform';

export type NamedFullResponse<
  Data,
  Details = unknown,
  O extends Operation = Operation
> = [string, FullResponse<Data, Details, O>];

export interface NamedFullResponseMap<
  Data,
  Details = unknown,
  O extends Operation = Operation
> {
  [name: string]: FullResponse<Data, Details, O>;
}

export interface FullResponse<
  Data,
  Details = unknown,
  O extends Operation = Operation
> {
  /**
   * Primary data for this response.
   */
  data?: Data;

  /**
   * Source-specific response details. For example, a request that uses `fetch`
   * might include the raw response document in `details`.
   */
  details?: Details;

  /**
   * Transforms should be returned if fulfilling a request results in mutations
   * to a source.
   */
  transforms?: Transform<O>[];

  /**
   * If fulfilling this request triggers downstream requests in other sources,
   * those full responses may be returned in the `sources` map.
   *
   * Note: Response `data` and `details` from other sources do not necessarily
   * match the types of the primary response
   */
  sources?: NamedFullResponseMap<unknown, unknown, O>;
}

export interface ResponseHints<Data, Details> {
  data?: Data;
  details?: Details;
}

export function mapNamedFullResponses<
  Data = unknown,
  Details = unknown,
  O extends Operation = Operation
>(
  responses: (NamedFullResponse<Data, Details, O> | undefined)[]
): NamedFullResponseMap<Data, Details, O> {
  let map: NamedFullResponseMap<Data, Details, O> = {};
  for (let r of responses) {
    if (typeof r?.[0] === 'string' && r?.[1] !== undefined) {
      map[r[0]] = r[1];
    }
  }
  return map;
}
