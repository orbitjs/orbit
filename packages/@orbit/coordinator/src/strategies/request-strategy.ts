import Coordinator, { ActivationOptions, LogLevel } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import Orbit, {
  Source,
  Transform,
  isSyncable,
  Syncable
} from '@orbit/data';
import { Dict, assert, objectValues, deepGet, deepSet } from '@orbit/utils';

declare const console: any;

export interface RequestStrategyOptions extends StrategyOptions {
  /**
   * The name of the source to be observed.
   *
   * @type {string}
   * @memberOf RequestStrategyOptions
   */
  source: string;

  /**
   * The name of the source which will be acted upon.
   *
   * @type {string}
   * @memberOf RequestStrategyOptions
   */
  target?: string;

  on: string;

  action: string | Function;

  /**
   * Should resolution of `action` on the the target block the completion
   * of the source's event?
   *
   * @type {boolean}
   * @memberOf RequestStrategyOptionss
   */
  blocking: boolean;
}

export class RequestStrategy extends Strategy {
  protected _blocking: boolean;
  protected _event: string;
  protected _action: string | Function;
  protected _listener: Function;

  constructor(options: RequestStrategyOptions) {
    assert('A `source` must be specified for a RequestStrategy', !!options.source);
    options.sources = [options.source];
    delete options.source;
    if (options.target) {
      options.sources.push(options.target);
      delete options.target;
    }
    options.name = options.name || `request-${options.sources.join('-')}-${options.on}`;
    super(options);

    this._event = options.on;
    this._action = options.action;
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
        this.source.on(this._event, this._listener, this);
      });
  }

  deactivate(): Promise<any> {
    return super.deactivate()
      .then(() => {
        this.source.off(this._event, this._listener, this);
        this._listener = null;
      });
  }

  protected _generateListener() {
    let target: any = this.target;

    return (...args) => {
      let result;

      if (typeof this._action === 'string') {
        result = this.target[this._action](...args);
      } else {
        result = this._action.apply(this, args);
      }

      if (this._blocking) {
        return result;
      }
    };
  }
}
