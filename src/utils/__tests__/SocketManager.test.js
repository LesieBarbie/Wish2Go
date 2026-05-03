import { SocketManager, SocketState } from '../SocketManager';

// Мокаємо глобальний WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.sent = [];
    this.readyState = 0;
    MockWebSocket.instance = this;
  }
  send(data) { this.sent.push(data); }
  close() { this.readyState = 3; if (this.onclose) this.onclose(); }
}

global.WebSocket = MockWebSocket;

function makeManager() {
  return new SocketManager();
}

describe('SocketManager', () => {

  // 1
  test('initial state is DISCONNECTED', () => {
    const m = makeManager();
    expect(m.state).toBe(SocketState.DISCONNECTED);
  });

  // 2
  test('connect() sets state to CONNECTING then CONNECTED on open', () => {
    const m = makeManager();
    m.connect('ws://test');
    expect(m.state).toBe(SocketState.CONNECTING);
    MockWebSocket.instance.onopen();
    expect(m.state).toBe(SocketState.CONNECTED);
  });

  // 3
  test('disconnect() sets state to DISCONNECTED', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    m.disconnect();
    expect(m.state).toBe(SocketState.DISCONNECTED);
  });

  // 4
  test('disconnect() prevents reconnect', () => {
    const m = makeManager();
    m.connect('ws://test');
    m.disconnect();
    expect(m.shouldReconnect).toBe(false);
  });

  // 5
  test('send() returns false when not connected', () => {
    const m = makeManager();
    const result = m.send({ test: 1 });
    expect(result).toBe(false);
  });

  // 6
  test('send() returns true and sends JSON when connected', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    const result = m.send({ type: 'ping' });
    expect(result).toBe(true);
    expect(MockWebSocket.instance.sent[0]).toBe(JSON.stringify({ type: 'ping' }));
  });

  // 7
  test('onMessage handler is called with parsed JSON', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    const received = [];
    m.onMessage(data => received.push(data));
    MockWebSocket.instance.onmessage({ data: JSON.stringify({ type: 'test' }) });
    expect(received).toHaveLength(1);
    expect(received[0].type).toBe('test');
  });

  // 8
  test('onMessage unsubscribe removes handler', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    const received = [];
    const unsub = m.onMessage(data => received.push(data));
    unsub();
    MockWebSocket.instance.onmessage({ data: JSON.stringify({ type: 'test' }) });
    expect(received).toHaveLength(0);
  });

  // 9
  test('invalid JSON message does not crash', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    expect(() => {
      MockWebSocket.instance.onmessage({ data: 'not json' });
    }).not.toThrow();
  });

  // 10
  test('onStateChange handler is called on state transitions', () => {
    const m = makeManager();
    const states = [];
    m.onStateChange(s => states.push(s));
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    expect(states).toContain(SocketState.CONNECTING);
    expect(states).toContain(SocketState.CONNECTED);
  });

  // 11
  test('onStateChange unsubscribe removes handler', () => {
    const m = makeManager();
    const states = [];
    const unsub = m.onStateChange(s => states.push(s));
    unsub();
    m.connect('ws://test');
    expect(states).toHaveLength(0);
  });

  // 12
  test('onclose triggers RECONNECTING state', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    const states = [];
    m.onStateChange(s => states.push(s));
    MockWebSocket.instance.onclose();
    expect(states).toContain(SocketState.RECONNECTING);
  });

  // 13
  test('retryCount increments on each reconnect attempt', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    MockWebSocket.instance.onclose();
    expect(m.retryCount).toBe(1);
  });

  // 14
  test('stops reconnecting after maxRetries', () => {
    const m = makeManager();
    m.maxRetries = 2;
    m.retryDelay = 0;
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    m.retryCount = 2;
    const states = [];
    m.onStateChange(s => states.push(s));
    m._scheduleReconnect();
    expect(states).toContain(SocketState.DISCONNECTED);
  });

  // 15
  test('multiple onMessage handlers all receive events', () => {
    const m = makeManager();
    m.connect('ws://test');
    MockWebSocket.instance.onopen();
    const r1 = [], r2 = [];
    m.onMessage(d => r1.push(d));
    m.onMessage(d => r2.push(d));
    MockWebSocket.instance.onmessage({ data: JSON.stringify({ x: 1 }) });
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(1);
  });

  // 16
  test('retryCount resets to 0 on successful reconnect', () => {
    const m = makeManager();
    m.connect('ws://test');
    m.retryCount = 3;
    MockWebSocket.instance.onopen();
    expect(m.retryCount).toBe(0);
  });

  // 17
  test('url is stored after connect', () => {
    const m = makeManager();
    m.connect('ws://example.com');
    expect(m.url).toBe('ws://example.com');
  });
});