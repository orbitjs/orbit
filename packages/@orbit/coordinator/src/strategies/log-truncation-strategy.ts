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
    return this._activated = super.activate(coordinator, options)
      .then(() => {
        return this._reifySources();
      })
      .then(() => {
        this._transformListeners = {};
        this._sources.forEach(source => this._activateSource(source));
        return this.review();
      });
  }

  deactivate(): Promise<any> {
    return super.deactivate()
      .then(() => {
        this._sources.forEach(source => this._deactivateSource(source));
        this._transformListeners = null;
      });
  }

  review(): Promise<void> {
    if (this._reviewing) {
      this._extraReviewNeeded = true;
    } else {
      this._reviewing = this._reifySources()
        .then(() => this._review())
        .then(() => {
          if (this._extraReviewNeeded) {
            this._extraReviewNeeded = false;
            return this._review();
          } else {
            this._reviewing = null;
          }
        });
    }
    return this._reviewing;
  }

  _reifySources(): Promise<void> {
    return this._sources
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.reified);
      }, Orbit.Promise.resolve());
  }

  _review(): Promise<void> {
    let sources = this._sources;
    if (sources.length > 1) {
      let primaryLog = sources[0].transformLog;
      let otherLogs = sources.slice(1).map(s => s.transformLog);
      let entries = primaryLog.entries;
      let latestMatch;

      for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];

        let match = true;
        for (let j = 0; j < otherLogs.length; j++) {
          if (!otherLogs[j].contains(entry)) {
            match = false;
            break;
          }
        }

        if (match) {
          latestMatch = entry;
        } else {
          break;
        }
      }

      if (latestMatch) {
        return this._truncateSources(latestMatch, +1);
      }
    }

    return Orbit.Promise.resolve();
  }

  _truncateSources(transformId: string, relativePosition: number) {
    return this._sources
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.truncate(transformId, relativePosition));
      }, Orbit.Promise.resolve());
  }

  _activateSource(source: Source) {
    const listener = this._transformListeners[source.name] = (transform: Transform): void => {
      this._sourceTransformed(source, transform.id);
    };

    source.on('transform', listener);
  }

  _deactivateSource(source: Source) {
    const listener = this._transformListeners[source.name];
    source.off('transform', listener);
  }

  _sourceTransformed(source: Source, transformId: string) {
    this.review();
  }
}
