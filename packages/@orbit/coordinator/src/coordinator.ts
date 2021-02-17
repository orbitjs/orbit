import { Orbit } from '@orbit/core';
import { Source } from '@orbit/data';
import { Dict, objectValues } from '@orbit/utils';
import { Strategy } from './strategy';

const { assert } = Orbit;

export interface CoordinatorOptions {
  sources?: Source[];
  strategies?: Strategy[];
  defaultActivationOptions?: ActivationOptions;
}

export enum LogLevel {
  None,
  Errors,
  Warnings,
  Info
}

export interface ActivationOptions {
  logLevel?: LogLevel;
}

/**
 * The Coordinator class manages a set of sources to which it applies a set of
 * coordination strategies.
 */
export class Coordinator {
  protected _sources: Dict<Source>;
  protected _strategies: Dict<Strategy>;
  protected _activated?: Promise<void>;
  protected _defaultActivationOptions: ActivationOptions;
  protected _currentActivationOptions?: ActivationOptions;

  constructor(options: CoordinatorOptions = {}) {
    this._sources = {};
    this._strategies = {};

    if (options.sources) {
      options.sources.forEach((source) => this.addSource(source));
    }

    if (options.strategies) {
      options.strategies.forEach((strategy) => this.addStrategy(strategy));
    }

    this._defaultActivationOptions = options.defaultActivationOptions || {};

    if (this._defaultActivationOptions.logLevel === undefined) {
      this._defaultActivationOptions.logLevel = LogLevel.Info;
    }
  }

  addSource(source: Source): void {
    const name = source.name;
    if (name) {
      assert(
        `A source named '${name}' has already been added to this coordinator.`,
        !this._sources[name]
      );
      assert(
        `A coordinator's sources can not be changed while it is active.`,
        !this._activated
      );
      this._sources[name] = source;
    } else {
      assert(`Sources require a 'name' to be added to a coordinator.`, !!name);
    }
  }

  removeSource(name: string): void {
    let source = this._sources[name];

    assert(
      `Source '${name}' has not been added to this coordinator.`,
      !!source
    );
    assert(
      `A coordinator's sources can not be changed while it is active.`,
      !this._activated
    );

    delete this._sources[name];
  }

  getSource<T extends Source = Source>(name: string): T {
    return this._sources[name] as T;
  }

  get sources(): Source[] {
    return objectValues(this._sources);
  }

  get sourceNames(): string[] {
    return Object.keys(this._sources);
  }

  addStrategy(strategy: Strategy): void {
    const name = strategy.name;

    assert(
      `A strategy named '${name}' has already been added to this coordinator.`,
      !this._strategies[name]
    );
    assert(
      `A coordinator's strategies can not be changed while it is active.`,
      !this._activated
    );

    this._strategies[name] = strategy;
  }

  removeStrategy(name: string): void {
    let strategy = this._strategies[name];

    assert(
      `Strategy '${name}' has not been added to this coordinator.`,
      !!strategy
    );
    assert(
      `A coordinator's strategies can not be changed while it is active.`,
      !this._activated
    );

    delete this._strategies[name];
  }

  getStrategy<T extends Strategy = Strategy>(name: string): T {
    return this._strategies[name] as T;
  }

  get strategies(): Strategy[] {
    return objectValues(this._strategies);
  }

  get strategyNames(): string[] {
    return Object.keys(this._strategies);
  }

  get activated(): Promise<void> | undefined {
    return this._activated;
  }

  async activate(options: ActivationOptions = {}): Promise<void> {
    if (!this._activated) {
      this._activated = this._activate(options);
    }
    await this._activated;
  }

  async deactivate(): Promise<void> {
    if (this._activated) {
      await this._activated;
      await this._deactivate();
    }

    this._activated = undefined;
  }

  protected async _activate(options: ActivationOptions = {}): Promise<void> {
    if (options.logLevel === undefined) {
      options.logLevel = this._defaultActivationOptions.logLevel;
    }

    this._currentActivationOptions = options;

    for (let strategy of this.strategies) {
      await strategy.activate(this, options);
    }

    for (let strategy of this.strategies) {
      await strategy.beforeSourceActivation();
    }

    for (let source of this.sources) {
      await source.activate();
    }

    for (let strategy of this.strategies) {
      await strategy.afterSourceActivation();
    }
  }

  protected async _deactivate(): Promise<void> {
    const strategies = this.strategies.reverse();
    const sources = this.sources.reverse();

    for (let strategy of strategies) {
      await strategy.beforeSourceDeactivation();
    }

    for (let source of sources) {
      await source.deactivate();
    }

    for (let strategy of strategies) {
      await strategy.afterSourceDeactivation();
    }

    for (let strategy of strategies) {
      await strategy.deactivate();
    }
  }
}
