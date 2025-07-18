import React from 'react'
import ConsultationArea from './ConsultationArea.jsx'
import LogList from './LogList.jsx'

export default function MainView({ characters, onSelect, logs, trusts, addLog, updateTrust, updateLastConsultation }) {

  return (
    <div>
      <section className="mb-6">
        <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ みんなの様子</h2>
        <div className="flex overflow-x-auto gap-2 pb-2">
          {characters.map(c => (
            <div
              key={c.id}
              className="flex-shrink-0 w-24 h-16 bg-gray-600 border border-gray-500 rounded flex flex-col items-center justify-center cursor-pointer"
              onClick={() => onSelect(c)}
            >
              <span>{c.name}</span>
              {c.condition && (
                <span className="text-xs text-gray-300">{c.condition}</span>
              )}
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
        <LogList logs={logs} />
      </section>
    </div>
  )
}
