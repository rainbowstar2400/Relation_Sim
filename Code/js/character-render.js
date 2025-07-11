import { dom } from './dom-cache.js';
import { state } from './state.js';

export function renderCharacters() {
    dom.characterListElement.innerHTML = '';
    state.characters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.textContent = char.name;
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
