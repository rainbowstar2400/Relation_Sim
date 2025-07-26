import React from 'react'

export default function LogDetail({ log = null, onBack }) {
  if (!log) {
    return (
      <section className="mb-6">
        <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">会話詳細</h2>
        <p>ログが見つかりません。</p>
        <button className="mt-4" onClick={onBack}>戻る</button>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">会話詳細</h2>
      <p className="mb-2">
        {log.time && <span className="mr-1">[{log.time}]</span>}
        {log.type}: {log.text}
      </p>
      {log.type !== 'SYSTEM' && (
        <pre className="whitespace-pre-wrap mb-4 bg-gray-700 p-2 rounded">
          {log.detail || '詳細はありません'}
        </pre>
      )}
      <button onClick={onBack}>戻る</button>
    </section>
  )
}
