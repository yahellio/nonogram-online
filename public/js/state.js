import { EMPTY } from './cell.js';

const STORAGE_KEY = 'nonogram-state';

export class GameState {
  game = null;
  pending = new Map();

  static restore() {
    const state = new GameState();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved?.game) {
        state.game = saved.game;
        state.pending = new Map(saved.pending);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    return state;
  }

  save() {
    const data = { game: this.game, pending: [...this.pending] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  setGame(game) {
    if (game.round !== this.game?.round) this.pending.clear();
    this.game = game;
    this.save();
  }

  valueAt(index) {
    return this.pending.get(index)?.value ?? this.game.cells[index].value;
  }

  makeMove(index, tool) {
    if (!this.game || this.game.solved) return null;

    // Повторный ход в ту же клетку сохраняет версию, которую игрок видел изначально
    const version = this.pending.get(index)?.version ?? this.game.cells[index].version;
    const value = this.valueAt(index) === tool ? EMPTY : tool;
    const move = { id: crypto.randomUUID(), round: this.game.round, index, value, version };

    this.pending.set(index, move);
    this.save();
    return move;
  }

  applyCell(index, cell, moveId, solved = this.game.solved) {
    this.game.cells[index] = cell;
    this.game.solved = solved;
    if (this.pending.get(index)?.id === moveId) this.pending.delete(index);
    this.save();
  }
}
