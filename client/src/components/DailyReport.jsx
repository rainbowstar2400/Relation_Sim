import React, { useState, useEffect } from 'react'

// 日付文字列 (YYYY-MM-DD) を取得する簡易ヘルパー
const todayStr = () => new Date().toISOString().split('T')[0]

// reports: state.reports を想定
export default function DailyReport({ reports = {}, characters = [], onBack, onOpenLog }) {
  // 現在の日付を初期値とする
  const [date, setDate] = useState(todayStr())
  const [events, setEvents] = useState([])
  const [changes, setChanges] = useState([])
  // 複数選択されたキャラ名を配列で保持
  const [selectedChars, setSelectedChars] = useState([])
  const [changeType, setChangeType] = useState('all')

  // キャラ選択時の処理
  const handleCharChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value)
    // 先頭の "" (全員) が選択された場合は選択をリセット
    if (values.includes('')) {
      setSelectedChars([])
    } else {
      setSelectedChars(values)
    }
  }

  // 日付変更や reports 更新時にリストを再取得
  useEffect(() => {
    const data = reports[date] || { events: [], changes: [] }
    let evs = data.events
    let chgs = data.changes

    // キャラが選ばれている場合は該当キャラを含む項目のみ表示
    if (selectedChars.length > 0) {
      const matchChar = (text = '') =>
        selectedChars.some(name => text.includes(name))
      evs = evs.filter(ev => matchChar(ev.description))
      chgs = chgs.filter(chg => matchChar(chg.description))
    }

    switch (changeType) {
      case 'event':
        chgs = []
        break
      case 'relation':
        evs = []
        chgs = chgs.filter(chg => chg.description?.includes('関係'))
        break
      case 'emotion':
        evs = []
        chgs = chgs.filter(chg => chg.description?.includes('印象'))
        break
      default:
        // all - 何もしない
        break
    }

    setEvents(evs)
    setChanges(chgs)
  }, [date, reports, selectedChars, changeType])

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
      <div className="flex items-center mb-2 gap-2">
        <label htmlFor="char-select" className="mr-1">住人:</label>
        <select
          id="char-select"
          className="text-black"
          multiple
          value={selectedChars}
          onChange={handleCharChange}
        >
          <option value="">全員</option>
          {characters.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <label htmlFor="change-type" className="ml-2 mr-1">変化タイプ:</label>
        <select
          id="change-type"
          className="text-black"
          value={changeType}
          onChange={(e) => setChangeType(e.target.value)}
        >
          <option value="all">すべて</option>
          <option value="event">イベント</option>
          <option value="relation">関係</option>
          <option value="emotion">印象</option>
        </select>
      </div>

      {/* 発生イベント一覧 */}
      <h3 className="mb-1">発生イベント</h3>
      <ul className="mb-2 list-none pl-4">
        {events.length === 0 ? (
          <li>イベントがありません</li>
        ) : (
          events.map((ev, idx) => (
            <li
              key={idx}
              className={ev.logId ? 'cursor-pointer text-blue-300' : ''}
              onClick={() => ev.logId && onOpenLog && onOpenLog(ev.logId)}
            >
              [{formatTime(ev.timestamp)}] {ev.description || ''}
            </li>
          ))
        )}
      </ul>

      {/* 変化履歴一覧 */}
      <h3 className="mb-1">変化履歴</h3>
      <ul className="mb-4 list-none pl-4">
        {changes.length === 0 ? (
          <li>変化はありません</li>
        ) : (
          changes.map((chg, idx) => (
            <li
              key={idx}
              className={chg.logId ? 'cursor-pointer text-blue-300' : ''}
              onClick={() => chg.logId && onOpenLog && onOpenLog(chg.logId)}
            >
              [{chg.time}] {chg.description}
            </li>
          ))
        )}
      </ul>

    </section>
  )
}
