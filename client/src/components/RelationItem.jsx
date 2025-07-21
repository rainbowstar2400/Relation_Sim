import React from 'react'
import AffectionBar from './AffectionBar.jsx'

// 関係カード1件分を展開表示するコンポーネント
// charName: ベースキャラクター名
// relation: 相手との関係情報

export default function RelationItem({ charName, relation, onOpen }) {
  return (
    <details className="flex-shrink-0 w-60 bg-gray-700 border border-gray-600 rounded p-2">
      <summary className="cursor-pointer list-none">
        <p className="font-bold text-yellow-300">{relation.otherName}</p>
        {/* 印象表示の右側に詳細ボタンを配置 */}
        <p className="text-sm flex items-center">
          {relation.label} | 印象: {relation.emotion}
          {onOpen && (
            <button
              type="button"
              className="ml-2 text-blue-300 underline"
              onClick={e => {
                // summaryの開閉と独立させるためイベント伝播を停止
                e.stopPropagation()
                onOpen()
              }}
            >
              詳細
            </button>
          )}
        </p>
      </summary>
      <div className="mt-2 ml-2 text-sm">
        <p>[{charName} → {relation.otherName}]</p>
        <div className="flex items-center mb-1">
          <span className="mr-1">好感度:</span>
          <AffectionBar score={relation.affectionTo} />
        </div>
        <p>呼び方：{relation.nicknameTo ? `「${relation.nicknameTo}」` : '―'}</p>
        <p className="mt-2">[{relation.otherName} → {charName}]</p>
        <div className="flex items-center mb-1">
          <span className="mr-1">好感度:</span>
          <AffectionBar score={relation.affectionFrom} />
        </div>
        <p>呼び方：{relation.nicknameFrom ? `「${relation.nicknameFrom}」` : '―'}</p>
      </div>
    </details>
  )
}
