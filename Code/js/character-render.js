import { dom } from './dom-cache.js';
import { state } from './state.js';
import { getEmotionLabel } from './emotion-label.js';
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

function affectionToPercent(score) {
    const clamped = Math.max(-100, Math.min(100, score));
    return (clamped + 100) / 2;
}

function createDirectionBlock(labelText, score, nickname) {
    const div = document.createElement('div');
    div.className = 'relation-direction';

    const label = document.createElement('p');
    label.textContent = `[${labelText}]`;
    div.appendChild(label);

    const affectionP = document.createElement('p');
    affectionP.textContent = '好感度: ';
    const wrapper = document.createElement('span');
    wrapper.className = 'affection-wrapper';
    const prog = document.createElement('progress');
    prog.max = 100;
    prog.value = affectionToPercent(score);
    wrapper.appendChild(prog);
    affectionP.appendChild(wrapper);
    div.appendChild(affectionP);

    const nickP = document.createElement('p');
    nickP.textContent = `呼び方：${nickname ? `「${nickname}」` : '―'}`;
    div.appendChild(nickP);

    return div;
}

function showCharacterStatus(char) {
    dom.statusName.textContent = char.name;
    dom.statusMbti.textContent = char.mbti;
    const style = char.talk_style;
    dom.statusTalkPreset.textContent = style.preset;
    dom.statusFirstPerson.textContent = style.first_person;
    dom.statusSuffix.textContent = style.suffix;
    dom.statusCondition.textContent = '活動中';
    dom.statusActivityPattern.textContent = char.activityPattern || '不明';
    const trustRec = state.trusts.find(t => t.id === char.id);
    dom.statusTrust.textContent = trustRec ? trustRec.score : 50;
    const p = char.personality;
    dom.statusPersonality.social.textContent = levelToBars(p.social);
    dom.statusPersonality.kindness.textContent = levelToBars(p.kindness);
    dom.statusPersonality.stubbornness.textContent = levelToBars(p.stubbornness);
    dom.statusPersonality.activity.textContent = levelToBars(p.activity);
    dom.statusPersonality.expressiveness.textContent = levelToBars(p.expressiveness);

    const relations = state.characters
        .filter(c => c.id !== char.id)
        .map(other => {
            const pair = [char.id, other.id].sort();
            const relRec = state.relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1]);
            const label = relRec ? relRec.label : 'なし';
            const affectionTo = state.affections.find(a => a.from === char.id && a.to === other.id)?.score || 0;
            const affectionFrom = state.affections.find(a => a.from === other.id && a.to === char.id)?.score || 0;
            const nicknameTo = state.nicknames.find(n => n.from === char.id && n.to === other.id)?.nickname || '';
            const nicknameFrom = state.nicknames.find(n => n.from === other.id && n.to === char.id)?.nickname || '';
            const emotion = getEmotionLabel(char.id, other.id) || 'なし';
            return { other, label, affectionTo, affectionFrom, nicknameTo, nicknameFrom, emotion };
        })
        .sort((a, b) => (b.affectionTo + b.affectionFrom) - (a.affectionTo + a.affectionFrom));

    dom.statusRelations.innerHTML = '';
    if (relations.length === 0) {
        const li = document.createElement('li');
        li.textContent = '関係なし';
        dom.statusRelations.appendChild(li);
    } else {
        relations.forEach(rel => {
            const otherName = rel.other.name;
            const li = document.createElement('li');
            li.className = 'relation-item';

            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.innerHTML = `<span class="other-name">${otherName}</span> - ${rel.label} | 印象: ${rel.emotion}`;
            details.appendChild(summary);

            const body = document.createElement('div');
            body.className = 'detail-body';
            body.appendChild(createDirectionBlock(`${char.name} → ${otherName}`, rel.affectionTo, rel.nicknameTo));
            body.appendChild(createDirectionBlock(`${otherName} → ${char.name}`, rel.affectionFrom, rel.nicknameFrom));
            details.appendChild(body);

            li.appendChild(details);
            dom.statusRelations.appendChild(li);
        });
    }

    dom.statusEvents.textContent = '';
    switchView('status');
}
