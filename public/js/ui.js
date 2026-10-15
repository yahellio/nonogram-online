const TOAST_MS = 2500;

const elements = {
  status: document.getElementById('status'),
  title: document.getElementById('title'),
  solved: document.getElementById('solved'),
  players: document.getElementById('players'),
  toast: document.getElementById('toast'),
};

let toastTimer = null;

export function setStatus(online, pendingCount) {
  elements.status.classList.toggle('online', online);
  if (online) {
    elements.status.textContent = 'В сети';
  } else {
    elements.status.textContent = pendingCount
      ? `Нет связи · ходов в очереди: ${pendingCount}`
      : 'Нет связи';
  }
}

export function setTitle(title) {
  elements.title.textContent = title;
}

export function setSolved(solved) {
  elements.solved.hidden = !solved;
}

export function renderPlayers(players) {
  const items = players.map(({ name, online, score }) => {
    const item = document.createElement('li');
    item.classList.toggle('offline', !online);
    const nameEl = document.createElement('span');
    nameEl.textContent = name;
    const scoreEl = document.createElement('b');
    scoreEl.textContent = score;
    item.append(nameEl, scoreEl);
    return item;
  });
  elements.players.replaceChildren(...items);
}

export function showToast(text) {
  elements.toast.textContent = text;
  elements.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, TOAST_MS);
}
