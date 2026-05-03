import { SocketState } from './SocketManager';

// Тестові події які імітує mock-сервер
const MOCK_EVENTS = [
  { type: 'friend_visited', countryId: '276', countryName: 'Germany', friendName: 'Олена' },
  { type: 'friend_visited', countryId: '250', countryName: 'France', friendName: 'Максим' },
  { type: 'country_tip', countryId: '380', countryName: 'Ukraine', tip: 'Спробуй борщ у Львові!' },
  { type: 'friend_visited', countryId: '392', countryName: 'Japan', friendName: 'Аня' },
  { type: 'country_tip', countryId: '724', countryName: 'Spain', tip: 'Найкращий час — квітень-травень' },
];

class MockSocketManager {
  constructor() {
    this.state = SocketState.DISCONNECTED;
    this.handlers = [];
    this.stateHandlers = [];
    this.timer = null;
    this.eventIndex = 0;
  }

  connect() {
    this._setState(SocketState.CONNECTING);
    setTimeout(() => {
      this._setState(SocketState.CONNECTED);
      this._startMocking();
    }, 800);
  }

  disconnect() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this._setState(SocketState.DISCONNECTED);
  }

  send(message) {
    console.log('[MockSocket] Sent:', message);
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

  _startMocking() {
    this.timer = setInterval(() => {
      const event = MOCK_EVENTS[this.eventIndex % MOCK_EVENTS.length];
      this.eventIndex++;
      this.handlers.forEach(h => h(event));
    }, 4000);
  }

  _setState(state) {
    this.state = state;
    this.stateHandlers.forEach(h => h(state));
  }
}

export const mockSocketManager = new MockSocketManager();