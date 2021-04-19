import { Operation } from './operation';
import {
  DefaultRequestOptions,
  FullRequestOptions,
  RequestOptions
} from './request';
import { FullResponse } from './response';
import { TransformOrOperations } from './transform';

export interface AsyncUpdatable<
  Data,
  Details,
  O extends Operation,
  TransformBuilder,
  Options extends RequestOptions = RequestOptions
> {
  update<RequestData extends Data = Data>(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options?: DefaultRequestOptions<Options>,
    id?: string
  ): Promise<RequestData>;
  update<
    RequestData extends Data = Data,
    RequestDetails extends Details = Details,
    RequestOperation extends O = O
  >(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options: FullRequestOptions<Options>,
    id?: string
  ): Promise<FullResponse<RequestData, RequestDetails, RequestOperation>>;
}

export interface SyncUpdatable<
  Data,
  Details,
  O extends Operation,
  TransformBuilder,
  Options extends RequestOptions = RequestOptions
> {
  update<RequestData extends Data = Data>(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options?: DefaultRequestOptions<Options>,
    id?: string
  ): RequestData;
  update<
    RequestData extends Data = Data,
    RequestDetails extends Details = Details,
    RequestOperation extends O = O
  >(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options: FullRequestOptions<Options>,
    id?: string
  ): FullResponse<RequestData, RequestDetails, RequestOperation>;
}
