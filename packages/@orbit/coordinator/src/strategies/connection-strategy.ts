import { Coordinator, ActivationOptions } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import { Orbit, Listener } from '@orbit/core';
import { Source } from '@orbit/data';

const { assert } = Orbit;

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
  action: string | ((...args: unknown[]) => unknown);

  /**
   * A handler for any errors thrown as a result of performing the action.
   */
  catch?: (error: Error, ...args: unknown[]) => void;

  /**
   * A filter function that returns `true` if the `action` should be performed.
   *
   * `filter` will be invoked in the context of this strategy (and thus will
   * have access to both `this.source` and `this.target`).
   */
  filter?: (...args: unknown[]) => boolean;

  /**
   * Should resolution of `action` on the the target block the completion
   * of the source's event?
   *
   * By default, `blocking` is false.
   */
  blocking?: boolean | ((...args: unknown[]) => boolean);
}

declare type CatchFn = (error: Error, ...args: unknown[]) => void;
declare type FilterFn = (...args: unknown[]) => boolean;

export class ConnectionStrategy extends Strategy {
  protected _blocking: boolean | ((...args: unknown[]) => boolean);
  protected _event: string;
  protected _action: string | ((...args: unknown[]) => unknown);
  protected _catch?: CatchFn;
  protected _listener?: Listener;
  protected _filter?: FilterFn;

  constructor(options: ConnectionStrategyOptions) {
    assert(
      'A `source` must be specified for a ConnectionStrategy',
      !!options.source
    );
    assert(
      '`source` should be a Source name specified as a string',
      typeof options.source === 'string'
    );
    assert(
      '`on` should be specified as the name of the event a ConnectionStrategy listens for',
      typeof options.on === 'string'
    );
    options.sources = [options.source];
    let defaultName = `${options.source}:${options.on}`;
    delete (options as any).source;
    if (options.target) {
      assert(
        '`target` should be a Source name specified as a string',
        typeof options.target === 'string'
      );
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
    this._blocking =
      typeof options.blocking === 'function'
        ? options.blocking
        : !!options.blocking;
  }

  get source(): Source {
    return this._sources[0];
  }

  get target(): Source {
    return this._sources[1];
  }

  get blocking(): boolean | ((...args: any[]) => boolean) {
    return this._blocking;
  }

  async activate(
    coordinator: Coordinator,
    options: ActivationOptions = {}
  ): Promise<void> {
    await super.activate(coordinator, options);
    this._listener = this.generateListener();
    this.source.on(this._event, this._listener);
  }

  async deactivate(): Promise<void> {
    await super.deactivate();
    this.source.off(this._event, this._listener);
    this._listener = undefined;
  }

  protected generateListener(): Listener {
    return (...args: any[]) => this.defaultListener(...args);
  }

  protected async defaultListener(...args: any[]): Promise<any> {
    if (this._filter) {
      if (!this._filter.apply(this, args)) {
        return;
      }
    }

    let result = this.invokeAction(...args) as any;

    if (this._catch && result && result.catch) {
      result = result.catch((e: Error) => {
        return (this._catch as CatchFn).apply(this, [e, ...args]);
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
        return this.handleBlockingResponse(result, ...args);
      }
    }
  }

  protected invokeAction(...args: any[]): unknown {
    const target = this.target as any;

    if (typeof this._action === 'string') {
      return target[this._action](...args);
    } else {
      return this._action.apply(this, args);
    }
  }

  protected async handleBlockingResponse(
    result: Promise<any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...args: any[]
  ): Promise<any> {
    await result;
  }
}
