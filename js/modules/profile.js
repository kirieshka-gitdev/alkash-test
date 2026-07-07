// profile.js — управление профилем и UI

import { getStatusLabel, getStatusClass, formatTime, formatDuration } from './utils.js';
import { getProfile, setProfile, saveAccounts, getCurrentIndex, isSandboxMode, setSandboxMode, isFunnyMode } from './auth.js';
import { isGameRunning } from './game.js';

export { isFunnyMode };

let profileUI = {
  panelName: null,
  panelAvatar: null,
  panelStatus: null,
  panelTimerText: null,
  panelMeta: null,
  panelAccountType: null,
  panelEditName: null,
  panelCaptchaBtn: null,
  panelDeleteBtn: null,
  panelTokenBtn: null,
  panelAccountsBtn: null,
  funnyBadge: null,
  leftPanel: null
};

export function initProfile(elements) {
  profileUI = { ...profileUI, ...elements };
  
  profileUI.panelEditName.addEventListener('click', handleEditName);
  profileUI.panelDeleteBtn.addEventListener('click', handleDeleteAccount);
  profileUI.panelTokenBtn.addEventListener('click', handleToken);
  profileUI.panelAccountsBtn.addEventListener('click', handleShowAccounts);
  
  if (profileUI.funnyBadge) {
    profileUI.funnyBadge.addEventListener('click', toggleSandbox);
  }
}

export function updateProfileUI() {
  const profile = getProfile();
  if (!profile) return;
  
  profileUI.panelName.textContent = profile.name;
  profileUI.panelAvatar.textContent = profile.name.charAt(0).toUpperCase();
  
  const st = profile.status || 'unknown';
  profileUI.panelStatus.textContent = getStatusLabel(st);
  profileUI.panelStatus.className = 'panel-status ' + getStatusClass(st);
  
  if (profile.created) {
    profileUI.panelMeta.textContent = 'Создан: ' + formatTime(profile.created);
  }
  
  const accType = profile.accountType || 'device';
  profileUI.panelAccountType.textContent = accType === 'token' ? '🔑 Вход по токену' : '📱 Создан на устройстве';
  
  const now = Date.now();
  if (profile.timerUntil && profile.timerUntil > now) {
    const remaining = Math.floor((profile.timerUntil - now) / 1000);
    profileUI.panelTimerText.textContent = `⏳ ${formatDuration(remaining)} до сброса`;
    profileUI.panelTimerText.style.color = '#f87171';
  } else {
    if (profile.timerUntil && profile.timerUntil <= now) {
      profile.status = 'sober';
      profile.timerUntil = null;
      setProfile(profile);
      saveAccounts();
    } else {
      profileUI.panelTimerText.textContent = '✅ таймер не активен';
      profileUI.panelTimerText.style.color = '#6ee7b7';
    }
  }
  
  const isSand = isSandboxMode();
  const appContainer = document.querySelector('.app-container');
  
  if (isSand) {
    appContainer.classList.add('sandbox-active');
    profileUI.funnyBadge.textContent = profile.status === 'drunk' ? '🍊 Песочница (Алкаш)' : '🍊 Песочница';
    profileUI.funnyBadge.className = 'funny-badge sandbox';
  } else {
    appContainer.classList.remove('sandbox-active');
    profileUI.funnyBadge.textContent = '🔒 Реальный режим';
    profileUI.funnyBadge.className = 'funny-badge';
  }
  
  const canCaptcha = st === 'drunk' && profile.timerUntil && profile.timerUntil > now;
  profileUI.panelCaptchaBtn.disabled = !canCaptcha;
  profileUI.panelCaptchaBtn.title = canCaptcha ? '' : 'Капча доступна только в состоянии "Алкаш"';
}

function toggleSandbox() {
  const profile = getProfile();
  if (!profile) return;
  
  if (isGameRunning()) {
    customAlert('Песочница', '⚠️ Вы не можете переключить режим во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
  
  if (profile.status === 'drunk') {
    customAlert('Песочница', 'В статусе "Алкаш" режим песочницы принудительно активен и не может быть отключен.');
    return;
  }
  const current = isSandboxMode();
  setSandboxMode(!current);
  updateProfileUI();
}

async function handleEditName() {
  const profile = getProfile();
  if (!profile) return;
  const newName = await customAlert('Смена имени', 'Введите новое имя:', 'Новое имя');
  if (newName && newName.length >= 2) {
    profile.name = newName.trim();
    setProfile(profile);
    saveAccounts();
    updateProfileUI();
  } else if (newName !== null && newName !== '') {
    await customAlert('Ошибка', 'Имя должно содержать минимум 2 символа');
  }
}

async function handleDeleteAccount() {
  const profile = getProfile();
  if (!profile) return;
  
  if (isGameRunning()) {
    await customAlert('Удаление профиля', '⚠️ Вы не можете удалить аккаунт во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
  
  if (profile.status === 'drunk') {
    await customAlert('Доступ запрещён', '❌ Нельзя удалить аккаунт в состоянии "Алкаш". Пройдите капчу!');
    return;
  }
  const confirmName = await customAlert('Удаление профиля', `Для подтверждения удаления введите имя аккаунта: "${profile.name}"`, 'Имя аккаунта');
  if (confirmName === profile.name) {
    if (window.onDeleteAccount) window.onDeleteAccount();
  } else if (confirmName !== null) {
    await customAlert('Ошибка', 'Введенное имя не совпадает. Удаление отменено.');
  }
}

async function handleToken() {
  const profile = getProfile();
  if (!profile) return;
  
  if (isGameRunning()) {
    await customAlert('Ваш токен', '⚠️ Вы не можете получить токен во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
  
  const { generateToken } = await import('./auth.js');
  const token = generateToken(profile);
  await customAlert('Ваш токен', 
    'Скопируйте токен для входа в любом браузере:\n\n' + token + 
    '\n\nСохраните его в надёжном месте. Токен содержит все данные вашего аккаунта.',
    null, token);
}

function handleShowAccounts() {
  if (isGameRunning()) {
    customAlert('Аккаунты', '⚠️ Вы не можете перейти к списку аккаунтов во время активной игры. Завершите игру или дождитесь окончания времени!');
    return;
  }
  if (window.onShowAccounts) window.onShowAccounts();
}

let customAlert = (title, message) => alert(message);
export function setCustomAlert(alertFn) {
  customAlert = alertFn;
}