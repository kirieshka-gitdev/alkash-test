// app.js — главный файл, инициализация всех модулей

import { initAuth, loadAccount, renderAccountList, loadAccounts, saveAccounts, getProfile, getHistory, setProfile, setHistory, getAllAccounts, getCurrentIndex } from './modules/auth.js';
import { initProfile, updateProfileUI } from './modules/profile.js';
import { initTest, startNewGame } from './modules/test.js';
import { initGame, initGameSession, restoreGame, startGame as startGameSession, pauseMemoryGame } from './modules/game.js';
import { initCaptcha, startCaptcha, cancelCaptcha } from './modules/captcha.js';
import { initHistory, renderHistory, renderChart } from './modules/history.js';
import { formatDuration } from './modules/utils.js';

const dom = {
  // Левая панель
  leftPanel: document.getElementById('leftPanel'),
  panelName: document.getElementById('panelName'),
  panelAvatar: document.getElementById('panelAvatar'),
  panelStatus: document.getElementById('panelStatus'),
  panelTimerText: document.getElementById('panelTimerText'),
  panelMeta: document.getElementById('panelMeta'),
  panelAccountType: document.getElementById('panelAccountType'),
  panelEditName: document.getElementById('panelEditName'),
  panelCaptchaBtn: document.getElementById('panelCaptchaBtn'),
  panelDeleteBtn: document.getElementById('panelDeleteBtn'),
  panelTokenBtn: document.getElementById('panelTokenBtn'),
  panelAccountsBtn: document.getElementById('panelAccountsBtn'),
  funnyBadge: document.getElementById('funnyBadge'),
  
  // Регистрация
  registerScreen: document.getElementById('registerScreen'),
  mainApp: document.getElementById('mainApp'),
  nameInput: document.getElementById('nameInput'),
  tokenInput: document.getElementById('tokenInput'),
  registerBtn: document.getElementById('registerBtn'),
  loginTokenBtn: document.getElementById('loginTokenBtn'),
  accountList: document.getElementById('accountList'),
  
  // Тест
  questionBlock: document.getElementById('questionBlock'),
  resultBlock: document.getElementById('resultBlock'),
  questionText: document.getElementById('questionText'),
  optionsContainer: document.getElementById('optionsContainer'),
  progressText: document.getElementById('progressText'),
  progressFill: document.getElementById('progressFill'),
  extraIndicator: document.getElementById('extraIndicator'),
  scaleMarker: document.getElementById('scaleMarker'),
  resultLabel: document.getElementById('resultLabel'),
  resultSub: document.getElementById('resultSub'),
  percentageDisplay: document.getElementById('percentageDisplay'),
  resetBtn: document.getElementById('resetBtn'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  
  // Игра
  gameGrid: document.getElementById('gameGrid'),
  gameStatus: document.getElementById('gameStatus'),
  gameTimerDisplay: document.getElementById('gameTimerDisplay'),
  gameStartBtn: document.getElementById('gameStartBtn'),
  
  // Капча
  captchaOverlay: document.getElementById('captchaOverlay'),
  captchaProgressFill: document.getElementById('captchaProgressFill'),
  captchaTimerDisplay: document.getElementById('captchaTimerDisplay'),
  captchaBufferDisplay: document.getElementById('captchaBufferDisplay'),
  captchaAdContainer: document.getElementById('captchaAdContainer'),
  captchaCancelBtn: document.getElementById('captchaCancelBtn'),
  captchaResult: document.getElementById('captchaResult'),
  
  // История
  historyList: document.getElementById('historyList'),
  chartWrapper: document.getElementById('chartWrapper'),
  chartCanvas: document.getElementById('historyChart'),
  chartEmptyText: document.getElementById('chartEmptyText'),
  
  // Системное уведомление
  systemNotif: document.getElementById('systemNotification'),
  notifCloseBtn: document.getElementById('notifCloseBtn'),
  
  // Кастомный алерт
  customAlert: document.getElementById('customAlert'),
  alertTitle: document.getElementById('alertTitle'),
  alertMessage: document.getElementById('alertMessage'),
  alertInput: document.getElementById('alertInput'),
  alertInputContainer: document.getElementById('alertInputContainer'),
  alertOkBtn: document.getElementById('alertOkBtn'),
  alertCancelBtn: document.getElementById('alertCancelBtn'),
  alertCopyBtn: document.getElementById('alertCopyBtn'),
  
  // Режимы
  modeBtns: document.querySelectorAll('.mode-btn'),
  standardMode: document.getElementById('standardMode'),
  modularMode: document.getElementById('modularMode'),
  
  // Кнопки
  captchaBtn: document.getElementById('panelCaptchaBtn'),
  deleteBtn: document.getElementById('panelDeleteBtn'),
  tokenBtn: document.getElementById('panelTokenBtn'),
  accountsBtn: document.getElementById('panelAccountsBtn')
};

// ----- КАСТОМНЫЙ АЛЕРТ -----
let alertResolve = null;
let alertCopyText = null;

function customAlert(title, message, inputPlaceholder = null, copyText = null) {
  return new Promise((resolve) => {
    dom.alertTitle.textContent = title || 'Уведомление';
    dom.alertMessage.textContent = message || '';
    alertCopyText = copyText;
    
    if (copyText) {
      dom.alertCopyBtn.classList.remove('hidden');
      dom.alertCancelBtn.classList.add('hidden'); // Убираем отмену для копирования токена
    } else {
      dom.alertCopyBtn.classList.add('hidden');
    }
    
    if (inputPlaceholder !== null) {
      dom.alertInputContainer.classList.remove('hidden');
      dom.alertInput.value = '';
      dom.alertInput.placeholder = inputPlaceholder;
      dom.alertCancelBtn.classList.remove('hidden'); // Показываем Отмену только если нужен ввод текста
      setTimeout(() => dom.alertInput.focus(), 100);
    } else {
      dom.alertInputContainer.classList.add('hidden');
      if (!copyText) {
        dom.alertCancelBtn.classList.add('hidden'); // Убираем отмену в информационных окнах
      }
    }
    
    dom.customAlert.classList.add('show');
    alertResolve = resolve;
  });
}

dom.alertOkBtn.addEventListener('click', () => {
  dom.customAlert.classList.remove('show');
  if (alertResolve) {
    const val = dom.alertInputContainer.classList.contains('hidden') ? true : dom.alertInput.value.trim();
    alertResolve(val);
    alertResolve = null;
  }
});

dom.alertCancelBtn.addEventListener('click', () => {
  dom.customAlert.classList.remove('show');
  if (alertResolve) {
    alertResolve(null);
    alertResolve = null;
  }
});

dom.alertCopyBtn.addEventListener('click', () => {
  if (alertCopyText) {
    navigator.clipboard.writeText(alertCopyText).then(() => {
      dom.alertCopyBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
      setTimeout(() => {
        dom.alertCopyBtn.innerHTML = '<i class="fas fa-copy"></i> Копировать';
      }, 2000);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = alertCopyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      dom.alertCopyBtn.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
      setTimeout(() => {
        dom.alertCopyBtn.innerHTML = '<i class="fas fa-copy"></i> Копировать';
      }, 2000);
    });
  }
});

dom.alertInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') dom.alertOkBtn.click();
  if (e.key === 'Escape') dom.alertCancelBtn.click();
});

if (dom.notifCloseBtn) {
  dom.notifCloseBtn.addEventListener('click', () => {
    dom.systemNotif.classList.remove('show');
  });
}

// ----- ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ -----

// Передаём customAlert во все модули
const alertModules = [initAuth, initProfile, initCaptcha, initTest];
alertModules.forEach(fn => {
  if (fn.setCustomAlert) fn.setCustomAlert(customAlert);
});

window.customAlert = customAlert; // Делаем глобально доступным для вызовов завершения игр

initAuth({
  accountList: dom.accountList,
  registerScreen: dom.registerScreen,
  mainApp: dom.mainApp,
  leftPanel: dom.leftPanel,
  nameInput: dom.nameInput,
  tokenInput: dom.tokenInput,
  registerBtn: dom.registerBtn,
  loginTokenBtn: dom.loginTokenBtn
});

initProfile({
  panelName: dom.panelName,
  panelAvatar: dom.panelAvatar,
  panelStatus: dom.panelStatus,
  panelTimerText: dom.panelTimerText,
  panelMeta: dom.panelMeta,
  panelAccountType: dom.panelAccountType,
  panelEditName: dom.panelEditName,
  panelCaptchaBtn: dom.panelCaptchaBtn,
  panelDeleteBtn: dom.panelDeleteBtn,
  panelTokenBtn: dom.panelTokenBtn,
  panelAccountsBtn: dom.panelAccountsBtn,
  funnyBadge: dom.funnyBadge,
  leftPanel: dom.leftPanel
});

initTest({
  questionBlock: dom.questionBlock,
  resultBlock: dom.resultBlock,
  questionText: dom.questionText,
  optionsContainer: dom.optionsContainer,
  progressText: dom.progressText,
  progressFill: dom.progressFill,
  extraIndicator: dom.extraIndicator,
  scaleMarker: dom.scaleMarker,
  resultLabel: dom.resultLabel,
  resultSub: dom.resultSub,
  percentageDisplay: dom.percentageDisplay,
  resetBtn: dom.resetBtn,
  loadingOverlay: dom.loadingOverlay
});

initGame({
  gameGrid: dom.gameGrid,
  gameStatus: dom.gameStatus,
  gameTimerDisplay: dom.gameTimerDisplay,
  gameStartBtn: dom.gameStartBtn
});

initCaptcha({
  captchaOverlay: dom.captchaOverlay,
  captchaProgressFill: dom.captchaProgressFill,
  captchaTimerDisplay: dom.captchaTimerDisplay,
  captchaBufferDisplay: dom.captchaBufferDisplay,
  captchaAdContainer: dom.captchaAdContainer,
  captchaCancelBtn: dom.captchaCancelBtn,
  captchaResult: dom.captchaResult
});

initHistory({
  historyList: dom.historyList,
  chartWrapper: dom.chartWrapper,
  chartCanvas: dom.chartCanvas,
  chartEmptyText: dom.chartEmptyText
});

// ----- КОЛБЭКИ ДЛЯ МЕЖМОДУЛЬНОГО ВЗАИМОДЕЙСТВИЯ -----

window.onAccountChange = function() {
  pauseMemoryGame();
  loadAccounts();
  updateProfileUI();
  renderAccountList(handleAccountClick);
  startNewGame();
  initGameSession();
  renderHistory();
  renderChart();
};

window.onHistoryUpdate = function() {
  renderHistory();
  renderChart();
};

window.onDeleteAccount = function() {
  pauseMemoryGame();
  const allAccounts = getAllAccounts();
  const currentIndex = getCurrentIndex();
  
  allAccounts.splice(currentIndex, 1);
  localStorage.setItem('alcoholAccounts', JSON.stringify(allAccounts));
  
  if (allAccounts.length > 0) {
    const newIndex = Math.min(currentIndex, allAccounts.length - 1);
    loadAccount(newIndex);
    renderAccountList(handleAccountClick);
    updateProfileUI();
    startNewGame();
    initGameSession();
    renderHistory();
    renderChart();
  } else {
    localStorage.removeItem('alcoholProfile');
    localStorage.removeItem('alcoholTestHistory');
    localStorage.removeItem('alcoholCurrentAccount');
    localStorage.removeItem('memoryGameState');
    dom.registerScreen.classList.add('show');
    dom.mainApp.classList.remove('show');
    dom.leftPanel.style.display = 'none';
    renderAccountList(handleAccountClick);
    location.reload();
  }
};

window.onShowAccounts = function() {
  pauseMemoryGame();
  dom.registerScreen.classList.add('show');
  dom.mainApp.classList.remove('show');
  dom.leftPanel.style.display = 'none';
  renderAccountList(handleAccountClick);
};

function handleAccountClick(idx) {
  pauseMemoryGame();
  if (idx !== getCurrentIndex()) {
    loadAccount(idx);
    dom.registerScreen.classList.remove('show');
    dom.mainApp.classList.add('show');
    dom.leftPanel.style.display = 'block';
    renderAccountList(handleAccountClick);
    updateProfileUI();
    startNewGame();
    initGameSession();
    renderHistory();
    renderChart();
  } else {
    // Если аккаунт один или нажат текущий — просто возвращаем на главную
    dom.registerScreen.classList.remove('show');
    dom.mainApp.classList.add('show');
    dom.leftPanel.style.display = 'block';
  }
}

// ----- ОБРАБОТЧИКИ КНОПОК -----

dom.resetBtn.addEventListener('click', startNewGame);

if (dom.gameStartBtn) {
  dom.gameStartBtn.addEventListener('click', () => {
    const profile = getProfile();
    if (!profile) {
      customAlert('Ошибка', 'Сначала создайте профиль');
      return;
    }
    startGameSession();
  });
}

dom.captchaCancelBtn.addEventListener('click', cancelCaptcha);

if (dom.captchaBtn) {
  dom.captchaBtn.addEventListener('click', () => {
    const profile = getProfile();
    if (!profile) {
      customAlert('Ошибка', 'Сначала создайте профиль');
      return;
    }
    if (profile.status !== 'drunk') {
      customAlert('Доступ запрещён', 'Капча доступна только в состоянии "Алкаш"');
      return;
    }
    startCaptcha();
  });
}

// ----- ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ -----

function setMode(mode) {
  if (mode === 'standard') {
    pauseMemoryGame(); // Ставим на паузу игру, если ушли на тест
    dom.standardMode.classList.remove('hidden');
    dom.modularMode.classList.add('hidden');
    dom.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'standard'));
  } else {
    dom.standardMode.classList.add('hidden');
    dom.modularMode.classList.remove('hidden');
    dom.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'modular'));
    
    const profile = getProfile();
    if (profile && !dom.gameStartBtn.disabled) {
      initGameSession();
      restoreGame();
    }
  }
}

dom.modeBtns.forEach(btn => {
  btn.addEventListener('click', () => { setMode(btn.dataset.mode); });
});

// ----- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ -----

function initApp() {
  const profile = getProfile();
  
  if (profile) {
    dom.registerScreen.classList.remove('show');
    dom.mainApp.classList.add('show');
    dom.leftPanel.style.display = 'block';
    
    const now = Date.now();
    if (profile.timerUntil && profile.timerUntil <= now) {
      profile.status = 'sober';
      profile.timerUntil = null;
      setProfile(profile);
      saveAccounts();
    }
    
    updateProfileUI();
    renderAccountList(handleAccountClick);
    startNewGame();
    initGameSession();
    restoreGame();
    renderHistory();
    renderChart();
    
    setInterval(() => {
      updateProfileUI();
      const profileCheck = getProfile();
      if (profileCheck && profileCheck.timerUntil) {
        const now2 = Date.now();
        if (profileCheck.timerUntil <= now2) {
          profileCheck.status = 'sober';
          profileCheck.timerUntil = null;
          setProfile(profileCheck);
          saveAccounts();
          updateProfileUI();
        }
      }
    }, 1000);
    
  } else {
    dom.registerScreen.classList.add('show');
    dom.mainApp.classList.remove('show');
    dom.leftPanel.style.display = 'none';
    renderAccountList(handleAccountClick);
  }
}

initApp();