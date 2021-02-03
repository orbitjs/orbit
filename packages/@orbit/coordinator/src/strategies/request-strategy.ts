import {
  ConnectionStrategy,
  ConnectionStrategyOptions
} from './connection-strategy';
import {
  FullResponse,
  NamedFullResponse,
  Operation,
  Query,
  QueryExpression,
  ResponseHints,
  Transform
} from '@orbit/data';

export interface RequestStrategyOptions extends ConnectionStrategyOptions {
  /**
   * Should results returned from calling `action` on the `target` source be
   * passed as hint data back to the `source`?
   *
   * This can allow hints to inform the processing of subsequent actions on the
   * source. For instance, a `beforeQuery` event might invoke `query` on a
   * target, and those results could inform how the originating source performs
   * `_query`. This might allow a target source's sorting and filtering of
   * results to affect how the originating source processes the query.
   *
   * This setting is only effective for `blocking` strategies, since only in
   * those scenarios is processing delayed.
   */
  passHints?: boolean;
}

export class RequestStrategy extends ConnectionStrategy {
  public passHints: boolean;

  constructor(options: RequestStrategyOptions) {
    super(options);

    this.passHints = !!options.passHints;
  }

  protected invokeAction(
    request: Query<QueryExpression> | Transform<Operation>
  ): Promise<NamedFullResponse<unknown, unknown, Operation>> {
    if (typeof this._action === 'string') {
      return (this.target as any)[this._action](request, {
        fullResponse: true
      });
    } else {
      return super.invokeAction(...arguments) as Promise<
        NamedFullResponse<unknown, unknown, Operation>
      >;
    }
  }

  protected async handleBlockingResponse(
    result: Promise<FullResponse<unknown, unknown, Operation>>,
    request: Query<QueryExpression> | Transform<Operation>,
    hints?: ResponseHints<unknown, unknown>
  ): Promise<NamedFullResponse<unknown, unknown, Operation>> {
    const fullResponse = await result;
    if (this.passHints && hints) {
      this.assignHints(hints, fullResponse);
    }
    return [this.target.name as string, fullResponse];
  }

  protected assignHints(
    hints: ResponseHints<unknown, unknown>,
    fullResponse: FullResponse<unknown, unknown, Operation>
  ): void {
    if (fullResponse.data !== undefined) {
      hints.data = fullResponse.data;
    }
    if (fullResponse.details !== undefined) {
      hints.details = fullResponse.details;
    }
  }
}
