import React from 'react'

// 関係カード1件分を展開表示するコンポーネント
// charName: ベースキャラクター名
// relation: 相手との関係情報
function affectionToPercent(score) {
  const clamped = Math.max(-100, Math.min(100, score))
  return (clamped + 100) / 2
}

export default function RelationItem({ charName, relation, onOpen }) {
  return (
    <details className="flex-shrink-0 w-60 bg-gray-700 border border-gray-600 rounded p-2">
      <summary className="cursor-pointer list-none">
        <p className="font-bold text-yellow-300">{relation.otherName}</p>
        <p className="text-sm">
          {relation.label} | 印象: {relation.emotion}
        </p>
        {onOpen && (
          <button
            type="button"
            className="ml-2 text-blue-300 underline"
            onClick={e => {
              e.stopPropagation()
              onOpen()
            }}
          >
            詳細
          </button>
        )}
      </summary>
      <div className="mt-2 ml-2 text-sm">
        <p>[{charName} → {relation.otherName}]</p>
        <p className="flex items-center mb-1">
          <span className="mr-1">好感度:</span>
          <progress value={affectionToPercent(relation.affectionTo)} max="100" className="w-full h-2" />
        </p>
        <p>呼び方：{relation.nicknameTo ? `「${relation.nicknameTo}」` : '―'}</p>
        <p className="mt-2">[{relation.otherName} → {charName}]</p>
        <p className="flex items-center mb-1">
          <span className="mr-1">好感度:</span>
          <progress value={affectionToPercent(relation.affectionFrom)} max="100" className="w-full h-2" />
        </p>
        <p>呼び方：{relation.nicknameFrom ? `「${relation.nicknameFrom}」` : '―'}</p>
      </div>
    </details>
  )
}
