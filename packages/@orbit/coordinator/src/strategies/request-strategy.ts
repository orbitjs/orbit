import {
  ConnectionStrategy,
  ConnectionStrategyOptions
} from './connection-strategy';
import { Listener } from '@orbit/core';
import { ResponseHints } from '@orbit/data';

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

  protected generateListener(): Listener {
    const target = this.target;

    return (...args: unknown[]): unknown => {
      let result;

      if (this._filter) {
        if (!this._filter(...args)) {
          return;
        }
      }

      if (typeof this._action === 'string') {
        result = (target as any)[this._action](args[0]);
      } else {
        result = this._action(...args);
      }

      if (this._catch && result && result.catch) {
        result = result.catch((e: Error) => {
          return this._catch && this._catch(e, ...args);
        });
      }

      if (result) {
        let blocking = false;
        if (typeof this._blocking === 'function') {
          if (this._blocking(...args)) {
            blocking = true;
          }
        } else if (this._blocking) {
          blocking = true;
        }

        if (blocking) {
          if (this.passHints) {
            const hints = args[1];
            if (hints && typeof hints === 'object') {
              return this.applyHint(hints as { data?: unknown }, result);
            }
          }
          return result;
        }
      }
    };
  }

  protected async applyHint(
    hints: ResponseHints<unknown>,
    result: Promise<unknown>
  ): Promise<void> {
    hints.data = await result;
  }
}
