import { dom } from './dom-cache.js';
import { state } from './state.js';

function getReportByDate(dateStr) {
    const report = state.reports[dateStr];
    if (!report) return { events: [], changes: [] };
    return report;
}

export function renderDailyReport(dateStr) {
    const target = dateStr || new Date().toISOString().split('T')[0];
    if (!dateStr) dom.reportDateInput.value = target;
    const report = getReportByDate(target);
    dom.dailyReportList.innerHTML = '';
    dom.changeHistoryList.innerHTML = '';
    if (report.events.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'イベントがありません';
        dom.dailyReportList.appendChild(li);
    } else {
        report.events.forEach(ev => {
            const li = document.createElement('li');
            const time = new Date(ev.timestamp).toTimeString().slice(0,5);
            li.textContent = `[${time}] ${ev.description || ''}`;
            dom.dailyReportList.appendChild(li);
        });
    }
    if (report.changes.length === 0) {
        const li = document.createElement('li');
        li.textContent = '変化はありません';
        dom.changeHistoryList.appendChild(li);
    } else {
        report.changes.forEach(chg => {
            const li = document.createElement('li');
            li.textContent = `[${chg.time}] ${chg.description}`;
            dom.changeHistoryList.appendChild(li);
        });
    }
}

export function setupDailyReport() {
    dom.reportDateInput.addEventListener('change', () => {
        renderDailyReport(dom.reportDateInput.value);
    });
}
