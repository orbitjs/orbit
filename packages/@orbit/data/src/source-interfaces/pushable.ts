import { Orbit, settleInSeries, fulfillInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import { Transform, TransformOrOperations, buildTransform } from '../transform';
import { RequestOptions } from '../request';
import {
  FullResponse,
  NamedFullResponse,
  TransformsOrFullResponse,
  mapNamedFullResponses,
  ResponseHints
} from '../response';
import { Operation } from '../operation';

const { assert } = Orbit;

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
 */
export interface Pushable<
  Data,
  Details,
  O extends Operation,
  TransformBuilder
> {
  /**
   * The `push` method accepts a `Transform` instance as an argument and returns
   * a promise that resolves to an array of `Transform` instances that are
   * applied as a result. In other words, `push` captures the direct results
   * _and_ side effects of applying a `Transform` to a source.
   */
  push(
    transformOrOperations: TransformOrOperations<O, TransformBuilder>,
    options?: RequestOptions,
    id?: string
  ): Promise<TransformsOrFullResponse<Data, Details, O>>;

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

  proto.push = async function (
    transformOrOperations: TransformOrOperations<Operation, unknown>,
    options?: RequestOptions,
    id?: string
  ): Promise<TransformsOrFullResponse<unknown, unknown, Operation>> {
    await this.activated;
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this.transformBuilder
    );

    if (this.transformLog.contains(transform.id)) {
      return [];
    }

    return this._enqueueRequest('push', transform);
  };

  proto.__push__ = async function (
    transform: Transform<Operation>
  ): Promise<TransformsOrFullResponse<unknown, unknown, Operation>> {
    if (this.transformLog.contains(transform.id)) {
      return {
        transforms: []
      };
    }

    try {
      const options = transform.options || {};
      const hints: ResponseHints<unknown, unknown> = {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforePush',
        transform,
        hints
      )) as (NamedFullResponse<unknown, unknown, Operation> | undefined)[];
      const fullResponse = await this._push(transform, hints);
      if (options.includeSources) {
        fullResponse.sources = otherResponses
          ? mapNamedFullResponses<unknown, unknown, Operation>(otherResponses)
          : {};
      }
      if (fullResponse.transforms?.length > 0) {
        await this.transformed(fullResponse.transforms);
      }
      await settleInSeries(this, 'push', transform, fullResponse);
      if (options.fullResponse) {
        return fullResponse;
      } else {
        return fullResponse.transforms || [];
      }
    } catch (error) {
      await settleInSeries(this, 'pushFail', transform, error);
      throw error;
    }
  };
}
