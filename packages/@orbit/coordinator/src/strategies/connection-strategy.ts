import Coordinator, { ActivationOptions } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import { Source } from '@orbit/data';
import { assert } from '@orbit/utils';

export interface ConnectionStrategyOptions extends StrategyOptions {
  /**
   * The name of the source to be observed.
   */
  source: string;

  /**
   * The name of the event to observe.
   */
  on: string;

  /**
   * The name of the source which will be acted upon.
   */
  target?: string;

  /**
   * The action to perform on the target.
   *
   * Can be specified as a string (e.g. `pull`) or a function which will be
   * invoked in the context of this strategy (and thus will have access to
   * both `this.source` and `this.target`).
   */
  action: string | Function;

  /**
   * A handler for any errors thrown as a result of performing the action.
   */
  catch?: Function;

  /**
   * A filter function that returns `true` if the `action` should be performed.
   *
   * `filter` will be invoked in the context of this strategy (and thus will
   * have access to both `this.source` and `this.target`).
   */
  filter?: Function;

  /**
   * Should resolution of `action` on the the target block the completion
   * of the source's event?
   *
   * By default, `blocking` is false.
   */
  blocking?: boolean | Function;
}

export class ConnectionStrategy extends Strategy {
  protected _blocking: boolean | Function;
  protected _event: string;
  protected _action: string | Function;
  protected _catch: Function;
  protected _listener: Function;
  protected _filter: Function;

  constructor(options: ConnectionStrategyOptions) {
    assert('A `source` must be specified for a ConnectionStrategy', !!options.source);
    assert('`source` should be a Source name specified as a string', typeof options.source === 'string');
    assert('`on` should be specified as the name of the event a ConnectionStrategy listens for', typeof options.on === 'string');
    options.sources = [options.source];
    let defaultName = `${options.source}:${options.on}`;
    delete options.source;
    if (options.target) {
      assert('`target` should be a Source name specified as a string', typeof options.target === 'string');
      options.sources.push(options.target);
      defaultName += ` -> ${options.target}`;
      if (typeof options.action === 'string') {
        defaultName += `:${options.action}`;
      }
      delete options.target;
    }
    options.name = options.name || defaultName;
    super(options);

    this._event = options.on;
    this._action = options.action;
    this._catch = options.catch;
    this._filter = options.filter;
    this._blocking = typeof options.blocking === 'function' ? options.blocking : !!options.blocking;
  }

  get source(): Source {
    return this._sources[0];
  }

  get target(): Source {
    return this._sources[1];
  }

  get blocking(): boolean | Function {
    return this._blocking;
  }

  async activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<void> {
    await super.activate(coordinator, options);
    this._listener = this._generateListener();
    this.source.on(this._event, this._listener, this);
  }

  async deactivate(): Promise<void> {
    await super.deactivate()
    this.source.off(this._event, this._listener, this);
    this._listener = null;
  }

  protected _generateListener(): Function {
    const target = this.target as any;

    return (...args: any[]) => {
      let result;

      if (this._filter) {
        if (!this._filter.apply(this, args)) {
          return;
        }
      }

      if (typeof this._action === 'string') {
        result = target[this._action](...args);
      } else {
        result = this._action.apply(this, args);
      }

      if (this._catch && result && result.catch) {
        result = result.catch((e: Error) => {
          args.unshift(e);
          return this._catch.apply(this, args);
        });
      }

      if (typeof this._blocking === 'function') {
        if (this._blocking.apply(this, args)) {
          return result;
        }
      } else if (this._blocking) {
        return result;
      }
    };
  }
}
