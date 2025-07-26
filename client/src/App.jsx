import React, { useState, useEffect, useRef } from 'react'
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
import StartScreen from './components/StartScreen.jsx'
import { addReportChange } from './lib/reportUtils.js'
import {
  loadTimeModifiers,
  drawSleepTimes,
  getCharacterCondition,
  getDateString
} from './lib/timeUtils.js'
const EVENT_INTERVAL_MS = 1800000 // 30分ごと
const EVENT_PROBABILITY = 0.7

// 初期状態を Code/js/state.js の構造に合わせて定義
const initialState = {
  // キャラクター情報は空の状態から開始する
  characters: [],
  relationships: [], // キャラクター同士の関係
  nicknames: [],     // 呼び方設定
  affections: [],    // 好感度一覧
  emotions: [],      // 感情ラベル一覧
  // 信頼度もキャラクター追加時に設定する
  trusts: [],
  consultations: [], // 進行中の相談イベント
  logs: [],          // CLI 風ログ
  readLogCount: 0,
  reports: {},       // 日報履歴
}

export default function App() {
  const [view, setView] = useState('main')
  const [isStarting, setIsStarting] = useState(true)
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)
  const [initialized, setInitialized] = useState(false)
  const [currentChar, setCurrentChar] = useState(null)
  const [currentPair, setCurrentPair] = useState(null)
  const [currentLogId, setCurrentLogId] = useState(null)

  // state の最新値を保持する参照
  useEffect(() => {
    stateRef.current = state
  }, [state])

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

  // ログIDを指定して削除
  const removeLog = (id) => {
    setState(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.id !== id)
    }))
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
    if (isStarting) return
    const saved = loadStateFromLocal()
    if (saved) {
      setState(prev => ({ ...prev, ...saved }))
    }
    setInitialized(true)
  }, [isStarting])

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
            await triggerRandomEvent(stateRef.current, setState, addLog)
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

  // キャラ状態と就寝時間を更新
  useEffect(() => {
    const lastUpdate = { current: '' }

    const updateCondition = () => {
      const now = new Date()
      const minutes = now.getHours() * 60 + now.getMinutes()
      const dateStr = getDateString(now)
      const needReroll = now.getHours() === 12 && lastUpdate.current !== dateStr

      setState(prev => {
        let changed = false
        const characters = prev.characters.map(c => {
          let sleepStart = c.sleepStart
          let sleepEnd = c.sleepEnd
          if (needReroll || sleepStart === undefined || sleepEnd === undefined) {
            const times = drawSleepTimes(c.activityPattern)
            sleepStart = times.sleepStart
            sleepEnd = times.sleepEnd
            changed = true
          }
          const condition = getCharacterCondition({ sleepStart, sleepEnd }, minutes)
          if (
            condition !== c.condition ||
            sleepStart !== c.sleepStart ||
            sleepEnd !== c.sleepEnd ||
            'recoverAt' in c
          ) {
            changed = true
            const { recoverAt, ...rest } = c
            return { ...rest, condition, sleepStart, sleepEnd }
          }
          return c
        })
        if (needReroll) lastUpdate.current = dateStr
        return changed ? { ...prev, characters } : prev
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

  // スタート画面: セーブデータを読み込む
  const handleLoadSaveData = (file) => {
    importStateFromFile(file)
      .then(loaded => {
        setState(prev => ({ ...prev, ...loaded }))
        setIsStarting(false)
      })
      .catch(() => alert('セーブデータの読み込みに失敗しました'))
  }

  // スタート画面: 新しく始める
  const handleNewGame = () => {
    setState(initialState)
    localStorage.removeItem('relation_sim_state')
    setIsStarting(false)
  }

  // 開発用: 手動でランダムイベントを発生させる
  const handleDevEvent = async () => {
    try {
      await triggerRandomEvent(stateRef.current, setState, addLog)
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
    <div className="max-w-[50rem] mx-auto border border-gray-600 bg-panel p-4 rounded text-gray-100 min-h-screen">
      {isStarting ? (
        <StartScreen onContinue={handleLoadSaveData} onNewGame={handleNewGame} />
      ) : (
        <>
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
          removeLog={removeLog}
          updateTrust={updateTrust}
          updateReadLogCount={updateReadLogCount}
          updateLastConsultation={updateLastConsultation}
          trusts={state.trusts}
          relationships={state.relationships}
          emotions={state.emotions}
          affections={state.affections}
          nicknames={state.nicknames}
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
          nicknames={state.nicknames}
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
        </>
      )}
    </div>
  )
}
