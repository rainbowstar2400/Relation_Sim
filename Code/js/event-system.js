import { state } from './state.js';
import { saveState } from './storage.js';
import { dom } from './dom-cache.js';

function getRandomPair() {
    if (state.characters.length < 2) return null;
    const idx1 = Math.floor(Math.random() * state.characters.length);
    let idx2 = idx1;
    while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * state.characters.length);
    }
    return [state.characters[idx1], state.characters[idx2]];
}

function updateAffection(from, to, delta) {
    let rec = state.affections.find(a => a.from === from && a.to === to);
    if (!rec) {
        rec = { from, to, score: 0 };
        state.affections.push(rec);
    }
    rec.score += delta;
}

function appendLog(text) {
    const time = new Date().toTimeString().slice(0,5);
    const p = document.createElement('p');
    p.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-event">EVENT:</span> ${text}`;
    if (dom.logContent) {
        dom.logContent.appendChild(p);
        dom.logContent.scrollTop = dom.logContent.scrollHeight;
    }
}

function storeEvent(text) {
    const history = JSON.parse(localStorage.getItem('event_history') || '[]');
    history.push({ timestamp: Date.now(), description: text });
    localStorage.setItem('event_history', JSON.stringify(history));
}

export function triggerRandomEvent() {
    const pair = getRandomPair();
    if (!pair) return;
    const [a, b] = pair;
    const types = ['雑談', '思い出し会話', '二人きりの時間'];
    const type = types[Math.floor(Math.random() * types.length)];
    let desc = '';
    let delta = 0;
    switch (type) {
        case '雑談':
            desc = `${a.name}と${b.name}が楽しそうに雑談している。`;
            delta = 1;
            break;
        case '思い出し会話':
            desc = `${a.name}と${b.name}が昔の出来事を思い出して語り合っている。`;
            delta = 2;
            break;
        case '二人きりの時間':
            desc = `${a.name}と${b.name}が静かに二人きりの時間を過ごしている。`;
            delta = 3;
            break;
    }
    updateAffection(a.id, b.id, delta);
    updateAffection(b.id, a.id, delta);
    appendLog(desc);
    storeEvent(desc);
    saveState(state);
}
