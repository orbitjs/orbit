import Coordinator, { ActivationOptions } from './coordinator';
import Orbit, {
  Source
} from '@orbit/data';
import { assert } from '@orbit/utils';

export interface StrategyOptions {
  /**
   * Name of strategy.
   *
   * Used to uniquely identify this strategy in a coordinator's collection.
   *
   * @type {string}
   * @memberOf StrategyOptions
   */
  name?: string;

  /**
   * The names of sources to include in this strategy. Leave undefined
   * to include all sources registered with a coordinator.
   *
   * Note: can not be used together with `excludeSources`.
   *
   * @type {string[]}
   * @memberOf LogTruncationOptions
   */
  includeSources?: string[];

  /**
   * The names of sources to exclude from this strategy. Leave undefined
   * to include all sources registered with a coordinator.
   *
   * Note: can not be used together with `includeSources`.
   *
   * @type {string[]}
   * @memberOf LogTruncationOptions
   */
  excludeSources?: string[];
}

export abstract class Strategy {
  protected _name: string;
  protected _coordinator: Coordinator;
  protected _includeSources: string[];
  protected _excludeSources: string[];
  protected _sources: Source[];
  protected _activated: Promise<any>;

  constructor(options: StrategyOptions = {}) {
    assert('Strategy requires a name', !!options.name);
    assert('Strategy can not include both `includeSources` and `excludeSources`', !(!!options.includeSources && !!options.excludeSources));

    this._name = options.name;
    this._includeSources = options.includeSources;
    this._excludeSources = options.excludeSources;
  }

  activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
    this._coordinator = coordinator;

    if (this._includeSources) {
      this._sources = coordinator.sources.filter(s => this._includeSources.indexOf(s.name) > -1);

    } else if (this._excludeSources) {
      this._sources = coordinator.sources.filter(s => this._excludeSources.indexOf(s.name) === -1);

    } else {
      this._sources = coordinator.sources;
    }

    this._activated = Orbit.Promise.resolve();

    return this._activated;
  }

  deactivate(): Promise<any> {
    this._coordinator = null;
    this._activated = null;

    return Orbit.Promise.resolve();
  }

  get name(): string {
    return this._name;
  }

  get activated(): Promise<any> {
    return this._activated;
  }

  get coordinator(): Coordinator {
    return this._coordinator;
  }
}
