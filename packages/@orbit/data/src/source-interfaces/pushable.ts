import { Orbit, settleInSeries, fulfillInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import { Transform, TransformOrOperations, buildTransform } from '../transform';
import {
  DefaultRequestOptions,
  FullRequestOptions,
  RequestOptions
} from '../request';
import {
  FullResponse,
  NamedFullResponse,
  mapNamedFullResponses,
  ResponseHints
} from '../response';
import { Operation } from '../operation';

const { assert, deprecate } = Orbit;

const PUSHABLE = '__pushable__';

/**
 * Has a source been decorated as `@pushable`?
 */
export function isPushable(source: Source): boolean {
  return !!(source as { [PUSHABLE]?: boolean })[PUSHABLE];
}

/**
 * A source decorated as `@pushable` must also implement the `Pushable`
 * interface.
 *
 * @deprecated since v0.17, use `Updatable` instead
 */
export interface Pushable<
  Data,
  Details,
  O extends Operation,
  TransformBuilder,
  Options extends RequestOptions = RequestOptions
> {
  /**
   * The `push` method accepts a `Transform` instance as an argument and returns
   * a promise that resolves to an array of `Transform` instances that are
   * applied as a result. In other words, `push` captures the direct results
   * _and_ side effects of applying a `Transform` to a source.
   */
  push<RequestOperation extends O = O>(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options?: DefaultRequestOptions<Options>,
    id?: string
  ): Promise<Transform<RequestOperation>[]>;
  push<
    RequestData extends Data = Data,
    RequestDetails extends Details = Details,
    RequestOperation extends O = O
  >(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options: FullRequestOptions<Options>,
    id?: string
  ): Promise<FullResponse<RequestData, RequestDetails, RequestOperation>>;

  _push(
    transform: Transform<O>,
    hints?: ResponseHints<Data, Details>
  ): Promise<FullResponse<Data, Details, O>>;
}

/**
 * Marks a source as "pushable" and adds an implementation of the `Pushable`
 * interface.
 *
 * The `push` method is part of the "request flow" in Orbit. Requests trigger
 * events before and after processing of each request. Observers can delay the
 * resolution of a request by returning a promise in an event listener.
 *
 * A pushable source emits the following events:
 *
 * - `beforePush` - emitted prior to the processing of `push`, this event
 * includes the requested `Transform` as an argument.
 *
 * - `push` - emitted after a `push` has successfully been applied, this event's
 * arguments include both the requested `Transform` and an array of the actual
 * applied `Transform` instances.
 *
 * - `pushFail` - emitted when an error has occurred pushing a transform, this
 * event's arguments include both the requested `Transform` and the error.
 *
 * A pushable source must implement a private method `_push`, which performs
 * the processing required for `push` and returns a promise that resolves to an
 * array of `Transform` instances.
 */
export function pushable(Klass: unknown): void {
  let proto = (Klass as SourceClass).prototype;

  if (isPushable(proto)) {
    return;
  }

  assert(
    'Pushable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[PUSHABLE] = true;

  proto.push = async function <RO extends RequestOptions>(
    transformOrOperations: TransformOrOperations<Operation, unknown>,
    options?: RO,
    id?: string
  ): Promise<unknown> {
    deprecate(
      "'push' has been deprecated. Please use 'update' instead and specify '{ fullResponse: true }' to access the resultant 'transforms'."
    );

    await this.activated;
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this.transformBuilder
    );

    if (this.transformLog.contains(transform.id)) {
      const transforms: Transform<Operation>[] = [];
      const response = options?.fullResponse ? { transforms } : transforms;
      return response;
    } else {
      const response = await this._requestQueue.push({
        type: 'push',
        data: transform
      });
      return options?.fullResponse ? response : response.transforms || [];
    }
  };

  proto.__push__ = async function (
    transform: Transform<Operation>
  ): Promise<FullResponse<unknown, unknown, Operation>> {
    if (this.transformLog.contains(transform.id)) {
      return { transforms: [] };
    }

    try {
      const hints: ResponseHints<unknown, unknown> = {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforePush',
        transform,
        hints
      )) as (NamedFullResponse<unknown, unknown, Operation> | undefined)[];
      const fullResponse = await this._push(transform, hints);
      if (otherResponses.length > 0) {
        fullResponse.sources = mapNamedFullResponses(otherResponses);
      }
      if (fullResponse.transforms?.length > 0) {
        await this.transformed(fullResponse.transforms);
      }
      await settleInSeries(this, 'push', transform, fullResponse);
      return fullResponse;
    } catch (error) {
      await settleInSeries(this, 'pushFail', transform, error);
      throw error;
    }
  };
}
