import { Coordinator, ActivationOptions, LogLevel } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import { Listener } from '@orbit/core';
import {
  Source,
  isPullable,
  isPushable,
  isQueryable,
  isSyncable,
  isUpdatable
} from '@orbit/data';
import { Dict, deepGet, deepSet } from '@orbit/utils';

declare const console: any;

export interface EventLoggingStrategyOptions extends StrategyOptions {
  events?: string[];
  interfaces?: string[];
}

export class EventLoggingStrategy extends Strategy {
  protected _events?: string[];
  protected _interfaces?: string[];
  protected _eventListeners?: Dict<Dict<Listener>>;

  constructor(options: EventLoggingStrategyOptions = {}) {
    super({
      ...options,
      name: options.name || 'event-logging'
    });

    this._events = options.events;
    this._interfaces = options.interfaces;
    this._logPrefix = options.logPrefix || '[source-event]';
  }

  async activate(
    coordinator: Coordinator,
    options: ActivationOptions = {}
  ): Promise<void> {
    await super.activate(coordinator, options);
    this._eventListeners = {};
    this._sources.forEach((source) => this._activateSource(source));
  }

  async deactivate(): Promise<void> {
    await super.deactivate();
    this._sources.forEach((source) => this._deactivateSource(source));
    this._eventListeners = undefined;
  }

  protected _activateSource(source: Source): void {
    this._sourceEvents(source).forEach((event) => {
      this._addListener(source, event);
    });
  }

  protected _deactivateSource(source: Source): void {
    this._sourceEvents(source).forEach((event) => {
      this._removeListener(source, event);
    });
  }

  protected _sourceEvents(source: Source): string[] {
    if (this._events) {
      return this._events;
    } else {
      let events: string[] = [];
      let interfaces = this._interfaces || this._sourceInterfaces(source);

      interfaces.forEach((i) => {
        Array.prototype.push.apply(events, this._interfaceEvents(i));
      });

      return events;
    }
  }

  protected _sourceInterfaces(source: Source): string[] {
    let interfaces = ['transformable'];
    if (isPullable(source)) {
      interfaces.push('pullable');
    }
    if (isPushable(source)) {
      interfaces.push('pushable');
    }
    if (isQueryable(source)) {
      interfaces.push('queryable');
    }
    if (isSyncable(source)) {
      interfaces.push('syncable');
    }
    if (isUpdatable(source)) {
      interfaces.push('updatable');
    }
    return interfaces;
  }

  protected _interfaceEvents(interfaceName: string): string[] {
    if (this._logLevel === LogLevel.Info) {
      switch (interfaceName) {
        case 'pullable':
          return ['beforePull', 'pull', 'pullFail'];
        case 'pushable':
          return ['beforePush', 'push', 'pushFail'];
        case 'queryable':
          return ['beforeQuery', 'query', 'queryFail'];
        case 'updatable':
          return ['beforeUpdate', 'update', 'updateFail'];
        case 'syncable':
          return ['beforeSync', 'sync', 'syncFail'];
        case 'transformable':
          return ['transform'];
      }
    } else if (this._logLevel !== undefined && this._logLevel > LogLevel.None) {
      switch (interfaceName) {
        case 'pullable':
          return ['pullFail'];
        case 'pushable':
          return ['pushFail'];
        case 'queryable':
          return ['queryFail'];
        case 'syncable':
          return ['syncFail'];
        case 'updatable':
          return ['updateFail'];
      }
    }
    return [];
  }

  protected _addListener(source: Source, event: string): void {
    const listener = this._generateListener(source, event);
    const sourceName = this.getSourceName(source);
    deepSet(this._eventListeners, [sourceName, event], listener);
    source.on(event, listener);
  }

  protected _removeListener(source: Source, event: string): void {
    const sourceName = this.getSourceName(source);
    const listener = deepGet(this._eventListeners, [
      sourceName,
      event
    ]) as Listener;
    source.off(event, listener);
    deepSet(this._eventListeners, [sourceName, event], undefined);
  }

  protected _generateListener(source: Source, event: string): Listener {
    const sourceName = this.getSourceName(source);
    return (...args: any[]) => {
      console.log(this._logPrefix, sourceName, event, ...args);
    };
  }
}
