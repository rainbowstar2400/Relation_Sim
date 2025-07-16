import { dom } from './dom-cache.js';
import { state } from './state.js';

function filterEventsByDate(dateStr) {
    return state.reports.filter(ev => {
        if (!ev.timestamp) return false;
        const d = new Date(ev.timestamp).toISOString().split('T')[0];
        return d === dateStr;
    });
}

export function renderDailyReport(dateStr) {
    const target = dateStr || new Date().toISOString().split('T')[0];
    if (!dateStr) dom.reportDateInput.value = target;
    const events = filterEventsByDate(target);
    dom.dailyReportList.innerHTML = '';
    if (events.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'イベントがありません';
        dom.dailyReportList.appendChild(li);
        return;
    }
    events.forEach(ev => {
        const li = document.createElement('li');
        const time = new Date(ev.timestamp).toTimeString().slice(0,5);
        li.textContent = `[${time}] ${ev.description || ''}`;
        dom.dailyReportList.appendChild(li);
    });
}

export function setupDailyReport() {
    dom.reportDateInput.addEventListener('change', () => {
        renderDailyReport(dom.reportDateInput.value);
    });
}
