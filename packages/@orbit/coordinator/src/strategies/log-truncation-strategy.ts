import { Coordinator, ActivationOptions } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import { Operation, Source, Transform } from '@orbit/data';
import { Dict } from '@orbit/utils';

export class LogTruncationStrategy extends Strategy {
  protected _transformListeners: Dict<
    (transform: Transform<Operation>) => void
  > = {};

  constructor(options: StrategyOptions = {}) {
    super({
      ...options,
      name: options.name || 'log-truncation'
    });
  }

  async activate(
    coordinator: Coordinator,
    options: ActivationOptions = {}
  ): Promise<void> {
    await super.activate(coordinator, options);
    this._transformListeners = {};
    for (let source of this._sources) {
      this._connectSource(source);
    }
  }

  async deactivate(): Promise<void> {
    await super.deactivate();
    for (let source of this._sources) {
      this._disconnectSource(source);
    }
    this._transformListeners = {};
  }

  async _review(source: Source): Promise<void> {
    let sources = this._sources;
    let transformId = source.transformLog.head;

    if (transformId && sources.length > 1) {
      let match = true;

      for (let i = 0; i < sources.length; i++) {
        let s = sources[i];
        if (s !== source) {
          if (
            !s.requestQueue.empty ||
            !s.syncQueue.empty ||
            !s.transformLog.contains(transformId)
          ) {
            match = false;
            break;
          }
        }
      }
      if (match) {
        return this._truncateSources(transformId, 0);
      }
    }
  }

  _truncateSources(
    transformId: string,
    relativePosition: number
  ): Promise<void> {
    return this._sources.reduce((chain, source) => {
      return chain.then(() =>
        source.transformLog.truncate(transformId, relativePosition)
      );
    }, Promise.resolve());
  }

  _connectSource(source: Source): void {
    const listener = async (): Promise<void> => {
      if (source.requestQueue.empty && source.syncQueue.empty) {
        return this._review(source);
      }
    };
    const sourceName = this.getSourceName(source);
    this._transformListeners[sourceName] = listener;
    source.syncQueue.on('complete', listener);
    source.requestQueue.on('complete', listener);
  }

  _disconnectSource(source: Source): void {
    const sourceName = this.getSourceName(source);
    const listener = this._transformListeners[sourceName];
    source.syncQueue.off('complete', listener);
    source.requestQueue.off('complete', listener);
    delete this._transformListeners[sourceName];
  }
}
