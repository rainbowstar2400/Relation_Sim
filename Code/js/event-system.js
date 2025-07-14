import { state } from './state.js';
import { saveState } from './storage.js';
import { dom } from './dom-cache.js';

let baseDistTable = {};
let relationModifierTable = {};
let emotionModifierTable = {};
let moodTablesLoaded = false;

async function loadMoodTables() {
    if (moodTablesLoaded) return;
    const [baseRes, relRes, emoRes] = await Promise.all([
        fetch('data/initial_distribution_table.json'),
        fetch('data/relation_modifier_table.json'),
        fetch('data/emotion_modifier_table.json')
    ]);
    baseDistTable = await baseRes.json();
    relationModifierTable = await relRes.json();
    emotionModifierTable = await emoRes.json();
    moodTablesLoaded = true;
}

function getAffection(from, to) {
    return state.affections.find(a => a.from === from && a.to === to)?.score || 0;
}

function getRelationLabel(id1, id2) {
    const key = [id1, id2].sort();
    return state.relationships.find(r => r.pair[0] === key[0] && r.pair[1] === key[1])?.label || 'なし';
}

function getEmotionLabel(from, to) {
    return state.emotions?.find(e => e.from === from && e.to === to)?.emotion_label || 'なし';
}

async function drawEventMood(charA, charB) {
    await loadMoodTables();
    const affAtoB = getAffection(charA, charB);
    const affBtoA = getAffection(charB, charA);
    const affectionAvg = Math.round((affAtoB + affBtoA) / 2);

    let baseMood = 0;
    if (affectionAvg <= -30) baseMood = -2;
    else if (affectionAvg < 0) baseMood = -1;
    else if (affectionAvg <= 30) baseMood = 0;
    else if (affectionAvg <= 60) baseMood = 1;
    else baseMood = 2;

    const baseDist = baseDistTable[baseMood] || { '-2': 20, '-1': 20, '0': 20, '1': 20, '2': 20 };

    const relationLabel = getRelationLabel(charA, charB);
    const relationCoeff = relationModifierTable[relationLabel] || { '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1 };

    const emotionLabelA = getEmotionLabel(charA, charB);
    const emotionLabelB = getEmotionLabel(charB, charA);
    const emotionCoeffA = emotionModifierTable[emotionLabelA] || { '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1 };
    const emotionCoeffB = emotionModifierTable[emotionLabelB] || { '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1 };

    const corrected = {};
    for (let m = -2; m <= 2; m++) {
        corrected[m] = (baseDist[m] || 0)
            * (relationCoeff[m] || 1)
            * (emotionCoeffA[m] || 1)
            * (emotionCoeffB[m] || 1);
    }

    const total = Object.values(corrected).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (let m = -2; m <= 2; m++) {
        rand -= corrected[m];
        if (rand < 0) return m;
    }
    return 0;
}

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

function storeEvent(text, mood) {
    const history = JSON.parse(localStorage.getItem('event_history') || '[]');
    history.push({ timestamp: Date.now(), description: text, mood });
    localStorage.setItem('event_history', JSON.stringify(history));
}

export async function triggerRandomEvent() {
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
    const mood = await drawEventMood(a.id, b.id);
    appendLog(desc);
    storeEvent(desc, mood);
    saveState(state);
}
