import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// ヘッダー。各画面への移動ボタンと時刻表示のみを扱う
export default function Header() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

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
      {/* 設定画面へのリンクを追加 */}
      <Link to="/settings">設定</Link>
      <div className="ml-auto text-right">
        <span id="time" className="font-bold mr-1">{time}</span>
        <span id="date">{date}</span>
      </div>
    </header>
  )
}
