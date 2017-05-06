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
   * @type {boolean}
   * @memberOf SyncStrategyOptionss
   */
  blocking?: boolean;
}

export class SyncStrategy extends Strategy {
  protected _blocking: boolean;
  protected _filter: Function;
  protected _listener: Function;

  constructor(options: SyncStrategyOptions) {
    assert('A `source` must be specified for a SyncStrategy', !!options.source);
    assert('A `target` must be specified for a SyncStrategy', !!options.target);
    assert('`source` should be a Source name specified as a string', typeof options.source === 'string');
    assert('`target` should be a Source name specified as a string', typeof options.target === 'string');
    options.sources = [options.source, options.target];
    delete options.source;
    delete options.target;
    options.name = options.name || `sync-${options.sources.join('-')}`;
    super(options);

    this._filter = options.filter;
    this._blocking = options.blocking || false;
  }

  get source(): Source {
    return this._sources[0];
  }

  get target(): Source {
    return this._sources[1];
  }

  get blocking(): boolean {
    return this._blocking;
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
      if (this._filter) {
        if (!this._filter.call(this, transform)) {
          return;
        }
      }

      let result = this.target['sync'](transform);
      if (this._blocking) {
        return result;
      }
    };
  }
}
