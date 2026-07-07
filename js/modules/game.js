// game.js — модульная игра

import { shuffleArray, formatDuration } from './utils.js';
import { getProfile, setProfile, getHistory, setHistory, saveAccounts, isSandboxMode } from './auth.js';
import { updateProfileUI } from './profile.js';

const GAME_EMOJIS = ['🍺','🍷','🥃','🍸','🧉','🍹','🍾','🥂'];

let gameState = {
  cards: [],
  flipped: [],
  matched: [],
  locked: false,
  seconds: 0,
  started: false,
  finished: false,
  timer: null,
  clicks: 0,
  errors: 0
};

let gameUI = {};

export function initGame(elements) {
  gameUI = { ...gameUI, ...elements };
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && gameState.started && !gameState.finished) {
      pauseMemoryGame();
    }
  });
  window.addEventListener('beforeunload', () => {
    if (gameState.started && !gameState.finished) {
      pauseMemoryGame();
    }
  });
}

export function isGameRunning() {
  return gameState.started && !gameState.finished;
}

export function pauseMemoryGame() {
  if (!gameState.started || gameState.finished) return;
  
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }
  
  const saveState = {
    cards: gameState.cards,
    flipped: gameState.flipped,
    matched: gameState.matched,
    seconds: gameState.seconds,
    clicks: gameState.clicks,
    errors: gameState.errors,
    started: true,
    finished: false,
    paused: true
  };
  localStorage.setItem('memoryGameState', JSON.stringify(saveState));
  
  gameState.started = false;
  
  gameUI.gameStartBtn.disabled = false;
  gameUI.gameStartBtn.innerHTML = '<i class="fas fa-play"></i> Продолжить игру';
  gameUI.gameStatus.textContent = '⏸ Игра приостановлена. Нажмите "Продолжить"!';
}

export function initGameSession() {
  const saved = localStorage.getItem('memoryGameState');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.paused) {
        gameState.cards = state.cards;
        gameState.flipped = state.flipped;
        gameState.matched = state.matched;
        gameState.seconds = state.seconds;
        gameState.clicks = state.clicks || 0;
        gameState.errors = state.errors || 0;
        gameState.started = false;
        gameState.finished = false;
        
        gameUI.gameStatus.textContent = '⏸ Игра приостановлена. Нажмите "Продолжить"!';
        gameUI.gameTimerDisplay.textContent = `⏱ ${formatDuration(gameState.seconds)}`;
        gameUI.gameStartBtn.disabled = false;
        gameUI.gameStartBtn.innerHTML = '<i class="fas fa-play"></i> Продолжить игру';
        if (gameUI.shareGameBtn) gameUI.shareGameBtn.classList.add('hidden');
        renderGame();
        return;
      }
    } catch (e) {
      localStorage.removeItem('memoryGameState');
    }
  }
  
  const pairs = shuffleArray([...GAME_EMOJIS, ...GAME_EMOJIS]);
  gameState.cards = pairs.map((em, idx) => ({ id: idx, emoji: em, matched: false, flipped: false }));
  gameState.flipped = [];
  gameState.matched = [];
  gameState.locked = false;
  gameState.seconds = 0;
  gameState.clicks = 0;
  gameState.errors = 0;
  gameState.started = false;
  gameState.finished = false;
  
  if (gameState.timer) { clearInterval(gameState.timer); gameState.timer = null; }
  
  gameUI.gameStatus.textContent = 'Найди пары! Трезвый ум — быстрый ум.';
  gameUI.gameTimerDisplay.textContent = '⏱ 0:00';
  gameUI.gameStartBtn.disabled = false;
  gameUI.gameStartBtn.innerHTML = '<i class="fas fa-play"></i> Начать игру';
  if (gameUI.shareGameBtn) gameUI.shareGameBtn.classList.add('hidden');
  renderGame();
}

function renderGame() {
  gameUI.gameGrid.innerHTML = '';
  gameState.cards.forEach((card, idx) => {
    const div = document.createElement('div');
    div.className = 'game-card';
    if (card.matched) div.classList.add('matched');
    else if (card.flipped) div.classList.add('flipped');
    div.textContent = (card.flipped || card.matched) ? card.emoji : '❓';
    div.dataset.idx = idx;
    div.addEventListener('click', () => handleGameClick(idx));
    gameUI.gameGrid.appendChild(div);
  });
}

export function startGame() {
  // Фикс бага кнопки "Новая игра": если игра завершена, сбрасываем состояние и запускаем заново
  if (gameState.finished) {
    localStorage.removeItem('memoryGameState');
    const pairs = shuffleArray([...GAME_EMOJIS, ...GAME_EMOJIS]);
    gameState.cards = pairs.map((em, idx) => ({ id: idx, emoji: em, matched: false, flipped: false }));
    gameState.flipped = [];
    gameState.matched = [];
    gameState.locked = false;
    gameState.seconds = 0;
    gameState.clicks = 0;
    gameState.errors = 0;
    gameState.started = true;
    gameState.finished = false;
    if (gameUI.shareGameBtn) gameUI.shareGameBtn.classList.add('hidden');
  }
  
  const saved = localStorage.getItem('memoryGameState');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.paused) {
        gameState.cards = state.cards;
        gameState.flipped = state.flipped;
        gameState.matched = state.matched;
        gameState.seconds = state.seconds;
        gameState.clicks = state.clicks || 0;
        gameState.errors = state.errors || 0;
        gameState.started = true;
        gameState.finished = false;
        localStorage.removeItem('memoryGameState');
      }
    } catch (e) {
      localStorage.removeItem('memoryGameState');
    }
  }
  
  if (!gameState.started) {
    gameState.started = true;
    gameState.seconds = 0;
    gameState.clicks = 0;
    gameState.errors = 0;
  }
  
  gameUI.gameStartBtn.disabled = true;
  gameUI.gameStartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Игра идёт...';
  gameUI.gameStatus.textContent = 'Найди пары! Трезвый ум — быстрый ум.';
  renderGame();
  
  if (gameState.timer) clearInterval(gameState.timer);
  gameState.timer = setInterval(() => {
    gameState.seconds++;
    gameUI.gameTimerDisplay.textContent = `⏱ ${formatDuration(gameState.seconds)}`;
    
    const activeState = {
      cards: gameState.cards,
      flipped: gameState.flipped,
      matched: gameState.matched,
      seconds: gameState.seconds,
      clicks: gameState.clicks,
      errors: gameState.errors,
      started: true,
      finished: false,
      paused: true
    };
    localStorage.setItem('memoryGameState', JSON.stringify(activeState));
    
    if (gameState.seconds >= 45) {
      clearInterval(gameState.timer);
      gameState.timer = null;
      gameState.finished = true;
      gameState.started = false;
      localStorage.removeItem('memoryGameState');
      gameUI.gameStatus.textContent = '⏰ Время вышло! Вы не успели. Статус: АЛКАШ!';
      gameUI.gameStartBtn.disabled = false;
      gameUI.gameStartBtn.innerHTML = '<i class="fas fa-redo"></i> Новая игра';
      if (gameUI.shareGameBtn) gameUI.shareGameBtn.classList.remove('hidden');
      
      if (isSandboxMode()) {
        customAlert('Песочница', '⚠️ Внимание: Время вышло в режиме "Песочница". Ваш реальный статус и история не изменились.');
      } else {
        const profile = getProfile();
        if (profile) {
          profile.status = 'drunk';
          profile.timerUntil = Date.now() + 5 * 60 * 60 * 1000;
          setProfile(profile);
          saveAccounts();
          
          const history = getHistory();
          history.push({ time: Date.now(), percent: 85, label: '💜 Провал в игре → Алкаш!', status: 'drunk' });
          if (history.length > 30) history.shift();
          setHistory(history);
          saveAccounts();
          
          updateProfileUI();
          if (window.onHistoryUpdate) window.onHistoryUpdate();
        }
      }
    }
  }, 1000);
}

function handleGameClick(idx) {
  if (gameState.locked || gameState.finished || (!gameState.started && !localStorage.getItem('memoryGameState'))) return;
  
  const card = gameState.cards[idx];
  if (card.matched || card.flipped) return;
  
  if (!gameState.started) {
    startGame();
  }
  
  gameState.clicks++;
  card.flipped = true;
  gameState.flipped.push(idx);
  renderGame();
  
  if (gameState.flipped.length === 2) {
    gameState.locked = true;
    const idx1 = gameState.flipped[0], idx2 = gameState.flipped[1];
    
    if (gameState.cards[idx1].emoji === gameState.cards[idx2].emoji) {
      gameState.cards[idx1].matched = true;
      gameState.cards[idx2].matched = true;
      gameState.matched.push(idx1, idx2);
      gameState.flipped = [];
      gameState.locked = false;
      renderGame();
      
      if (gameState.matched.length === gameState.cards.length) {
        clearInterval(gameState.timer);
        gameState.timer = null;
        gameState.finished = true;
        gameState.started = false;
        localStorage.removeItem('memoryGameState');
        const time = gameState.seconds;
        gameUI.gameStatus.textContent = `🎉 Поздравляем! Вы прошли за ${time} сек. Вы трезвы!`;
        gameUI.gameStartBtn.disabled = false;
        gameUI.gameStartBtn.innerHTML = '<i class="fas fa-redo"></i> Новая игра';
        if (gameUI.shareGameBtn) gameUI.shareGameBtn.classList.remove('hidden');
        
        if (isSandboxMode()) {
          customAlert('Песочница', `🎉 Результат: ${time}с в режиме "Песочница". На ваш статус это никак не повлияло.`);
        } else {
          const profile = getProfile();
          if (profile) {
            const history = getHistory();
            history.push({ time: Date.now(), percent: 0, label: `🏆 Модуль: ${time}с`, status: 'sober' });
            if (history.length > 30) history.shift();
            setHistory(history);
            saveAccounts();
            if (window.onHistoryUpdate) window.onHistoryUpdate();
          }
        }
      }
    } else {
      gameState.errors++;
      setTimeout(() => {
        gameState.cards[idx1].flipped = false;
        gameState.cards[idx2].flipped = false;
        gameState.flipped = [];
        gameState.locked = false;
        renderGame();
      }, 500);
    }
  }
}

export function getGameSharePayload() {
  const profile = getProfile();
  return {
    type: 'game',
    name: profile ? profile.name : 'Аноним',
    sandbox: isSandboxMode(),
    seconds: gameState.seconds,
    clicks: gameState.clicks,
    errors: gameState.errors,
    victory: gameState.matched.length === gameState.cards.length
  };
}

export function restoreGame() {
  initGameSession();
  if (localStorage.getItem('memoryGameState')) {
    const saved = JSON.parse(localStorage.getItem('memoryGameState'));
    if (saved.paused && saved.started) {
      // Готово к возобновлению
    }
  }
}

let customAlert = (title, message) => alert(message);
export function setCustomAlert(alertFn) {
  customAlert = alertFn;
}