import React, { useEffect, useRef } from 'react'
import ConsultationArea from './ConsultationArea.jsx'

function parseLog(line) {
  const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
  if (m) return { time: m[1], type: m[2], text: m[3] }
  return { time: '', type: 'EVENT', text: line }
}

export default function MainView({ characters, onSelect, logs, trusts, addLog, updateTrust, updateLastConsultation }) {
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div>
      <section className="mb-6">
        <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ みんなの様子</h2>
        <div className="flex overflow-x-auto gap-2 pb-2">
          {characters.map(c => (
            <div key={c.id} className="flex-shrink-0 w-24 h-16 bg-gray-600 border border-gray-500 rounded flex items-center justify-center cursor-pointer" onClick={() => onSelect(c)}>
              {c.name}
            </div>
          ))}
        </div>
      </section>
      <ConsultationArea
        characters={characters}
        trusts={trusts}
        updateTrust={updateTrust}
        addLog={addLog}
        updateLastConsultation={updateLastConsultation}
      />
      <section className="mb-6">
        <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ ログ表示エリア (CLI風)</h2>
        <div ref={logRef} className="h-52 overflow-y-auto bg-black border border-gray-600 p-3 font-mono rounded text-gray-100">
          {logs.map((line, idx) => {
            const { time, type, text } = parseLog(line)
            const cls = type === 'SYSTEM'
              ? 'text-orange-300 font-bold'
              : 'text-blue-400 font-bold'
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
