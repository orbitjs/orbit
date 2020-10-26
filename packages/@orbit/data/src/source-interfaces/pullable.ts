import { Orbit, settleInSeries, fulfillInSeries } from '@orbit/core';
import { Source, SourceClass } from '../source';
import { Query, QueryOrExpressions, buildQuery } from '../query';
import { RequestOptions } from '../request';
import {
  FullResponse,
  NamedFullResponse,
  TransformsOrFullResponse,
  mapNamedFullResponses
} from '../response';
import { Operation } from '../operation';
import { QueryExpression } from '../query-expression';

const { assert } = Orbit;

const PULLABLE = '__pullable__';

/**
 * Has a source been decorated as `@pullable`?
 */
export function isPullable(source: Source): boolean {
  return !!(source as { [PULLABLE]?: boolean })[PULLABLE];
}

/**
 * A source decorated as `@pullable` must also implement the `Pullable`
 * interface.
 */
export interface Pullable<
  R,
  O extends Operation,
  QE extends QueryExpression,
  QB
> {
  /**
   * The `pull` method accepts a query or expression(s) and returns a promise
   * that resolves to an array of `Transform` instances that represent the
   * changeset that resulted from applying the query. In other words, a `pull`
   * request retrieves the results of a query in `Transform` form.
   */
  pull(
    queryOrExpressions: QueryOrExpressions<QE, QB>,
    options?: RequestOptions,
    id?: string
  ): Promise<TransformsOrFullResponse<undefined, R, O>>;

  _pull(query: Query<QE>): Promise<FullResponse<undefined, R, O>>;
}

/**
 * Marks a source as "pullable" and adds an implementation of the `Pullable`
 * interface.
 *
 * The `pull` method is part of the "request flow" in Orbit. Requests trigger
 * events before and after processing of each request. Observers can delay the
 * resolution of a request by returning a promise in an event listener.
 *
 * A pullable source emits the following events:
 *
 * - `beforePull` - emitted prior to the processing of `pull`, this event
 * includes the requested `Query` as an argument.
 *
 * - `pull` - emitted after a `pull` has successfully been requested, this
 * event's arguments include both the requested `Query` and an array of the
 * resulting `Transform` instances.
 *
 * - `pullFail` - emitted when an error has occurred processing a `pull`, this
 * event's arguments include both the requested `Query` and the error.
 *
 * A pullable source must implement a private method `_pull`, which performs
 * the processing required for `pull` and returns a promise that resolves to an
 * array of `Transform` instances.
 */
export function pullable(Klass: unknown): void {
  let proto = (Klass as SourceClass).prototype;

  if (isPullable(proto)) {
    return;
  }

  assert(
    'Pullable interface can only be applied to a Source',
    proto instanceof Source
  );

  proto[PULLABLE] = true;

  proto.pull = async function (
    queryOrExpressions: QueryOrExpressions<QueryExpression, unknown>,
    options?: RequestOptions,
    id?: string
  ): Promise<TransformsOrFullResponse<undefined, unknown, Operation>> {
    await this.activated;
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.queryBuilder
    );
    return this._enqueueRequest('pull', query);
  };

  proto.__pull__ = async function (
    query: Query<QueryExpression>
  ): Promise<TransformsOrFullResponse<undefined, unknown, Operation>> {
    try {
      const options = query.options || {};
      const otherResponses = (await fulfillInSeries(
        this,
        'beforePull',
        query
      )) as (NamedFullResponse<unknown, unknown, Operation> | undefined)[];
      const fullResponse = await this._pull(query);
      if (options.includeSources) {
        fullResponse.sources = otherResponses
          ? mapNamedFullResponses<unknown, unknown, Operation>(otherResponses)
          : {};
      }
      if (fullResponse.transforms?.length > 0) {
        await this.transformed(fullResponse.transforms);
      }
      await settleInSeries(this, 'pull', query, fullResponse);
      if (options.fullResponse) {
        return fullResponse;
      } else {
        return fullResponse.transforms || [];
      }
    } catch (error) {
      await settleInSeries(this, 'pullFail', query, error);
      throw error;
    }
  };
}
