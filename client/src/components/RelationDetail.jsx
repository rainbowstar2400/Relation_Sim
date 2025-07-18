import React from 'react'
import { getEmotionLabel } from '../lib/emotionLabel.js'

// ログ行をパースして {time, text} を返す簡易関数
function parseLog(line) {
  const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
  if (m) return { time: m[1], text: m[3] }
  return { time: '', text: line }
}

// 好感度スコア(-100~100)を0~100のパーセントに変換
function affectionToPercent(score) {
  const clamped = Math.max(-100, Math.min(100, score))
  return (clamped + 100) / 2
}

// charA, charB: 対象キャラオブジェクト
// relationships, affections, emotions: 全体の状態
export default function RelationDetail({
  charA,
  charB,
  relationships = [],
  affections = [],
  emotions = [],
  logs = [],
  onBack,
}) {
  const pair = [charA.id, charB.id].sort()
  const relRec = relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
  const label = relRec ? relRec.label : 'なし'

  const affectionAB = affections.find(a => a.from === charA.id && a.to === charB.id)?.score || 0
  const affectionBA = affections.find(a => a.from === charB.id && a.to === charA.id)?.score || 0

  const emotionAB = getEmotionLabel({ emotions }, charA.id, charB.id) || 'なし'
  const emotionBA = getEmotionLabel({ emotions }, charB.id, charA.id) || 'なし'

  // 両名が登場するログを抽出し新しいものから5件表示
  const histories = logs
    .filter(l => l.includes(charA.name) && l.includes(charB.name))
    .slice(-5)
    .map(parseLog)
    .reverse()

  return (
    <section className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">
        ▼ {charA.name}⇄{charB.name} 関係詳細
      </h2>
      <div className="flex justify-between mb-2">
        <div>
          <p>キャラA: {charA.name}</p>
        </div>
        <div>
          <p>キャラB: {charB.name}</p>
        </div>
      </div>
      <p className="mb-2">関係ラベル: {label}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="mb-1">[{charA.name} → {charB.name}]</p>
          <p className="flex items-center mb-1">
            <span className="mr-1">好感度:</span>
            <progress value={affectionToPercent(affectionAB)} max="100" className="w-full h-2" />
          </p>
          <p>感情ラベル: {emotionAB}</p>
        </div>
        <div>
          <p className="mb-1">[{charB.name} → {charA.name}]</p>
          <p className="flex items-center mb-1">
            <span className="mr-1">好感度:</span>
            <progress value={affectionToPercent(affectionBA)} max="100" className="w-full h-2" />
          </p>
          <p>感情ラベル: {emotionBA}</p>
        </div>
      </div>
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 最近のやり取り履歴</h3>
      <ul className="list-disc pl-4 mb-2">
        {histories.length === 0 ? (
          <li>履歴なし</li>
        ) : (
          histories.map((h, idx) => (
            <li key={idx}>
              {h.time && <span className="mr-1">[{h.time}]</span>}
              {h.text}
            </li>
          ))
        )}
      </ul>
      <button className="mt-4" onClick={onBack}>戻る</button>
    </section>
  )
}

