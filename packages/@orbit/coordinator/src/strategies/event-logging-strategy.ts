import Coordinator, { ActivationOptions, LogLevel } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import Orbit, {
  Source,
  Transform,
  isPullable,
  isPushable,
  isQueryable,
  isSyncable,
  isUpdatable
} from '@orbit/data';
import { Dict, assert, objectValues, deepGet, deepSet } from '@orbit/utils';

declare const console: any;

export interface EventLoggingStrategyOptions extends StrategyOptions {
  events?: string[];
  interfaces?: string[];
  logPrefix?: string;
}

export class EventLoggingStrategy extends Strategy {
  protected _events?: string[];
  protected _interfaces?: string[];
  protected _logPrefix?: string;
  protected _eventListeners: Dict<Dict<Function>>;

  constructor(options: EventLoggingStrategyOptions = {}) {
    options.name = options.name || 'event-logging';
    super(options);

    this._events = options.events;
    this._interfaces = options.interfaces;
    this._logPrefix = options.logPrefix || '[source-event]';
  }

  activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
    return super.activate(coordinator, options)
      .then(() => {
        this._eventListeners = {};
        this._sources.forEach(source => this._activateSource(source));
      });
  }

  deactivate(): Promise<any> {
    return super.deactivate()
      .then(() => {
        this._sources.forEach(source => this._deactivateSource(source));
        this._eventListeners = null;
      });
  }

  protected _activateSource(source: Source) {
    this._sourceEvents(source).forEach(event => {
      this._addListener(source, event);
    });
  }

  protected _deactivateSource(source: Source) {
    this._sourceEvents(source).forEach(event => {
      this._removeListener(source, event);
    });
  }

  protected _sourceEvents(source: Source) {
    if (this._events) {
      return this._events;
    } else {
      let events = [];
      let interfaces = this._interfaces || this._sourceInterfaces(source);

      interfaces.forEach(i => {
        Array.prototype.push.apply(events, this._interfaceEvents(i));
      });

      return events;
    }
  }

  protected _sourceInterfaces(source: Source) {
    let interfaces = ['transformable'];
    if (isPullable(source)) { interfaces.push('pullable'); }
    if (isPushable(source)) { interfaces.push('pushable'); }
    if (isQueryable(source)) { interfaces.push('queryable'); }
    if (isSyncable(source)) { interfaces.push('syncable'); }
    if (isUpdatable(source)) { interfaces.push('updatable'); }
    return interfaces;
  }

  protected _interfaceEvents(interfaceName: string): string[] {
    if (this._logLevel === LogLevel.Info) {
      switch(interfaceName) {
        case 'pullable':
          return ['beforePull', 'pull', 'pullFail'];
        case 'pushable':
          return ['beforePush', 'push', 'pushFail'];
        case 'queryable':
          return ['beforeQuery', 'query', 'queryFail'];
        case 'updatable':
          return ['beforeUpdate', 'update', 'updateFail'];
        case 'syncable':
          return ['sync'];
        case 'transformable':
          return ['transform'];
      }
    } else if (this._logLevel > LogLevel.None) {
      switch(interfaceName) {
        case 'pullable':
          return ['pullFail'];
        case 'pushable':
          return ['pushFail'];
        case 'queryable':
          return ['queryFail'];
        case 'updatable':
          return ['updateFail'];
       }
    }
  }

  protected _addListener(source: Source, event: string) {
    const listener = this._generateListener(source, event);
    deepSet(this._eventListeners, [source.name, event], listener);
    source.on(event, listener, this);
  }

  protected _removeListener(source: Source, event: string) {
    const listener = deepGet(this._eventListeners, [source.name, event]);
    source.off(event, listener, this);
    this._eventListeners[source.name][event] = null;
  }

  protected _generateListener(source: Source, event: string) {
    return (...args): void => {
      console.log(this._logPrefix, source.name, event, ...args);
    };
  }
}
