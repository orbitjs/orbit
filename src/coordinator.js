import Orbit from './main';
import { assert } from './lib/assert';

export default class Coordinator {
  constructor(options = {}) {
    this._active = false;
    this._sources = [];
    this._transformListeners = {};

    if (options.sources) {
      options.sources.forEach(source => this.addSource(source));
    }

    if (options.autoActivate !== false) {
      this.activate();
    }
  }

  addSource(source) {
    assert(`Source '${source.name}' has already been added to the Coordinator.`, this._sources.indexOf(source) === -1);

    this._sources.push(source);

    if (this._active) {
      this._activateSource(source);
    }
  }

  removeSource(source) {
    assert(`Source '${source.name}' has not been added to the Coordinator.`, this._sources.indexOf(source) > -1);

    if (this._active) {
      this._deactivateSource(source);
    }

    this._sources.pop(source);
  }

  get active() {
    return this._active;
  }

  activate() {
    this.activated = this.review()
      .then(() => {
        this._active = true;
        this._sources.forEach(source => this._activateSource(source));
      });

    return this.activated;
  }

  review() {
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

  deactivate() {
    this._active = false;
    this.activated = null;
    this._sources.forEach(source => this._deactivateSource(source));
  }

  _reifySources() {
    return this._sources
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.reified);
      }, Orbit.Promise.resolve());
  }

  _review() {
    if (this._sources.length > 1) {
      let primaryLog = this._sources[0].transformLog;
      let otherLogs = this._sources.slice(1).map(s => s.transformLog);
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

  _truncateSources(transformId, relativePosition) {
    return this._sources
      .reduce((chain, source) => {
        return chain.then(() => source.transformLog.truncate(transformId, relativePosition));
      }, Orbit.Promise.resolve());
  }

  _activateSource(source) {
    const listener = this._transformListeners[source.name] = (transform) => {
      this._sourceTransformed(source, transform.id);
    };
    source.on('transform', listener);
  }

  _deactivateSource(source) {
    source.off('transform', this._transformListeners[source.name]);
  }

  _sourceTransformed(/* source, transformId */) {
    this.review();
  }
}
