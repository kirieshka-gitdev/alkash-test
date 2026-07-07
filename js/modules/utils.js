// utils.js — вспомогательные функции

export function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
}

export function formatDuration(sec) {
  if (sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getStatusLabel(status) {
  if (status === 'drunk') return '🍷 Алкаш';
  if (status === 'almost') return '🌙 Почти трезвый';
  if (status === 'sober') return '✨ Трезвый';
  return '❓ Неизвестен';
}

export function getStatusClass(status) {
  if (status === 'drunk') return 'drunk';
  if (status === 'almost') return 'almost';
  if (status === 'sober') return 'sober';
  return 'unknown';
}