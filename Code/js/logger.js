import { dom } from './dom-cache.js';
import { state } from './state.js';

export function renderSavedLogs() {
    const logArea = dom.logContent;
    if (!logArea) return;
    logArea.innerHTML = '';
    const dates = Object.keys(state.logs).sort();
    dates.forEach(date => {
        state.logs[date].forEach(entry => {
            const p = document.createElement('p');
            const cls = entry.type === 'SYSTEM' ? 'log-system' : 'log-event';
            p.innerHTML = `<span class="log-time">[${entry.time}]</span> <span class="${cls}">${entry.type}:</span> ${entry.text}`;
            logArea.appendChild(p);
        });
    });
    logArea.scrollTop = logArea.scrollHeight;
}

export function appendLog(text, type = 'EVENT') {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const dateKey = now.toISOString().split('T')[0];
    if (!state.logs[dateKey]) {
        state.logs[dateKey] = [];
    }
    state.logs[dateKey].push({ time, type, text });
    const p = document.createElement('p');
    const cls = type === 'SYSTEM' ? 'log-system' : 'log-event';
    p.innerHTML = `<span class="log-time">[${time}]</span> <span class="${cls}">${type}:</span> ${text}`;
    const logArea = dom.logContent;
    if (logArea) {
        logArea.appendChild(p);
        logArea.scrollTop = logArea.scrollHeight;
    }
}
