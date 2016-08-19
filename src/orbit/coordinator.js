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
    this._active = true;
    this._sources.forEach(source => this._activateSource(source));
  }

  deactivate() {
    this._active = false;
    this._sources.forEach(source => this._deactivateSource(source));
  }

  _activateSource(source) {
    const listener = this._transformListeners[source.name] = (transform) => {
      this._sourceTransformed(source, transform.id);
    };
    source.on('transform', listener);
    this._reviewSourceLogs(source);
  }

  _deactivateSource(source) {
    source.off('transform', this._transformListeners[source.name]);
  }

  _sourceTransformed(source, transformId) {
    this._reviewSourceLogs(source, transformId);
  }

  _reviewSourceLogs(source, transformId = null) {
    let logs = this._sources
      .filter(s => s !== source)
      .map(s => s.transformLog)
      .filter(log => log.length > 0);

    if (logs.length === 0) { return; }

    let entries;
    if (transformId) {
      entries = [transformId];
    } else {
      entries = source.transformLog.entries();
    }
    let latestMatch;

    for (let i = 0; i < entries.length; i++) {
      let entry = entries[i];

      let match = true;
      for (let j = 0; j < logs.length; j++) {
        if (!logs[j].contains(entry)) {
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
      this._truncateHistory(latestMatch, +1);
    }
  }

  _truncateHistory(transformId, relativePosition) {
    this._sources.forEach(s => {
      if (s.transformLog.contains(transformId)) {
        s.truncateHistory(transformId, relativePosition);
      }
    });
  }
}
