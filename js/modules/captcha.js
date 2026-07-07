// captcha.js — капча

import { formatDuration } from './utils.js';
import { getProfile, setProfile, getHistory, setHistory, saveAccounts } from './auth.js';
import { updateProfileUI } from './profile.js';

const AD_MESSAGES = [
  { text: '🍻 top-alkash.drinks — скидки на светлое 50%!' },
  { text: '🥃 Виски-барон — доставка за 30 минут!' },
  { text: '🍸 Коктейли дня — 2 по цене 1!' },
  { text: '🍺 Пивной рай — акция "3+1"' },
  { text: '🥂 Шампанское оптом — лучшие цены!' },
];

let captchaState = {
  timer: null,
  seconds: 0,
  active: false,
  failed: false,
  buffer: 0,
  maxBuffer: 3
};

let captchaUI = {};

export function initCaptcha(elements) {
  captchaUI = { ...captchaUI, ...elements };
}

export function startCaptcha() {
  if (captchaState.active) return;
  
  const profile = getProfile();
  if (!profile || profile.status !== 'drunk') {
    customAlert('Доступ запрещён', 'Капча доступна только в состоянии "Алкаш"');
    return;
  }
  
  captchaState.active = true;
  captchaState.seconds = 0;
  captchaState.failed = false;
  captchaState.buffer = 0;
  
  captchaUI.captchaResult.textContent = '';
  captchaUI.captchaResult.style.color = '#fbbf24';
  captchaUI.captchaAdContainer.innerHTML = '';
  captchaUI.captchaProgressFill.style.width = '0%';
  captchaUI.captchaTimerDisplay.textContent = '0:00 / 5:00';
  captchaUI.captchaBufferDisplay.textContent = '📦 Буфер: 0/3';
  captchaUI.captchaBufferDisplay.style.color = 'rgba(200,200,255,0.3)';
  captchaUI.captchaOverlay.classList.add('show');
  
  if (captchaState.timer) clearInterval(captchaState.timer);
  captchaState.timer = setInterval(() => {
    if (captchaState.failed) return;
    
    let step = 1;
    if (captchaState.buffer >= captchaState.maxBuffer) {
      step = -1;
      captchaUI.captchaBufferDisplay.style.color = '#f87171';
    } else {
      captchaUI.captchaBufferDisplay.style.color = 'rgba(200,200,255,0.3)';
    }
    
    captchaState.seconds += step;
    if (captchaState.seconds < 0) captchaState.seconds = 0;
    
    const progress = Math.min((captchaState.seconds / 300) * 100, 100);
    captchaUI.captchaProgressFill.style.width = progress + '%';
    captchaUI.captchaTimerDisplay.textContent = `${formatDuration(captchaState.seconds)} / 5:00`;
    
    const adCount = captchaUI.captchaAdContainer.children.length;
    if (captchaState.seconds > 2 && adCount < captchaState.maxBuffer && Math.random() < 0.06 && !captchaState.failed) {
      spawnAd();
    }
    
    if (captchaState.seconds >= 300) {
      clearInterval(captchaState.timer);
      captchaState.timer = null;
      if (!captchaState.failed) {
        const profile = getProfile();
        profile.status = 'sober';
        profile.timerUntil = null;
        setProfile(profile);
        saveAccounts();
        
        captchaUI.captchaResult.textContent = '✅ Капча пройдена! Вы снова трезвы.';
        captchaUI.captchaResult.style.color = '#6ee7b7';
        captchaState.active = false;
        
        const history = getHistory();
        history.push({ time: Date.now(), percent: 0, label: '✅ Капча пройдена', status: 'captcha_pass' });
        if (history.length > 30) history.shift();
        setHistory(history);
        saveAccounts();
        
        setTimeout(() => { captchaUI.captchaOverlay.classList.remove('show'); }, 1500);
        updateProfileUI();
        if (window.onHistoryUpdate) window.onHistoryUpdate();
      }
    }
  }, 1000);
}

function spawnAd() {
  if (!captchaState.active || captchaState.failed) return;
  
  const ad = AD_MESSAGES[Math.floor(Math.random() * AD_MESSAGES.length)];
  const div = document.createElement('div');
  div.className = 'captcha-ad';
  div.innerHTML = `
    <span>${ad.text}</span>
    <div style="display:flex; gap:3px; align-items:center;">
      <a href="#" class="ad-link" target="_blank">Перейти</a>
      <button class="close-ad" data-close="true">✕</button>
    </div>
  `;
  
  div.querySelector('.ad-link').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    failCaptcha('❌ Вы кликнули на рекламу! Капча провалена.');
  });
  
  div.querySelector('.close-ad').addEventListener('click', (e) => {
    e.stopPropagation();
    if (div.parentNode) {
      div.remove();
      if (captchaState.buffer > 0) captchaState.buffer--;
      captchaUI.captchaBufferDisplay.textContent = `📦 Буфер: ${captchaState.buffer}/${captchaState.maxBuffer}`;
    }
  });
  
  captchaUI.captchaAdContainer.appendChild(div);
  captchaState.buffer++;
  captchaUI.captchaBufferDisplay.textContent = `📦 Буфер: ${captchaState.buffer}/${captchaState.maxBuffer}`;
}

function failCaptcha(msg) {
  if (captchaState.failed) return;
  
  captchaState.failed = true;
  captchaState.active = false;
  clearInterval(captchaState.timer);
  captchaState.timer = null;
  
  captchaUI.captchaResult.textContent = msg;
  captchaUI.captchaResult.style.color = '#f87171';
  
  const history = getHistory();
  history.push({ time: Date.now(), percent: 0, label: '❌ Капча провалена', status: 'captcha_fail' });
  if (history.length > 30) history.shift();
  setHistory(history);
  saveAccounts();
  
  setTimeout(() => {
    captchaUI.captchaOverlay.classList.remove('show');
    captchaUI.captchaAdContainer.innerHTML = '';
  }, 1500);
}

export function cancelCaptcha() {
  if (captchaState.timer) { clearInterval(captchaState.timer); captchaState.timer = null; }
  captchaState.active = false;
  captchaUI.captchaOverlay.classList.remove('show');
  captchaUI.captchaAdContainer.innerHTML = '';
  captchaUI.captchaResult.textContent = '';
}

// Временная заглушка для customAlert
let customAlert = (title, message) => alert(message);
export function setCustomAlert(alertFn) {
  customAlert = alertFn;
}