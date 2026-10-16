export const EMPTY = 0;
export const FILLED = 1;
export const CROSS = 2;

//Получает строку из true/false и возвращает подсказку
export function lineClue(line) {
  const clue = [];
  let run = 0;
  for (const filled of line) {
    if (filled) {
      run++;
    } else if (run) {
      clue.push(run);
      run = 0;
    }
  }
  if (run) clue.push(run);
  return clue;
}

//Считает подсказки для всего поля
export function getClues(grid) {
  const columns = grid[0].map((_, col) => grid.map((row) => row[col]));
  return { rows: grid.map(lineClue), cols: columns.map(lineClue) };
}
