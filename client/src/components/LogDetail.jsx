import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function LogDetail({ logs = [] }) {
  const { logId } = useParams()
  const navigate = useNavigate()
  const log = logs.find(l => l.id === logId) || null
  if (!log) {
    return (
      <section className="mb-6">
        <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">会話詳細</h2>
        <p>ログが見つかりません。</p>
        <button className="mt-4" onClick={() => navigate(-1)}>戻る</button>
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
      <button onClick={() => navigate(-1)}>戻る</button>
    </section>
  )
}
