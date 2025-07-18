// emotionLabel.js - 感情ラベル関連処理

import { addReportChange } from './reportUtils.js'

let drawTable = null
export const specialRelations = ['恋人', '親友', '家族']

export const EmotionNormal = Object.freeze({
  DISLIKE_MAYBE: '嫌いかも',
  NONE: 'なし',
  INTEREST: '気になる',
  LIKE_MAYBE: '好きかも',
  AWKWARD: '気まずい'
})

export const EmotionSpecial = Object.freeze({
  DISLIKE: '嫌い',
  NORMAL: '普通',
  LIKE: '好き',
  LOVE: '大好き',
  AWKWARD: '気まずい'
})

// テーブルを読み込む
export async function loadEmotionLabelTable() {
  const res = await fetch('/data/emotion_label_draw.json')
  drawTable = await res.json()
}

const moodText = {
  '2': 'とてもポジティブ',
  '1': 'ポジティブ',
  '0': '普通',
  '-1': 'ネガティブ',
  '-2': 'とてもネガティブ'
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

export function getEmotionLabel(state, from, to) {
  const rec = state.emotions.find(e => e.from === from && e.to === to)
  return rec ? rec.label : null
}

function setEmotionLabel(emotions, from, to, label) {
  const next = [...emotions]
  const idx = next.findIndex(e => e.from === from && e.to === to)
  if (idx >= 0) next[idx] = { from, to, label }
  else next.push({ from, to, label })
  return next
}

function initialEmotionLabel(relLabel, affection) {
  if (specialRelations.includes(relLabel)) {
    if (affection < -50) return EmotionSpecial.DISLIKE
    if (affection <= 30) return EmotionSpecial.NORMAL
    if (affection <= 69) return EmotionSpecial.LIKE
    return EmotionSpecial.LOVE
  } else {
    if (affection < -50) return EmotionNormal.DISLIKE_MAYBE
    if (relLabel === '友達') {
      if (affection <= 15) return EmotionNormal.NONE
      if (affection <= 59) return EmotionNormal.INTEREST
      return EmotionNormal.LIKE_MAYBE
    } else {
      if (affection <= 10) return EmotionNormal.NONE
      return EmotionNormal.INTEREST
    }
  }
}

function ensureEmotionRecord(state, emotions, from, to) {
  if (getEmotionLabel({ ...state, emotions }, from, to)) return emotions
  const rel = getRelationLabel(state, from, to)
  const aff = getAffection(state, from, to)
  const label = initialEmotionLabel(rel, aff)
  return setEmotionLabel(emotions, from, to, label)
}

// 感情ラベル変化抽選
export function drawEmotionChange(state, emotions, from, to, mood, reports = {}) {
  if (!drawTable) return { emotions, log: null, reports }
  let next = ensureEmotionRecord(state, emotions, from, to)
  const relation = getRelationLabel(state, from, to)
  const current = getEmotionLabel({ ...state, emotions: next }, from, to)
  const tableRoot = specialRelations.includes(relation) ? drawTable.special_relationship : drawTable.normal_relationship
  const key = (specialRelations.includes(relation) ? '特殊_' : '通常_') + current
  const moodWeights = tableRoot[key]?.[moodText[String(mood)]]
  if (!moodWeights) return { emotions: next, log: null, reports }
  let total = 0
  Object.values(moodWeights).forEach(v => { total += v })
  let rnd = Math.random() * total
  let result = current
  for (const [label, weight] of Object.entries(moodWeights)) {
    rnd -= weight
    if (rnd < 0) { result = label; break }
  }
  if (result !== '変化なし' && result !== current) {
    next = setEmotionLabel(next, from, to, result)
    const fromName = state.characters.find(c => c.id === from)?.name || from
    const toName = state.characters.find(c => c.id === to)?.name || to
    const log = `${fromName}→${toName}の印象が「${result}」に変化しました。`
    reports = addReportChange(reports, `${fromName}→${toName}の印象「${current}」→「${result}」`)
    return { emotions: next, log, reports }
  }
  return { emotions: next, log: null, reports }
}
