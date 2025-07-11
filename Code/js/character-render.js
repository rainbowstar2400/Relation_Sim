import { dom } from './dom-cache.js';
import { state } from './state.js';
import { switchView } from './view-switcher.js';

export function renderCharacters() {
    dom.characterListElement.innerHTML = '';
    state.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.textContent = char.name;
        card.addEventListener('click', () => showCharacterStatus(char));
        dom.characterListElement.appendChild(card);
    });
}

export function renderManagementList() {
    dom.managementCharacterList.innerHTML = '';
    state.characters.forEach(char => {
        const listItem = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = char.name;
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'character-actions';
        const infoButton = document.createElement('button');
        infoButton.textContent = '情報';
        infoButton.dataset.id = char.id;
        const editButton = document.createElement('button');
        editButton.textContent = '編集';
        editButton.className = 'edit-button';
        editButton.dataset.id = char.id;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'delete-button';
        deleteButton.dataset.id = char.id;
        actionsDiv.appendChild(infoButton);
        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        listItem.appendChild(nameSpan);
        listItem.appendChild(actionsDiv);
        dom.managementCharacterList.appendChild(listItem);
    });
}

function levelToBars(level) {
    const filled = '■'.repeat(level);
    const empty = '□'.repeat(5 - level);
    return filled + empty;
}

function showCharacterStatus(char) {
    dom.statusName.textContent = char.name;
    dom.statusMbti.textContent = char.mbti;
    const style = char.talk_style;
    dom.statusTalkPreset.textContent = style.preset;
    dom.statusFirstPerson.textContent = style.first_person;
    dom.statusSuffix.textContent = style.suffix;
    dom.statusCondition.textContent = '活動中';
    const p = char.personality;
    dom.statusPersonality.social.textContent = levelToBars(p.social);
    dom.statusPersonality.kindness.textContent = levelToBars(p.kindness);
    dom.statusPersonality.stubbornness.textContent = levelToBars(p.stubbornness);
    dom.statusPersonality.activity.textContent = levelToBars(p.activity);
    dom.statusPersonality.expressiveness.textContent = levelToBars(p.expressiveness);

    const relations = state.relationships.filter(r => r.pair.includes(char.id));
    dom.statusRelations.innerHTML = '';
    if (relations.length === 0) {
        const li = document.createElement('li');
        li.textContent = '関係なし';
        dom.statusRelations.appendChild(li);
    } else {
        relations.forEach(rel => {
            const otherId = rel.pair.find(id => id !== char.id);
            const other = state.characters.find(c => c.id === otherId);
            const li = document.createElement('li');
            li.textContent = `${other ? other.name : otherId}: ${rel.label}`;
            dom.statusRelations.appendChild(li);
        });
    }

    dom.statusEvents.textContent = '';
    switchView('status');
}
