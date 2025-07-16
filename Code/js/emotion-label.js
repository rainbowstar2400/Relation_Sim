import { state } from './state.js';
import { appendLog } from './logger.js';

let drawTable = null;

export async function loadEmotionLabelTable() {
    const res = await fetch('./data/emotion_label_draw.json');
    drawTable = await res.json();
}

export const specialRelations = ['恋人', '親友', '家族'];

export const EmotionNormal = Object.freeze({
    DISLIKE_MAYBE: '嫌いかも',
    NONE: 'なし',
    INTEREST: '気になる',
    LIKE_MAYBE: '好きかも',
    AWKWARD: '気まずい'
});

export const EmotionSpecial = Object.freeze({
    DISLIKE: '嫌い',
    NORMAL: '普通',
    LIKE: '好き',
    LOVE: '大好き',
    AWKWARD: '気まずい'
});

const moodText = {
    '2': 'とてもポジティブ',
    '1': 'ポジティブ',
    '0': '普通',
    '-1': 'ネガティブ',
    '-2': 'とてもネガティブ'
};

function getAffection(from, to) {
    return state.affections.find(a => a.from === from && a.to === to)?.score || 0;
}

function getRelationLabel(idA, idB) {
    const pair = [idA, idB].sort();
    const rel = state.relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1]);
    return rel ? rel.label : '友達';
}

export function getEmotionLabel(from, to) {
    return state.emotions.find(e => e.from === from && e.to === to)?.label || null;
}

function setEmotionLabel(from, to, label) {
    let rec = state.emotions.find(e => e.from === from && e.to === to);
    if (!rec) {
        rec = { from, to, label };
        state.emotions.push(rec);
    } else {
        rec.label = label;
    }
}

function initialEmotionLabel(relLabel, affection) {
    if (specialRelations.includes(relLabel)) {
        if (affection < -50) return EmotionSpecial.DISLIKE;
        if (affection <= 30) return EmotionSpecial.NORMAL;
        if (affection <= 69) return EmotionSpecial.LIKE;
        return EmotionSpecial.LOVE;
    } else { // 認知・友達など
        if (affection < -50) return EmotionNormal.DISLIKE_MAYBE;
        if (relLabel === '友達') {
            if (affection <= 15) return EmotionNormal.NONE;
            if (affection <= 59) return EmotionNormal.INTEREST;
            return EmotionNormal.LIKE_MAYBE;
        } else { // なし・認知
            if (affection <= 10) return EmotionNormal.NONE;
            return EmotionNormal.INTEREST;
        }
    }
}

function ensureEmotionRecord(from, to) {
    if (getEmotionLabel(from, to)) return;
    const rel = getRelationLabel(from, to);
    const aff = getAffection(from, to);
    const label = initialEmotionLabel(rel, aff);
    setEmotionLabel(from, to, label);
}

export function drawEmotionChange(from, to, mood) {
    if (!drawTable) return;
    ensureEmotionRecord(from, to);
    const relation = getRelationLabel(from, to);
    const current = getEmotionLabel(from, to);
    const tableRoot = specialRelations.includes(relation) ? drawTable.special_relationship : drawTable.normal_relationship;
    const key = (specialRelations.includes(relation) ? '特殊_' : '通常_') + current;
    const moodWeights = tableRoot[key]?.[moodText[String(mood)]];
    if (!moodWeights) return;
    let total = 0;
    Object.values(moodWeights).forEach(v => total += v);
    let rnd = Math.random() * total;
    let result = current;
    for (const [label, weight] of Object.entries(moodWeights)) {
        rnd -= weight;
        if (rnd < 0) { result = label; break; }
    }
    if (result !== '変化なし' && result !== current) {
        setEmotionLabel(from, to, result);
        const fromName = state.characters.find(c => c.id === from)?.name || from;
        const toName = state.characters.find(c => c.id === to)?.name || to;
        appendLog(`${fromName}→${toName}の印象が「${result}」に変化しました。`, 'SYSTEM');
    }
}
