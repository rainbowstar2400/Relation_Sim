import React from 'react'

export default function DailyReport({ onBack }) {
  return (
    <section id="daily-report-view" className="view">
      <h2 className="mb-2">▼ 日報</h2>
      <p className="mb-2">（日報データは未実装）</p>
      <button onClick={onBack}>メインに戻る</button>
    </section>
  )
}
