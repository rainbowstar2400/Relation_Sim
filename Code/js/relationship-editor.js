import { dom } from './dom-cache.js';
import { state } from './state.js';

export function renderRelationshipEditor() {
    const targetSelect = dom.relationshipEditor.targetSelect;
    targetSelect.innerHTML = '<option value="">--選択してください--</option>';
    const existingIds = Object.keys(state.tempRelations);
    const otherCharacters = state.characters.filter(c => c.id !== state.currentlyEditingId && !existingIds.includes(c.id));
    otherCharacters.forEach(char => {
        const option = document.createElement('option');
        option.value = char.id;
        option.textContent = char.name;
        targetSelect.appendChild(option);
    });
    updateConfiguredRelationshipsList();
    clearRelationshipInputs();
}

export function updateConfiguredRelationshipsList() {
    const displayList = dom.relationshipEditor.displayList;
    displayList.innerHTML = '';
    const configuredIds = Object.keys(state.tempRelations);
    if (configuredIds.length === 0) {
        displayList.innerHTML = '<p>設定済みの関係はありません。</p>';
    } else {
        const ul = document.createElement('ul');
        ul.classList.add('configured-relationship-list');
        configuredIds.forEach(id => {
            const otherChar = state.characters.find(c => c.id === id);
            const relData = state.tempRelations[id];
            if (otherChar) {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${otherChar.name}</strong>: ${relData.type}<br> (好感度: ${relData.affectionTo} / ${relData.affectionFrom} | 呼び方: ${relData.nicknameTo} / 呼ばれ方: ${relData.nicknameFrom})`;
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.textContent = '関係を編集';
                editBtn.classList.add('edit-relation-button');
                editBtn.dataset.id = id;
                li.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.textContent = '削除';
                deleteBtn.classList.add('delete-relation-button');
                deleteBtn.dataset.id = id;
                li.appendChild(deleteBtn);
                ul.appendChild(li);
            }
        });
        displayList.appendChild(ul);
    }
}

export function clearRelationshipInputs() {
    dom.relationshipEditor.targetSelect.value = '';
    dom.relationshipEditor.typeSelect.value = 'なし';
    dom.relationshipEditor.nicknameToOtherInput.value = '';
    dom.relationshipEditor.nicknameFromOtherInput.value = '';
}
