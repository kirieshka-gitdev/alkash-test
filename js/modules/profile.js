// profile.js — управление профилем и UI

import { getStatusLabel, getStatusClass, formatTime, formatDuration } from './utils.js';
import { getProfile, setProfile, saveAccounts, getCurrentIndex } from './auth.js';

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
  
  const isFunny = isFunnyMode();
  profileUI.funnyBadge.textContent = isFunny ? '🎭 шуточный режим' : '🔒 реальный тест';
  profileUI.funnyBadge.style.color = isFunny ? '#fbbf24' : 'rgba(200,200,255,0.2)';
  
  const canCaptcha = st === 'drunk' && profile.timerUntil && profile.timerUntil > now;
  profileUI.panelCaptchaBtn.disabled = !canCaptcha;
  profileUI.panelCaptchaBtn.title = canCaptcha ? '' : 'Капча доступна только в состоянии "Алкаш"';
}

export function isFunnyMode() {
  const profile = getProfile();
  if (!profile) return true;
  const now = Date.now();
  if (profile.timerUntil && profile.timerUntil > now) return true;
  return false;
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
  if (profile.status !== 'sober' && profile.status !== 'almost') {
    await customAlert('Доступ запрещён', '❌ Удалить аккаунт можно только в состоянии "Трезвый" или "Почти трезвый". Пройдите капчу!');
    return;
  }
  const confirm = await customAlert('Удаление профиля', `Удалить профиль "${profile.name}"?`);
  if (confirm) {
    // Логика удаления будет в app.js
    if (window.onDeleteAccount) window.onDeleteAccount();
  }
}

async function handleToken() {
  const profile = getProfile();
  if (!profile) return;
  const token = generateToken(profile);
  await customAlert('Ваш токен', 
    'Скопируйте токен для входа в любом браузере:\n\n' + token + 
    '\n\nСохраните его в надёжном месте. Токен содержит все данные вашего аккаунта.',
    null, token);
}

function handleShowAccounts() {
  // Будет переопределено в app.js
  if (window.onShowAccounts) window.onShowAccounts();
}

// Временная заглушка для customAlert
let customAlert = (title, message) => alert(message);
export function setCustomAlert(alertFn) {
  customAlert = alertFn;
}