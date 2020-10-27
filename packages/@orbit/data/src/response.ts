import { Operation } from './operation';
import { Transform } from './transform';

export type DataOrFullResponse<D, R, O extends Operation> =
  | D
  | D[]
  | FullResponse<D, R, O>;

export type TransformsOrFullResponse<D, R, O extends Operation> =
  | Transform<O>[]
  | FullResponse<D, R, O>;

export type NamedFullResponse<D, R, O extends Operation> = [
  string,
  FullResponse<D, R, O>
];

export interface NamedFullResponseMap<D, R, O extends Operation> {
  [name: string]: FullResponse<D, R, O>;
}

export interface FullResponse<D, R, O extends Operation> {
  data?: D | D[];
  details?: R | R[];
  transforms?: Transform<O>[];

  // Note: Response `data` and `details` from other sources do not necessarily
  // match the types of the primary response
  sources?: NamedFullResponseMap<unknown, unknown, O>;
}

export interface ResponseHints<D> {
  data?: D;
}

export function mapNamedFullResponses<D, R, O extends Operation>(
  responses: (NamedFullResponse<D, R, O> | undefined)[]
): NamedFullResponseMap<D, R, O> {
  let map: NamedFullResponseMap<D, R, O> = {};
  for (let r of responses) {
    if (r) {
      map[r[0] as string] = r[1];
    }
  }
  return map;
}
