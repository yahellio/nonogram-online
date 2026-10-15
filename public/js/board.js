import { CROSS, FILLED } from './cell.js';

const SECTION = 5;

function createElement(className, children = []) {
  const element = document.createElement('div');
  element.className = className;
  element.append(...children);
  return element;
}

function createClue(numbers, className) {
  const items = (numbers.length ? numbers : [0]).map((n) => {
    const span = document.createElement('span');
    span.textContent = n;
    return span;
  });
  return createElement(`clue ${className}`, items);
}

function createCell(index, row, col, { rows, cols }) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'cell';
  cell.dataset.index = index;
  cell.classList.toggle('sep-right', (col + 1) % SECTION === 0 && col < cols - 1);
  cell.classList.toggle('sep-bottom', (row + 1) % SECTION === 0 && row < rows - 1);
  return cell;
}

export class Board {
  #root;
  #cells = [];
  #onCellClick;

  constructor(root, onCellClick) {
    this.#root = root;
    this.#onCellClick = onCellClick;
    root.addEventListener('click', (event) => this.#handleClick(event, FILLED));
    root.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.#handleClick(event, CROSS);
    });
  }

  #handleClick(event, tool) {
    const cell = event.target.closest('.cell');
    if (cell) this.#onCellClick(Number(cell.dataset.index), tool);
  }

  render(state) {
    const { size, clues } = state.game;
    this.#root.style.setProperty('--cols', size.cols);

    const colClues = clues.cols.map((clue) => createClue(clue, 'col-clue'));
    const rows = clues.rows.flatMap((clue, row) => [
      createClue(clue, 'row-clue'),
      ...Array.from({ length: size.cols }, (_, col) => createCell(row * size.cols + col, row, col, size)),
    ]);

    this.#root.replaceChildren(createElement('corner'), ...colClues, ...rows);
    this.#cells = [...this.#root.querySelectorAll('.cell')];
    this.#cells.forEach((_, index) => this.updateCell(index, state));
  }

  updateCell(index, state) {
    const element = this.#cells[index];
    const { by } = state.game.cells[index];
    element.dataset.value = state.valueAt(index);
    element.classList.toggle('pending', state.pending.has(index));
    element.title = by ? `Изменил: ${by}` : '';
  }

  flash(index) {
    this.#cells[index].animate([{ backgroundColor: '#d9534f' }, {}], { duration: 800 });
  }

  setSolved(solved) {
    this.#root.classList.toggle('solved', solved);
  }
}
