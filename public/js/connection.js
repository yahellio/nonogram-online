const MIN_DELAY = 1000;
const MAX_DELAY = 10_000;

export class Connection {
  #url;
  #ws = null;
  #timer = null;
  #delay = MIN_DELAY;
  #handlers;

  constructor(url, { onOpen, onMessage, onStatusChange }) {
    this.#url = url;
    this.#handlers = { onOpen, onMessage, onStatusChange };
    window.addEventListener('offline', () => this.#ws?.close());
    window.addEventListener('online', () => this.#reconnectNow());
  }

  get online() {
    return this.#ws?.readyState === WebSocket.OPEN;
  }

  connect() {
    this.#timer = null;
    const ws = new WebSocket(this.#url);

    ws.addEventListener('open', () => {
      this.#delay = MIN_DELAY;
      this.#handlers.onStatusChange(true);
      this.#handlers.onOpen();
    });
    ws.addEventListener('message', (event) => this.#handlers.onMessage(JSON.parse(event.data)));
    ws.addEventListener('close', () => {
      this.#handlers.onStatusChange(false);
      this.#scheduleReconnect();
    });

    this.#ws = ws;
  }

  send(message) {
    if (this.online) this.#ws.send(JSON.stringify(message));
  }

  #scheduleReconnect() {
    this.#timer = setTimeout(() => this.connect(), this.#delay);
    this.#delay = Math.min(this.#delay * 2, MAX_DELAY);
  }

  #reconnectNow() {
    if (!this.#timer) return;
    clearTimeout(this.#timer);
    this.connect();
  }
}
