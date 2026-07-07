// test.js — вопросы и логика теста

import { shuffleArray, formatDuration } from './utils.js';
import { getProfile, setProfile, getHistory, setHistory, saveAccounts, isSandboxMode } from './auth.js';
import { updateProfileUI } from './profile.js';

export const BASE_QUESTIONS = [
  { 
    text: 'Как часто в вашей жизни присутствует алкоголь?', 
    options: [
      { label: 'Вообще не употребляю / раз в год символически', score: 0 },
      { label: 'По праздникам или пару раз в месяц в компании', score: 15 },
      { label: 'Каждые выходные без исключений (пятница/суббота — закон)', score: 45 },
      { label: 'Через день, чтобы снять стресс и расслабиться после работы', score: 75 },
      { label: 'Каждый день, не представляю своего вечера/дня без спиртного', score: 95 }
    ] 
  },
  { 
    text: 'Ваше отношение к употреблению алкоголя с утра или в первой половине дня?', 
    options: [
      { label: 'Исключено, для меня это явный признак тяжелой зависимости', score: 0 },
      { label: 'Только если это бокал шампанского на редком праздничном бранче', score: 15 },
      { label: 'Могу выпить легкого пива в выходной день во время просмотра матча', score: 40 },
      { label: 'Если вчера было очень плохо, приходится выпить с утра, чтобы прийти в себя', score: 75 },
      { label: 'Обычное дело, утренний алкоголь помогает настроиться на рабочий лад', score: 95 }
    ] 
  },
  { 
    text: 'Можете ли вы вовремя остановиться после одного бокала или рюмки спиртного?', 
    options: [
      { label: 'Да, легко контролирую дозу и пью чисто символически', score: 0 },
      { label: 'Обычно да, но в хорошей компании могу выпить лишнего', score: 15 },
      { label: 'Часто обещаю себе выпить немного, но в итоге увлекаюсь', score: 45 },
      { label: 'Практически никогда, если начал пить — пью до полной кондиции', score: 75 },
      { label: 'Ни за что. Первая рюмка отключает контроль и запускает цепную реакцию', score: 95 }
    ] 
  },
  { 
    text: 'Случалось ли вам употреблять алкоголь в одиночестве или втайне от близких?', 
    options: [
      { label: 'Никогда, пью только открыто и в компании', score: 0 },
      { label: 'Иногда могу выпить один бокал вина за ужином под фильм', score: 15 },
      { label: 'Периодически выпиваю втихаря, чтобы избежать осуждения близких', score: 50 },
      { label: 'Часто пью один, мне так комфортнее и не нужно ни под кого подстраиваться', score: 75 },
      { label: 'Имею постоянные заначки алкоголя по дому/гаражу, о которых никто не знает', score: 95 }
    ] 
  },
  { 
    text: 'Бывают ли у вас провалы в памяти на утро после употребления алкоголя?', 
    options: [
      { label: 'Никогда не сталкивался с потерей памяти', score: 0 },
      { label: 'Было пару раз в жизни после экстремально тяжелых праздников', score: 20 },
      { label: 'Иногда частично забываю отдельные фрагменты вчерашнего вечера', score: 50 },
      { label: 'Регулярно просыпаюсь с трудом вспоминая, как добрался до кровати', score: 80 },
      { label: 'Постоянно стираются целые пласты времени, восстанавливаю события по перепискам', score: 95 }
    ] 
  },
  { 
    text: 'Как вы переносите похмелье (абстинентный синдром) и боретесь с ним?', 
    options: [
      { label: 'Практически не знаю, что такое похмелье', score: 0 },
      { label: 'Бывает редко, лечусь только чаем, минеральной водой или сном', score: 15 },
      { label: 'Тяжело болею, пью лекарства и отлеживаюсь весь день', score: 45 },
      { label: 'Плохо весь день, спасаюсь исключительно рассолом или бутылкой пива вечером', score: 75 },
      { label: 'Испытываю жуткую ломку, без утренней рюмки/банки пива физически не выживу', score: 95 }
    ] 
  },
  { 
    text: 'Замечаете ли вы, что ваша привычная доза алкоголя для опьянения заметно выросла?', 
    options: [
      { label: 'Нет, пьянею быстро от небольшого количества, доза стабильна', score: 0 },
      { label: 'Толерантность стандартная, пьянею умеренно и предсказуемо', score: 15 },
      { label: 'Замечаю, что за последний год мне требуется выпить больше для нужного эффекта', score: 45 },
      { label: 'Могу выпить очень много крепкого спиртного и внешне казаться трезвым', score: 75 },
      { label: 'Организм выработал огромную стойкость, пью литрами, чтобы просто почувствовать расслабление', score: 95 }
    ] 
  },
  { 
    text: 'Какую долю вашего бюджета занимают систематические траты на алкоголь?', 
    options: [
      { label: 'Ничтожную, практически не трачу деньги на спиртное', score: 0 },
      { label: 'Незначительную, покупаю алкоголь нерегулярно', score: 15 },
      { label: 'Ощутимую статью расходов, особенно заметно бьет по карману после выходных', score: 45 },
      { label: 'Трачу больше, чем могу себе позволить, экономлю на других сферах жизни', score: 75 },
      { label: 'Готов потратить последние деньги, влезть в долги или сдать вещи ради бутылки', score: 95 }
    ] 
  },
  { 
    text: 'Что обычно становится для вас основным триггером (поводом) выпить?', 
    options: [
      { label: 'Только крупные общественные праздники или важные даты', score: 0 },
      { label: 'Встреча с друзьями, окончание тяжелой рабочей недели', score: 15 },
      { label: 'Любая усталость, стресс, плохое настроение, скука или одиночество', score: 45 },
      { label: 'Потребность заглушить внутренние психологические проблемы и забыться', score: 75 },
      { label: 'Повод не нужен, употребление спиртного — это фоновый и обязательный процесс дня', score: 95 }
    ] 
  },
  { 
    text: 'Приходилось ли вам отменять важные дела, хобби или работу ради употребления спиртного?', 
    options: [
      { label: 'Никогда, обязанности и увлечения всегда на первом месте', score: 0 },
      { label: 'Пару раз переносил неважные встречи из-за затянувшегося застолья', score: 20 },
      { label: 'Иногда забиваю на домашние дела, спорт или задачи, выбирая выпивку', score: 50 },
      { label: 'Регулярно прогуливаю работу/учебу или срываю важные планы из-за похмелья', score: 80 },
      { label: 'Алкоголь полностью вытеснил все бывшие интересы, меня больше ничего не увлекает', score: 95 }
    ] 
  },
  { 
    text: 'Испытываете ли вы чувство стыда или глубокого сожаления на следующий день после выпивки?', 
    options: [
      { label: 'Нет, так как выпиваю крайне редко и полностью себя контролирую', score: 0 },
      { label: 'Иногда жалею о зря потраченных деньгах или испорченном режиме сна', score: 20 },
      { label: 'Регулярно корю себя за глупое поведение и лишние сказанные слова под градусом', score: 55 },
      { label: 'Постоянно обещаю себе "завязать навсегда", но срываюсь через несколько дней', score: 80 },
      { label: 'Стыд стал хроническим, единственный способ избавиться от него — выпить снова', score: 95 }
    ] 
  },
  { 
    text: 'Случалось ли у вас употребление алкоголя несколько дней подряд (запойное поведение)?', 
    options: [
      { label: 'Ни разу в жизни, пью максимум один вечер', score: 0 },
      { label: 'Бывало только на праздниках (например, Новый год) 2 дня подряд', score: 15 },
      { label: 'Регулярно затягиваю пьянку с вечера пятницы до конца воскресенья', score: 50 },
      { label: 'Иногда ухожу в мини-запои на 3-4 дня подряд, с трудом выходя из них', score: 80 },
      { label: 'Многодневные запои — моя регулярная реальность, теряю счет дням и неделям', score: 95 }
    ] 
  },
  { 
    text: 'С какой скоростью вы обычно выпиваете алкоголь по сравнению с другими людьми?', 
    options: [
      { label: 'Медленнее всех, могу цедить один бокал в течение всего вечера', score: 0 },
      { label: 'Пью в среднем темпе всей компании', score: 15 },
      { label: 'Пью быстрее остальных, часто приходится ждать, пока нальют следующий круг', score: 45 },
      { label: 'Опережаю всех по темпу, стараюсь быстрее достичь состояния опьянения', score: 75 },
      { label: 'Пью мгновенно и залпом, тороплюсь опрокинуть очередную рюмку', score: 95 }
    ] 
  },
  { 
    text: 'Выражали ли ваши близкие, друзья или коллеги открытую тревогу по поводу вашего употребления?', 
    options: [
      { label: 'Никогда, никто и близко не считает меня зависимым', score: 0 },
      { label: 'Были единичные шутливые намеки или мягкие замечания со стороны близких', score: 20 },
      { label: 'В семье часто происходят конфликты и серьезные ссоры из-за моих пьянок', score: 55 },
      { label: 'Родственники бьют тревогу, требуют лечиться или закодироваться', score: 85 },
      { label: 'Все давно махнули на меня рукой, круг общения сузился до таких же собутыльников', score: 95 }
    ] 
  },
  { 
    text: 'Как вы готовитесь к предстоящему алкогольному вечеру?', 
    options: [
      { label: 'Покупаю строго ограниченный объем алкоголя непосредственно перед употреблением', score: 0 },
      { label: 'Беру с небольшим запасом, чтобы не пришлось бежать в магазин ночью', score: 20 },
      { label: 'Всегда покупаю огромное количество спиртного, панически боясь ситуации "вдруг не хватит"', score: 50 },
      { label: 'Закупаюсь ящиками, дома всегда есть приличный склад крепкого алкоголя', score: 75 },
      { label: 'Постоянно прячу "дежурную" бутылку на экстренный случай', score: 95 }
    ] 
  },
  { 
    text: 'Используете ли вы алкоголь как основное "лекарство" от тревоги, бессонницы или физической боли?', 
    options: [
      { label: 'Нет, для этого есть медицинские препараты и врачи', score: 0 },
      { label: 'Иногда выпиваю немного коньяка при простуде или бокал вина для лучшего сна', score: 20 },
      { label: 'Часто прибегаю к алкоголю как к единственному средству успокоить расшатанные нервы', score: 55 },
      { label: 'Без алкоголя я физически не могу уснуть или справиться с сильной тревогой', score: 80 },
      { label: 'Алкоголь стал моим главным антидепрессантом на постоянной основе', score: 95 }
    ] 
  },
  { 
    text: 'Приходилось ли вам совершать опасные действия в состоянии опьянения (водить машину, лезть в драку)?', 
    options: [
      { label: 'Никогда, в состоянии алкогольного опьянения строго соблюдаю безопасность', score: 0 },
      { label: 'Было пару раз, когда пьяным купался в водоеме или вступал в горячие словесные споры', score: 20 },
      { label: 'Иногда управлял автомобилем после "пары бутылок пива", считая себя трезвым', score: 55 },
      { label: 'Регулярно попадаю в опасные ситуации, чудом избегая травм, ДТП или полиции', score: 85 },
      { label: 'Пьяная езда, драки и балансирование на грани закона — моя обычная практика', score: 95 }
    ] 
  },
  { 
    text: 'Бывает ли у вас по утрам дрожь в руках (тремор), которая проходит только после рюмки или банки пива?', 
    options: [
      { label: 'Никогда не испытывал подобного физического симптома', score: 0 },
      { label: 'Было легкое недомогание или слабость после крайне тяжелых праздников', score: 20 },
      { label: 'Иногда трясутся руки с похмелья, тяжело удержать чашку с водой', score: 55 },
      { label: 'Регулярно трясет по утрам, координация восстанавливается только после дозы алкоголя', score: 85 },
      { label: 'Трясет постоянно, физически не дееспособен, пока не приму хотя бы 100 грамм', score: 95 }
    ] 
  },
  { 
    text: 'Интересно ли вам проводить время на мероприятиях, где полностью отсутствует алкоголь?', 
    options: [
      { label: 'Да, спокойно и с удовольствием отдыхаю без спиртного', score: 0 },
      { label: 'Вполне нормально, но с алкоголем было бы значительно веселее', score: 20 },
      { label: 'Иду неохотно, стараюсь выпить "для разогрева" непосредственно перед выходом из дома', score: 55 },
      { label: 'Считаю безалкогольные встречи пустой тратой времени, стараюсь их избегать', score: 80 },
      { label: 'Ни за что не пойду туда, где нельзя выпить. Алкоголь — обязательное условие любого выхода', score: 95 }
    ] 
  },
  { 
    text: 'Пытались ли вы когда-нибудь контролировать дозу с помощью жестких правил ("только пиво", "не пить до 18:00")?', 
    options: [
      { label: 'Нет необходимости в правилах, легко контролирую себя сам', score: 0 },
      { label: 'Пытался вводить ограничения, правила иногда помогают не перебрать лишнего', score: 20 },
      { label: 'Постоянно выдумываю новые схемы контроля, но регулярно нарушаю их уже к середине вечера', score: 60 },
      { label: 'Все мои попытки самоконтроля давно провалились, рамок больше не существует', score: 95 }
    ] 
  }
];

export const EXTRA_QUESTIONS = [
  { 
    text: 'Как вы реагируете на критику вашего увлечения алкоголем со стороны близких людей?', 
    options: [
      { label: 'Спокойно выслушиваю, при необходимости делаю выводы', score: 0 },
      { label: 'Раздражаюсь, считая, что они сильно преувеличивают проблему', score: 25 },
      { label: 'Агрессивно защищаюсь, перевожу тему на их собственные недостатки', score: 60 },
      { label: 'Пью назло им, чтобы доказать свою полную независимость и свободу', score: 90 }
    ] 
  },
  { 
    text: 'Случались ли у вас проблемы с законом, приводы в полицию или вытрезвитель из-за выпивки?', 
    options: [
      { label: 'Никогда', score: 0 },
      { label: 'Было мелкое административное предупреждение или штраф в далеком прошлом', score: 25 },
      { label: 'Периодически задерживали в нетрезвом виде, имею проблемы на работе из-за прогулов', score: 65 },
      { label: 'Регулярные приводы, конфликты с правоохранительными органами, образ жизни менять не собираюсь', score: 95 }
    ] 
  },
  { 
    text: 'Бывало ли, что при отсутствии качественного алкоголя вы употребляли суррогаты или аптечные настойки?', 
    options: [
      { label: 'Полностью исключено, моё здоровье мне дорого', score: 0 },
      { label: 'Мог выпить сомнительный алкоголь "из-под полы" ради экономии средств', score: 30 },
      { label: 'Принимал спиртовые настойки (боярышник и др.) исключительно ради быстрого опьянения', score: 65 },
      { label: 'Пил технический спирт, самогон сомнительного происхождения или аптечные пузырьки', score: 95 }
    ] 
  },
  { 
    text: 'Присутствует ли у вас навязчивая мысль о выпивке в течение обычного рабочего дня?', 
    options: [
      { label: 'Нет, полностью погружен в рабочие задачи', score: 0 },
      { label: 'Иногда ближе к вечеру радуюсь мысли о пятничном пиве', score: 15 },
      { label: 'Регулярно считаю часы до окончания смены, чтобы поскорее купить бутылку', score: 55 },
      { label: 'Все мысли заняты только спиртным, могу незаметно выпить прямо на рабочем месте', score: 90 }
    ] 
  },
  { 
    text: 'Каково ваше физическое и ментальное состояние при вынужденном периоде абсолютной трезвости?', 
    options: [
      { label: 'Отличное, чувствую прилив сил, энергии и ясность ума', score: 0 },
      { label: 'Нормальное, но ощущаю легкую скуку и нехватку привычного расслабления', score: 20 },
      { label: 'Испытываю постоянную раздражительность, агрессию, мир кажется серым и унылым', score: 60 },
      { label: 'Начинается депрессия, тремор, сильная бессонница и непреодолимая тяга сорваться', score: 95 }
    ] 
  },
  { 
    text: 'Случалось ли вам воровать деньги, сдавать ценные вещи в ломбард ради покупки очередной дозы алкоголя?', 
    options: [
      { label: 'Никогда в жизни', score: 0 },
      { label: 'Занимал деньги под сомнительными предлогами, зная, что спущу их на выпивку', score: 30 },
      { label: 'Сдавал технику или золото в ломбард в периоды тяжелого похмелья', score: 70 },
      { label: 'Регулярно иду на мелкие преступления или кражи ради заветной бутылки', score: 95 }
    ] 
  }
];

// Объединенная база данных для сжатой пересылки
export const ALL_QUESTIONS_DB = [...BASE_QUESTIONS, ...EXTRA_QUESTIONS];

let testState = {
  questions: [],
  currentIndex: 0,
  totalScore: 0,
  answeredCount: 0,
  isFinished: false,
  extraTriggered: false,
  isTransitioning: false,
  selectedAnswers: []
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
  testState.selectedAnswers = [];
  
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
    btn.addEventListener('click', () => handleAnswer(opt.score, idx));
    testUI.optionsContainer.appendChild(btn);
  });
  
  updateProgress();
}

function handleAnswer(score, optionIdx) {
  if (testState.isFinished || testState.isTransitioning) return;
  testState.isTransitioning = true;
  testUI.loadingOverlay.classList.remove('hidden');
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  
  setTimeout(() => {
    testState.totalScore += score;
    testState.answeredCount++;
    testState.selectedAnswers.push(optionIdx);
    
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

// Экспорт компактного лога индексов
export function getTestSharePayload() {
  const profile = getProfile();
  
  const compactLog = testState.questions.map((q, idx) => {
    const dbIndex = ALL_QUESTIONS_DB.findIndex(dbQ => dbQ.text === q.text);
    return {
      q: dbIndex,
      a: testState.selectedAnswers[idx] !== undefined ? testState.selectedAnswers[idx] : null
    };
  });
  
  return {
    type: 'test',
    name: profile ? profile.name : 'Аноним',
    sandbox: isSandboxMode(),
    qData: compactLog,
    percent: Math.round(Math.min(100, Math.max(0, (testState.totalScore / testState.questions.reduce((sum, q) => {
      const maxOpt = q.options.reduce((m, o) => Math.max(m, o.score), 0);
      return sum + maxOpt;
    }, 0)) * 100)))
  };
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
  testUI.percentageDisplay.textContent = `Отклонение: ${percentInt}%`;
  
  const profile = getProfile();
  
  if (isSandboxMode()) {
    customAlert('Песочница', '⚠️ Внимание: Тест пройден в режиме "Песочница". Этот результат никак не повлиял на ваш официальный статус и историю тестов.');
  } else if (profile) {
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
  }
}

let customAlert = (title, message) => alert(message);
export function setCustomAlert(alertFn) {
  customAlert = alertFn;
}