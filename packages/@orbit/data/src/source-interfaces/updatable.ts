import { Orbit, fulfillInSeries, settleInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import { Transform, TransformOrOperations, buildTransform } from '../transform';
import { RequestOptions } from '../request';
import {
  NamedFullResponse,
  ResponseHints,
  FullResponse,
  mapNamedFullResponses
} from '../response';
import { Operation } from '../operation';
import { AsyncUpdatable } from '../updatable';

const { assert } = Orbit;

const UPDATABLE = '__updatable__';

/**
 * Has a source been decorated as `@updatable`?
 */
export function isUpdatable(source: Source): boolean {
  return !!(source as { [UPDATABLE]?: boolean })[UPDATABLE];
}

/**
 * A source decorated as `@updatable` must also implement the `Updatable`
 * interface.
 */
export interface Updatable<
  Data,
  Details,
  O extends Operation,
  TransformBuilder,
  Options extends RequestOptions = RequestOptions
> extends AsyncUpdatable<Data, Details, O, TransformBuilder, Options> {
  _update(
    transform: Transform<O>,
    hints?: ResponseHints<Data, Details>
  ): Promise<FullResponse<Data, Details, O>>;
}

/**
 * Marks a source as "updatable" and adds an implementation of the `Updatable`
 * interface.
 *
 * The `update` method is part of the "request flow" in Orbit. Requests trigger
 * events before and after processing of each request. Observers can delay the
 * resolution of a request by returning a promise in an event listener.
 *
 * An updatable source emits the following events:
 *
 * - `beforeUpdate` - emitted prior to the processing of `update`, this event
 * includes the requested `Transform` as an argument.
 *
 * - `update` - emitted after an `update` has successfully been applied, this
 * event includes the requested `Transform` as an argument.
 *
 * - `updateFail` - emitted when an error has occurred applying an update, this
 * event's arguments include both the requested `Transform` and the error.
 *
 * An updatable source must implement a private method `_update`, which performs
 * the processing required for `update` and returns a promise that resolves when
 * complete.
 */
export function updatable(Klass: unknown): void {
  let proto = (Klass as SourceClass).prototype;

  if (isUpdatable(proto)) {
    return;
  }

  assert(
    'Updatable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[UPDATABLE] = true;

  proto.update = async function (
    transformOrOperations: TransformOrOperations<Operation, unknown>,
    options?: RequestOptions,
    id?: string
  ): Promise<unknown> {
    await this.activated;
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this.transformBuilder
    );

    if (this.transformLog.contains(transform.id)) {
      return options?.fullResponse ? { transforms: [] } : undefined;
    } else {
      const response = await this._requestQueue.push({
        type: 'update',
        data: transform
      });
      return options?.fullResponse ? response : response.data;
    }
  };

  proto.__update__ = async function (
    transform: Transform<Operation>
  ): Promise<FullResponse<unknown, unknown, Operation>> {
    if (this.transformLog.contains(transform.id)) {
      return { transforms: [] };
    }

    try {
      const hints: ResponseHints<unknown, unknown> = {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforeUpdate',
        transform,
        hints
      )) as (NamedFullResponse<unknown, unknown, Operation> | undefined)[];
      const fullResponse = await this._update(transform, hints);
      if (otherResponses.length > 0) {
        fullResponse.sources = mapNamedFullResponses(otherResponses);
      }
      if (fullResponse.transforms?.length > 0) {
        await this.transformed(fullResponse.transforms);
      }
      await settleInSeries(this, 'update', transform, fullResponse);
      return fullResponse;
    } catch (error) {
      await settleInSeries(this, 'updateFail', transform, error);
      throw error;
    }
  };
}
