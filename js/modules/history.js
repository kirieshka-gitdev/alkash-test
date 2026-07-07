// history.js — история и график

import { formatTime } from './utils.js';
import { getHistory } from './auth.js';

let historyUI = {};

export function initHistory(elements) {
  historyUI = { ...historyUI, ...elements };
}

export function renderHistory() {
  const history = getHistory();
  if (!history || !history.length) {
    historyUI.historyList.innerHTML = '<div class="history-empty">История тестов пуста</div>';
    return;
  }
  
  let html = '';
  const showHistory = history.slice(-5).reverse();
  showHistory.forEach(item => {
    const label = item.label || 'Тест';
    const st = item.status || '';
    let emoji = '📊';
    if (st === 'drunk') emoji = '🍷';
    else if (st === 'sober') emoji = '✨';
    else if (st === 'almost') emoji = '🌙';
    else if (st === 'funny') emoji = '🎭';
    else if (st === 'captcha_pass') emoji = '✅';
    else if (st === 'captcha_fail') emoji = '❌';
    const pct = item.percent !== undefined ? item.percent + '%' : '—';
    html += `<div class="history-item"><span>${emoji} ${label}</span><span>${pct} · ${formatTime(item.time)}</span></div>`;
  });
  historyUI.historyList.innerHTML = html;
}

export function renderChart() {
  const history = getHistory();
  const data = history.filter(h => h.percent !== undefined && h.status !== 'captcha_pass' && h.status !== 'captcha_fail' && h.status !== 'funny');
  
  if (data.length < 2) {
    historyUI.chartEmptyText.style.display = 'block';
    historyUI.chartCanvas.style.display = 'none';
    return;
  }
  
  historyUI.chartEmptyText.style.display = 'none';
  historyUI.chartCanvas.style.display = 'block';
  
  const ctx = historyUI.chartCanvas.getContext('2d');
  const labels = data.map(d => new Date(d.time).toLocaleDateString());
  const values = data.map(d => d.percent || 0);
  
  const captchaEvents = history.filter(h => h.status === 'captcha_pass' || h.status === 'captcha_fail');
  const captchaTimes = captchaEvents.map(h => h.time);
  
  const rect = historyUI.chartWrapper.getBoundingClientRect();
  const width = Math.max(200, rect.width - 10);
  const height = 80;
  
  historyUI.chartCanvas.width = width * 2;
  historyUI.chartCanvas.height = height * 2;
  historyUI.chartCanvas.style.width = width + 'px';
  historyUI.chartCanvas.style.height = height + 'px';
  
  ctx.scale(2, 2);
  const pad = { top: 10, bottom: 10, left: 16, right: 8 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  
  ctx.clearRect(0, 0, width, height);
  
  const maxVal = Math.max(100, ...values);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  ctx.beginPath();
  ctx.roundRect(pad.left, pad.top, chartWidth, chartHeight, 4);
  ctx.fill();
  
  // Вертикальные линии капчи
  if (captchaTimes.length > 0 && data.length > 1) {
    const firstTime = data[0].time;
    const lastTime = data[data.length-1].time;
    const totalRange = lastTime - firstTime || 1;
    captchaTimes.forEach(ct => {
      if (ct >= firstTime && ct <= lastTime) {
        const x = pad.left + ((ct - firstTime) / totalRange) * chartWidth;
        ctx.beginPath();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }
  
  // Линия графика
  ctx.beginPath();
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(167,139,250,0.15)';
  ctx.shadowBlur = 4;
  values.forEach((v, i) => {
    const x = pad.left + (i / (values.length - 1)) * chartWidth;
    const y = pad.top + chartHeight - ((v - minVal) / range) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Точки
  ctx.shadowBlur = 0;
  values.forEach((v, i) => {
    const x = pad.left + (i / (values.length - 1)) * chartWidth;
    const y = pad.top + chartHeight - ((v - minVal) / range) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = v >= 65 ? '#f87171' : v >= 45 ? '#fb923c' : v >= 25 ? '#fbbf24' : '#6ee7b7';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  
  ctx.fillStyle = 'rgba(200,200,255,0.08)';
  ctx.font = '7px Inter, sans-serif';
  ctx.textAlign = 'center';
  if (labels.length > 1) {
    const step = Math.max(1, Math.floor(labels.length / 3));
    labels.forEach((l, i) => {
      if (i % step === 0 || i === labels.length - 1) {
        const x = pad.left + (i / (labels.length - 1)) * chartWidth;
        ctx.fillText(l, x, height - 2);
      }
    });
  }
}

// Полифил для roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (r > w/2) r = w/2;
    if (r > h/2) r = h/2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    return this;
  };
}