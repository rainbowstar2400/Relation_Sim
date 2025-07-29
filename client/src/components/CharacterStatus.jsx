import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEmotionLabel } from '../lib/emotionLabel.js'
import RelationItem from './RelationItem.jsx'

// ログ文字列をパースする簡易関数
function parseLog(line) {
  if (typeof line === 'string') {
    const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
    if (m) return { time: m[1], text: m[3] }
    return { time: '', text: line }
  }
  return line
}


// characters: 全キャラクター一覧
// logs: これまでのログ
// 関係情報も受け取れるように引数を拡張
export default function CharacterStatus({
  characters = [],
  logs = [],
  trusts = [],
  relationships = [],
  nicknames = [],
  affections = [],
  emotions = [],
  onOpenRelation,
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const char = characters.find(c => c.id === id)
  if (!char) return null
  const p = char.personality || {}
  const talk = char.talkStyle || {}
  const trustRec = trusts.find(t => t.id === char.id)
  const trust = trustRec ? trustRec.score : 50

  // 実際の関係情報を抽出
  const relations = characters
    .filter(c => c.id !== char.id)
    .map(other => {
      const pair = [char.id, other.id].sort()
      const relRec = relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
      const label = relRec ? relRec.label : 'なし'

      const affectionTo =
        affections.find(a => a.from === char.id && a.to === other.id)?.score || 0
      const affectionFrom =
        affections.find(a => a.from === other.id && a.to === char.id)?.score || 0

      const nicknameTo =
        nicknames.find(n => n.from === char.id && n.to === other.id)?.nickname || ''
      const nicknameFrom =
        nicknames.find(n => n.from === other.id && n.to === char.id)?.nickname || ''

      const emotion = getEmotionLabel({ emotions }, char.id, other.id) || 'なし'

      return {
        otherId: other.id,
        otherName: other.name,
        label,
        affectionTo,
        affectionFrom,
        nicknameTo,
        nicknameFrom,
        emotion
      }
    })
    .sort((a, b) => (b.affectionTo + b.affectionFrom) - (a.affectionTo + a.affectionFrom))

  // 対象キャラ名を含むログを抽出し、新しいものから5件表示
  const events = logs
    .filter(l => (typeof l === 'string' ? l : l.text).includes(char.name))
    .slice(-5)
    .map(parseLog)
    .reverse()

  return (
    <section id="character-status-view" className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 情報</h2>
      <div className="basic-info mb-2">
        <p>名前: {char.name}</p>
        <p>年齢: {char.age ?? '不明'}</p>
        <p>性別: {char.gender || '不明'}</p>
        <p>MBTI: {char.mbti}</p>
        <p>話し方: {talk.template || '未設定'}</p>
        <p className="ml-4">特徴: {talk.description || '未設定'}</p>
        <p className="ml-4">一人称: {talk.firstPerson || '未設定'}</p>
        <p>現在状態: {char.condition || '活動中'}</p>
        <p>活動傾向: {char.activityPattern || '通常'}</p>
        <p>信頼度: {trust}</p>
        <p>興味関心: {(char.interests || []).length > 0 ? char.interests.join(', ') : 'なし'}</p>
      </div>

      {/* 性格のバー表示 */}
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 性格</h3>
      <ul className="mb-2 list-none p-0">
        <li className="mb-1">
          社交性:
          <progress value={p.social || 0} max="5" className="ml-2 w-40 h-2" />
        </li>
        <li className="mb-1">
          気配り:
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
            <RelationItem
              key={idx}
              charName={char.name}
              relation={rel}
              onOpen={() => onOpenRelation && onOpenRelation(char.id, rel.otherId)}
            />
          ))
        )}
      </div>

      {/* 最近のイベント履歴 */}
      <h3 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ イベント履歴</h3>
      <ul id="status-events" className="mb-2 list-none pl-4">
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

    </section>
  )
}

