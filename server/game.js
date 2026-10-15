import { CROSS, EMPTY, FILLED, getClues } from './nonogram.js';
import { PUZZLES } from './puzzles.js';

const VALUES = new Set([EMPTY, FILLED, CROSS]);
const MAX_NAME_LENGTH = 20;

const sameClues = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export class Game {
  constructor({ round = 0, cells = null, solved = false, players = {} } = {}) {
    this.players = players;
    this.#startRound(round, cells, solved);
  }

  #startRound(round, cells = null, solved = false) {
    this.round = round;
    this.puzzle = PUZZLES[round % PUZZLES.length];
    this.clues = getClues(this.puzzle.grid);
    this.size = { rows: this.puzzle.grid.length, cols: this.puzzle.grid[0].length };
    const total = this.size.rows * this.size.cols;
    this.cells = cells?.length === total
      ? cells
      : Array.from({ length: total }, () => ({ value: EMPTY, version: 0, by: null }));
    this.solved = solved;
  }

  setPlayer(playerId, name) {
    this.players[playerId] = String(name ?? '').trim().slice(0, MAX_NAME_LENGTH) || 'Аноним';
  }

  applyMove(playerId, { round, index, value, version }) {
    const cell = Number.isInteger(index) ? this.cells[index] : undefined;
    if (round !== this.round || this.solved || !cell || !VALUES.has(value)) return null;

    // Конфликт: клетку изменил кто-то другой после того, как игрок её видел
    if (cell.version !== version && cell.by !== playerId) {
      return { accepted: false, cell: this.publicCell(cell) };
    }

    Object.assign(cell, { value, version: cell.version + 1, by: playerId });
    this.solved = this.#isSolved();
    return { accepted: true, cell: this.publicCell(cell) };
  }

  nextRound() {
    if (!this.solved) return false;
    this.#startRound(this.round + 1);
    return true;
  }

  #isSolved() {
    const { cols } = this.size;
    const grid = this.puzzle.grid.map((row, r) =>
      row.map((_, c) => this.cells[r * cols + c].value === FILLED));
    return sameClues(getClues(grid), this.clues);
  }

  publicCell({ value, version, by }) {
    return { value, version, by: this.players[by] ?? null };
  }

  view() {
    return {
      round: this.round,
      title: this.puzzle.title,
      size: this.size,
      clues: this.clues,
      cells: this.cells.map((cell) => this.publicCell(cell)),
      solved: this.solved,
    };
  }

  leaderboard(onlineIds) {
    const solution = this.puzzle.grid.flat();
    const scores = {};
    this.cells.forEach(({ value, by }, i) => {
      if (by && value === FILLED && solution[i]) scores[by] = (scores[by] ?? 0) + 1;
    });

    return Object.entries(this.players)
      .filter(([id]) => onlineIds.has(id) || scores[id])
      .map(([id, name]) => ({ name, online: onlineIds.has(id), score: scores[id] ?? 0 }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  toJSON() {
    return { round: this.round, cells: this.cells, solved: this.solved, players: this.players };
  }
}
