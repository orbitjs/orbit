import Orbit, {
  Source,
  Transform
} from '@orbit/data';
import { Dict, assert } from '@orbit/utils';

/**
 * The Coordinator class observes sources registered with it, and truncates
 * logs up to the most recent common entry between them.
 * 
 * This class is experimental and should be considered a work in progress.
 * 
 * @export
 * @class Coordinator
 */
export default class Coordinator {
  private _active: boolean;
  private _sources: Dict<Source>;
  private _transformListeners: Dict<(transform: Transform) => void>;
  private _activated: Promise<void>;
  private _reviewing: Promise<void>;
  private _extraReviewNeeded: boolean;

  constructor(sources: Source[] = [], autoActivate: boolean = true) {
    this._active = false;
    this._sources = {};
    this._transformListeners = {};

    sources.forEach(source => this.addSource(source));

    if (autoActivate) {
      this.activate();
    }
  }

  addSource(source: Source) {
    const name = source.name;

    assert(`Sources require a 'name' to be added to the Coordinator.`, !!name);
    assert(`Source '${name}' has already been added to the Coordinator.`, !this._sources[name]);

    this._sources[name] = source;

    if (this._active) {
      this._activateSource(source);
    }
  }

  removeSource(name: string) {
    let source = this._sources[name];

    assert(`Source '${name}' has not been added to the Coordinator.`, !!source);

    if (this._active) {
      this._deactivateSource(source);
    }

    delete this._sources[name];
  }

  get sources(): Dict<Source> {
    return this._sources;
  }

  get active(): boolean {
    return this._active;
  }

  get activated(): Promise<void> {
    return this._activated;
  }

  activate(): Promise<void> {
    this._activated = this.review()
      .then(() => {
        this._active = true;
        Object.values(this._sources).forEach(source => this._activateSource(source));
      });

    return this._activated;
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

  deactivate(): void {
    this._active = false;
    this._activated = null;
    Object.values(this._sources).forEach(source => this._deactivateSource(source));
  }

  _reifySources(): Promise<void> {
    return Object.values(this._sources)
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.reified);
      }, Orbit.Promise.resolve());
  }

  _review(): Promise<void> {
    let sources = Object.values(this._sources);
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
    return Object.values(this._sources)
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
