import { Operation } from './operation';
import { QueryOrExpressions } from './query';
import { QueryExpression } from './query-expression';
import {
  DefaultRequestOptions,
  FullRequestOptions,
  RequestOptions
} from './request';
import { FullResponse } from './response';

export interface AsyncQueryable<
  Data,
  Details,
  O extends Operation,
  QE extends QueryExpression,
  QueryBuilder,
  Options extends RequestOptions = RequestOptions
> {
  query<RequestData extends Data = Data>(
    queryOrExpressions: QueryOrExpressions<QE, QueryBuilder>,
    options?: DefaultRequestOptions<Options>,
    id?: string
  ): Promise<RequestData>;
  query<
    RequestData extends Data = Data,
    RequestDetails extends Details = Details,
    RequestOperation extends O = O
  >(
    queryOrExpressions: QueryOrExpressions<QE, QueryBuilder>,
    options: FullRequestOptions<Options>,
    id?: string
  ): Promise<FullResponse<RequestData, RequestDetails, RequestOperation>>;
}

export interface SyncQueryable<
  Data,
  Details,
  O extends Operation,
  QE extends QueryExpression,
  QueryBuilder,
  Options extends RequestOptions = RequestOptions
> {
  query<RequestData extends Data = Data>(
    queryOrExpressions: QueryOrExpressions<QE, QueryBuilder>,
    options?: DefaultRequestOptions<Options>,
    id?: string
  ): RequestData;
  query<
    RequestData extends Data = Data,
    RequestDetails extends Details = Details,
    RequestOperation extends O = O
  >(
    queryOrExpressions: QueryOrExpressions<QE, QueryBuilder>,
    options: FullRequestOptions<Options>,
    id?: string
  ): FullResponse<RequestData, RequestDetails, RequestOperation>;
}
