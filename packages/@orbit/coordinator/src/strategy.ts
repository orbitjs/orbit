import { Orbit, Assertion } from '@orbit/core';
import { Source } from '@orbit/data';
import { Coordinator, ActivationOptions, LogLevel } from './coordinator';

const { assert } = Orbit;

export interface StrategyOptions {
  /**
   * Name of strategy.
   *
   * Used to uniquely identify this strategy in a coordinator's collection.
   */
  name?: string;

  /**
   * The names of sources to include in this strategy. Leave undefined
   * to include all sources registered with a coordinator.
   */
  sources?: string[];

  /**
   * The prefix to use for logging from this strategy.
   *
   * Defaults to `[${name}]`.
   */
  logPrefix?: string;

  /**
   * A specific log level for this strategy.
   *
   * Overrides the log level used when activating the coordinator.
   */
  logLevel?: LogLevel;
}

export abstract class Strategy {
  protected _name!: string;
  protected _coordinator?: Coordinator;
  protected _sourceNames?: string[];
  protected _sources: Source[] = [];
  protected _customLogLevel?: LogLevel;
  protected _logLevel?: LogLevel;
  protected _logPrefix: string;

  constructor(options: StrategyOptions = {}) {
    if (options.name) {
      this._name = options.name;
    } else {
      assert('Strategy requires a name', false);
    }

    this._sourceNames = options.sources;
    this._logPrefix = options.logPrefix || `[${this._name}]`;
    this._logLevel = this._customLogLevel = options.logLevel;
  }

  async activate(
    coordinator: Coordinator,
    options: ActivationOptions = {}
  ): Promise<void> {
    this._coordinator = coordinator;

    if (this._customLogLevel === undefined) {
      this._logLevel = options.logLevel;
    }

    if (this._sourceNames) {
      this._sources = this._sourceNames.map((name) =>
        coordinator.getSource(name)
      );
    } else {
      this._sources = coordinator.sources;
    }
  }

  async deactivate(): Promise<void> {
    this._coordinator = undefined;
  }

  async beforeSourceActivation(): Promise<void> {}
  async afterSourceActivation(): Promise<void> {}

  async beforeSourceDeactivation(): Promise<void> {}
  async afterSourceDeactivation(): Promise<void> {}

  get name(): string {
    return this._name;
  }

  get coordinator(): Coordinator | undefined {
    return this._coordinator;
  }

  get sources(): Source[] {
    return this._sources;
  }

  get logPrefix(): string {
    return this._logPrefix;
  }

  get logLevel(): LogLevel | undefined {
    return this._logLevel;
  }

  protected getSourceName(source: Source): string {
    if (source.name) {
      return source.name;
    } else {
      throw new Assertion(
        `Sources require a 'name' to be used by a coordination strategy.`
      );
    }
  }
}
