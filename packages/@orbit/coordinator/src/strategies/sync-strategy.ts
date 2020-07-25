import { Orbit } from '@orbit/core';
import { StrategyOptions } from '../strategy';
import {
  ConnectionStrategy,
  ConnectionStrategyOptions
} from './connection-strategy';

const { assert } = Orbit;

export interface SyncStrategyOptions extends StrategyOptions {
  /**
   * The name of the source to be observed.
   */
  source: string;

  /**
   * The name of the source which will be acted upon.
   */
  target: string;

  /**
   * A handler for any errors thrown as a result of the sync operation.
   */
  catch?: (error: Error, ...args: any[]) => void;

  /**
   * A filter function that returns `true` if the sync should be performed.
   *
   * `filter` will be invoked in the context of this strategy (and thus will
   * have access to both `this.source` and `this.target`).
   */
  filter?: (...args: any[]) => boolean;

  /**
   * Should resolution of the target's `sync` block the completion of the
   * source's `transform`?
   *
   * By default, `blocking` is false.
   */
  blocking?: boolean | ((...args: any[]) => boolean);
}

export class SyncStrategy extends ConnectionStrategy {
  constructor(options: SyncStrategyOptions) {
    let opts = options as ConnectionStrategyOptions;
    assert('A `source` must be specified for a SyncStrategy', !!opts.source);
    assert('A `target` must be specified for a SyncStrategy', !!opts.target);
    assert(
      '`source` should be a Source name specified as a string',
      typeof opts.source === 'string'
    );
    assert(
      '`target` should be a Source name specified as a string',
      typeof opts.target === 'string'
    );
    opts.on = opts.on || 'transform';
    opts.action = opts.action || 'sync';
    super(opts);
  }
}
