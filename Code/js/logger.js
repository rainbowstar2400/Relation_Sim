import { dom } from './dom-cache.js';

export function appendLog(text, type = 'EVENT') {
    const time = new Date().toTimeString().slice(0, 5);
    const p = document.createElement('p');
    const cls = type === 'SYSTEM' ? 'log-system' : 'log-event';
    p.innerHTML = `<span class="log-time">[${time}]</span> <span class="${cls}">${type}:</span> ${text}`;
    const logArea = dom.logContent;
    if (logArea) {
        logArea.appendChild(p);
        logArea.scrollTop = logArea.scrollHeight;
    }
}
