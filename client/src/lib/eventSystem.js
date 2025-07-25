// eventSystem.js - イベント発生処理
import { drawMood, loadMoodTables } from './mood.js'
import { drawEmotionChange, loadEmotionLabelTable, getEmotionLabel } from './emotionLabel.js'
import { addReportEvent, addReportChange } from './reportUtils.js'
import { getTimeWeight, getTimeSlot, getDateString } from './timeUtils.js'
import { generateConversation } from '../gpt/generateConversation.js'

// 初期化処理: ムードテーブルと感情ラベルテーブルの読み込み
export async function initEventSystem() {
  // 並列で読み込んだ後に完了を返す
  await Promise.all([
    loadMoodTables(),
    loadEmotionLabelTable()
  ])
}

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

// 関係変化イベントの発生確率
const FRIEND_EVENT_PROB = 0.05
const BEST_FRIEND_EVENT_PROB = 0.02

// 現在の関係ラベルを取得
function getRelationLabel(relationships, idA, idB) {
  const pair = [idA, idB].sort()
  const rec = relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
  return rec ? rec.label : 'なし'
}

// 関係ラベルを更新
function updateRelationship(list, idA, idB, label) {
  const pair = [idA, idB].sort()
  const next = [...list]
  const idx = next.findIndex(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
  if (idx >= 0) next[idx] = { pair, label }
  else next.push({ pair, label })
  return next
}

// 現在の好感度を取得
function getAffection(list, from, to) {
  const rec = list.find(a => a.from === from && a.to === to)
  return rec ? rec.score : 0
}

// 呼び方を取得
function getNickname(list, from, to) {
  const rec = list.find(n => n.from === from && n.to === to)
  return rec ? rec.nickname : ''
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
export async function triggerRandomEvent(state, setState, addLog, updateLog) {
  const pair = getRandomPair(state.characters)
  if (!pair) return
  const [a, b] = pair
  const weightA = getTimeWeight(a.activityPattern)
  const weightB = getTimeWeight(b.activityPattern)
  const chance = Math.min(1, weightA * weightB)
  if (Math.random() > chance) return

  const now = Date.now()
  const relation = getRelationLabel(state.relationships, a.id, b.id)
  const emotionAB = getEmotionLabel(state, a.id, b.id)
  const emotionBA = getEmotionLabel(state, b.id, a.id)
  const nickAB = getNickname(state.nicknames, a.id, b.id)
  const nickBA = getNickname(state.nicknames, b.id, a.id)
  const affAvg = (getAffection(state.affections, a.id, b.id) +
    getAffection(state.affections, b.id, a.id)) / 2

  // 親友になるイベント
  if (
    relation === '友達' &&
    emotionAB === '好きかも' &&
    emotionBA === '好きかも' &&
    affAvg >= 60 &&
    Math.random() < BEST_FRIEND_EVENT_PROB
  ) {
    const talkDesc = `${a.name}と${b.name}が何やら話しているようです…`
    const mood = drawMood(state, a.id, b.id)
  const talkLogId = addLog(talkDesc, 'EVENT')
  generateConversation('親友になる', a, b, {
    relationLabel: relation,
    emotionLabels: { AtoB: emotionAB, BtoA: emotionBA },
    affectionScores: { AtoB: getAffection(state.affections, a.id, b.id), BtoA: getAffection(state.affections, b.id, a.id) },
    timeSlot: getTimeSlot(),
    date: getDateString(),
    mood,
    nicknames: { AtoB: nickAB, BtoA: nickBA }
  })
    .then(detail => {
      updateLog(talkLogId, undefined, detail)
      const changeLogId = addLog(`${a.name}と${b.name}が親友になりました`, 'SYSTEM')
      setState(prev => {
        let relationships = updateRelationship(prev.relationships, a.id, b.id, '親友')
        let reports = prev.reports || {}
        reports = addReportEvent(reports, { timestamp: now, description: '親友になるイベント', logId: talkLogId })
        reports = addReportChange(reports, `${a.name}と${b.name}が親友になった`, changeLogId)
        return { ...prev, relationships, reports }
      })
    })
    .catch(err => {
      addLog(`会話生成エラー: ${err.message}`, 'SYSTEM')
    })
  return
  }

  // 友達になるイベント
  if (
    (relation === 'なし' || relation === '認知') &&
    Math.random() < FRIEND_EVENT_PROB
  ) {
  const talkDesc = `${a.name}と${b.name}が何やら話しているようです…`
  const mood = drawMood(state, a.id, b.id)
  const talkLogId = addLog(talkDesc, 'EVENT')
  generateConversation('友達になる', a, b, {
      relationLabel: relation,
      emotionLabels: { AtoB: emotionAB, BtoA: emotionBA },
      affectionScores: { AtoB: getAffection(state.affections, a.id, b.id), BtoA: getAffection(state.affections, b.id, a.id) },
      timeSlot: getTimeSlot(),
      date: getDateString(),
      mood,
      nicknames: { AtoB: nickAB, BtoA: nickBA }
    })
    .then(detail => {
      updateLog(talkLogId, undefined, detail)
      const changeLogId = addLog(`${a.name}と${b.name}が友達になりました`, 'SYSTEM')
      setState(prev => {
        let relationships = updateRelationship(prev.relationships, a.id, b.id, '友達')
        let reports = prev.reports || {}
        reports = addReportEvent(reports, { timestamp: now, description: '友達になるイベント', logId: talkLogId })
        reports = addReportChange(reports, `${a.name}と${b.name}が友達になった`, changeLogId)
        return { ...prev, relationships, reports }
      })
    })
    .catch(err => {
      addLog(`会話生成エラー: ${err.message}`, 'SYSTEM')
    })
  return
  }

  const types = ['挨拶', '雑談', '思い出し会話', '二人きりの時間']
  const type = types[Math.floor(Math.random() * types.length)]

  let desc = ''
  switch (type) {
    case '挨拶':
      desc = `${a.name}と${b.name}が軽く挨拶を交わした。`
      break
    case '雑談':
      desc = `${a.name}と${b.name}が雑談している。`
      break
    case '思い出し会話':
      desc = `${a.name}と${b.name}が昔の出来事を思い出して語り合っている。`
      break
    case '二人きりの時間':
      desc = `${a.name}と${b.name}が二人きりの時間を過ごしている。`
      break
  }

  const mood = drawMood(state, a.id, b.id)
  const base = baseAffection[type] || 0
  const delta = base + (moodAffectionModifier[mood] || 0)

  // GPT 会話生成
  const eventLogId = addLog(desc, 'EVENT')
  generateConversation(type, a, b, {
    relationLabel: relation,
    emotionLabels: { AtoB: emotionAB, BtoA: emotionBA },
    affectionScores: { AtoB: getAffection(state.affections, a.id, b.id), BtoA: getAffection(state.affections, b.id, a.id) },
    timeSlot: getTimeSlot(),
    date: getDateString(),
    mood,
    nicknames: { AtoB: nickAB, BtoA: nickBA }
  })
    .then(detail => {
      updateLog(eventLogId, undefined, detail)

      let changeLogIdA = null
      let changeLogIdB = null
      if (delta !== 0) {
        const verb = delta > 0 ? '上昇しました' : '下降しました'
        changeLogIdA = addLog(`${a.name}→${b.name}の好感度が${verb}`, 'SYSTEM')
        changeLogIdB = addLog(`${b.name}→${a.name}の好感度が${verb}`, 'SYSTEM')
      } else {
        addLog(`${a.name}と${b.name}の好感度に変化はありません`, 'SYSTEM')
      }

      // 好感度・感情・レポートを計算
      let emotionLogs = []
      let affections = updateAffection(state.affections, a.id, b.id, delta, now)
      affections = updateAffection(affections, b.id, a.id, delta, now)
      let emotions = state.emotions || []
      let reports = state.reports || {}

      let result = drawEmotionChange(state, emotions, a.id, b.id, mood, reports)
      emotions = result.emotions
      reports = result.reports
      if (result.log) emotionLogs.push(result.log)

      result = drawEmotionChange(state, emotions, b.id, a.id, mood, reports)
      emotions = result.emotions
      reports = result.reports
      if (result.log) emotionLogs.push(result.log)

      reports = addReportEvent(reports, { timestamp: now, description: desc, logId: eventLogId })
      if (delta !== 0) {
        const verb = delta > 0 ? '上昇しました' : '下降しました'
        reports = addReportChange(reports, `${a.name}→${b.name}の好感度が${verb}`, changeLogIdA)
        reports = addReportChange(reports, `${b.name}→${a.name}の好感度が${verb}`, changeLogIdB)
      }

      setState(prev => ({ ...prev, affections, emotions, reports }))

      emotionLogs.forEach(l => addLog(l, 'SYSTEM', l))
    })
    .catch(err => {
      addLog(`会話生成エラー: ${err.message}`, 'SYSTEM')
    })
}

