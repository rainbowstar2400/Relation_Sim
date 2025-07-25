import React, { useState, useEffect } from 'react'
import { triggerRandomEvent, initEventSystem } from './lib/eventSystem.js'
import {
  loadStateFromLocal,
  saveStateToLocal,
  exportState,
  importStateFromFile,
} from './lib/storage.js'
import Header from './components/Header.jsx'
import MainView from './components/MainView.jsx'
import ManagementRoom from './components/ManagementRoom.jsx'
import CharacterStatus from './components/CharacterStatus.jsx'
import RelationDetail from './components/RelationDetail.jsx'
import DailyReport from './components/DailyReport.jsx'
import LogDetail from './components/LogDetail.jsx'
import { addReportChange } from './lib/reportUtils.js'
import { loadTimeModifiers, isSleeping } from './lib/timeUtils.js'
const EVENT_INTERVAL_MS = 1800000 // 30分ごと
const EVENT_PROBABILITY = 0.7

// 初期状態を Code/js/state.js の構造に合わせて定義
const initialState = {
  characters: [
    {
      id: 'char_001',
      name: '碧',
      age: 17,
      gender: '男性',
      personality: { social: 4, kindness: 3, stubbornness: 2, activity: 5, expressiveness: 4 },
      mbti: 'INFP',
      talkStyle: { template: 'タメ口', description: 'フレンドリーな砕けた口調：「〜だよ」「〜じゃん」など' },
      activityPattern: '夜型',
      interests: ['読書', '散歩'],
      condition: '活動中',
      lastConsultation: 0,
    },
    {
      id: 'char_002',
      name: '彩花',
      age: 17,
      gender: '女性',
      personality: { social: 5, kindness: 4, stubbornness: 1, activity: 3, expressiveness: 5 },
      mbti: 'ESFJ',
      talkStyle: { template: '優しい敬語', description: '「〜です」「〜ます」など丁寧で穏やかな話し方' },
      activityPattern: '朝型',
      interests: ['お菓子作り', 'カフェ巡り'],
      condition: '活動中',
      lastConsultation: 0,
    },
    {
      id: 'char_003',
      name: '志音',
      age: 16,
      gender: '男性',
      personality: { social: 2, kindness: 5, stubbornness: 4, activity: 2, expressiveness: 2 },
      mbti: 'ISFP',
      talkStyle: { template: 'タメ口', description: 'フレンドリーな砕けた口調：「〜だよ」「〜じゃん」など' },
      activityPattern: '通常',
      interests: ['音楽鑑賞'],
      condition: '活動中',
      lastConsultation: 0,
    },
  ],
  relationships: [], // キャラクター同士の関係
  nicknames: [],     // 呼び方設定
  affections: [],    // 好感度一覧
  emotions: [],      // 感情ラベル一覧
  trusts: [          // プレイヤーへの信頼度
    { id: 'char_001', score: 50 },
    { id: 'char_002', score: 50 },
    { id: 'char_003', score: 50 },
  ],
  consultations: [], // 進行中の相談イベント
  logs: [],          // CLI 風ログ
  readLogCount: 0,
  reports: {},       // 日報履歴
}

export default function App() {
  const [view, setView] = useState('main')
  const [state, setState] = useState(initialState)
  const [initialized, setInitialized] = useState(false)
  const [currentChar, setCurrentChar] = useState(null)
  const [currentPair, setCurrentPair] = useState(null)
  const [currentLogId, setCurrentLogId] = useState(null)

  // ログを追加するヘルパー
  // text: 表示テキスト
  // type: EVENT または SYSTEM
  // detail: クリック時に表示する全文
  const addLog = (text, type = 'EVENT', detail = '') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
    const entry = { id, time, type, text, detail: detail || text }
    setState(prev => ({ ...prev, logs: [...prev.logs, entry] }))
    return id
  }

  // 信頼度を変更
  // 信頼度を変更
  const updateTrust = (charId, delta) => {
    setState(prev => {
      const trusts = [...prev.trusts]
      const idx = trusts.findIndex(t => t.id === charId)
      const current = idx >= 0 ? trusts[idx].score : 50
      const score = Math.max(0, Math.min(100, current + delta))
      if (idx >= 0) trusts[idx] = { id: charId, score }
      else trusts.push({ id: charId, score })

      const char = prev.characters.find(c => c.id === charId)
      const verb = delta >= 0 ? '上昇しました' : '下降しました'

      // ログ追加
      addLog(`${char.name}からの信頼度が${verb}。`, 'SYSTEM')

      return {
        ...prev,
        trusts
      }
    })
  }

  // キャラクターが相談を行った時間を更新
  const updateLastConsultation = (charId) => {
    const now = Date.now()
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(c =>
        c.id === charId ? { ...c, lastConsultation: now } : c
      )
    }))
  }

  const updateReadLogCount = (count) => {
    setState(prev => ({ ...prev, readLogCount: count }))
  }

  // 関係ラベルを更新
  const updateRelationship = (idA, idB, label) => {
    setState(prev => {
      const pair = [idA, idB].sort()
      const next = [...prev.relationships]
      const idx = next.findIndex(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
      if (idx >= 0) next[idx] = { pair, label }
      else next.push({ pair, label })
      return { ...prev, relationships: next }
    })
  }

  // 感情ラベルを更新
  const updateEmotion = (from, to, label) => {
    setState(prev => {
      const next = [...prev.emotions]
      const idx = next.findIndex(e => e.from === from && e.to === to)
      if (idx >= 0) next[idx] = { from, to, label }
      else next.push({ from, to, label })
      return { ...prev, emotions: next }
    })
  }

  // localStorageから読み込み
  useEffect(() => {
    const saved = loadStateFromLocal()
    if (saved) {
      setState(prev => ({ ...prev, ...saved }))
    }
    setInitialized(true)
  }, [])

  // 時間帯補正テーブルを読み込む
  useEffect(() => {
    loadTimeModifiers()
  }, [])

  // 保存（初期化後に実行）
  useEffect(() => {
    if (initialized) {
      saveStateToLocal(state)
    }
  }, [state, initialized])

  // 一定間隔でランダムイベントを発生させる
  useEffect(() => {
    let timer
    const startScheduler = async () => {
      // テーブル読み込み完了を待ってからスケジュール開始
      await initEventSystem()
      timer = setInterval(async () => {
        if (Math.random() < EVENT_PROBABILITY) {
          try {
            await triggerRandomEvent(state, setState, addLog)
          } catch (err) {
            addLog(`イベント実行エラー: ${err.message}`, 'SYSTEM')
          }
        }
      }, EVENT_INTERVAL_MS)
    }
    startScheduler()
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  // 日次で好感度の経過日数を評価
  useEffect(() => {
    const evaluateDecay = () => {
      setState(prev => {
        let changed = false
        let reports = prev.reports || {}
        const now = Date.now()
        const dayMs = 86400000
        const affections = prev.affections.map(rec => {
          if (!rec.lastInteracted) return rec
          const days = Math.floor((now - rec.lastInteracted) / dayMs)
          let delta = 0
          if (days >= 8) delta = -2
          else if (days >= 4) delta = -1
          if (delta !== 0) {
            const score = Math.max(-100, Math.min(100, rec.score + delta))
            const fromName = prev.characters.find(c => c.id === rec.from)?.name || rec.from
            const toName = prev.characters.find(c => c.id === rec.to)?.name || rec.to
            reports = addReportChange(reports, `${fromName}→${toName}の好感度が${-delta}低下（疎遠）`)
            changed = true
            return { ...rec, score }
          }
          return rec
        })
        if (changed) {
          return { ...prev, affections, reports }
        }
        return prev
      })
    }

    evaluateDecay()
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const firstDelay = tomorrow.getTime() - now.getTime()
    let intervalId
    const timeoutId = setTimeout(() => {
      evaluateDecay()
      intervalId = setInterval(evaluateDecay, 86400000)
    }, firstDelay)
    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  // キャラ状態を時間帯や確率で更新
  useEffect(() => {
    const updateCondition = () => {
      const now = new Date()
      const hour = now.getHours()
      setState(prev => {
        const characters = prev.characters.map(c => {
          const base = isSleeping(c.activityPattern, hour) ? '就寝中' : '活動中'
          let condition = c.condition
          let recoverAt = c.recoverAt

          // 風邪の継続判定
          if (condition === '風邪') {
            if (recoverAt && Date.now() >= recoverAt) {
              condition = base
              recoverAt = null
            }
          } else {
            condition = base
          }

          // 1時間あたり約5%の確率で風邪を発症
          if (condition !== '風邪' && Math.random() < 0.05 / 3600) {
            condition = '風邪'
            recoverAt = Date.now() + 3 * 86400000
          }

          if (condition !== c.condition || recoverAt !== c.recoverAt) {
            return { ...c, condition, recoverAt }
          }
          return c
        })
        return { ...prev, characters }
      })
    }

    updateCondition()
    const timer = setInterval(updateCondition, 1000)
    return () => clearInterval(timer)
  }, [])

  const saveCharacter = (char, rels = [], nicks = [], affs = []) => {
    setState(prev => {
      let characters = [...prev.characters]
      let relationships = prev.relationships.filter(r => !r.pair.includes(char.id))
      let nicknames = prev.nicknames.filter(n => n.from !== char.id && n.to !== char.id)
      let affections = prev.affections.filter(a => a.from !== char.id && a.to !== char.id)
      const exists = characters.some(c => c.id === char.id)
      if (exists) {
        characters = characters.map(c => c.id === char.id ? char : c)
      } else {
        characters.push(char)
      }
      return {
        ...prev,
        characters,
        relationships: relationships.concat(rels),
        nicknames: nicknames.concat(nicks),
        affections: affections.concat(affs)
      }
    })
  }

  const deleteCharacter = (id) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id),
      relationships: prev.relationships.filter(r => !r.pair.includes(id)),
      nicknames: prev.nicknames.filter(n => n.from !== id && n.to !== id),
      affections: prev.affections.filter(a => a.from !== id && a.to !== id)
    }))
  }

  const handleExport = () => {
    exportState(state)
  }

  const handleImport = (file) => {
    importStateFromFile(file)
      .then(loaded => setState(prev => ({ ...prev, ...loaded })))
      .catch(() => alert('読み込みに失敗しました'))
  }

  // 開発用: 手動でランダムイベントを発生させる
  const handleDevEvent = async () => {
    try {
      await triggerRandomEvent(state, setState, addLog)
    } catch (err) {
      addLog(`イベント実行エラー: ${err.message}`, 'SYSTEM')
    }
  }

  const showStatus = (char) => {
    setCurrentChar(char)
    setCurrentPair(null)
    setView('status')
  }

  const showRelationDetail = (idA, idB) => {
    const a = state.characters.find(c => c.id === idA)
    const b = state.characters.find(c => c.id === idB)
    if (!a || !b) return
    setCurrentPair({ a, b })
    setView('relation')
  }

  return (
    <div className="max-w-2xl mx-auto border border-gray-600 bg-panel p-4 rounded text-gray-100 min-h-screen">
      <Header
        onChangeView={setView}
        onSave={handleExport}
        onLoad={handleImport}
        onDevEvent={handleDevEvent}
      />
      {view === 'main' && (
        <MainView
          characters={state.characters}
          logs={state.logs}
          readLogCount={state.readLogCount}
          onSelect={showStatus}
          addLog={addLog}
          updateTrust={updateTrust}
          updateReadLogCount={updateReadLogCount}
          updateLastConsultation={updateLastConsultation}
          trusts={state.trusts}
          relationships={state.relationships}
          emotions={state.emotions}
          affections={state.affections}
          updateRelationship={updateRelationship}
          updateEmotion={updateEmotion}
        />
      )}
      {view === 'management' && (
        <ManagementRoom
          characters={state.characters}
          relationships={state.relationships}
          nicknames={state.nicknames}
          affections={state.affections}
          onSaveCharacter={saveCharacter}
          onDeleteCharacter={deleteCharacter}
          onBack={() => {
            setCurrentPair(null)
            setView('main')
          }}
        />
      )}
      {view === 'status' && currentChar && (
        <CharacterStatus
          char={currentChar}
          characters={state.characters}
          logs={state.logs}
          trusts={state.trusts}
          relationships={state.relationships}
          nicknames={state.nicknames}
          affections={state.affections}
          emotions={state.emotions}
          onBack={() => {
            setCurrentPair(null)
            setView('main')
          }}
          onOpenRelation={showRelationDetail}
        />
      )}
      {view === 'relation' && currentPair && (
        <RelationDetail
          charA={currentPair.a}
          charB={currentPair.b}
          relationships={state.relationships}
          affections={state.affections}
          emotions={state.emotions}
          logs={state.logs}
          onBack={() => {
            setCurrentPair(null)
            setView('status')
          }}
        />
      )}
      {view === 'daily' && (
        <DailyReport
          reports={state.reports}
          characters={state.characters}
          onBack={() => setView('main')}
          onOpenLog={(id) => {
            setCurrentLogId(id)
            setView('logdetail')
          }}
        />
      )}
      {view === 'logdetail' && (
        <LogDetail
          log={state.logs.find(l => l.id === currentLogId)}
          onBack={() => setView('daily')}
        />
      )}
    </div>
  )
}
