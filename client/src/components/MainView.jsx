import React from 'react'

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
      <section className="log-display">
        <h2 className="mb-2">▼ ログ表示エリア (CLI風)</h2>
        <div className="log-content h-40 overflow-y-auto bg-black p-2">
          {logs.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </section>
    </div>
  )
}
