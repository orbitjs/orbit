import Orbit, {
  Source,
  Transform
} from '@orbit/data';
import { Dict, assert, objectValues } from '@orbit/utils';
import { Strategy } from './strategy';

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
 *
 * @export
 * @class Coordinator
 */
export default class Coordinator {
  protected _sources: Dict<Source>;
  protected _strategies: Dict<Strategy>;
  protected _activated: Promise<any>;
  protected _defaultActivationOptions: ActivationOptions;
  protected _currentActivationOptions: ActivationOptions;

  constructor(options: CoordinatorOptions = {}) {
    this._sources = {};
    this._strategies = {};

    if (options.sources) {
      options.sources.forEach(source => this.addSource(source));
    }

    if (options.strategies) {
      options.strategies.forEach(strategy => this.addStrategy(strategy));
    }

    this._defaultActivationOptions = options.defaultActivationOptions || {};

    if (this._defaultActivationOptions.logLevel === undefined) {
      this._defaultActivationOptions.logLevel = LogLevel.Info;
    }
  }

  addSource(source: Source): Promise<any> {
    const name = source.name;

    assert(`Sources require a 'name' to be added to the Coordinator.`, !!name);
    assert(`A source named '${name}' has already been added to the Coordinator.`, !this._sources[name]);

    this._sources[name] = source;

    if (this._activated) {
      return this.reactivate();
    } else {
      return Orbit.Promise.resolve();
    }
  }

  removeSource(name: string): Promise<any> {
    let source = this._sources[name];

    assert(`Source '${name}' has not been added to the Coordinator.`, !!source);

    delete this._sources[name];

    if (this._activated) {
      return this.reactivate();
    } else {
      return Orbit.Promise.resolve();
    }
  }

  getSource(name: string) {
    return this._sources[name];
  }

  get sources(): Source[] {
    return objectValues(this._sources);
  }

  get sourceNames(): string[] {
    return Object.keys(this._sources);
  }

  addStrategy(strategy: Strategy): Promise<any> {
    const name = strategy.name;

    assert(`Strategies require a 'name' to be added to the Coordinator.`, !!name);
    assert(`A strategy named '${name}' has already been added to the Coordinator.`, !this._strategies[name]);

    this._strategies[name] = strategy;

    if (this._activated) {
      this._activated = this._activated
        .then(() => {
          return strategy.activate(this, this._currentActivationOptions);
        });
      return this._activated;
    } else {
      return Orbit.Promise.resolve();
    }
  }

  removeStrategy(name: string): Promise<any> {
    let strategy = this._strategies[name];

    assert(`Strategy '${name}' has not been added to the Coordinator.`, !!strategy);

    return strategy.deactivate()
      .then(() => {
        delete this._strategies[name];
      });
  }

  getStrategy(name: string) {
    return this._strategies[name];
  }

  get strategies(): Strategy[] {
    return objectValues(this._strategies);
  }

  get strategyNames(): string[] {
    return Object.keys(this._strategies);
  }

  get activated(): Promise<void[]> {
    return this._activated;
  }

  activate(options: ActivationOptions = {}): Promise<void[]> {
    if (!this._activated) {
      if (options.logLevel === undefined) {
        options.logLevel = this._defaultActivationOptions.logLevel;
      }

      this._currentActivationOptions = options;
      this._activated = Promise.all(this.strategies.map(strategy => strategy.activate(this, options)));
    }

    return this._activated;
  }

  deactivate(): Promise<any> {
    return Promise.all(this.strategies.map(strategy => strategy.deactivate()))
      .then(() => {
        this._activated = null;
      });
  }

  reactivate(options?: ActivationOptions): Promise<any> {
    options = options || this._currentActivationOptions;

    if (this._activated) {
      return this.deactivate()
        .then(() => this.activate(options));
    } else {
      return this.activate(options);
    }
  }
}
