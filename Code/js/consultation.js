import { state } from './state.js';
import { dom } from './dom-cache.js';
import { appendLog } from './logger.js';
import { saveState } from './storage.js';

let templates = [];
let currentId = null;
let answered = false;

export async function loadConsultationTemplates() {
    const res = await fetch('./data/trouble_prompt_templates.json');
    templates = await res.json();
}

function getTrust(charId) {
    const rec = state.trusts.find(t => t.id === charId);
    return rec ? rec.score : 50;
}

function updateTrust(charId, delta) {
    let rec = state.trusts.find(t => t.id === charId);
    if (!rec) {
        rec = { id: charId, score: 50 };
        state.trusts.push(rec);
    }
    rec.score = Math.max(0, Math.min(100, rec.score + delta));
    const char = state.characters.find(c => c.id === charId);
    const verb = delta >= 0 ? '上昇しました' : '下降しました';
    appendLog(`${char.name}からの信頼度が${verb}。`, 'SYSTEM');
    saveState(state);
}

function weightedChoice(items) {
    const total = items.reduce((sum, it) => sum + it.weight, 0);
    let rnd = Math.random() * total;
    for (const it of items) {
        rnd -= it.weight;
        if (rnd < 0) return it.value;
    }
    return items[0].value;
}

function selectTemplate(trust) {
    if (trust <= 20) {
        const lows = templates.filter(t => t.genre === '低信頼度テンプレート');
        return lows[Math.floor(Math.random() * lows.length)];
    }
    let prob;
    if (trust < 40) {
        prob = { 0: 1 };
    } else if (trust < 80) {
        prob = { 0: 60, 1: 30, 2: 10 };
    } else if (trust < 100) {
        prob = { 0: 25, 1: 45, 2: 25, 3: 5 };
    } else {
        prob = { 0: 15, 1: 40, 2: 30, 3: 15 };
    }
    const pool = [];
    for (const [lvl, w] of Object.entries(prob)) {
        templates.filter(t => t.level === Number(lvl)).forEach(t => {
            pool.push({ weight: w, value: t });
        });
    }
    return weightedChoice(pool);
}

function chooseCharacter() {
    const now = Date.now();
    const candidates = state.characters.filter(c => {
        if (c.condition && (c.condition === '就寝中' || c.condition === '風邪')) return false;
        if (now - (c.lastConsultation || 0) < 3600000) return false;
        return true;
    });
    if (candidates.length === 0) return null;
    const weighted = candidates.map(c => {
        const trust = getTrust(c.id);
        const social = c.personality.social || 0;
        const express = c.personality.expressiveness || 0;
        return { weight: trust + social * 10 + express * 10, value: c };
    });
    return weightedChoice(weighted);
}

export function createConsultation() {
    if (state.consultations.length >= 3) return;
    const char = chooseCharacter();
    if (!char) return;
    const tpl = selectTemplate(getTrust(char.id));
    if (!tpl) return;
    const event = {
        id: Date.now(),
        charId: char.id,
        template: tpl,
        created: Date.now(),
        timer: null
    };
    char.lastConsultation = Date.now();
    state.consultations.push(event);
    renderConsultations();
    event.timer = setTimeout(() => removeConsultation(event.id, false), 3600000);
}

export function startConsultationScheduler() {
    setInterval(() => {
        if (state.consultations.length === 0) {
            createConsultation();
        }
    }, 3600000);
}

export function renderConsultations() {
    dom.consultationList.innerHTML = '';
    state.consultations.slice(0, 3).forEach(ev => {
        const li = document.createElement('li');
        li.className = 'consultation-item';
        li.dataset.id = ev.id;
        const name = state.characters.find(c => c.id === ev.charId).name;
        const span = document.createElement('span');
        span.textContent = `・${name}から相談があります`;
        const btn = document.createElement('button');
        btn.textContent = '対応する';
        btn.addEventListener('click', () => openPopup(ev.id));
        li.appendChild(span);
        li.appendChild(btn);
        dom.consultationList.appendChild(li);
    });
}

function openPopup(id) {
    currentId = id;
    answered = false;
    const ev = state.consultations.find(e => e.id === id);
    if (!ev) return;
    const char = state.characters.find(c => c.id === ev.charId);
    appendLog(`${char.name}がプレイヤーに相談しています…`);
    dom.consultationQuestion.textContent = `${char.name}「${ev.template.core_prompt}」`;
    dom.consultationAnswerArea.innerHTML = '';
    if (ev.template.form === 'choice') {
        const options = [
            { label: 'A: いいと思う', type: 'good' },
            { label: 'B: そうだね', type: 'neutral' },
            { label: 'C: やめておこう', type: 'bad' }
        ];
        options.forEach(op => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'consult-answer';
            radio.value = op.type;
            label.appendChild(radio);
            label.append(` ${op.label}`);
            const br = document.createElement('br');
            dom.consultationAnswerArea.appendChild(label);
            dom.consultationAnswerArea.appendChild(br);
        });
    } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'consult-fill';
        input.placeholder = 'ここに入力';
    dom.consultationAnswerArea.appendChild(input);
    }
    dom.consultationSendButton.disabled = false;
    dom.consultationSendButton.textContent = '決定';
    dom.consultationPopup.style.display = 'flex';
}

function handleSendClick() {
    if (currentId == null) return;
    const ev = state.consultations.find(e => e.id === currentId);
    if (!ev) return;
    let kind = 'neutral';
    if (ev.template.form === 'choice') {
        const checked = dom.consultationAnswerArea.querySelector('input[name="consult-answer"]:checked');
        if (!checked) return;
        kind = checked.value;
    }
    let delta = 0;
    if (kind === 'good') delta = Math.floor(Math.random() * 3) + 3; // +3〜+5
    else if (kind === 'neutral') delta = Math.floor(Math.random() * 3); // 0〜2
    else delta = -(Math.floor(Math.random() * 3) + 2); // -2〜-4
    if (answered) return;
    updateTrust(ev.charId, delta);
    dom.consultationAnswerArea.innerHTML = '<p>ありがとう！</p>';
    dom.consultationSendButton.disabled = true;
    dom.consultationSendButton.textContent = '完了';
    answered = true;
}

function closePopup() {
    dom.consultationPopup.style.display = 'none';
    if (currentId == null) return;
    const id = currentId;
    currentId = null;
    if (answered) {
        removeConsultation(id, true);
    }
}

export function setupConsultationHandlers() {
    if (dom.consultationSendButton) {
        dom.consultationSendButton.addEventListener('click', handleSendClick);
    }
    if (dom.consultationCloseButton) {
        dom.consultationCloseButton.addEventListener('click', closePopup);
    }
}

export function removeConsultation(id, answered) {
    const idx = state.consultations.findIndex(e => e.id === id);
    if (idx === -1) return;
    clearTimeout(state.consultations[idx].timer);
    state.consultations.splice(idx, 1);
    renderConsultations();
}
