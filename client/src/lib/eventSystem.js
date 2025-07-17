// eventSystem.js - イベント発生処理
import { drawMood, loadMoodTables } from './mood.js'
import { drawEmotionChange, loadEmotionLabelTable } from './emotionLabel.js'

// テーブルを事前読み込み
loadMoodTables()
loadEmotionLabelTable()

// イベント種別ごとの基本好感度変化量
const baseAffection = {
  '挨拶': 1,
  '雑談': 2,
  '思い出し会話': 3,
  '二人きりの時間': 4,
}

// ムードによる好感度補正値
const moodAffectionModifier = {
  2: 3,
  1: 2,
  0: 0,
  '-1': -3,
  '-2': -5,
}

// キャラクター2名をランダムに選ぶ
function getRandomPair(characters) {
  if (!characters || characters.length < 2) return null
  const idx1 = Math.floor(Math.random() * characters.length)
  let idx2 = idx1
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * characters.length)
  }
  return [characters[idx1], characters[idx2]]
}

// 好感度を更新するヘルパー
function updateAffection(list, from, to, delta) {
  const next = [...list]
  const idx = next.findIndex(a => a.from === from && a.to === to)
  if (idx >= 0) {
    const score = Math.max(-100, Math.min(100, next[idx].score + delta))
    next[idx] = { ...next[idx], score }
  } else {
    const score = Math.max(-100, Math.min(100, delta))
    next.push({ from, to, score })
  }
  return next
}


// ランダムイベントを発生させるメイン関数
// setState: React の状態更新関数
// addLog: ログ追加用関数
export function triggerRandomEvent(setState, addLog) {
  let eventInfo = null
  setState(prev => {
    const pair = getRandomPair(prev.characters)
    if (!pair) return prev
    const [a, b] = pair

    const types = ['挨拶', '雑談', '思い出し会話', '二人きりの時間']
    const type = types[Math.floor(Math.random() * types.length)]

    let desc = ''
    switch (type) {
      case '挨拶':
        desc = `${a.name}と${b.name}が軽く挨拶を交わした。`
        break
      case '雑談':
        desc = `${a.name}と${b.name}が楽しそうに雑談している。`
        break
      case '思い出し会話':
        desc = `${a.name}と${b.name}が昔の出来事を思い出して語り合っている。`
        break
      case '二人きりの時間':
        desc = `${a.name}と${b.name}が静かに二人きりの時間を過ごしている。`
        break
    }

    const mood = drawMood(prev, a.id, b.id)
    const base = baseAffection[type] || 0
    const delta = base + (moodAffectionModifier[mood] || 0)

    let affections = updateAffection(prev.affections, a.id, b.id, delta)
    affections = updateAffection(affections, b.id, a.id, delta)
    let emotions = prev.emotions || []
    const logs = []

    let result = drawEmotionChange(prev, emotions, a.id, b.id, mood)
    emotions = result.emotions
    if (result.log) logs.push(result.log)
    result = drawEmotionChange(prev, emotions, b.id, a.id, mood)
    emotions = result.emotions
    if (result.log) logs.push(result.log)

    eventInfo = { a, b, desc, delta, logs }
    return { ...prev, affections, emotions }
  })

  // state 更新後にログを追加
  if (!eventInfo) return
  const { a, b, desc, delta, logs } = eventInfo
  addLog(desc)
  if (delta !== 0) {
    const verb = delta > 0 ? '上昇しました' : '下降しました'
    addLog(`${a.name}→${b.name}の好感度が${verb}`, 'SYSTEM')
    addLog(`${b.name}→${a.name}の好感度が${verb}`, 'SYSTEM')
  } else {
    addLog(`${a.name}と${b.name}の好感度に変化はありません`, 'SYSTEM')
  }

  logs.forEach(l => addLog(l, 'SYSTEM'))
}

