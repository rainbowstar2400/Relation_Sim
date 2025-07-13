import { dom } from './dom-cache.js';
import { state, defaultAffections, mbtiDescriptions } from './state.js';
import { calculateMbti } from './mbti-diagnosis.js';
import { renderCharacters, renderManagementList } from './character-render.js';
import { renderRelationshipEditor } from './relationship-editor.js';
import { switchView, resetFormState, alignAllSliderTicks } from './view-switcher.js';
import { saveState } from './storage.js';
import { addLog } from './event-log.js';

export function setupFormHandlers() {
    dom.addCharacterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const isDiagMode = dom.mbtiDiagModeBtn.classList.contains('active');
        const personality = {
            social: parseInt(dom.personalityInputs.social.value),
            kindness: parseInt(dom.personalityInputs.kindness.value),
            stubbornness: parseInt(dom.personalityInputs.stubbornness.value),
            activity: parseInt(dom.personalityInputs.activity.value),
            expressiveness: parseInt(dom.personalityInputs.expressiveness.value),
        };
        let mbtiSliderValues = [];
        let mbtiResult;
        if (isDiagMode) {
            for (let i = 1; i <= 16; i++) {
                mbtiSliderValues.push(parseInt(dom.mbtiInputs[`q${i}`].value));
            }
            mbtiResult = calculateMbti(mbtiSliderValues, personality);
        } else {
            mbtiResult = dom.mbtiManualSelect.value;
            mbtiSliderValues = [];
        }
        const talkStyle = {
            preset: document.querySelector('input[name="talk-preset"]:checked').value,
            first_person: dom.talkFirstPersonInput.value,
            suffix: dom.talkSuffixInput.value,
        };
        const activityPatternValue = document.querySelector('input[name="activity-pattern"]:checked').value;
        const interestsValue = dom.interestsInput.value.split(',').map(i => i.trim()).filter(i => i);

        let characterId;
        if (state.currentlyEditingId) {
            characterId = state.currentlyEditingId;
            const charToUpdate = state.characters.find(char => char.id === characterId);
            if (charToUpdate) {
                charToUpdate.name = dom.charNameInput.value;
                charToUpdate.personality = personality;
                charToUpdate.mbti = mbtiResult;
                charToUpdate.mbti_slider = mbtiSliderValues;
                charToUpdate.talk_style = talkStyle;
                charToUpdate.activityPattern = activityPatternValue;
                charToUpdate.interests = interestsValue;
            }
            addLog(`キャラクター「${dom.charNameInput.value}」を更新しました。`);
            state.relationships = state.relationships.filter(r => !r.pair.includes(characterId));
            state.nicknames = state.nicknames.filter(n => n.from !== characterId && n.to !== characterId);
            state.affections = state.affections.filter(a => a.from !== characterId && a.to !== characterId);
        } else {
            characterId = 'char_' + Date.now();
            state.characters.push({
                id: characterId,
                name: dom.charNameInput.value,
                personality,
                mbti: mbtiResult,
                mbti_slider: mbtiSliderValues,
                talk_style: talkStyle,
                activityPattern: activityPatternValue,
                interests: interestsValue,
            });
            addLog(`キャラクター「${dom.charNameInput.value}」を追加しました。`);
        }

        Object.keys(state.tempRelations).forEach(targetId => {
            const relData = state.tempRelations[targetId];
            if (relData.type !== 'なし') {
                state.relationships.push({ pair: [characterId, targetId].sort(), label: relData.type });
            }
            if (relData.nicknameTo) {
                state.nicknames.push({ from: characterId, to: targetId, nickname: relData.nicknameTo });
            }
            if (relData.nicknameFrom) {
                state.nicknames.push({ from: targetId, to: characterId, nickname: relData.nicknameFrom });
            }
            state.affections.push({ from: characterId, to: targetId, score: relData.affectionTo });
            state.affections.push({ from: targetId, to: characterId, score: relData.affectionFrom });
        });

        renderCharacters();
        renderManagementList();
        saveState(state);
        switchView('main');
    });

    for (const key in dom.personalityInputs) {
        dom.personalityInputs[key].addEventListener('input', (e) => {
            dom.personalityValues[key].textContent = e.target.value;
        });
    }

    dom.showAddFormButton.addEventListener('click', () => {
        state.currentlyEditingId = null;
        resetFormState();
        dom.formTitle.textContent = 'キャラクター追加フォーム';
        dom.submitButton.textContent = '追加する';
        dom.addCharacterForm.style.display = 'block';
        dom.showAddFormButton.style.display = 'none';
        dom.addCharacterForm.dataset.newId = 'char_' + Date.now();
        state.tempRelations = {};
        renderRelationshipEditor();
        requestAnimationFrame(alignAllSliderTicks);
    });

    dom.managementCharacterList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-button')) {
            const idToDelete = event.target.dataset.id;
            if (confirm('本当にこのキャラクターを削除しますか？')) {
                const target = state.characters.find(char => char.id === idToDelete);
                state.characters = state.characters.filter(char => char.id !== idToDelete);
                renderManagementList();
                renderCharacters();
                saveState(state);
                addLog(`キャラクター「${target ? target.name : idToDelete}」を削除しました。`);
            }
        } else if (event.target.classList.contains('edit-button')) {
            const idToEdit = event.target.dataset.id;
            const characterToEdit = state.characters.find(char => char.id === idToEdit);
            if (characterToEdit) {
                dom.formTitle.textContent = 'キャラクター編集';
                dom.submitButton.textContent = '更新する';
                state.currentlyEditingId = idToEdit;
                dom.charNameInput.value = characterToEdit.name;
                for (const key in dom.personalityInputs) {
                    dom.personalityInputs[key].value = characterToEdit.personality[key];
                    dom.personalityValues[key].textContent = characterToEdit.personality[key];
                }
                if (characterToEdit.mbti_slider && characterToEdit.mbti_slider.length === 16) {
                    for (let i = 0; i < 16; i++) {
                        dom.mbtiInputs[`q${i + 1}`].value = characterToEdit.mbti_slider[i];
                    }
                }
                if (characterToEdit.mbti) {
                    dom.mbtiManualSelect.value = characterToEdit.mbti;
                }
                document.querySelector(`input[name="talk-preset"][value="${characterToEdit.talk_style.preset}"]`).checked = true;
                dom.talkFirstPersonInput.value = characterToEdit.talk_style.first_person;
                dom.talkSuffixInput.value = characterToEdit.talk_style.suffix;
                document.querySelector(`input[name="activity-pattern"][value="${characterToEdit.activityPattern}"]`).checked = true;
                dom.addCharacterForm.style.display = 'block';
                dom.showAddFormButton.style.display = 'none';
                dom.interestsInput.value = characterToEdit.interests ? characterToEdit.interests.join(', ') : '';
                dom.addCharacterForm.scrollIntoView({ behavior: 'smooth' });
                requestAnimationFrame(alignAllSliderTicks);
            }
            state.tempRelations = {};
            const existingRelations = state.relationships.filter(r => r.pair.includes(idToEdit));
            existingRelations.forEach(rel => {
                const targetId = rel.pair.find(id => id !== idToEdit);
                const affectionTo = state.affections.find(a => a.from === idToEdit && a.to === targetId)?.score || 0;
                const affectionFrom = state.affections.find(a => a.from === targetId && a.to === idToEdit)?.score || 0;
                const nicknameTo = state.nicknames.find(n => n.from === idToEdit && n.to === targetId)?.nickname || '';
                const nicknameFrom = state.nicknames.find(n => n.from === targetId && n.to === idToEdit)?.nickname || '';
                state.tempRelations[targetId] = {
                    type: rel.label,
                    nicknameTo,
                    nicknameFrom,
                    affectionTo,
                    affectionFrom,
                };
            });
            renderRelationshipEditor();
            dom.addCharacterForm.scrollIntoView({ behavior: 'smooth' });
        }
    });

    dom.relationshipEditor.typeSelect.addEventListener('change', (event) => {
        const selectedType = event.target.value;
        const defaultValue = defaultAffections[selectedType] || 0;
        dom.relationshipEditor.affectionToOtherSlider.value = defaultValue;
        dom.relationshipEditor.affectionFromOtherSlider.value = defaultValue;
        dom.relationshipEditor.affectionToOtherValue.textContent = defaultValue;
        dom.relationshipEditor.affectionFromOtherValue.textContent = defaultValue;
    });

    dom.relationshipEditor.targetSelect.addEventListener('change', (event) => {
        const targetId = event.target.value;
        if (!targetId) return;
        const targetChar = state.characters.find(c => c.id === targetId);
        const currentChar = state.characters.find(c => c.id === state.currentlyEditingId);
        const existing = state.tempRelations[targetId];
        if (existing) {
            dom.relationshipEditor.typeSelect.value = existing.type;
            dom.relationshipEditor.nicknameToOtherInput.value = existing.nicknameTo;
            dom.relationshipEditor.nicknameFromOtherInput.value = existing.nicknameFrom;
            dom.relationshipEditor.affectionToOtherSlider.value = existing.affectionTo;
            dom.relationshipEditor.affectionFromOtherSlider.value = existing.affectionFrom;
            dom.relationshipEditor.affectionToOtherValue.textContent = existing.affectionTo;
            dom.relationshipEditor.affectionFromOtherValue.textContent = existing.affectionFrom;
        } else {
            dom.relationshipEditor.nicknameToOtherInput.value = targetChar ? targetChar.name : '';
            dom.relationshipEditor.nicknameFromOtherInput.value = currentChar ? currentChar.name : '';
            const defaultValue = defaultAffections[dom.relationshipEditor.typeSelect.value] || 0;
            dom.relationshipEditor.affectionToOtherSlider.value = defaultValue;
            dom.relationshipEditor.affectionFromOtherSlider.value = defaultValue;
            dom.relationshipEditor.affectionToOtherValue.textContent = defaultValue;
            dom.relationshipEditor.affectionFromOtherValue.textContent = defaultValue;
        }
    });

    dom.relationshipEditor.affectionToOtherSlider.addEventListener('input', (e) => {
        dom.relationshipEditor.affectionToOtherValue.textContent = e.target.value;
    });
    dom.relationshipEditor.affectionFromOtherSlider.addEventListener('input', (e) => {
        dom.relationshipEditor.affectionFromOtherValue.textContent = e.target.value;
    });

    dom.relationshipEditor.saveButton.addEventListener('click', () => {
        const targetId = dom.relationshipEditor.targetSelect.value;
        if (!targetId) {
            alert('相手を選択してください。');
            return;
        }
        state.tempRelations[targetId] = {
            type: dom.relationshipEditor.typeSelect.value,
            nicknameTo: dom.relationshipEditor.nicknameToOtherInput.value,
            nicknameFrom: dom.relationshipEditor.nicknameFromOtherInput.value,
            affectionTo: parseInt(dom.relationshipEditor.affectionToOtherSlider.value),
            affectionFrom: parseInt(dom.relationshipEditor.affectionFromOtherSlider.value)
        };
        alert(`「${state.characters.find(c => c.id === targetId).name}」との関係を一時保存しました。`);
        renderRelationshipEditor();
    });

    dom.relationshipEditor.displayList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-relation-button')) {
            const targetId = e.target.dataset.id;
            const data = state.tempRelations[targetId];
            if (data) {
                if (!Array.from(dom.relationshipEditor.targetSelect.options).some(o => o.value === targetId)) {
                    const option = document.createElement('option');
                    option.value = targetId;
                    option.textContent = state.characters.find(c => c.id === targetId)?.name || '';
                    dom.relationshipEditor.targetSelect.appendChild(option);
                }
                dom.relationshipEditor.targetSelect.value = targetId;
                dom.relationshipEditor.typeSelect.value = data.type;
                dom.relationshipEditor.nicknameToOtherInput.value = data.nicknameTo;
                dom.relationshipEditor.nicknameFromOtherInput.value = data.nicknameFrom;
                dom.relationshipEditor.affectionToOtherSlider.value = data.affectionTo;
                dom.relationshipEditor.affectionFromOtherSlider.value = data.affectionFrom;
                dom.relationshipEditor.affectionToOtherValue.textContent = data.affectionTo;
                dom.relationshipEditor.affectionFromOtherValue.textContent = data.affectionFrom;
            }
        } else if (e.target.classList.contains('delete-relation-button')) {
            const targetId = e.target.dataset.id;
            if (confirm('この関係を削除してもよろしいですか？')) {
                delete state.tempRelations[targetId];
                renderRelationshipEditor();
            }
        }
    });

    window.addEventListener('resize', alignAllSliderTicks);
}
