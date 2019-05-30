import { Connection } from './connection';

export interface ConnectionMonitorSettings {
  connection: Connection;
  pollInterval?: PollInterval;
  staleThreshold?: number;
}

export interface PollInterval {
  min?: number;
  max?: number;
  multiplier?: number;
}

const defaultPollInterval = {
  min: 3,
  max: 30,
  multiplier: 5
};

export class ConnectionMonitor {
  connection: Connection;

  reconnectAttempts: number = 0;
  startedAt: number;
  stoppedAt: number;
  disconnectedAt: number;
  pingedAt: number;

  protected _pollTimeout: number;
  protected _staleThreshold: number;
  protected _pollInterval: PollInterval;

  constructor(settings: ConnectionMonitorSettings) {
    this.visibilityDidChange = this.visibilityDidChange.bind(this);
    this.connection = settings.connection;
    this._pollInterval = settings.pollInterval || defaultPollInterval;
    this._staleThreshold = settings.staleThreshold || 6;
  }

  start(): void {
    if (!this.isRunning) {
      this.startedAt = now();
      delete this.stoppedAt;
      this.startPolling();
      addEventListener('visibilitychange', this.visibilityDidChange);
      console.log(
        `ConnectionMonitor started. pollInterval = ${this._pollInterval} ms`
      );
    }
  }

  stop(): void {
    if (this.isRunning) {
      this.stoppedAt = now();
      this.stopPolling();
      removeEventListener('visibilitychange', this.visibilityDidChange);
      console.log('ConnectionMonitor stopped');
    }
  }

  recordPing(): void {
    this.pingedAt = now();
  }

  recordConnect(): void {
    this.reconnectAttempts = 0;
    this.recordPing();
    delete this.disconnectedAt;
    console.log('ConnectionMonitor recorded connect');
  }

  recordDisconnect(): void {
    this.disconnectedAt = now();
    console.log('ConnectionMonitor recorded disconnect');
  }

  get isRunning(): boolean {
    return this.startedAt && !this.stoppedAt;
  }

  get connectionIsStale(): boolean {
    return (
      secondsSince(this.pingedAt ? this.pingedAt : this.startedAt) >
      this._staleThreshold
    );
  }

  get isDisconnectedRecently(): boolean {
    return (
      this.disconnectedAt &&
      secondsSince(this.disconnectedAt) < this._staleThreshold
    );
  }

  protected startPolling(): void {
    this.stopPolling();
    this.poll();
  }

  protected stopPolling(): void {
    clearTimeout(this._pollTimeout);
  }

  protected poll(): void {
    this._pollTimeout = setTimeout(() => {
      this.reconnectIfStale();
      this.poll();
    }, this._nextPollInterval);
  }

  protected reconnectIfStale(): void {
    if (this.connectionIsStale) {
      console.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${
        this.reconnectAttempts
      },
        pollInterval = ${this._nextPollInterval} ms,
        time disconnected = ${secondsSince(this.disconnectedAt)} s,
        stale threshold = ${this._staleThreshold} s`);
      this.reconnectAttempts++;
      if (this.isDisconnectedRecently) {
        console.log('ConnectionMonitor skipping reopening recent disconnect');
      } else {
        console.log('ConnectionMonitor reopening');
        this.connection.reopen();
      }
    }
  }

  protected visibilityDidChange(): void {
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        if (this.connectionIsStale || !this.connection.isOpen) {
          console.log(
            `ConnectionMonitor reopening stale connection on visibilitychange. visbilityState = ${
              document.visibilityState
            }`
          );
          this.connection.reopen();
        }
      }, 200);
    }
  }

  protected get _nextPollInterval(): number {
    const { min, max, multiplier } = this._pollInterval;
    const interval = multiplier * Math.log(this.reconnectAttempts + 1);
    return Math.round(clamp(interval, min, max) * 1000);
  }
}

const now = (): number => new Date().getTime();
const secondsSince = (time: number): number => (now() - time) / 1000;
const clamp = (number: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, number));
