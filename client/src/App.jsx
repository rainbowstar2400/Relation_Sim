import React, { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import MainView from './components/MainView.jsx'
import ManagementRoom from './components/ManagementRoom.jsx'
import CharacterStatus from './components/CharacterStatus.jsx'
import DailyReport from './components/DailyReport.jsx'

const STORAGE_KEY = 'relation_sim_state'

// 初期状態を Code/js/state.js から簡略化して移植
const initialState = {
  characters: [
    {
      id: 'char_001',
      name: '碧',
      personality: { social: 4, kindness: 3, stubbornness: 2, activity: 5, expressiveness: 4 },
      mbti: 'INFP',
      talkStyle: { preset: 'くだけた', firstPerson: '俺', suffix: '〜じゃん' },
      activityPattern: '夜型',
      interests: ['読書', '散歩'],
    },
    {
      id: 'char_002',
      name: '彩花',
      personality: { social: 5, kindness: 4, stubbornness: 1, activity: 3, expressiveness: 5 },
      mbti: 'ESFJ',
      talkStyle: { preset: '丁寧', firstPerson: '私', suffix: '〜です' },
      activityPattern: '朝型',
      interests: ['お菓子作り', 'カフェ巡り'],
    },
    {
      id: 'char_003',
      name: '志音',
      personality: { social: 2, kindness: 5, stubbornness: 4, activity: 2, expressiveness: 2 },
      mbti: 'ISFP',
      talkStyle: { preset: 'くだけた', firstPerson: 'ボク', suffix: '〜だよ' },
      activityPattern: '通常',
      interests: ['音楽鑑賞'],
    },
  ],
  relationships: [],
  nicknames: [],
  affections: [],
  trusts: {
    char_001: 50,
    char_002: 50,
    char_003: 50,
  },
  logs: []
}

export default function App() {
  const [view, setView] = useState('main')
  const [state, setState] = useState(initialState)
  const [currentChar, setCurrentChar] = useState(null)

  // ログを追加するヘルパー
  const addLog = (text, type = 'EVENT') => {
    setState(prev => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const line = `[${time}] ${type}: ${text}`
      return { ...prev, logs: [...prev.logs, line] }
    })
  }

  // 信頼度を変更
  const updateTrust = (charId, delta) => {
    setState(prev => {
      const current = prev.trusts[charId] ?? 50
      const score = Math.max(0, Math.min(100, current + delta))
      const char = prev.characters.find(c => c.id === charId)
      const verb = delta >= 0 ? '上昇しました' : '下降しました'
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const line = `[${time}] SYSTEM: ${char.name}からの信頼度が${verb}。`
      return {
        ...prev,
        trusts: { ...prev.trusts, [charId]: score },
        logs: [...prev.logs, line]
      }
    })
  }

  // localStorageから読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setState(JSON.parse(saved))
    }
  }, [])

  // 保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

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

  const showStatus = (char) => {
    setCurrentChar(char)
    setView('status')
  }

  return (
    <div className="p-4 text-gray-100">
      <Header onChangeView={setView} />
      {view === 'main' && (
        <MainView
          characters={state.characters}
          logs={state.logs}
          trusts={state.trusts}
          onSelect={showStatus}
          addLog={addLog}
          updateTrust={updateTrust}
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
          onBack={() => setView('main')}
        />
      )}
      {view === 'status' && currentChar && (
        <CharacterStatus
          char={currentChar}
          characters={state.characters}
          logs={state.logs}
          onBack={() => setView('main')}
        />
      )}
      {view === 'daily' && <DailyReport onBack={() => setView('main')} />}
    </div>
  )
}
