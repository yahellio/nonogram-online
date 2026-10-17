import { Board } from './board.js';
import { Connection } from './connection.js';
import { GameState } from './state.js';
import * as ui from './ui.js';

const nameInput = document.getElementById('name');
const nextButton = document.getElementById('next');

function loadPlayer() {
  const id = localStorage.getItem('playerId') ?? crypto.randomUUID();
  const name = localStorage.getItem('playerName') ?? `Игрок-${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem('playerId', id);
  localStorage.setItem('playerName', name);
  return { id, name };
}

const player = loadPlayer();
const state = GameState.restore();
const board = new Board(document.getElementById('board'), handleCellClick);
const connection = new Connection(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`, {
  onOpen: sayHello,
  onMessage: handleMessage,
  onStatusChange: updateStatus,
});

function sayHello() {
  connection.send({ type: 'hello', playerId: player.id, name: player.name });
}

function updateStatus() {
  ui.setStatus(connection.online, state.pending.size);
}

function renderGame() {
  ui.setTitle(state.game.title);
  ui.setSolved(state.game.solved);
  board.render(state);
  board.setSolved(state.game.solved);
  updateStatus();
}

function handleCellClick(index, tool) {
  const move = state.makeMove(index, tool);
  if (!move) return;
  board.updateCell(index, state);
  connection.send({ type: 'move', ...move });
  updateStatus();
}

const messageHandlers = {
  state({ game }) {
    state.setGame(game);
    renderGame();
    for (const move of state.pending.values()) connection.send({ type: 'move', ...move });
  },

  cell({ index, cell, moveId, solved }) {
    state.applyCell(index, cell, moveId, solved);
    board.updateCell(index, state);
    board.setSolved(solved);
    ui.setSolved(solved);
    updateStatus();
  },

  reject({ index, cell, moveId }) {
    state.applyCell(index, cell, moveId);
    board.updateCell(index, state);
    board.flash(index);
    ui.showToast(`Конфликт: клетку уже изменил ${cell.by ?? 'другой игрок'}`);
    updateStatus();
  },

  players({ players }) {
    ui.renderPlayers(players);
  },

  history({ history }) {
    ui.renderHistory(history);
  },
};

function handleMessage(message) {
  if (Object.hasOwn(messageHandlers, message.type)) messageHandlers[message.type](message);
}

nameInput.value = player.name;
nameInput.addEventListener('change', () => {
  player.name = nameInput.value.trim() || player.name;
  nameInput.value = player.name;
  localStorage.setItem('playerName', player.name);
  sayHello();
});

nextButton.addEventListener('click', () => connection.send({ type: 'next' }));

if (state.game) renderGame();
connection.connect();
