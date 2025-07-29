import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEmotionLabel } from '../lib/emotionLabel.js'
import AffectionBar from './AffectionBar.jsx'

// ログ行をパースして {time, text} を返す簡易関数
function parseLog(line) {
  if (typeof line === 'string') {
    const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
    if (m) return { time: m[1], text: m[3] }
    return { time: '', text: line }
  }
  return line
}


// charA, charB: 対象キャラオブジェクト
// relationships, affections, emotions: 全体の状態
export default function RelationDetail({
  characters = [],
  relationships = [],
  affections = [],
  emotions = [],
  nicknames = [],
  logs = [],
}) {
  const { idA, idB } = useParams()
  const navigate = useNavigate()
  const charA = characters.find(c => c.id === idA)
  const charB = characters.find(c => c.id === idB)
  if (!charA || !charB) return null
  const pair = [charA.id, charB.id].sort()
  const relRec = relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
  const label = relRec ? relRec.label : 'なし'

  const affectionAB = affections.find(a => a.from === charA.id && a.to === charB.id)?.score || 0
  const affectionBA = affections.find(a => a.from === charB.id && a.to === charA.id)?.score || 0

  const emotionAB = getEmotionLabel({ emotions }, charA.id, charB.id) || 'なし'
  const emotionBA = getEmotionLabel({ emotions }, charB.id, charA.id) || 'なし'

  const nicknameAB =
    nicknames.find(n => n.from === charA.id && n.to === charB.id)?.nickname || ''
  const nicknameBA =
    nicknames.find(n => n.from === charB.id && n.to === charA.id)?.nickname || ''

  // 両名が登場するログを抽出し新しいものから5件表示
  const histories = logs
    .filter(l => {
      const text = typeof l === 'string' ? l : l.text || ''
      return text.includes(charA.name) && text.includes(charB.name)
    })
    .slice(-5)
    .map(parseLog)
    .reverse()

  return (
    <section className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">
        ▼ {charA.name} ⇄ {charB.name} 関係詳細
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <p>{charA.name}</p>
        </div>
        <div>
          <p>{charB.name}</p>
        </div>
      </div>
      <p className="mb-2">関係: {label}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="mb-1">[{charA.name} → {charB.name}]</p>
          <p className="flex items-center mb-1">
            <span className="mr-1">好感度:</span>
            <AffectionBar score={affectionAB} />
          </p>
          <p>印象: {emotionAB}</p>
          <p>呼び方: {nicknameAB ? `「${nicknameAB}」` : '―'}</p>
        </div>
        <div>
          <p className="mb-1">[{charB.name} → {charA.name}]</p>
          <p className="flex items-center mb-1">
            <span className="mr-1">好感度:</span>
            <AffectionBar score={affectionBA} />
          </p>
          <p>印象: {emotionBA}</p>
          <p>呼び方: {nicknameBA ? `「${nicknameBA}」` : '―'}</p>
        </div>
      </div>
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 直近の関わり</h3>
      <ul className="list-none pl-4 mb-2">
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
      <button className="mt-4" onClick={() => navigate(-1)}>戻る</button>
    </section>
  )
}

