import React, { useState, useEffect } from 'react'

// 日付文字列 (YYYY-MM-DD) を取得する簡易ヘルパー
const todayStr = () => new Date().toISOString().split('T')[0]

// reports: state.reports を想定
export default function DailyReport({ reports = {}, onBack }) {
  // 現在の日付を初期値とする
  const [date, setDate] = useState(todayStr())
  const [events, setEvents] = useState([])
  const [changes, setChanges] = useState([])

  // 日付変更や reports 更新時にリストを再取得
  useEffect(() => {
    const data = reports[date] || { events: [], changes: [] }
    setEvents(data.events)
    setChanges(data.changes)
  }, [date, reports])

  const formatTime = (ts) => new Date(ts).toTimeString().slice(0, 5)

  return (
    <section id="daily-report-view" className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 日報</h2>

      {/* 日付選択エリア */}
      <div className="flex items-center mb-2">
        <label htmlFor="report-date" className="mr-1">日付:</label>
        <input
          id="report-date"
          type="date"
          className="text-black"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 発生イベント一覧 */}
      <h3 className="mb-1">発生イベント</h3>
      <ul className="mb-2 list-disc pl-4">
        {events.length === 0 ? (
          <li>イベントがありません</li>
        ) : (
          events.map((ev, idx) => (
            <li key={idx}>[{formatTime(ev.timestamp)}] {ev.description || ''}</li>
          ))
        )}
      </ul>

      {/* 変化履歴一覧 */}
      <h3 className="mb-1">変化履歴</h3>
      <ul className="mb-4 list-disc pl-4">
        {changes.length === 0 ? (
          <li>変化はありません</li>
        ) : (
          changes.map((chg, idx) => (
            <li key={idx}>[{chg.time}] {chg.description}</li>
          ))
        )}
      </ul>

      <button onClick={onBack}>メインに戻る</button>
    </section>
  )
}
