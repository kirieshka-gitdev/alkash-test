// test.js — вопросы и логика теста

import { shuffleArray, formatDuration } from './utils.js';
import { getProfile, setProfile, getHistory, setHistory, saveAccounts } from './auth.js';
import { updateProfileUI, isFunnyMode } from './profile.js';

// Вопросы
export const BASE_QUESTIONS = [
  { text: 'Как часто вы употребляете алкоголь?', options: [{label:'Ни разу',score:0},{label:'По праздникам',score:12},{label:'Пару раз в месяц',score:35},{label:'Каждые выходные',score:60},{label:'Почти каждый день',score:85}] },
  { text: 'Что чувствуете при виде алкоголя в магазине?', options: [{label:'Ничего',score:0},{label:'Мелькнула мысль',score:18},{label:'Планирую вечеринку',score:40},{label:'Хочется купить',score:65},{label:'У меня есть запас',score:80}] },
  { text: 'Сколько напитков нужно для расслабления?', options: [{label:'Не нужно',score:0},{label:'0.5 пива',score:15},{label:'2-3 порции',score:45},{label:'Бутылка вина/водки',score:70},{label:'Пью пока есть',score:90}] },
  { text: 'Бывало пили в одиночестве?', options: [{label:'Никогда',score:0},{label:'Пару раз',score:22},{label:'Иногда вечером',score:45},{label:'Регулярно',score:70},{label:'Основное занятие',score:92}] },
  { text: 'Как относитесь к похмелью?', options: [{label:'Не знаю',score:0},{label:'Бывало пару раз',score:20},{label:'Терплю',score:45},{label:'Часть жизни',score:70},{label:'Всегда есть лекарство',score:88}] },
  { text: 'Алкоголь влияет на вашу внешность?', options: [{label:'Нет',score:0},{label:'Не замечал',score:15},{label:'Покраснение лица',score:35},{label:'Отеки по утрам',score:55},{label:'Сильно изменился',score:78}] },
  { text: 'Как часто вы пьёте пиво?', options: [{label:'Никогда',score:0},{label:'Раз в месяц',score:15},{label:'Раз в неделю',score:40},{label:'Каждый день',score:70},{label:'С утра до вечера',score:88}] },
  { text: 'Вы когда-нибудь скрывали количество выпитого?', options: [{label:'Нет',score:0},{label:'Пару раз',score:25},{label:'Иногда',score:50},{label:'Постоянно',score:75},{label:'Всегда',score:90}] },
  { text: 'Ваше утро обычно начинается с...', options: [{label:'Кофе/зарядки',score:0},{label:'Воды',score:5},{label:'Бокала пива',score:50},{label:'Рюмки для здоровья',score:82}] },
  { text: 'Сколько раз за неделю вы употребляли алкоголь?', options: [{label:'0',score:0},{label:'1',score:15},{label:'2-3',score:40},{label:'4-5',score:68},{label:'Каждый день',score:88}] },
  { text: 'Алкоголь мешает работе/учёбе?', options: [{label:'Нет',score:0},{label:'Редко',score:18},{label:'Иногда',score:48},{label:'Постоянно',score:72},{label:'Уволился из-за этого',score:94}] },
  { text: 'Вы пьёте быстрее, чем другие?', options: [{label:'Нет',score:0},{label:'Чуть быстрее',score:20},{label:'Значительно быстрее',score:50},{label:'Всегда быстрее всех',score:80}] },
  { text: 'Бывало, что вы не помните вечер после пьянки?', options: [{label:'Никогда',score:0},{label:'Один раз',score:25},{label:'Несколько раз',score:55},{label:'Регулярно',score:85}] },
  { text: 'Как часто вы пьёте в одиночестве? (повторный)', options: [{label:'Никогда',score:0},{label:'Редко',score:18},{label:'Иногда',score:44},{label:'Часто',score:72},{label:'Каждый вечер',score:90}] }
];

export const EXTRA_QUESTIONS = [
  { text: 'Вы прячете алкоголь от близких?', options: [{label:'Нет',score:0},{label:'Было пару раз',score:30},{label:'Да, постоянно',score:70},{label:'У меня тайник',score:90}] },
  { text: 'Ваше похмелье длится больше суток?', options: [{label:'Нет',score:0},{label:'Редко',score:20},{label:'Иногда',score:45},{label:'Всегда',score:80}] },
  { text: 'Вы пьёте за рулём?', options: [{label:'Никогда',score:0},{label:'Пару раз',score:40},{label:'Регулярно',score:85},{label:'Не вижу проблемы',score:95}] }
];

let testState = {
  questions: [],
  currentIndex: 0,
  totalScore: 0,
  answeredCount: 0,
  isFinished: false,
  extraTriggered: false,
  isTransitioning: false
};

let testUI = {};

export function initTest(elements) {
  testUI = { ...testUI, ...elements };
}

export function startNewGame() {
  testState.questions = shuffleArray(BASE_QUESTIONS.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) })));
  testState.currentIndex = 0;
  testState.totalScore = 0;
  testState.answeredCount = 0;
  testState.isFinished = false;
  testState.extraTriggered = false;
  
  testUI.extraIndicator.innerHTML = '<i class="fas fa-circle" style="color:#6ee7b7;font-size:0.25rem;"></i> доп.';
  testUI.extraIndicator.style.opacity = '0.5';
  testUI.questionBlock.classList.remove('hidden');
  testUI.resultBlock.classList.add('hidden');
  renderQuestion();
}

function renderQuestion() {
  if (testState.currentIndex >= testState.questions.length) {
    finishTest();
    return;
  }
  
  const q = testState.questions[testState.currentIndex];
  testUI.questionText.textContent = q.text;
  testUI.optionsContainer.innerHTML = '';
  
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    const icons = ['fa-solid fa-wine-bottle','fa-solid fa-beer-mug-empty','fa-solid fa-cocktail','fa-solid fa-glass-cheers','fa-solid fa-wine-glass'];
    btn.innerHTML = `<i class="${icons[idx % icons.length]}"></i> ${opt.label}`;
    btn.addEventListener('click', () => handleAnswer(opt.score));
    testUI.optionsContainer.appendChild(btn);
  });
  
  updateProgress();
}

function handleAnswer(score) {
  if (testState.isFinished || testState.isTransitioning) return;
  testState.isTransitioning = true;
  testUI.loadingOverlay.classList.remove('hidden');
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  
  setTimeout(() => {
    testState.totalScore += score;
    testState.answeredCount++;
    
    if (!testState.extraTriggered && testState.answeredCount >= 2 && (testState.totalScore / testState.answeredCount) >= 35) {
      testState.extraTriggered = true;
      let extraCopy = EXTRA_QUESTIONS.map(q => ({ ...q, options: q.options.map(o => ({ ...o })) }));
      let shuffled = shuffleArray(extraCopy);
      testState.questions.splice(testState.currentIndex + 1, 0, ...shuffled.slice(0, 2));
      testUI.extraIndicator.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#fbbf24;"></i> +доп.';
      testUI.extraIndicator.style.opacity = '1';
    }
    
    testState.currentIndex++;
    testUI.loadingOverlay.classList.add('hidden');
    testState.isTransitioning = false;
    renderQuestion();
  }, 400);
}

function updateProgress() {
  const total = testState.questions.length;
  const cur = Math.min(testState.currentIndex, total);
  testUI.progressText.textContent = `${cur} / ${total}`;
  testUI.progressFill.style.width = `${total > 0 ? (cur / total) * 100 : 0}%`;
}

function finishTest() {
  testState.isFinished = true;
  testUI.questionBlock.classList.add('hidden');
  testUI.resultBlock.classList.remove('hidden');
  
  const maxPossible = testState.questions.reduce((sum, q) => {
    const maxOpt = q.options.reduce((m, o) => Math.max(m, o.score), 0);
    return sum + maxOpt;
  }, 0);
  
  let raw = maxPossible > 0 ? (testState.totalScore / maxPossible) * 100 : 0;
  let finalPercent = Math.min(100, Math.max(0, raw));
  let percentInt = Math.round(finalPercent);
  
  testUI.scaleMarker.style.left = `${100 - finalPercent}%`;
  
  let category = '', subtext = '', statusKey = 'unknown';
  if (finalPercent >= 85) { category = '💜 Вы 100% алкаш!'; subtext = 'вам срочно к наркологу'; statusKey = 'drunk'; }
  else if (finalPercent >= 65) { category = '🔥 Тяжёлое опьянение'; subtext = 'держитесь, вода и сон спасут'; statusKey = 'drunk'; }
  else if (finalPercent >= 45) { category = '🍊 Употребляли недавно, малые дозы'; subtext = 'ещё есть отклонения'; statusKey = 'drunk'; }
  else if (finalPercent >= 25) { category = '🌙 Приходите в себя'; subtext = 'небольшие отклонения'; statusKey = 'almost'; }
  else if (finalPercent >= 10) { category = '🥗 Довольно трезвый'; subtext = 'почти в норме'; statusKey = 'almost'; }
  else { category = '✨ 100% Трезвый!'; subtext = 'кристальная ясность'; statusKey = 'sober'; }
  
  testUI.resultLabel.textContent = category;
  testUI.resultSub.textContent = subtext;
  testUI.percentageDisplay.textContent = `${percentInt}%`;
  
  const profile = getProfile();
  if (!isFunnyMode() && profile) {
    profile.status = statusKey;
    if (statusKey === 'drunk') {
      profile.timerUntil = Date.now() + 5 * 60 * 60 * 1000;
    } else {
      if (profile.timerUntil) profile.timerUntil = null;
    }
    setProfile(profile);
    saveAccounts();
    
    const history = getHistory();
    history.push({ time: Date.now(), percent: percentInt, label: category, status: statusKey });
    if (history.length > 30) history.shift();
    setHistory(history);
    saveAccounts();
    
    updateProfileUI();
    
    if (window.onHistoryUpdate) window.onHistoryUpdate();
  } else if (profile) {
    const history = getHistory();
    history.push({ time: Date.now(), percent: percentInt, label: '🎭 ' + category, status: 'funny' });
    if (history.length > 30) history.shift();
    setHistory(history);
    saveAccounts();
    
    if (window.onHistoryUpdate) window.onHistoryUpdate();
  }
}