import Coordinator, { ActivationOptions, LogLevel } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import Orbit, {
  Source
} from '@orbit/data';
import { Dict, assert, objectValues, deepGet, deepSet } from '@orbit/utils';

declare const console: any;

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
   * Should resolution of the target's `sync` block the completion of the
   * source's `transform`?
   *
   * @type {boolean}
   * @memberOf SyncStrategyOptionss
   */
  blocking: boolean;
}

export class SyncStrategy extends Strategy {
  protected _blocking: boolean;
  protected _listener: Function;

  constructor(options: SyncStrategyOptions) {
    assert('A `source` must be specified for a SyncStrategy', !!options.source);
    assert('A `target` must be specified for a SyncStrategy', !!options.target);
    options.sources = [options.source, options.target];
    delete options.source;
    delete options.target;
    options.name = options.name || `sync-${options.sources.join('-')}`;
    super(options);

    this._blocking = options.blocking;
  }

  get source(): Source {
    return this._sources[0];
  }

  get target(): Source {
    return this._sources[1];
  }

  activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
    return super.activate(coordinator, options)
      .then(() => {
        this._listener = this._generateListener();
        this.source.on('transform', this._listener, this);
      });
  }

  deactivate(): Promise<any> {
    return super.deactivate()
      .then(() => {
        this.source.off('transform', this._listener, this);
        this._listener = null;
      });
  }

  protected _generateListener() {
    return (transform) => {
      let result = this.target['sync'](transform);
      if (this._blocking) {
        return result;
      }
    };
  }
}
