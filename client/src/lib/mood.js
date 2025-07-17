// mood.js - 雰囲気(ムード)計算処理
import { getEmotionLabel, specialRelations } from './emotionLabel.js'

let initialDistribution = {}
let relationModifier = {}
let emotionModifier = {}
let emotionModifierSpecial = {}

// JSON テーブルを読み込む
export async function loadMoodTables() {
  const [distRes, relRes, emoRes, emoSpeRes] = await Promise.all([
    fetch('/data/initial_distribution_table.json'),
    fetch('/data/relation_modifier_table.json'),
    fetch('/data/emotion_modifier_table.json'),
    fetch('/data/emotion_modifier_table_special.json'),
  ])
  initialDistribution = await distRes.json()
  relationModifier = await relRes.json()
  emotionModifier = await emoRes.json()
  emotionModifierSpecial = await emoSpeRes.json()
}

function getAffection(state, from, to) {
  const rec = state.affections.find(a => a.from === from && a.to === to)
  return rec ? rec.score : 0
}

function getRelationLabel(state, idA, idB) {
  const pair = [idA, idB].sort()
  const rel = state.relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
  return rel ? rel.label : '友達'
}

function getModifier(table, label) {
  return table[label] || table['友達'] || { '-2': 1, '-1': 1, '0': 1, '1': 1, '2': 1 }
}

// ムード値を計算 (-2 ~ 2)
export function drawMood(state, idA, idB) {
  const affAtoB = getAffection(state, idA, idB)
  const affBtoA = getAffection(state, idB, idA)
  const affectionAvg = Math.round((affAtoB + affBtoA) / 2)

  let baseMood = 0
  if (affectionAvg <= -30) baseMood = -2
  else if (affectionAvg < 0) baseMood = -1
  else if (affectionAvg <= 30) baseMood = 0
  else if (affectionAvg <= 60) baseMood = 1
  else baseMood = 2

  const base = initialDistribution[String(baseMood)]
  if (!base) return 0

  const relation = getRelationLabel(state, idA, idB)
  const relationCoeff = getModifier(relationModifier, relation)
  const isSpecial = specialRelations.includes(relation)
  const emotionTable = isSpecial ? emotionModifierSpecial : emotionModifier
  const labelA = getEmotionLabel(state, idA, idB) || 'なし'
  const labelB = getEmotionLabel(state, idB, idA) || 'なし'
  const emotionCoeffA = getModifier(emotionTable, labelA)
  const emotionCoeffB = getModifier(emotionTable, labelB)

  const corrected = {}
  let total = 0
  for (let m = -2; m <= 2; m++) {
    const key = String(m)
    const weight = (base[key] || 0) * (relationCoeff[key] || 1) * (emotionCoeffA[key] || 1) * (emotionCoeffB[key] || 1)
    corrected[key] = weight
    total += weight
  }
  if (total <= 0) return 0
  let rnd = Math.random() * total
  for (let m = -2; m <= 2; m++) {
    rnd -= corrected[String(m)]
    if (rnd < 0) return m
  }
  return 0
}
