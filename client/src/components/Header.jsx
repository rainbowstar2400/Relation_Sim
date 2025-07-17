import React, { useEffect, useState } from 'react'

export default function Header({ onChangeView }) {
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
    <header className="top-menu flex gap-2 mb-4">
      <button onClick={() => onChangeView('management')}>管理室</button>
      <button onClick={() => onChangeView('daily')}>日報</button>
      <div className="datetime ml-auto text-right">
        <span id="time" className="font-bold mr-1">{time}</span>
        <span id="date">{date}</span>
      </div>
    </header>
  )
}
