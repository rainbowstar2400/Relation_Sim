import { dom, initDomCache } from './dom-cache.js';
import { switchView, alignAllSliderTicks } from './view-switcher.js';
import { setupDailyReport } from './daily-report.js';
import { calculateMbti } from './mbti-diagnosis.js';
import { renderCharacters, renderManagementList } from './character-render.js';
import { setupFormHandlers } from './form-handler.js';
import { state, mbtiDescriptions } from './state.js';
import { exportState, importStateFromFile } from './storage.js';
import { triggerRandomEvent } from './event-system.js';
import { createConsultation, setupConsultationHandlers } from './consultation.js';
import { renderSavedLogs } from './logger.js';

export function setupEventListeners() {
    dom.homeButton.addEventListener('click', () => switchView('main'));
    dom.managementButton.addEventListener('click', () => switchView('management'));
    dom.dailyReportButton.addEventListener('click', () => {
        switchView('daily-report');
    });
    dom.devEventButton.addEventListener('click', () => triggerRandomEvent());
    dom.backToMainButton.addEventListener('click', () => switchView('main'));
    dom.statusBackButton.addEventListener('click', () => switchView('main'));
    dom.reportBackButton.addEventListener('click', () => switchView('main'));
    dom.saveButton.addEventListener('click', () => exportState(state));
    dom.loadButton.addEventListener('click', () => dom.loadFileInput.click());
    dom.loadFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        importStateFromFile(file)
            .then(loaded => {
                Object.assign(state, loaded);
                renderCharacters();
                renderManagementList();
                renderSavedLogs();
            })
            .catch(() => alert('読み込みに失敗しました。'))
            .finally(() => {
                dom.loadFileInput.value = '';
            });
    });

    dom.startDiagButton.addEventListener('click', () => {
        dom.mbtiQuestionsArea.style.display = 'block';
        dom.startDiagButton.style.display = 'none';
        dom.mbtiResultArea.style.display = 'none';
        requestAnimationFrame(alignAllSliderTicks);
    });

    dom.executeDiagButton.addEventListener('click', () => {
        const sliderValues = [];
        for (let i = 1; i <= 16; i++) {
            sliderValues.push(parseInt(dom.mbtiInputs[`q${i}`].value));
        }
        const personality = {
            social: parseInt(dom.personalityInputs.social.value),
            kindness: parseInt(dom.personalityInputs.kindness.value),
            stubbornness: parseInt(dom.personalityInputs.stubbornness.value),
            activity: parseInt(dom.personalityInputs.activity.value),
            expressiveness: parseInt(dom.personalityInputs.expressiveness.value),
        };
        const mbtiResult = calculateMbti(sliderValues, personality);
        const description = mbtiDescriptions[mbtiResult] || '説明文が見つかりませんでした。';
        dom.mbtiResultText.innerHTML = `この人の性格タイプは <strong>${mbtiResult}</strong> と診断されました。<br>${description}`;
        dom.mbtiResultArea.style.display = 'block';
    });

    dom.mbtiDiagModeBtn.addEventListener('click', () => {
        dom.mbtiDiagnosisView.style.display = 'block';
        dom.mbtiManualView.style.display = 'none';
        dom.mbtiDiagModeBtn.classList.add('active');
        dom.mbtiManualModeBtn.classList.remove('active');
    });

    dom.mbtiManualModeBtn.addEventListener('click', () => {
        dom.mbtiDiagnosisView.style.display = 'none';
        dom.mbtiManualView.style.display = 'block';
        dom.mbtiDiagModeBtn.classList.remove('active');
        dom.mbtiManualModeBtn.classList.add('active');
    });

    dom.addConsultationButton.addEventListener('click', () => createConsultation());
    setupConsultationHandlers();

    setupFormHandlers();
    setupDailyReport();
}
