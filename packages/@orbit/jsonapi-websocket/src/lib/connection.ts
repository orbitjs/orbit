import { evented, Evented, Listener } from '@orbit/core';

import { ConnectionMonitor, PollInterval } from './connection-monitor';

export interface ConnectionSettings {
  protocols: string[];
  reopenDelay?: number;
  pollInterval?: PollInterval;
  staleThreshold?: number;
}

@evented
export class Connection implements Evented {
  url: string;
  disconnected: boolean = true;
  monitor: ConnectionMonitor;
  webSocket: WebSocket;

  protected _protocols: string[];
  protected _reopenDelay: number;

  // Evented interface stubs
  on: (event: string, listener: Listener) => void;
  off: (event: string, listener?: Listener) => void;
  one: (event: string, listener: Listener) => void;
  emit: (event: string, ...args: any[]) => void;
  listeners: (event: string) => Listener[];

  constructor(url: string, settings: ConnectionSettings) {
    this.url = createWebSocketURL(url);

    this._protocols = settings.protocols;
    this._reopenDelay = settings.reopenDelay || 500;

    this.open = this.open.bind(this);
    this.monitor = new ConnectionMonitor({
      connection: this,
      pollInterval: settings.pollInterval,
      staleThreshold: settings.staleThreshold
    });
  }

  disconnect(): void {
    this.close({ allowReconnect: false });
  }

  ensureActiveConnection(): boolean {
    if (!this.isActive) {
      return this.open();
    }
  }

  send(data: unknown): boolean {
    if (this.isOpen) {
      this.webSocket.send(JSON.stringify(data));
      return true;
    } else {
      return false;
    }
  }

  open(): boolean {
    if (this.isActive) {
      console.log(
        `Attempted to open WebSocket, but existing socket is ${this.state}`
      );
      return false;
    } else {
      console.log(
        `Opening WebSocket, current state is ${this.state}, subprotocols: ${
          this._protocols
        }`
      );
      if (this.webSocket) {
        this.uninstallEventHandlers();
      }
      this.webSocket = new WebSocket(this.url, this._protocols);
      this.installEventHandlers();
      this.monitor.start();
      return true;
    }
  }

  close({ allowReconnect } = { allowReconnect: true }): void {
    if (!allowReconnect) {
      this.monitor.stop();
    }
    if (this.isActive) {
      this.webSocket.close();
    }
  }

  reopen(): boolean {
    console.log(`Reopening WebSocket, current state is ${this.state}`);
    if (this.isActive) {
      try {
        this.close();
      } catch (error) {
        console.log('Failed to reopen WebSocket', error);
      } finally {
        console.log(`Reopening WebSocket in ${this._reopenDelay}ms`);
        setTimeout(this.open, this._reopenDelay);
      }
    } else {
      return this.open();
    }
  }

  get protocol(): string {
    return this.webSocket && this.webSocket.protocol;
  }

  get isOpen(): boolean {
    return this.isState('open');
  }

  get isActive(): boolean {
    return this.isState('open', 'connecting');
  }

  get state(): string | null {
    if (this.webSocket) {
      switch (this.webSocket.readyState) {
        case WebSocket.CLOSED:
          return 'closed';
        case WebSocket.CLOSING:
          return 'closing';
        case WebSocket.CONNECTING:
          return 'connecting';
        case WebSocket.OPEN:
          return 'open';
      }
    }
    return null;
  }

  get isProtocolSupported(): boolean {
    return this._protocols.indexOf(this.protocol) >= 0;
  }

  protected isState(...states: string[]): boolean {
    return states.indexOf(this.state) >= 0;
  }

  protected installEventHandlers(): void {
    this.webSocket.onmessage = (event: MessageEvent) => {
      if (this.isProtocolSupported) {
        const payload = JSON.parse(event.data);
        this.emit('message', payload);
      }
    };
    this.webSocket.onopen = () => {
      console.log(
        `WebSocket onopen event, using '${this.protocol}' subprotocol`
      );
      this.disconnected = false;
      if (!this.isProtocolSupported) {
        console.log(
          'Protocol is unsupported. Stopping monitor and disconnecting.'
        );
        return this.close({ allowReconnect: false });
      }
    };
    this.webSocket.onclose = () => {
      console.log('WebSocket onclose event');
      if (!this.disconnected) {
        this.disconnected = true;
        this.monitor.recordDisconnect();
      }
    };
    this.webSocket.onerror = error => {
      this.emit('error', error);
      console.log('WebSocket onerror event');
    };
  }

  protected uninstallEventHandlers(): void {
    this.webSocket.onmessage = undefined;
    this.webSocket.onopen = undefined;
    this.webSocket.onclose = undefined;
    this.webSocket.onerror = undefined;
  }
}

function createWebSocketURL(url: string): string {
  if (url && !/^wss?:/i.test(url)) {
    const a = document.createElement('a');
    a.href = url;
    // Fix populating Location properties in IE. Otherwise, protocol will be blank.
    a.href = a.href;
    a.protocol = a.protocol.replace('http', 'ws');
    return a.href;
  } else {
    return url;
  }
}
