import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { triggerRandomEvent, initEventSystem, triggerGreetingTutorial } from './lib/eventSystem.js'
import {
  exportState,
  importStateFromFile,
} from './lib/storage.js'
import {
  loadGameData,
  saveGameData,
  deleteGameData,
} from './lib/cloudStorage.js'
import { auth } from './firebaseConfig.js'
import { onAuthStateChanged } from 'firebase/auth'
import Header from './components/Header.jsx'
import MainView from './components/MainView.jsx'
import ManagementRoom from './components/ManagementRoom.jsx'
import CharacterStatus from './components/CharacterStatus.jsx'
import RelationDetail from './components/RelationDetail.jsx'
import DailyReport from './components/DailyReport.jsx'
import LogDetail from './components/LogDetail.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import StartScreen from './components/StartScreen.jsx'
import Popup from './components/Popup.jsx'
import { addReportChange } from './lib/reportUtils.js'
import {
  loadTimeModifiers,
  drawSleepTimes,
  getCharacterCondition,
  getDateString
} from './lib/timeUtils.js'
const EVENT_INTERVAL_MS = 900000 // 15分ごと
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
  // チュートリアル進行度（2:住人登録チュートリアル、3以降:チュートリアル終了）
  tutorialStep: 3,
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [isStarting, setIsStarting] = useState(true)
  const [showIntro, setShowIntro] = useState(false)
  const [state, setState] = useState(initialState)
  const [userId, setUserId] = useState(null)
  const stateRef = useRef(state)
  const consultRef = useRef(null)
  // ステップ4の相談イベントIDを保持
  const consultEventIdRef = useRef(null)
  // 挨拶イベントのログIDを保持
  const greetingLogIdRef = useRef(null)
  const [initialized, setInitialized] = useState(false)
  const [popup, setPopup] = useState(null)
  const tutorialFlags = useRef({
    step3: false,
    step4: false,
    step5: false,
    step5Status: false,
    step5Detail: false,
    step6: false,
    step7: false,
    step7Detail: false,
    step8: false,
  })

  // 現在のパスから画面名を判定
  const view = (() => {
    const path = location.pathname
    if (path.startsWith('/management')) return 'management'
    if (path.startsWith('/status')) return 'status'
    if (path.startsWith('/relation')) return 'relation'
    if (path.startsWith('/daily/log')) return 'logdetail'
    if (path.startsWith('/daily')) return 'daily'
    return 'main'
  })()

  // URL パラメータから対象を取得
  const statusMatch = location.pathname.match(/^\/status\/([^/]+)/)
  const relationMatch = location.pathname.match(/^\/relation\/([^/]+)\/([^/]+)/)
  const logMatch = location.pathname.match(/^\/daily\/log\/([^/]+)/)
  const currentChar = statusMatch
    ? state.characters.find(c => c.id === statusMatch[1])
    : null
  const currentPair = relationMatch
    ? {
        a: state.characters.find(c => c.id === relationMatch[1]),
        b: state.characters.find(c => c.id === relationMatch[2]),
      }
    : null
  // チュートリアルフラグを全てリセット
  const resetTutorialFlags = () => {
    for (const key of Object.keys(tutorialFlags.current)) {
      tutorialFlags.current[key] = false
    }
  }

  // チュートリアル進行度に応じてフラグを再設定
  const applyTutorialFlags = (step) => {
    if (step >= 4) tutorialFlags.current.step3 = true
    if (step >= 5) tutorialFlags.current.step4 = true
    if (step >= 6) {
      tutorialFlags.current.step5 = true
      tutorialFlags.current.step5Status = true
      tutorialFlags.current.step5Detail = true
    }
    if (step >= 7) tutorialFlags.current.step6 = true
    if (step >= 8) {
      tutorialFlags.current.step7 = true
      tutorialFlags.current.step7Detail = true
    }
    if (step >= 9) tutorialFlags.current.step8 = true
  }
  const step6TimerRef = useRef(null)
  const step6NextIndexRef = useRef(0)
  const step6WaitingSaveRef = useRef(false)

  const step6Messages = [
    '先ほど行った住人の登録や、住人情報の編集は、\n管理室からいつでも行うことができます。',
    '「日報」からは、ログに表示された会話や\nそれによる変化の記録を見ることができます。\nこの後、実際に見に行ってみましょう。',
    'このゲームはオートセーブに対応しており、\n' +
    'ログや住人たちの状態は、常に自動で保存されています。\n\n' +
    'ただし、ブラウザを閉じたり、キャッシュを消去したりすると、\n' +
    'これらのデータは失われてしまうため注意が必要です。\n\n' +
    '「セーブ」からは、セーブデータをファイルとしてダウンロードできます。\n' +
    'ゲームを閉じる前には、必ずセーブを行ってデータを保存してください。\n\n' +
    'また、いつでも「ロード」からファイルを読み込むことで、\n' +
    '保存時点からプレイを再開することができます。',
    '「リセット」を押すと、現在のデータが初期化され、\n' +
    '最初のセーブデータ選択に戻ります。\n\n' +
    'チュートリアルも、最初からやり直すことができます。\n\n' +
    'なお、事前に「セーブ」しておいたファイルがあれば、\n' +
    '「ロード」からデータを復元することも可能です。',
    '今の状態をセーブしておきましょう。',
    'セーブできましたね。\n定期的にセーブを行うことをおすすめします。',
    '画面右上には、現在の日時が表示されています。\n\n'+
    'ゲーム内の時間は、現実世界の時間と連動しており、\n何もしなくても、住人たちはそれぞれの生活を続けていきます。',
  'では、「日報」を見てみましょう。',
  ]

  // Firebaseのログイン状態を取得
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) setUserId(user.uid)
    })
    return unsub
  }, [])

  const runStep6Sequence = (idx) => {
    step6NextIndexRef.current = idx + 1
    showPopup(step6Messages[idx], () => {
      const next = idx + 1
      if (idx === 4) {
        // セーブ完了後に次の案内を表示する
        step6WaitingSaveRef.current = true
      } else if (next < step6Messages.length) {
        step6TimerRef.current = setTimeout(() => runStep6Sequence(next), 500)
      } else {
        setState(prev => ({ ...prev, tutorialStep: 7 }))
      }
    })
  }

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

  // Firestoreから読み込み
  useEffect(() => {
    if (!userId) return
    loadGameData(userId).then(saved => {
      if (saved) {
        setState(prev => ({
          ...prev,
          ...saved,
          tutorialStep: saved.tutorialStep ?? 3,
        }))
        applyTutorialFlags(saved.tutorialStep ?? 3)
        setIsStarting(false)
        setInitialized(true)
      } else {
        setIsStarting(true)
      }
    })
  }, [userId])

  // 時間帯補正テーブルを読み込む
  useEffect(() => {
    loadTimeModifiers()
  }, [])

  // 保存（初期化後に実行）
  useEffect(() => {
    if (initialized && userId) {
      saveGameData(userId, state)
    }
  }, [state, initialized, userId])

  // 一定間隔でランダムイベントを発生させる
  useEffect(() => {
    let timer
    const startScheduler = async () => {
      // テーブル読み込み完了を待ってからスケジュール開始
      await initEventSystem()
      timer = setInterval(async () => {
        if (stateRef.current.tutorialStep >= 4 && Math.random() < EVENT_PROBABILITY) {
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

  // ホーム画面に入ってからのチュートリアル処理
  // 1. ホーム遷移から3秒後に案内ポップアップを表示しつつ挨拶イベントを発生
  // 2. ポップアップを閉じてから3秒後に次の説明を表示し、相談イベントを仕込む
  // 3. さらにそのポップアップを閉じて3秒後にステップ4へ進む
  useEffect(() => {
    let timer
    if (
      view === 'main' &&
      state.tutorialStep === 3 &&
      !tutorialFlags.current.step3 &&
      state.characters.length >= 2
    ) {
      tutorialFlags.current.step3 = true
      timer = setTimeout(() => {
        const firstText =
          'ここがホームです。\n\n' +
          'ホームでは、住人たちの会話を眺めたり、\n' +
          '彼らからの相談に応じたりすることができます。\n\n' +
          '……おや？'
          showPopup(firstText, () => {
            setTimeout(async () => {
              const char = stateRef.current.characters[0]
              const secondText =
                '今、二人の住人がすれ違い、挨拶を交わしたようです。\n\n' +
                'このように、住人どうしの会話や出来事は、\n' +
                'そのときに起こった変化とともに、ログに表示されます。\n\n' +
                '今回は「好感度」が少し上がりましたが、\n' +
                '場合によっては、関係性や印象が変わることもあります。\n\n' +
                'すべての出来事は、このログから見守ることができます。\n\n' +
                'なお、古いログは確認済みになると、順次非表示になります。'
              showPopup(secondText, () => {
                setTimeout(() => {
                  setState(prev => ({ ...prev, tutorialStep: 4 }))
                }, 1500)
              })
              setTimeout(async () => {
                if (consultRef.current) {
                  consultEventIdRef.current = await consultRef.current.addTutorialConsultation(
                    char,
                    true,
                  )
                }
              }, 0)
            }, 1500)
          })
          const [c1, c2] = stateRef.current.characters
          triggerGreetingTutorial(stateRef.current, setState, addLog, c1.id, c2.id)
            .then((id) => {
              greetingLogIdRef.current = id
            })
        }, 1500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep])




  // 日報画面の案内（ステップ7）
  useEffect(() => {
    let timer
    if (
      view === 'daily' &&
      state.tutorialStep === 7 &&
      !tutorialFlags.current.step7
    ) {
      const message =
        'ここでは、これまでに発生した会話や、\n' +
        'それによって起きた変化の記録を確認することができます。\n\n' +
        '日付や住人、記録の種類などで絞り込みもできます。\n\n' +
        'また、会話履歴からは、実際の会話そのものを振り返ることも可能です。\n\n' +
        '試しに、先ほどの挨拶を見てみましょう。'
      timer = setTimeout(() => {
        showPopup(message, () => {
          tutorialFlags.current.step7 = true
        })
      }, 500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep])

  // 会話詳細画面での案内（ステップ7詳細）
  useEffect(() => {
    let timer
    if (
      view === 'logdetail' &&
      state.tutorialStep === 7 &&
      !tutorialFlags.current.step7Detail
    ) {
      tutorialFlags.current.step7Detail = true
      timer = setTimeout(() => {
        showPopup('このように、過去の会話を振り返ることができます。', () => {
          timer = setTimeout(() => {
            showPopup('では、ホームに戻りましょう。', () => {
              navigate('/')
              setState(prev => ({ ...prev, tutorialStep: 8 }))
            })
          }, 1500)
        })
      }, 500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep])

  // ステータス確認チュートリアル
  useEffect(() => {
    let timer
    if (
      view === 'main' &&
      state.tutorialStep === 5 &&
      !tutorialFlags.current.step5 &&
      state.characters.length >= 2
    ) {
      const characterA = state.characters[0]
      const message =
        '「みんなの様子」では、\n' +
        '住人たちの現在の様子を一覧で確認することができます。\n' +
        '住人を選択すると、更に詳しい情報を見ることができます。\n\n'+
        `試しに、${characterA.name} の様子を見てみましょう。`
      timer = setTimeout(() => {
        showPopup(message, () => {
          tutorialFlags.current.step5 = true
        })
      }, 1500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep])

  // 相談チュートリアル
  useEffect(() => {
    let timer
    if (
      view === 'main' &&
      state.tutorialStep === 4 &&
      !tutorialFlags.current.step4 &&
      state.characters.length > 0
    ) {
      tutorialFlags.current.step4 = true
      const character = state.characters[0]
      timer = setTimeout(async () => {
        if (consultEventIdRef.current === null && consultRef.current) {
          consultEventIdRef.current = await consultRef.current.addTutorialConsultation(character, true)
        }
        if (consultRef.current && consultEventIdRef.current !== null) {
          consultRef.current.enableConsultation(consultEventIdRef.current)
        }
        const text =
          `なにやら、${character.name} から相談が届いたようです。\n\n` +
          'さっそく対応してみましょう。'
        showPopup(text)
      }, 0)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep])

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
    if (step6WaitingSaveRef.current) {
      step6WaitingSaveRef.current = false
      // セーブ完了を確認したら少し待って次の案内を出す
      step6TimerRef.current = setTimeout(
        () => runStep6Sequence(step6NextIndexRef.current),
        1000
      )
    }
  }

  const handleImport = (file) => {
    resetTutorialFlags()
    importStateFromFile(file)
      .then(loaded => {
        setState(prev => ({
          ...prev,
          ...loaded,
          tutorialStep: loaded.tutorialStep ?? 3,
        }))
        applyTutorialFlags(loaded.tutorialStep ?? 3)
      })
      .catch(() => alert('読み込みに失敗しました'))
  }

  // セーブデータを削除してスタート画面に戻る
  const handleReset = () => {
    if (window.confirm('本当にリセットしてよろしいですか？')) {
      resetTutorialFlags()
      if (userId) deleteGameData(userId)
      setState(initialState)
      navigate('/')
      setShowIntro(false)
      setIsStarting(true)
    }
  }

  // ポップアップ表示ヘルパー
  const showPopup = (text, afterClose) => {
    setPopup({ text, afterClose })
  }

  const closePopup = () => {
    const callback = popup?.afterClose
    // 先にポップアップを閉じてから次の処理を行う
    setPopup(null)
    if (callback) callback()
  }

  // スタート画面: セーブデータを読み込む
  const handleLoadSaveData = (file) => {
    resetTutorialFlags()
    importStateFromFile(file)
      .then(loaded => {
        setState(prev => ({
          ...prev,
          ...loaded,
          tutorialStep: loaded.tutorialStep ?? 3,
        }))
        applyTutorialFlags(loaded.tutorialStep ?? 3)
        setIsStarting(false)
        setInitialized(true)
      })
      .catch(() => alert('セーブデータの読み込みに失敗しました'))
  }

  // スタート画面: 新しく始める
  const handleNewGame = () => {
    resetTutorialFlags()
    setState({ ...initialState, tutorialStep: 1 })
    if (userId) deleteGameData(userId)
    setInitialized(true)
    setShowIntro(true)
  }

  const handleIntroFinish = () => {
    setShowIntro(false)
    setIsStarting(false)
    navigate('/management')
    setState(prev => ({ ...prev, tutorialStep: 2 }))
    setTimeout(() => {
      showPopup(
        'ここで情報を入力することで、住人を迎え入れることができます。\n' +
          'さっそく空欄を埋め、登録してみましょう。'
      )
    }, 500)
  }

  const handleSkipTutorial = () => {
    setShowIntro(false)
    setIsStarting(false)
    navigate('/')
    setInitialized(true)
    for (const key of Object.keys(tutorialFlags.current)) {
      tutorialFlags.current[key] = true
    }
    setState(prev => ({ ...prev, tutorialStep: 9 }))
  }


  // チュートリアル用コールバック
  const handleFirstRegisterComplete = () => {
    if (state.tutorialStep === 2) {
      setTimeout(() => {
        showPopup(
          '一人目の住人が登録できました！\n' +
            '登録した住人は、こちらの住人一覧に表示されます。\n\n' +
            '次は、二人目の住人を登録してみましょう。\n' +
            '「新規住人登録」から追加することができます。'
        )
      }, 500)
    }
  }

  const handleSecondRegisterStart = () => {
    if (state.tutorialStep === 2) {
      setTimeout(() => {
        showPopup(
          '二人目以降の住人には、他の住人との関係性を予め設定することができます。\n\n' +
            'この「好感度」は、お互いについてどれだけ好ましく思っているかを示します。'
        )
      }, 500)
    }
  }

  const handleSecondRegisterComplete = () => {
    if (state.tutorialStep === 2) {
      setTimeout(() => {
        showPopup(
          '二人目の住人の登録が完了しました！\n\n' +
            'これで箱庭の暮らしが始まります。\n' +
            'どんな関係が生まれていくのか、ぜひ見守ってみてください。\n\n' +
            'それでは、ホームへ進みましょう。',
          () => {
            navigate('/')
            setState(prev => ({ ...prev, tutorialStep: 3 }))
          }
        )
      }, 500)
    }
  }

  const handleConsultTutorialComplete = () => {
    const message =
      '相談に乗ることができましたね。\n\n' +
      'うまく応じることができると、このように、\n' +
      'その住人からの信頼度が少し上昇します。\n\n' +
      '信頼度が高まるほど、住人はより深い相談をしてくれるようになります。\n\n' +
      'また、相談は最大で3件まで表示され、\n' +
      '必要に応じて追加で受け付けることもできます。'
    setTimeout(() => {
      showPopup(message, () => {
        setState(prev => ({ ...prev, tutorialStep: 5 }))
      })
    }, 1500)
  }

  const showStatus = (char) => {
    navigate(`/status/${char.id}`)
  }

  const showRelationDetail = (idA, idB) => {
    const a = state.characters.find(c => c.id === idA)
    const b = state.characters.find(c => c.id === idB)
    if (!a || !b) return
    navigate(`/relation/${a.id}/${b.id}`)
  }

  // ステータス画面での説明
  useEffect(() => {
    let timer
    if (
      view === 'status' &&
      state.tutorialStep === 5 &&
      tutorialFlags.current.step5 &&
      !tutorialFlags.current.step5Status &&
      currentChar &&
      state.characters.length >= 2 &&
      currentChar.id === state.characters[0].id
    ) {
      tutorialFlags.current.step5Status = true
      const first =
        'ここでは、その住人について登録した情報や、\n' +
        '他の住人との関係、最近の出来事などを確認できます。\n\n' +
        '関係一覧では、表示されている住人を選ぶことで、\n' +
        'それぞれとの好感度や呼び方など、大まかな関係の情報を見ることができます。'
      const second =
        '「詳細」を選ぶと、さらに詳しい情報が見られます。\n\n' +
        `試しに、${state.characters[1].name} との関係を詳しく見てみましょう。`
      timer = setTimeout(() => {
        showPopup(first, () => {
          timer = setTimeout(() => {
            showPopup(second)
          }, 2000)
        })
      }, 500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep, currentChar])

  // 関係詳細画面での説明
  useEffect(() => {
    let timer
    if (
      view === 'relation' &&
      state.tutorialStep === 5 &&
      tutorialFlags.current.step5Status &&
      !tutorialFlags.current.step5Detail &&
      currentPair &&
      state.characters.length >= 2 &&
      currentPair.a.id === state.characters[0].id &&
      currentPair.b.id === state.characters[1].id
    ) {
      tutorialFlags.current.step5Detail = true
      const text1 =
        'この画面では、関係性や呼び方、好感度に加えて、\n' +
        '相手住人との直近の関わりや変化が表示されます。'
      timer = setTimeout(() => {
        showPopup(text1, () => {
          timer = setTimeout(() => {
            showPopup('では、ホームに戻りましょう。', () => {
              navigate('/')
              setState(prev => ({ ...prev, tutorialStep: 6 }))
            })
          }, 1500)
        })
      }, 500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep, currentPair])

  // ホーム画面での案内（ステップ6）
  useEffect(() => {
    if (
      view === 'main' &&
      state.tutorialStep === 6 &&
      !tutorialFlags.current.step6
    ) {
      tutorialFlags.current.step6 = true
      step6TimerRef.current = setTimeout(() => runStep6Sequence(0), 500)
    }
    return () => {
      if (step6TimerRef.current) {
        clearTimeout(step6TimerRef.current)
        step6TimerRef.current = null
      }
    }
  }, [view, state.tutorialStep])

  // チュートリアル終了の案内（ステップ8）
  useEffect(() => {
    let timer
    if (
      view === 'main' &&
      state.tutorialStep === 8 &&
      !tutorialFlags.current.step8
    ) {
      timer = setTimeout(() => {
        showPopup(
          'お疲れさまでした！\n\n' +
            'これで、あなたはもう立派な管理人です。\n' +
            '住人たちの毎日を、これからゆっくりと見守ってあげてくださいね。\n\n' +
            'そして、こまめなセーブもお忘れなく。',
          () => {
            tutorialFlags.current.step8 = true
            setState(prev => ({ ...prev, tutorialStep: 9 }))
          }
        )
      }, 500)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [view, state.tutorialStep])

  return (
    <div className="max-w-[50rem] mx-auto border border-gray-600 bg-panel p-4 rounded text-gray-100 min-h-screen">
      {isStarting ? (
        <StartScreen
          onContinue={handleLoadSaveData}
          onNewGame={handleNewGame}
          showIntro={showIntro}
          onIntroFinish={handleIntroFinish}
          onSkipTutorial={handleSkipTutorial}
        />
      ) : (
        <>
          <Header />
          <Routes>
            <Route
              path="/"
              element={
                <MainView
                  consultRef={consultRef}
                  onTutorialComplete={handleConsultTutorialComplete}
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
              }
            />
            <Route
              path="/management"
              element={
                <ManagementRoom
                  characters={state.characters}
                  relationships={state.relationships}
                  nicknames={state.nicknames}
                  affections={state.affections}
                  tutorialStep={state.tutorialStep}
                  onFirstRegisterComplete={handleFirstRegisterComplete}
                  onSecondRegisterStart={handleSecondRegisterStart}
                  onSecondRegisterComplete={handleSecondRegisterComplete}
                  onSaveCharacter={saveCharacter}
                  onDeleteCharacter={deleteCharacter}
                />
              }
            />
            <Route
              path="/status/:id"
              element={
                <CharacterStatus
                  characters={state.characters}
                  logs={state.logs}
                  trusts={state.trusts}
                  relationships={state.relationships}
                  nicknames={state.nicknames}
                  affections={state.affections}
                  emotions={state.emotions}
                  onOpenRelation={showRelationDetail}
                />
              }
            />
            <Route
              path="/relation/:idA/:idB"
              element={
                <RelationDetail
                  characters={state.characters}
                  relationships={state.relationships}
                  affections={state.affections}
                  emotions={state.emotions}
                  nicknames={state.nicknames}
                  logs={state.logs}
                />
              }
            />
            <Route
              path="/daily"
              element={
                <DailyReport
                  reports={state.reports}
                  characters={state.characters}
                />
              }
            />
            <Route
              path="/daily/log/:logId"
              element={<LogDetail logs={state.logs} />}
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  onSave={handleExport}
                  onLoad={handleImport}
                  onReset={handleReset}
                />
              }
            />
          </Routes>
          {popup && <Popup message={popup.text} onClose={closePopup} />}
        </>
      )}
    </div>
  )
}
