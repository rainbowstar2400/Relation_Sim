import { state } from './state.js';
import { saveState } from './storage.js';
import { drawMood } from './mood.js';
import { appendLog } from './logger.js';
import { drawEmotionChange } from './emotion-label.js';

// イベント種別ごとの基礎好感度値
const baseAffection = {
    '挨拶': 1,
    '雑談': 2,
    '思い出し会話': 3,
    '二人きりの時間': 4,
};

// 雰囲気値による好感度補正値
const moodAffectionModifier = {
    2: 3,    // very_positive
    1: 2,    // positive
    0: 0,    // neutral
    '-1': -3,   // negative
    '-2': -5    // very_negative
};

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
    // 好感度は -100 〜 +100 に制限
    rec.score = Math.max(-100, Math.min(100, rec.score));
}


function storeEvent(event) {
    const history = JSON.parse(localStorage.getItem('event_history') || '[]');
    history.push(event);
    localStorage.setItem('event_history', JSON.stringify(history));
}

export function triggerRandomEvent() {
    const pair = getRandomPair();
    if (!pair) return;
    const [a, b] = pair;
    const types = ['挨拶', '雑談', '思い出し会話', '二人きりの時間'];
    const type = types[Math.floor(Math.random() * types.length)];
    let desc = '';
    switch (type) {
        case '挨拶':
            desc = `${a.name}と${b.name}が軽く挨拶を交わした。`;
            break;
        case '雑談':
            desc = `${a.name}と${b.name}が楽しそうに雑談している。`;
            break;
        case '思い出し会話':
            desc = `${a.name}と${b.name}が昔の出来事を思い出して語り合っている。`;
            break;
        case '二人きりの時間':
            desc = `${a.name}と${b.name}が静かに二人きりの時間を過ごしている。`;
            break;
    }

    // 雰囲気を決定し、好感度変化量を算出
    const mood = drawMood(a.id, b.id);
    const base = baseAffection[type] || 0;
    const delta = base + (moodAffectionModifier[mood] || 0);

    updateAffection(a.id, b.id, delta);
    updateAffection(b.id, a.id, delta);

    drawEmotionChange(a.id, b.id, mood);
    drawEmotionChange(b.id, a.id, mood);

    appendLog(desc);
    if (delta !== 0) {
        const verb = delta > 0 ? '上昇しました' : '下降しました';
        appendLog(`${a.name}→${b.name}の好感度が${verb}`, 'SYSTEM');
        appendLog(`${b.name}→${a.name}の好感度が${verb}`, 'SYSTEM');
    } else {
        appendLog(`${a.name}と${b.name}の好感度に変化はありません`, 'SYSTEM');
    }

    storeEvent({ timestamp: Date.now(), description: desc, mood });
    saveState(state);
}
