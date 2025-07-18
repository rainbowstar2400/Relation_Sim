// eventSystem.js - イベント発生処理
import { drawMood, loadMoodTables } from './mood.js'
import { drawEmotionChange, loadEmotionLabelTable } from './emotionLabel.js'
import { addReportEvent, addReportChange } from './reportUtils.js'
import { getTimeWeight } from './timeUtils.js'

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
  const active = characters.filter(
    c => c.condition !== '就寝中' && c.condition !== '風邪'
  )
  if (active.length < 2) return null
  const idx1 = Math.floor(Math.random() * active.length)
  let idx2 = idx1
  while (idx2 === idx1) {
    idx2 = Math.floor(Math.random() * active.length)
  }
  return [active[idx1], active[idx2]]
}

// 好感度を更新するヘルパー
function updateAffection(list, from, to, delta, ts = null) {
  const next = [...list]
  const idx = next.findIndex(a => a.from === from && a.to === to)
  if (idx >= 0) {
    const score = Math.max(-100, Math.min(100, next[idx].score + delta))
    const last = ts ?? next[idx].lastInteracted
    next[idx] = { ...next[idx], score, lastInteracted: last }
  } else {
    const score = Math.max(-100, Math.min(100, delta))
    next.push({ from, to, score, lastInteracted: ts ?? Date.now() })
  }
  return next
}


// ランダムイベントを発生させるメイン関数
// setState: React の状態更新関数
// addLog: ログ追加用関数
export function triggerRandomEvent(state, setState, addLog) {
  const pair = getRandomPair(state.characters)
  if (!pair) return
  const [a, b] = pair
  const weightA = getTimeWeight(a.activityPattern)
  const weightB = getTimeWeight(b.activityPattern)
  const chance = Math.min(1, weightA * weightB)
  if (Math.random() > chance) return

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

  const mood = drawMood(state, a.id, b.id)
  const base = baseAffection[type] || 0
  const delta = base + (moodAffectionModifier[mood] || 0)

  const now = Date.now()
  const eventLogId = addLog(desc, 'EVENT', desc)
  let changeLogIdA = null
  let changeLogIdB = null
  if (delta !== 0) {
    const verb = delta > 0 ? '上昇しました' : '下降しました'
    changeLogIdA = addLog(`${a.name}→${b.name}の好感度が${verb}`, 'SYSTEM')
    changeLogIdB = addLog(`${b.name}→${a.name}の好感度が${verb}`, 'SYSTEM')
  } else {
    addLog(`${a.name}と${b.name}の好感度に変化はありません`, 'SYSTEM')
  }

  let emotionLogs = []
  setState(prev => {
    let affections = updateAffection(prev.affections, a.id, b.id, delta, now)
    affections = updateAffection(affections, b.id, a.id, delta, now)
    let emotions = prev.emotions || []
    let reports = prev.reports || {}

    let result = drawEmotionChange(prev, emotions, a.id, b.id, mood, reports)
    emotions = result.emotions
    reports = result.reports
    if (result.log) emotionLogs.push(result.log)
    result = drawEmotionChange(prev, emotions, b.id, a.id, mood, reports)
    emotions = result.emotions
    reports = result.reports
    if (result.log) emotionLogs.push(result.log)

    reports = addReportEvent(reports, { timestamp: now, description: desc, logId: eventLogId })
    if (delta !== 0) {
      const verb = delta > 0 ? '上昇しました' : '下降しました'
      reports = addReportChange(reports, `${a.name}→${b.name}の好感度が${verb}`, changeLogIdA)
      reports = addReportChange(reports, `${b.name}→${a.name}の好感度が${verb}`, changeLogIdB)
    }

    return { ...prev, affections, emotions, reports }
  })

  emotionLogs.forEach(l => addLog(l, 'SYSTEM', l))
}

