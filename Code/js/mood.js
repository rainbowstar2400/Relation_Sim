// 雰囲気(mood)抽選関連の処理
import { state } from './state.js';

let initialDistribution = {};
let relationModifier = {};
let emotionModifier = {};

export async function loadMoodTables() {
    const [distRes, relRes, emoRes] = await Promise.all([
        fetch('../data/initial_distribution_table.json'),
        fetch('../data/relation_modifier_table.json'),
        fetch('../data/emotion_modifier_table.json'),
    ]);
    initialDistribution = await distRes.json();
    relationModifier = await relRes.json();
    emotionModifier = await emoRes.json();
}

function getAffection(from, to) {
    return state.affections.find(a => a.from === from && a.to === to)?.score || 0;
}

function getRelationLabel(idA, idB) {
    const pair = [idA, idB].sort();
    const rel = state.relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1]);
    return rel ? rel.label : '友達'; // デフォルトは友達相当
}

function getModifier(table, label) {
    return table[label] || table['友達'] || { '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1 };
}

export function drawMood(idA, idB) {
    const affAtoB = getAffection(idA, idB);
    const affBtoA = getAffection(idB, idA);
    const affectionAvg = Math.round((affAtoB + affBtoA) / 2);

    let baseMood = 0;
    if (affectionAvg <= -30) {
        baseMood = -2;
    } else if (affectionAvg < 0) {
        baseMood = -1;
    } else if (affectionAvg <= 30) {
        baseMood = 0;
    } else if (affectionAvg <= 60) {
        baseMood = 1;
    } else {
        baseMood = 2;
    }

    const base = initialDistribution[String(baseMood)];
    if (!base) return 0;

    const relationCoeff = getModifier(relationModifier, getRelationLabel(idA, idB));
    // 感情ラベルは未実装のため仮に 'なし' を使用
    const emotionCoeffA = getModifier(emotionModifier, 'なし');
    const emotionCoeffB = getModifier(emotionModifier, 'なし');

    const corrected = {};
    let total = 0;
    for (let m = -2; m <= 2; m++) {
        const key = String(m);
        const weight = (base[key] || 0)
            * (relationCoeff[key] || 1)
            * (emotionCoeffA[key] || 1)
            * (emotionCoeffB[key] || 1);
        corrected[key] = weight;
        total += weight;
    }

    if (total <= 0) return 0;
    let rnd = Math.random() * total;
    for (let m = -2; m <= 2; m++) {
        rnd -= corrected[String(m)];
        if (rnd < 0) return m;
    }
    return 0;
}
