import React from 'react'
import ConsultationArea from './ConsultationArea.jsx'

function parseLog(line) {
  const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
  if (m) return { time: m[1], type: m[2], text: m[3] }
  return { time: '', type: 'EVENT', text: line }
}

export default function MainView({ characters, onSelect, logs }) {
  return (
    <div>
      <section className="character-observer mb-4">
        <h2 className="mb-2">▼ みんなの様子</h2>
        <div className="character-list flex overflow-x-auto gap-2">
          {characters.map(c => (
            <div key={c.id} className="character-card w-24 h-16 bg-gray-600 flex items-center justify-center cursor-pointer" onClick={() => onSelect(c)}>
              {c.name}
            </div>
          ))}
        </div>
      </section>
      <ConsultationArea characters={characters} />
      <section className="log-display">
        <h2 className="mb-2">▼ ログ表示エリア (CLI風)</h2>
        <div className="log-content h-40 overflow-y-auto bg-black p-2">
          {logs.map((line, idx) => {
            const { time, type, text } = parseLog(line)
            const cls = type === 'SYSTEM'
              ? 'text-orange-300 font-bold'
              : 'text-sky-400 font-bold'
            return (
              <p key={idx} className="mb-1">
                {time && <span className="text-gray-400 mr-1">[{time}]</span>}
                <span className={cls}>{type}:</span> {text}
              </p>
            )
          })}
        </div>
      </section>
    </div>
  )
}
