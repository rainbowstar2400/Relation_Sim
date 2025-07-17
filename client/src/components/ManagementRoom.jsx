import React, { useState } from 'react'

// onBack は管理画面からメイン画面へ戻るためのコールバック
export default function ManagementRoom({ characters, addCharacter, onBack }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name) return
    addCharacter({ id: 'char_' + Date.now(), name, personality: {}, mbti: '', talkStyle: {}, interests: [] })
    setName('')
  }

  return (
    <section id="management-room" className="view">
      <h2 className="mb-2">▼ 管理室</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input className="border mr-2 text-black" value={name} onChange={e => setName(e.target.value)} placeholder="名前" />
        <button type="submit">追加する</button>
      </form>
      <h3 className="mb-2">▼ 既存キャラクター一覧</h3>
      <ul className="list-disc pl-4">
        {characters.map(c => <li key={c.id}>{c.name}</li>)}
      </ul>
      <button className="mt-4" onClick={onBack}>メイン画面に戻る</button>
    </section>
  )
}
