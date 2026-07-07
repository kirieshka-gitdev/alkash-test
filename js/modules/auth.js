// auth.js — регистрация, токены, аккаунты

import { formatTime, getStatusLabel } from './utils.js';

// Глобальные переменные (будут инициализированы в app.js)
let allAccounts = [];
let currentAccountIndex = 0;
let profile = null;
let history = [];

// DOM элементы
let accountList, registerScreen, mainApp, leftPanel, nameInput, tokenInput;
let registerBtn, loginTokenBtn;

export function initAuth(elements) {
  accountList = elements.accountList;
  registerScreen = elements.registerScreen;
  mainApp = elements.mainApp;
  leftPanel = elements.leftPanel;
  nameInput = elements.nameInput;
  tokenInput = elements.tokenInput;
  registerBtn = elements.registerBtn;
  loginTokenBtn = elements.loginTokenBtn;
  
  loadAccounts();
  
  registerBtn.addEventListener('click', handleRegister);
  loginTokenBtn.addEventListener('click', handleLoginToken);
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') registerBtn.click(); });
  tokenInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginTokenBtn.click(); });
}

export function loadAccounts() {
  allAccounts = JSON.parse(localStorage.getItem('alcoholAccounts')) || [];
  currentAccountIndex = parseInt(localStorage.getItem('alcoholCurrentAccount')) || 0;
  
  if (allAccounts.length > 0 && allAccounts[currentAccountIndex]) {
    profile = allAccounts[currentAccountIndex].data;
    history = allAccounts[currentAccountIndex].history || [];
  }
}

export function saveAccounts() {
  localStorage.setItem('alcoholAccounts', JSON.stringify(allAccounts));
  localStorage.setItem('alcoholCurrentAccount', String(currentAccountIndex));
}

export function getProfile() { return profile; }
export function getHistory() { return history; }
export function getAllAccounts() { return allAccounts; }
export function getCurrentIndex() { return currentAccountIndex; }

export function setProfile(newProfile) {
  profile = newProfile;
  if (allAccounts[currentAccountIndex]) {
    allAccounts[currentAccountIndex].data = profile;
  }
  saveAccounts();
}

export function setHistory(newHistory) {
  history = newHistory;
  if (allAccounts[currentAccountIndex]) {
    allAccounts[currentAccountIndex].history = history;
  }
  saveAccounts();
}

export function loadAccount(index) {
  if (index >= 0 && index < allAccounts.length) {
    currentAccountIndex = index;
    localStorage.setItem('alcoholCurrentAccount', String(index));
    profile = allAccounts[index].data;
    history = allAccounts[index].history || [];
    localStorage.setItem('alcoholProfile', JSON.stringify(profile));
    localStorage.setItem('alcoholTestHistory', JSON.stringify(history));
    return true;
  }
  return false;
}

export function generateToken(profileData) {
  const data = {
    name: profileData.name,
    status: profileData.status,
    timerUntil: profileData.timerUntil,
    created: profileData.created,
    accountType: profileData.accountType || 'device'
  };
  const json = JSON.stringify(data);
  return btoa(encodeURIComponent(json));
}

export function decodeToken(token) {
  try {
    const json = decodeURIComponent(atob(token));
    return JSON.parse(json);
  } catch(e) {
    return null;
  }
}

export function renderAccountList(callback) {
  if (!accountList) return;
  
  accountList.innerHTML = '';
  
  if (allAccounts.length === 0) {
    accountList.innerHTML = '<div style="color:rgba(200,200,255,0.15); font-size:0.7rem; text-align:center; padding:6px;">Нет сохранённых аккаунтов</div>';
    return;
  }
  
  allAccounts.forEach((acc, i) => {
    const st = acc.data.status || 'unknown';
    const label = st === 'drunk' ? '🍷' : st === 'sober' ? '✨' : st === 'almost' ? '🌙' : '❓';
    const current = i === currentAccountIndex ? ' 👈' : '';
    const type = acc.data.accountType === 'token' ? '🔑' : '📱';
    
    const div = document.createElement('div');
    div.className = 'account-item';
    div.dataset.index = i;
    div.style.cursor = 'pointer';
    div.style.padding = '8px 14px';
    div.style.marginBottom = '4px';
    div.style.borderRadius = '40px';
    div.style.background = i === currentAccountIndex ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)';
    div.style.border = i === currentAccountIndex ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.04)';
    div.style.transition = '0.2s';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    
    div.addEventListener('mouseenter', () => {
      div.style.background = i === currentAccountIndex ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)';
      div.style.borderColor = 'rgba(167,139,250,0.15)';
    });
    div.addEventListener('mouseleave', () => {
      div.style.background = i === currentAccountIndex ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)';
      div.style.borderColor = i === currentAccountIndex ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)';
    });
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.style.color = '#d6d4ff';
    nameSpan.style.fontWeight = '600';
    nameSpan.style.fontSize = '0.85rem';
    nameSpan.textContent = `${label} ${acc.data.name}${current}`;
    
    const statusSpan = document.createElement('span');
    statusSpan.className = 'status';
    statusSpan.style.fontSize = '0.7rem';
    statusSpan.style.color = 'rgba(200,200,255,0.3)';
    statusSpan.textContent = `${type} ${getStatusLabel(st)}`;
    
    div.appendChild(nameSpan);
    div.appendChild(statusSpan);
    
    div.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      const idx = parseInt(this.dataset.index);
      if (callback) callback(idx);
    });
    
    accountList.appendChild(div);
  });
}

async function handleRegister() {
  const name = nameInput.value.trim();
  if (name.length < 2) {
    await customAlert('Ошибка', 'Имя должно содержать минимум 2 символа');
    return;
  }
  if (!canCreateNewAccount()) return;
  
  const newProfile = {
    name: name,
    status: 'unknown',
    timerUntil: null,
    created: Date.now(),
    accountType: 'device'
  };
  allAccounts.push({ data: newProfile, history: [] });
  currentAccountIndex = allAccounts.length - 1;
  profile = newProfile;
  history = [];
  saveAccounts();
  localStorage.setItem('alcoholProfile', JSON.stringify(profile));
  localStorage.setItem('alcoholTestHistory', JSON.stringify(history));
  
  registerScreen.classList.remove('show');
  mainApp.classList.add('show');
  leftPanel.style.display = 'block';
  
  // Вызываем callback для обновления UI
  if (window.onAccountChange) window.onAccountChange();
}

async function handleLoginToken() {
  const token = tokenInput.value.trim();
  if (!token) {
    await customAlert('Ошибка', 'Введите токен для входа');
    return;
  }
  const data = decodeToken(token);
  if (!data || !data.name) {
    await customAlert('Ошибка', 'Неверный токен');
    return;
  }
  
  let found = false;
  for (let i = 0; i < allAccounts.length; i++) {
    if (allAccounts[i].data.name === data.name && allAccounts[i].data.created === data.created) {
      loadAccount(i);
      found = true;
      break;
    }
  }
  
  if (!found) {
    const newProfile = {
      name: data.name,
      status: data.status || 'unknown',
      timerUntil: data.timerUntil || null,
      created: data.created || Date.now(),
      accountType: 'token'
    };
    allAccounts.push({ data: newProfile, history: [] });
    currentAccountIndex = allAccounts.length - 1;
    profile = newProfile;
    history = [];
    saveAccounts();
    localStorage.setItem('alcoholProfile', JSON.stringify(profile));
    localStorage.setItem('alcoholTestHistory', JSON.stringify(history));
  }
  
  registerScreen.classList.remove('show');
  mainApp.classList.add('show');
  leftPanel.style.display = 'block';
  
  if (window.onAccountChange) window.onAccountChange();
}

function canCreateNewAccount() {
  if (allAccounts.length >= 5) {
    customAlert('Достигнут лимит', 'Максимум 5 аккаунтов');
    return false;
  }
  if (allAccounts.length > 0) {
    const last = allAccounts[allAccounts.length - 1];
    if (last.data.status === 'unknown') {
      customAlert('Требуется тест', 'Сначала пройдите тест на текущем аккаунте, чтобы создать нового собутыльника.');
      return false;
    }
  }
  return true;
}

// Временная заглушка для customAlert (будет переопределена в app.js)
let customAlert = (title, message) => alert(message);
export function setCustomAlert(alertFn) {
  customAlert = alertFn;
}