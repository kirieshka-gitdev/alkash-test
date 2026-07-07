// app.js — главный файл, инициализация всех модулей

import { initAuth, loadAccount, renderAccountList, loadAccounts, saveAccounts, getProfile, getHistory, setProfile, setHistory, getAllAccounts, getCurrentIndex, setCustomAlert as setAuthAlert } from './modules/auth.js';
import { initProfile, updateProfileUI, setCustomAlert as setProfileAlert } from './modules/profile.js';
import { initTest, startNewGame, getTestSharePayload, setCustomAlert as setTestAlert, ALL_QUESTIONS_DB } from './modules/test.js';
import { initGame, initGameSession, restoreGame, startGame as startGameSession, pauseMemoryGame, isGameRunning, getGameSharePayload, setCustomAlert as setGameAlert } from './modules/game.js';
import { initCaptcha, startCaptcha, cancelCaptcha, setCustomAlert as setCaptchaAlert } from './modules/captcha.js';
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
  shareTestBtn: document.getElementById('shareTestBtn'),
  
  // Игра
  gameGrid: document.getElementById('gameGrid'),
  gameStatus: document.getElementById('gameStatus'),
  gameTimerDisplay: document.getElementById('gameTimerDisplay'),
  gameStartBtn: document.getElementById('gameStartBtn'),
  shareGameBtn: document.getElementById('shareGameBtn'),
  
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
  
  // Кнопки левой панели
  captchaBtn: document.getElementById('panelCaptchaBtn'),
  deleteBtn: document.getElementById('panelDeleteBtn'),
  tokenBtn: document.getElementById('panelTokenBtn'),
  accountsBtn: document.getElementById('panelAccountsBtn'),

  // Экран просмотра ссылки
  shareViewScreen: document.getElementById('shareViewScreen'),
  shareViewContent: document.getElementById('shareViewContent'),
  shareViewBackBtn: document.getElementById('shareViewBackBtn'),
  appMainCard: document.getElementById('appMainCard')
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
      dom.alertCancelBtn.classList.add('hidden');
    } else {
      dom.alertCopyBtn.classList.add('hidden');
    }
    
    if (inputPlaceholder !== null) {
      dom.alertInputContainer.classList.remove('hidden');
      dom.alertInput.value = '';
      dom.alertInput.placeholder = inputPlaceholder;
      dom.alertCancelBtn.classList.remove('hidden');
      setTimeout(() => dom.alertInput.focus(), 100);
    } else {
      dom.alertInputContainer.classList.add('hidden');
      if (!copyText) {
        dom.alertCancelBtn.classList.add('hidden');
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

// Связывание модулей с кастомными уведомлениями
setAuthAlert(customAlert);
setProfileAlert(customAlert);
setTestAlert(customAlert);
setGameAlert(customAlert);
setCaptchaAlert(customAlert);
window.customAlert = customAlert;

// ----- ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ -----

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
  loadingOverlay: dom.loadingOverlay,
  shareTestBtn: dom.shareTestBtn
});

initGame({
  gameGrid: dom.gameGrid,
  gameStatus: dom.gameStatus,
  gameTimerDisplay: dom.gameTimerDisplay,
  gameStartBtn: dom.gameStartBtn,
  shareGameBtn: dom.shareGameBtn
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

// ----- КОЛБЭКИ ВЗАИМОДЕЙСТВИЯ -----

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
  if (isGameRunning()) {
    customAlert('Аккаунты', '⚠️ Вы не можете перейти к списку аккаунтов во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
  pauseMemoryGame();
  dom.registerScreen.classList.add('show');
  dom.mainApp.classList.remove('show');
  dom.leftPanel.style.display = 'none';
  renderAccountList(handleAccountClick);
};

function handleAccountClick(idx) {
  if (isGameRunning()) {
    customAlert('Выбор собутыльника', '⚠️ Вы не можете переключить аккаунт во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
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
    if (isGameRunning()) {
      customAlert('Капча', '⚠️ Завершите активную мини-игру перед прохождением капчи!');
      return;
    }
    startCaptcha();
  });
}

// ----- ГЕНЕРАЦИЯ ССЫЛКИ ДЛЯ ПОДЕЛИТЬСЯ -----

function generateShareLink(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const base64 = btoa(encodeURIComponent(jsonStr));
    return `${window.location.origin}${window.location.pathname}?share=${base64}`;
  } catch(e) {
    console.error(e);
    return null;
  }
}

if (dom.shareTestBtn) {
  dom.shareTestBtn.addEventListener('click', async () => {
    // Кастомный алерт подтверждения
    const confirm = await customAlert('Поделиться результатом', '⚠️ Обратите внимание: Ваше имя (ник) будет видно всем, у кого есть эта ссылка. Вы уверены, что хотите продолжить?');
    if (!confirm) return;
    
    const payload = getTestSharePayload();
    const link = generateShareLink(payload);
    if (link) {
      await customAlert('Ссылка сгенерирована', 
        'Ваша персональная гостевая ссылка с ответами сгенерирована! Скопируйте и отправьте её друзьям:', 
        null, link);
    }
  });
}

if (dom.shareGameBtn) {
  dom.shareGameBtn.addEventListener('click', async () => {
    // Кастомный алерт подтверждения
    const confirm = await customAlert('Поделиться результатом', '⚠️ Обратите внимание: Ваше имя (ник) будет видно всем, у кого есть эта ссылка. Вы уверены, что хотите продолжить?');
    if (!confirm) return;
    
    const payload = getGameSharePayload();
    const link = generateShareLink(payload);
    if (link) {
      await customAlert('Ссылка сгенерирована', 
        'Ссылка на результаты прохождения мини-игры сгенерирована! Скопируйте её:', 
        null, link);
    }
  });
}

// Возврат из гостевого режима
if (dom.shareViewBackBtn) {
  dom.shareViewBackBtn.addEventListener('click', () => {
    window.location.href = window.location.pathname; // Сброс get-параметров
  });
}

// ----- РЕНДЕРИНГ ГОСТЕВОГО ЭКРАНА -----

function checkAndRenderShareLink() {
  const urlParams = new URLSearchParams(window.location.search);
  const shareParam = urlParams.get('share');
  if (!shareParam) return false;
  
  try {
    const decodedJson = decodeURIComponent(atob(shareParam));
    const data = JSON.parse(decodedJson);
    
    // Скрываем основные блоки интерфейса
    dom.leftPanel.style.display = 'none';
    dom.appMainCard.classList.add('hidden');
    dom.shareViewScreen.classList.remove('hidden');
    
    let html = '';
    
    if (data.type === 'test') {
      html += `
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="color:#a78bfa; font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-bottom: 6px; letter-spacing: 0.05em;"><i class="fas fa-question-circle"></i> Модуль: АлкоТест (Вопросы)</p>
          <div class="percentage-badge" style="font-size: 2rem; padding: 10px 30px; margin-bottom: 8px;">${data.percent}%</div>
          <h3 style="color:#f0eeff; font-size: 1.3rem;">${data.name}</h3>
          <p style="color:rgba(200,200,255,0.4); font-size:0.85rem;">Режим: ${data.sandbox ? '🍊 Песочница' : '🔒 Реальный тест'}</p>
        </div>
        <div style="text-align: left; display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 6px;">
      `;
      
      // Декодируем компактный лог ответов
      data.qData.forEach((item, qIdx) => {
        const originalQuestion = ALL_QUESTIONS_DB[item.q];
        if (!originalQuestion) return;
        
        html += `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 12px; border-radius: 16px;">
            <h4 style="color:#d6d4ff; font-size: 0.9rem; margin-bottom: 8px;">${qIdx + 1}. ${originalQuestion.text}</h4>
            <div style="display:flex; flex-direction:column; gap:4px;">
        `;
        
        originalQuestion.options.forEach((opt, oIdx) => {
          const isSelected = item.a === oIdx;
          const color = isSelected ? '#fb923c' : 'rgba(200,200,255,0.3)';
          const bg = isSelected ? 'rgba(251,146,60,0.1)' : 'transparent';
          const border = isSelected ? '1px solid #fb923c' : '1px solid rgba(255,255,255,0.02)';
          html += `
            <div style="padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; color:${color}; background:${bg}; border:${border}; display:flex; align-items:center; gap:6px;">
              <i class="${isSelected ? 'fas fa-check-circle' : 'far fa-circle'}"></i> ${opt.label}
            </div>
          `;
        });
        html += `</div></div>`;
      });
      html += `</div>`;
    } else if (data.type === 'game') {
      const resultColor = data.victory ? '#6ee7b7' : '#f87171';
      const resultText = data.victory ? '🏆 ПОБЕДА!' : '⏰ ПОРАЖЕНИЕ';
      
      html += `
        <div style="text-align: center;">
          <p style="color:#a78bfa; font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-bottom: 12px; letter-spacing: 0.05em;"><i class="fas fa-gamepad"></i> Модуль: Игра на память (Карточки)</p>
          <h2 style="color:${resultColor}; font-size: 1.8rem; font-weight: 900; margin-bottom: 12px;">${resultText}</h2>
          <h3 style="color:#f0eeff; font-size: 1.3rem; margin-bottom: 4px;">Игрок: ${data.name}</h3>
          <p style="color:rgba(200,200,255,0.4); font-size:0.85rem; margin-bottom: 20px;">Режим: ${data.sandbox ? '🍊 Песочница' : '🔒 Реальный режим'}</p>
          
          <div style="display: flex; flex-direction: column; gap: 8px; max-width: 300px; margin: 0 auto; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); padding: 16px; border-radius: 24px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
              <span style="color:rgba(200,200,255,0.45);">⏱ Время прохождения:</span>
              <span style="color:#f0eeff; font-weight:700;">${formatDuration(data.seconds)} / 0:45</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
              <span style="color:rgba(200,200,255,0.45);">🔄 Всего кликов:</span>
              <span style="color:#f0eeff; font-weight:700;">${data.clicks || 0}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
              <span style="color:rgba(200,200,255,0.45);">❌ Ошибок:</span>
              <span style="color:#f87171; font-weight:700;">${data.errors || 0}</span>
            </div>
          </div>
        </div>
      `;
    }
    
    dom.shareViewContent.innerHTML = html;
    return true;
  } catch(e) {
    console.error('Ошибка расшифровки ссылки:', e);
    return false;
  }
}

// ----- ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ -----

function setMode(mode) {
  if (isGameRunning()) {
    customAlert('Режим заблокирован', '⚠️ Вы не можете переключить режим во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
  
  if (mode === 'standard') {
    pauseMemoryGame();
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
  if (checkAndRenderShareLink()) {
    return; // Если это просмотр гостевой ссылки, обычное приложение не запускается
  }
  
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