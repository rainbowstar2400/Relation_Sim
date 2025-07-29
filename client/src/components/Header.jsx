import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'

// ヘッダー。各画面への移動やセーブ/ロードなどを行う
// リセットボタン用の onReset ハンドラを受け取る
export default function Header({ onSave, onLoad, onReset }) {
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
      <Link to="/">ホーム</Link>
      <Link to="/management">管理室</Link>
      <Link to="/daily">日報</Link>
      <button onClick={onSave}>セーブ</button>
      <button onClick={() => fileInputRef.current?.click()}>ロード</button>
      {/* セーブデータを初期化するリセットボタン。ロードボタンの右隣に配置 */}
      <button onClick={onReset}>リセット</button>
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
