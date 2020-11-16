import { Operation } from './operation';
import { Transform } from './transform';

export type DataOrFullResponse<Data, Details, O extends Operation> =
  | Data
  | FullResponse<Data, Details, O>;

export type TransformsOrFullResponse<Data, Details, O extends Operation> =
  | Transform<O>[]
  | FullResponse<Data, Details, O>;

export type NamedFullResponse<Data, Details, O extends Operation> = [
  string,
  FullResponse<Data, Details, O>
];

export interface NamedFullResponseMap<Data, Details, O extends Operation> {
  [name: string]: FullResponse<Data, Details, O>;
}

export interface FullResponse<Data, Details, O extends Operation> {
  data?: Data;
  details?: Details;
  transforms?: Transform<O>[];

  // Note: Response `data` and `details` from other sources do not necessarily
  // match the types of the primary response
  sources?: NamedFullResponseMap<unknown, unknown, O>;
}

export interface ResponseHints<Data, Details> {
  data?: Data;
  details?: Details;
}

export function mapNamedFullResponses<Data, Details, O extends Operation>(
  responses: (NamedFullResponse<Data, Details, O> | undefined)[]
): NamedFullResponseMap<Data, Details, O> {
  let map: NamedFullResponseMap<Data, Details, O> = {};
  for (let r of responses) {
    if (r) {
      map[r[0] as string] = r[1];
    }
  }
  return map;
}
