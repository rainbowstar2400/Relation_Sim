import React from 'react'

// ログ文字列をパースする簡易関数
function parseLog(line) {
  const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
  if (m) return { time: m[1], text: m[3] }
  return { time: '', text: line }
}

// characters: 全キャラクター一覧
// logs: これまでのログ
export default function CharacterStatus({ char, characters = [], logs = [], onBack }) {
  const p = char.personality || {}

  // 簡易的な関係情報を生成（現状ダミー）
  const relations = characters
    .filter(c => c.id !== char.id)
    .map(other => ({
      otherName: other.name,
      label: '友達',
      affection: 50,
      emotion: '普通'
    }))

  // 対象キャラ名を含むログを抽出し、新しいものから5件表示
  const events = logs
    .filter(l => l.includes(char.name))
    .slice(-5)
    .map(parseLog)
    .reverse()

  return (
    <section id="character-status-view" className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ ステータス</h2>
      <div className="basic-info mb-2">
        <p>名前: {char.name}</p>
        <p>MBTI: {char.mbti}</p>
      </div>

      {/* 性格パラメータのバー表示 */}
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 性格パラメータ</h3>
      <ul className="mb-2 list-none p-0">
        <li className="mb-1">
          社交性:
          <progress value={p.social || 0} max="5" className="ml-2 w-40 h-2" />
        </li>
        <li className="mb-1">
          気配り傾向:
          <progress value={p.kindness || 0} max="5" className="ml-2 w-40 h-2" />
        </li>
        <li className="mb-1">
          頑固さ:
          <progress value={p.stubbornness || 0} max="5" className="ml-2 w-40 h-2" />
        </li>
        <li className="mb-1">
          行動力:
          <progress value={p.activity || 0} max="5" className="ml-2 w-40 h-2" />
        </li>
        <li>
          表現力:
          <progress value={p.expressiveness || 0} max="5" className="ml-2 w-40 h-2" />
        </li>
      </ul>

      {/* 関係一覧（横スクロールカード） */}
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 関係一覧</h3>
      <div className="flex overflow-x-auto gap-2 mb-2">
        {relations.length === 0 ? (
          <p>関係情報なし</p>
        ) : (
          relations.map((rel, idx) => (
            <div key={idx} className="flex-shrink-0 w-40 bg-gray-700 border border-gray-600 rounded p-2">
              <p className="font-bold text-yellow-300 mb-1">{rel.otherName}</p>
              <p className="text-sm mb-1">
                {rel.label} | {rel.emotion}
              </p>
              <progress value={rel.affection} max="100" className="w-full h-2" />
            </div>
          ))
        )}
      </div>

      {/* 最近のイベント履歴 */}
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ イベント履歴</h3>
      <ul id="status-events" className="mb-2 list-disc pl-4">
        {events.length === 0 ? (
          <li>履歴なし</li>
        ) : (
          events.map((ev, idx) => (
            <li key={idx}>
              {ev.time && <span className="mr-1">[{ev.time}]</span>}
              {ev.text}
            </li>
          ))
        )}
      </ul>

      <button className="mt-4" onClick={onBack}>メインに戻る</button>
    </section>
  )
}

