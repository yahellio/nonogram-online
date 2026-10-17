import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Game } from '../server/game.js';
import { CROSS, FILLED } from '../server/nonogram.js';
import { PUZZLES } from '../server/puzzles.js';

const move = (index, value, version) => ({ round: 0, index, value, version });

test('all puzzles are rectangular', () => {
  for (const { title, grid } of PUZZLES) {
    assert.ok(grid.every((row) => row.length === grid[0].length), title);
  }
});

test('accepts a move with the current version', () => {
  const game = new Game();
  const result = game.applyMove('a', move(0, FILLED, 0));
  assert.equal(result.accepted, true);
  assert.equal(game.cells[0].version, 1);
});

test('rejects a move made over another player change', () => {
  const game = new Game();
  game.setPlayer('a', 'Alice');
  game.applyMove('a', move(0, FILLED, 0));

  const result = game.applyMove('b', move(0, CROSS, 0));
  assert.equal(result.accepted, false);
  assert.deepEqual(result.cell, { value: FILLED, version: 1, by: 'Alice' });
});

test('accepts own consecutive moves based on an unconfirmed version', () => {
  const game = new Game();
  game.applyMove('a', move(0, FILLED, 0));
  assert.equal(game.applyMove('a', move(0, CROSS, 0)).accepted, true);
  assert.equal(game.cells[0].value, CROSS);
});

test('ignores invalid moves', () => {
  const game = new Game();
  assert.equal(game.applyMove('a', move('__proto__', FILLED, 0)), null);
  assert.equal(game.applyMove('a', move(0, 42, 0)), null);
  assert.equal(game.applyMove('a', { ...move(0, FILLED, 0), round: 5 }), null);
});

test('detects a solved puzzle and starts the next round', () => {
  const game = new Game();
  game.setPlayer('a', 'Alice');
  game.puzzle.grid.flat().forEach((filled, i) => {
    if (filled) game.applyMove('a', move(i, FILLED, 0));
  });

  assert.equal(game.solved, true);
  assert.deepEqual(game.history, [{ title: PUZZLES[0].title, by: 'Alice' }]);
  assert.equal(game.nextRound(), true);
  assert.equal(game.round, 1);
  assert.equal(game.solved, false);
});
