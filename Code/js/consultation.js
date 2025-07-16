import { state, updateTrust } from './state.js';
import { dom } from './dom-cache.js';
import { saveState } from './storage.js';
import { appendLog } from './event-system.js';

let templates = [];
const EXPIRE_MS = 3600000; // 1時間

export async function loadConsultationTemplates() {
    const res = await fetch('./data/trouble_prompt_templates.json');
    templates = await res.json();
}

function selectTemplate(trust) {
    if (!templates.length) return null;
    if (trust <= 20) {
        const lows = templates.filter(t => t.genre === '低信頼度テンプレート');
        return lows[Math.floor(Math.random() * lows.length)];
    }
    let allowedLevels = [0];
    if (trust >= 40) allowedLevels.push(1, 2);
    if (trust >= 80) allowedLevels.push(3);
    const candidates = templates.filter(t => allowedLevels.includes(t.level));
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function cleanupConsultations() {
    const now = Date.now();
    state.consultations = state.consultations.filter(ev => now - ev.created < EXPIRE_MS);
}

export function tryGenerateConsultation() {
    cleanupConsultations();
    if (state.consultations.length > 0) return;
    const chars = state.characters;
    if (chars.length === 0) return;
    const char = chars[Math.floor(Math.random() * chars.length)];
    const tmpl = selectTemplate(char.trust);
    if (!tmpl) return;
    state.consultations.push({ charId: char.id, templateId: tmpl.id, created: Date.now() });
    renderConsultations();
}

export function renderConsultations() {
    if (!dom.consultationList) return;
    dom.consultationList.innerHTML = '';
    state.consultations.forEach((ev, index) => {
        const char = state.characters.find(c => c.id === ev.charId);
        if (!char) return;
        const item = document.createElement('div');
        item.className = 'consultation-item';
        const span = document.createElement('span');
        span.textContent = `・${char.name}から相談があります`;
        const btn = document.createElement('button');
        btn.textContent = '対応する';
        btn.addEventListener('click', () => handleConsultation(ev, index));
        item.appendChild(span);
        item.appendChild(btn);
        dom.consultationList.appendChild(item);
    });
}

function handleConsultation(ev, index) {
    const tmpl = templates.find(t => t.id === ev.templateId);
    const char = state.characters.find(c => c.id === ev.charId);
    if (!tmpl || !char) return;
    appendLog(`${char.name}がプレイヤーに相談しています…`, 'EVENT');
    const answer = window.prompt(tmpl.core_prompt);
    if (answer !== null) {
        updateTrust(char.id, 3);
        appendLog(`${char.name}からの信頼度が上昇しました。`, 'SYSTEM');
    }
    state.consultations.splice(index, 1);
    renderConsultations();
    saveState(state);
}
