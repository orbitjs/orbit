import { StrategyOptions } from '../strategy';
import {
  ConnectionStrategy,
  ConnectionStrategyOptions
} from './connection-strategy';
import Orbit from '@orbit/core';

const { assert } = Orbit;

export interface SyncStrategyOptions extends StrategyOptions {
  /**
   * The name of the source to be observed.
   *
   * @type {string}
   * @memberOf SyncStrategyOptions
   */
  source: string;

  /**
   * The name of the source which will be acted upon.
   *
   * @type {string}
   * @memberOf SyncStrategyOptions
   */
  target: string;

  /**
   * A handler for any errors thrown as a result of the sync operation.
   *
   * @type {Function}
   * @memberOf SyncStrategyOptions
   */
  catch?: Function;

  /**
   * A filter function that returns `true` if the sync should be performed.
   *
   * `filter` will be invoked in the context of this strategy (and thus will
   * have access to both `this.source` and `this.target`).
   *
   * @type {Function}
   * @memberOf SyncStrategyOptionss
   */
  filter?: Function;

  /**
   * Should resolution of the target's `sync` block the completion of the
   * source's `transform`?
   *
   * By default, `blocking` is false.
   *
   * @type {(boolean | Function)}
   * @memberOf SyncStrategyOptionss
   */
  blocking?: boolean | Function;
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
