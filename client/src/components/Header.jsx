import React, { useEffect, useState, useRef } from 'react'

// ヘッダー。各画面への移動やセーブ/ロードなどを行う
// リセットボタン用の onReset ハンドラを受け取る
export default function Header({ onChangeView, onSave, onLoad, onReset, tutorialStep, step6Index }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('ja-JP', { hour12: false }))
      setDate(now.toLocaleDateString('ja-JP'))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-600">
      {/* どの画面からでもメイン画面に戻るためのボタン */}
      <button
        onClick={() => onChangeView('main')}
        disabled={tutorialStep < 3}
      >
        ホーム
      </button>
      <button
        onClick={() => onChangeView('management')}
        disabled={!(tutorialStep === 2 || tutorialStep >= 9)}
      >
        管理室
      </button>
      <button
        onClick={() => onChangeView('daily')}
        disabled={!(tutorialStep === 7 || tutorialStep >= 9)}
      >
        日報
      </button>
      <button
        onClick={onSave}
        disabled={!((tutorialStep === 6 && step6Index >= 4) || tutorialStep >= 9)}
      >
        セーブ
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={tutorialStep < 9}
      >
        ロード
      </button>
      {/* セーブデータを初期化するリセットボタン。ロードボタンの右隣に配置 */}
      <button onClick={onReset} disabled={tutorialStep < 9}>リセット</button>
      <input
        type="file"
        accept="application/json"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onLoad(file)
          e.target.value = ''
        }}
      />
      <div className="ml-auto text-right">
        <span id="time" className="font-bold mr-1">{time}</span>
        <span id="date">{date}</span>
      </div>
    </header>
  )
}
