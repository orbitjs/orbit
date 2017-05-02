import Coordinator, { ActivationOptions, LogLevel } from './coordinator';
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
   * @type {string[]}
   * @memberOf LogTruncationOptions
   */
  sources?: string[];
}

export abstract class Strategy {
  protected _name: string;
  protected _coordinator: Coordinator;
  protected _sourceNames: string[];
  protected _sources: Source[];
  protected _activated: Promise<any>;
  protected _logLevel: LogLevel;

  constructor(options: StrategyOptions = {}) {
    assert('Strategy requires a name', !!options.name);

    this._name = options.name;
    this._sourceNames = options.sources;
  }

  activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
    this._coordinator = coordinator;
    this._logLevel = options.logLevel;

    if (this._sourceNames) {
      this._sources = coordinator.sources.filter(s => this._sourceNames.indexOf(s.name) > -1);
    } else {
      this._sources = coordinator.sources;
    }

    return Orbit.Promise.resolve();
  }

  deactivate(): Promise<any> {
    this._coordinator = null;

    return Orbit.Promise.resolve();
  }

  get name(): string {
    return this._name;
  }

  get coordinator(): Coordinator {
    return this._coordinator;
  }
}
