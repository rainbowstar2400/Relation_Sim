import { initDomCache, dom } from './dom-cache.js';
import { setupEventListeners } from './event-listeners.js';
import { renderCharacters } from './character-render.js';
import { triggerRandomEvent } from './event-system.js';
import { loadMoodTables } from './mood.js';
import { loadEmotionLabelTable } from './emotion-label.js';
import { switchView, alignAllSliderTicks } from './view-switcher.js';
import { loadState } from './storage.js';
import { state } from './state.js';
import { renderSavedLogs } from './logger.js';
import { loadConsultationTemplates, startConsultationScheduler, renderConsultations } from './consultation.js';

const EVENT_INTERVAL_MS = 1800000; // 30分に1回
const EVENT_PROBABILITY = 0.7; // 70%

function updateDateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    dom.timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dom.dateElement.textContent = `${year}/${month}/${day}`;
}

function startEventScheduler() {
    setInterval(() => {
        if (Math.random() < EVENT_PROBABILITY) {
            triggerRandomEvent();
        }
    }, EVENT_INTERVAL_MS);
}

export async function loadHTML(id, file) {
    const res = await fetch(file);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
}

export async function initializeApp() {
    initDomCache();
    const saved = loadState();
    if (saved) {
        Object.assign(state, saved);
        renderSavedLogs();
    }
    await loadEmotionLabelTable();
    await loadMoodTables();
    await loadConsultationTemplates();
    setupEventListeners();
    setInterval(updateDateTime, 1000);
    updateDateTime();
    startEventScheduler();
    startConsultationScheduler();
    renderCharacters();
    renderConsultations();
    switchView('main');
    requestAnimationFrame(alignAllSliderTicks);
}

export async function setupApp() {
    await loadHTML('header-placeholder', 'header.html');
    await loadHTML('main-view-placeholder', 'main-view.html');
    await loadHTML('management-room-placeholder', 'management-view.html');
    await loadHTML('status-view-placeholder', 'character-status.html');
    await loadHTML('daily-report-placeholder', 'daily-report.html');
    await initializeApp();
}
