export const dom = {};

export function initDomCache() {
    // メイン画面の要素
    dom.mainViewSections = document.querySelectorAll('.character-observer, .consultation-area, .log-display');
    dom.timeElement = document.getElementById('time');
    dom.dateElement = document.getElementById('date');
    dom.characterListElement = document.querySelector('.character-list');
    dom.consultationList = document.getElementById('consultation-list');
    dom.addConsultationButton = document.getElementById('add-consultation-button');
    dom.consultationPopup = document.getElementById('consultation-popup');
    dom.consultationQuestion = document.getElementById('consultation-question');
    dom.consultationAnswerArea = document.getElementById('consultation-answer-area');
    dom.consultationSendButton = document.getElementById('consultation-send-button');
    dom.consultationCloseButton = document.getElementById('consultation-close-button');
    dom.logContent = document.getElementById('log-content');
    dom.mbtiInputs = {};
    for (let i = 1; i <= 16; i++) {
        dom.mbtiInputs[`q${i}`] = document.getElementById(`mbti-q${i}`);
    }
    dom.mbtiManualSelect = document.getElementById('mbti-manual-select');

    // 管理室画面の要素
    dom.managementRoomView = document.getElementById('management-room');
    dom.backToMainButton = document.getElementById('back-to-main-button');
    dom.managementButton = document.getElementById('management-button');
    dom.dailyReportButton = document.getElementById('daily-report-button');
    dom.devEventButton = document.getElementById('dev-event-button');
    dom.saveButton = document.getElementById('save-button');
    dom.loadButton = document.getElementById('load-button');
    dom.loadFileInput = document.getElementById('load-file-input');

    dom.addCharacterForm = document.getElementById('add-character-form');
    dom.charNameInput = document.getElementById('char-name');
    dom.managementCharacterList = document.getElementById('character-list-in-mgmt');
    dom.formTitle = document.getElementById('form-title');
    dom.submitButton = document.querySelector('#add-character-form button[type="submit"]');
    dom.showAddFormButton = document.getElementById('show-add-form-button');

    dom.relationshipEditor = {
        targetSelect: document.getElementById('relationship-target-select'),
        typeSelect: document.getElementById('relationship-type-select'),
        affectionToOtherSlider: document.getElementById('affection-to-other'),
        affectionToOtherValue: document.getElementById('affection-to-other-value'),
        affectionFromOtherSlider: document.getElementById('affection-from-other'),
        affectionFromOtherValue: document.getElementById('affection-from-other-value'),
        nicknameToOtherInput: document.getElementById('nickname-to-other-input'),
        nicknameFromOtherInput: document.getElementById('nickname-from-other-input'),
        saveButton: document.getElementById('save-relationship-button'),
        displayList: document.getElementById('configured-relationships-list')
    };

    dom.talkFirstPersonInput = document.getElementById('talk-first-person');
    dom.talkSuffixInput = document.getElementById('talk-suffix');
    dom.interestsInput = document.getElementById('interests');

    dom.personalityInputs = {
        social: document.getElementById('social'),
        kindness: document.getElementById('kindness'),
        stubbornness: document.getElementById('stubbornness'),
        activity: document.getElementById('activity'),
        expressiveness: document.getElementById('expressiveness'),
    };

    dom.personalityValues = {
        social: document.getElementById('social-value'),
        kindness: document.getElementById('kindness-value'),
        stubbornness: document.getElementById('stubbornness-value'),
        activity: document.getElementById('activity-value'),
        expressiveness: document.getElementById('expressiveness-value'),
    };

    // MBTI関連
    dom.mbtiDiagModeBtn = document.getElementById('mbti-diag-mode-btn');
    dom.mbtiManualModeBtn = document.getElementById('mbti-manual-mode-btn');
    dom.mbtiDiagnosisView = document.getElementById('mbti-diagnosis-view');
    dom.mbtiManualView = document.getElementById('mbti-manual-view');
    dom.startDiagButton = document.getElementById('start-diag-button');
    dom.executeDiagButton = document.getElementById('execute-diag-button');
    dom.mbtiQuestionsArea = document.getElementById('mbti-questions-area');
    dom.mbtiResultArea = document.getElementById('mbti-result-area');
    dom.mbtiResultText = document.getElementById('mbti-result-text');

    // ステータス画面要素
    dom.statusView = document.getElementById('character-status-view');
    dom.statusBackButton = document.getElementById('back-to-main-from-status');
    dom.statusName = document.getElementById('status-name');
    dom.statusMbti = document.getElementById('status-mbti');
    dom.statusTalkPreset = document.getElementById('status-talk-preset');
    dom.statusFirstPerson = document.getElementById('status-first-person');
    dom.statusSuffix = document.getElementById('status-suffix');
    dom.statusCondition = document.getElementById('status-condition');
    dom.statusPersonality = {
        social: document.getElementById('status-social'),
        kindness: document.getElementById('status-kindness'),
        stubbornness: document.getElementById('status-stubbornness'),
        activity: document.getElementById('status-activity'),
        expressiveness: document.getElementById('status-expressiveness'),
    };
    dom.statusRelations = document.getElementById('status-relations');
    dom.statusEvents = document.getElementById('status-events');

    // 日報画面要素
    dom.dailyReportView = document.getElementById('daily-report-view');
    dom.dailyReportList = document.getElementById('daily-report-list');
    dom.reportDateInput = document.getElementById('report-date');
    dom.reportBackButton = document.getElementById('back-to-main-from-report');
}
