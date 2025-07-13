import { dom } from './dom-cache.js';

const STORAGE_KEY = 'event_history';
let logs = [];

export function loadLogs() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        logs = [];
        return logs;
    }
    try {
        logs = JSON.parse(data);
        if (!Array.isArray(logs)) logs = [];
    } catch (e) {
        console.error('ログの読み込みに失敗しました', e);
        logs = [];
    }
    return logs;
}

function saveLogs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function addLog(description) {
    const entry = {
        timestamp: new Date().toISOString(),
        description
    };
    logs.push(entry);
    saveLogs();
    renderLogs();
}

export function renderLogs() {
    if (!dom.logContent) return;
    if (!logs.length) {
        loadLogs();
    }
    dom.logContent.innerHTML = '';
    logs.forEach(ev => {
        const p = document.createElement('p');
        const timeSpan = document.createElement('span');
        timeSpan.className = 'log-time';
        timeSpan.textContent = '[' + new Date(ev.timestamp).toTimeString().slice(0,5) + ']';
        const eventSpan = document.createElement('span');
        eventSpan.className = 'log-event';
        eventSpan.textContent = 'EVENT:';
        p.appendChild(timeSpan);
        p.append(' ');
        p.appendChild(eventSpan);
        p.append(' ' + (ev.description || ''));
        dom.logContent.appendChild(p);
    });
    dom.logContent.scrollTop = dom.logContent.scrollHeight;
}

// 初期読み込み
loadLogs();
