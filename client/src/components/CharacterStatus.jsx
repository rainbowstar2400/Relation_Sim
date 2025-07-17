import React from 'react'

export default function CharacterStatus({ char, onBack }) {
  const p = char.personality || {}
  return (
    <section id="character-status-view" className="view">
      <h2 className="mb-2">▼ ステータス</h2>
      <div className="basic-info mb-2">
        <p>名前: {char.name}</p>
        <p>MBTI: {char.mbti}</p>
      </div>
      <h3 className="mb-2">▼ 性格パラメータ</h3>
      <ul className="personality-list list-disc pl-4">
        <li>社交性: {p.social}</li>
        <li>気配り傾向: {p.kindness}</li>
        <li>頑固さ: {p.stubbornness}</li>
        <li>行動力: {p.activity}</li>
        <li>表現力: {p.expressiveness}</li>
      </ul>
      <button className="mt-4" onClick={onBack}>メインに戻る</button>
    </section>
  )
}
