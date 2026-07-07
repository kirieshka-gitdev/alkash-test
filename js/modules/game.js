// game.js — модульная игра

import { shuffleArray, formatDuration } from './utils.js';
import { getProfile, setProfile, getHistory, setHistory, saveAccounts, isFunnyMode } from './auth.js';
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
  blocked: false,
  timer: null,
  startTime: 0
};

let gameUI = {};

export function initGame(elements) {
  gameUI = { ...gameUI, ...elements };
}

export function initGameSession() {
  const pairs = shuffleArray([...GAME_EMOJIS, ...GAME_EMOJIS]);
  gameState.cards = pairs.map((em, idx) => ({ id: idx, emoji: em, matched: false, flipped: false }));
  gameState.flipped = [];
  gameState.matched = [];
  gameState.locked = false;
  gameState.seconds = 0;
  gameState.started = false;
  gameState.finished = false;
  gameState.blocked = false;
  gameState.startTime = 0;
  
  if (gameState.timer) { clearInterval(gameState.timer); gameState.timer = null; }
  
  gameUI.gameStatus.textContent = 'Найди пары! Трезвый ум — быстрый ум.';
  gameUI.gameTimerDisplay.textContent = '⏱ 0:00';
  gameUI.gameStartBtn.disabled = false;
  gameUI.gameStartBtn.innerHTML = '<i class="fas fa-play"></i> Начать игру';
  renderGame();
  localStorage.removeItem('gameInProgress');
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
  if (gameState.started || gameState.finished) return;
  
  gameState.started = true;
  gameState.seconds = 0;
  gameState.startTime = Date.now();
  gameUI.gameStartBtn.disabled = true;
  gameUI.gameStartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Игра идёт...';
  
  const saveState = {
    cards: gameState.cards.map(c => ({ ...c })),
    seconds: 0,
    started: true,
    startTime: gameState.startTime
  };
  localStorage.setItem('gameInProgress', JSON.stringify(saveState));
  
  if (gameState.timer) clearInterval(gameState.timer);
  gameState.timer = setInterval(() => {
    gameState.seconds++;
    gameUI.gameTimerDisplay.textContent = `⏱ ${formatDuration(gameState.seconds)}`;
    
    if (gameState.seconds >= 45 && !gameState.blocked) {
      gameState.blocked = true;
      gameUI.gameStatus.textContent = '⛔ Игра заблокирована! Доиграйте до конца.';
      gameUI.gameStartBtn.disabled = true;
      const state = JSON.parse(localStorage.getItem('gameInProgress') || '{}');
      state.blocked = true;
      localStorage.setItem('gameInProgress', JSON.stringify(state));
    }
    
    if (gameState.seconds >= 60) {
      clearInterval(gameState.timer);
      gameState.timer = null;
      gameState.finished = true;
      gameState.started = false;
      localStorage.removeItem('gameInProgress');
      gameUI.gameStatus.textContent = '⏰ Время вышло! Вы не успели. Статус: АЛКАШ!';
      gameUI.gameStartBtn.disabled = false;
      gameUI.gameStartBtn.innerHTML = '<i class="fas fa-redo"></i> Новая игра';
      
      const profile = getProfile();
      if (profile && !isFunnyMode()) {
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
  }, 1000);
}

function handleGameClick(idx) {
  if (gameState.locked || gameState.finished || !gameState.started) return;
  if (gameState.blocked) {
    gameUI.gameStatus.textContent = '⛔ Игра заблокирована! Доиграйте до конца.';
    return;
  }
  
  const card = gameState.cards[idx];
  if (card.matched || card.flipped) return;
  if (!gameState.started) {
    startGame();
  }
  
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
        localStorage.removeItem('gameInProgress');
        const time = gameState.seconds;
        gameUI.gameStatus.textContent = `🎉 Поздравляем! Вы прошли за ${time} сек. Вы трезвы!`;
        gameUI.gameStartBtn.disabled = false;
        gameUI.gameStartBtn.innerHTML = '<i class="fas fa-redo"></i> Новая игра';
        
        const profile = getProfile();
        if (profile && !isFunnyMode()) {
          const history = getHistory();
          history.push({ time: Date.now(), percent: 0, label: `🏆 Модуль: ${time}с`, status: 'sober' });
          if (history.length > 30) history.shift();
          setHistory(history);
          saveAccounts();
          if (window.onHistoryUpdate) window.onHistoryUpdate();
        }
      }
    } else {
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

export function restoreGame() {
  const saved = localStorage.getItem('gameInProgress');
  if (!saved) return;
  
  try {
    const state = JSON.parse(saved);
    if (state.started && !state.finished) {
      gameState.cards = state.cards;
      gameState.started = true;
      gameState.startTime = state.startTime;
      gameState.seconds = Math.floor((Date.now() - state.startTime) / 1000);
      
      if (gameState.seconds > 60) {
        localStorage.removeItem('gameInProgress');
        return;
      }
      
      if (state.blocked) {
        gameState.blocked = true;
        gameUI.gameStatus.textContent = '⛔ Игра заблокирована! Доиграйте до конца.';
      }
      
      gameUI.gameStartBtn.disabled = true;
      gameUI.gameStartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Игра идёт...';
      gameUI.gameTimerDisplay.textContent = `⏱ ${formatDuration(gameState.seconds)}`;
      renderGame();
      
      if (gameState.timer) clearInterval(gameState.timer);
      gameState.timer = setInterval(() => {
        gameState.seconds++;
        gameUI.gameTimerDisplay.textContent = `⏱ ${formatDuration(gameState.seconds)}`;
        
        if (gameState.seconds >= 45 && !gameState.blocked) {
          gameState.blocked = true;
          gameUI.gameStatus.textContent = '⛔ Игра заблокирована! Доиграйте до конца.';
          const s = JSON.parse(localStorage.getItem('gameInProgress') || '{}');
          s.blocked = true;
          localStorage.setItem('gameInProgress', JSON.stringify(s));
        }
        
        if (gameState.seconds >= 60) {
          clearInterval(gameState.timer);
          gameState.timer = null;
          gameState.finished = true;
          gameState.started = false;
          localStorage.removeItem('gameInProgress');
          gameUI.gameStatus.textContent = '⏰ Время вышло! Вы не успели. Статус: АЛКАШ!';
          gameUI.gameStartBtn.disabled = false;
          gameUI.gameStartBtn.innerHTML = '<i class="fas fa-redo"></i> Новая игра';
          
          const profile = getProfile();
          if (profile && !isFunnyMode()) {
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
      }, 1000);
    }
  } catch(e) {
    localStorage.removeItem('gameInProgress');
  }
}