import React, { useEffect, useState, useRef } from 'react'

// 開発用イベント発生ボタンのハンドラ onDevEvent を追加
export default function Header({ onChangeView, onSave, onLoad, onDevEvent }) {
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
      <button onClick={() => onChangeView('main')}>ホーム</button>
      <button onClick={() => onChangeView('management')}>管理室</button>
      <button onClick={() => onChangeView('daily')}>日報</button>
      {/* 開発用: 手動でランダムイベントを発生させる */}
      <button onClick={onDevEvent}>イベント発生（開発用）</button>
      <button onClick={onSave}>セーブ</button>
      <button onClick={() => fileInputRef.current?.click()}>ロード</button>
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
