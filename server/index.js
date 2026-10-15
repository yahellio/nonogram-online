import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { Game } from './game.js';
import { serveStatic } from './static.js';
import { loadState, saveState } from './storage.js';

const PORT = Number(process.env.PORT) || 3000;
const HEARTBEAT_MS = 30_000;

const game = new Game(await loadState());
const server = createServer(serveStatic);
const wss = new WebSocketServer({ server });

const sessions = new Map();
const alive = new WeakSet();

const persist = () => saveState(game.toJSON());

const send = (ws, message) => ws.send(JSON.stringify(message));

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const ws of sessions.keys()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function broadcastPlayers() {
  broadcast({ type: 'players', players: game.leaderboard(new Set(sessions.values())) });
}

const handlers = {
  hello(ws, { playerId, name }) {
    if (typeof playerId !== 'string' || !playerId) return;
    sessions.set(ws, playerId);
    game.setPlayer(playerId, name);
    send(ws, { type: 'state', game: game.view() });
    broadcastPlayers();
    persist();
  },

  move(ws, move) {
    const playerId = sessions.get(ws);
    if (!playerId) return;

    const result = game.applyMove(playerId, move);
    if (!result) return;

    if (!result.accepted) {
      send(ws, { type: 'reject', moveId: move.id, index: move.index, cell: result.cell });
      return;
    }

    broadcast({ type: 'cell', moveId: move.id, index: move.index, cell: result.cell, solved: game.solved });
    broadcastPlayers();
    persist();
  },

  next(ws) {
    if (!sessions.has(ws) || !game.nextRound()) return;
    broadcast({ type: 'state', game: game.view() });
    broadcastPlayers();
    persist();
  },
};

wss.on('connection', (ws) => {
  alive.add(ws);
  ws.on('pong', () => alive.add(ws));

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (Object.hasOwn(handlers, message?.type)) handlers[message.type](ws, message);
  });

  ws.on('close', () => {
    if (sessions.delete(ws)) broadcastPlayers();
  });
});

// Обрывает «зависшие» соединения, которые не ответили на ping
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!alive.has(ws)) {
      ws.terminate();
      continue;
    }
    alive.delete(ws);
    ws.ping();
  }
}, HEARTBEAT_MS);

async function shutdown() {
  clearInterval(heartbeat);
  await persist();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
