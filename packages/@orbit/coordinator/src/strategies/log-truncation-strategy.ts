import Coordinator, { ActivationOptions } from '../coordinator';
import { Strategy, StrategyOptions } from '../strategy';
import Orbit, {
  Source,
  Transform
} from '@orbit/data';
import { Dict, assert, objectValues } from '@orbit/utils';

export class LogTruncationStrategy extends Strategy {
  protected _reviewing: Promise<void>;
  protected _extraReviewNeeded: boolean;
  protected _transformListeners: Dict<(transform: Transform) => void>;

  constructor(options: StrategyOptions = {}) {
    options.name = options.name || 'log-truncation';
    super(options);
  }

  activate(coordinator: Coordinator, options: ActivationOptions = {}): Promise<any> {
    return super.activate(coordinator, options)
      .then(() => {
        return this._reifySources();
      })
      .then(() => {
        this._transformListeners = {};
        this._sources.forEach(source => this._activateSource(source));
      });
  }

  deactivate(): Promise<any> {
    return super.deactivate()
      .then(() => {
        this._sources.forEach(source => this._deactivateSource(source));
        this._transformListeners = null;
      });
  }

  _reifySources(): Promise<void> {
    return this._sources
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.reified);
      }, Orbit.Promise.resolve());
  }

  _review(source: Source, transformId: string): Promise<void> {
    let sources = this._sources;
    let match = true;

    if (sources.length > 1) {
      for (let i = 0; i < sources.length; i++) {
        let s = sources[i];
        if (s !== source) {
          if (!s.transformLog.contains(transformId)) {
            match = false;
            break;
          }
        }
      }
    }

    if (match) {
      return this._truncateSources(transformId, 0);
    } else {
      return Orbit.Promise.resolve();
    }
  }

  _truncateSources(transformId: string, relativePosition: number) {
    return this._sources
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.truncate(transformId, relativePosition));
      }, Orbit.Promise.resolve());
  }

  _activateSource(source: Source) {
    const listener = this._transformListeners[source.name] = (transform: Transform): Promise<void> => {
      return this._review(source, transform.id);
    };

    source.on('transform', listener);
  }

  _deactivateSource(source: Source) {
    const listener = this._transformListeners[source.name];
    source.off('transform', listener);
    delete this._transformListeners[source.name];
  }
}
