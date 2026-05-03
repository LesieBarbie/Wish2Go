export const SocketState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
};

class SocketManager {
  constructor() {
    this.ws = null;
    this.state = SocketState.DISCONNECTED;
    this.handlers = [];
    this.stateHandlers = [];
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000;
    this.retryTimer = null;
    this.url = null;
    this.shouldReconnect = true;
  }

  connect(url) {
    this.url = url;
    this.shouldReconnect = true;
    this._setState(SocketState.CONNECTING);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this._setState(SocketState.CONNECTED);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlers.forEach(h => h(data));
        } catch (e) {
          console.warn('[SocketManager] Failed to parse message:', e.message);
        }
      };

      this.ws.onclose = () => {
        if (this.shouldReconnect) this._scheduleReconnect();
        else this._setState(SocketState.DISCONNECTED);
      };

      this.ws.onerror = (e) => {
        console.warn('[SocketManager] Error:', e.message);
      };

    } catch (e) {
      console.warn('[SocketManager] Connect failed:', e.message);
      this._scheduleReconnect();
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._setState(SocketState.DISCONNECTED);
  }

  send(message) {
    if (this.state !== SocketState.CONNECTED || !this.ws) {
      console.warn('[SocketManager] Cannot send — not connected');
      return false;
    }
    this.ws.send(JSON.stringify(message));
    return true;
  }

  onMessage(handler) {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter(h => h !== handler); };
  }

  onStateChange(handler) {
    this.stateHandlers.push(handler);
    return () => { this.stateHandlers = this.stateHandlers.filter(h => h !== handler); };
  }

  _setState(state) {
    this.state = state;
    this.stateHandlers.forEach(h => h(state));
  }

  _scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      this._setState(SocketState.DISCONNECTED);
      return;
    }
    this.retryCount++;
    this._setState(SocketState.RECONNECTING);
    this.retryTimer = setTimeout(() => {
      if (this.shouldReconnect) this.connect(this.url);
    }, this.retryDelay);
  }
}

export const socketManager = new SocketManager();
export { SocketManager };