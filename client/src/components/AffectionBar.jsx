import React from 'react'

// 好感度スコア(-100〜100)を0〜100%に変換
export function affectionToPercent(score) {
  const clamped = Math.max(-100, Math.min(100, score))
  return (clamped + 100) / 2
}

// 青色バーと区切り線付きの好感度表示
export default function AffectionBar({ score }) {
  const percent = affectionToPercent(score)

  return (
    {/* 外枠にも白線を付ける */}
    <div className="relative w-40 h-2 bg-gray-600 border border-white">
      {/* 実際のバー部分 */}
      <div className="h-full" style={{ width: `${percent}%`, backgroundColor: '#4eb0db' }} />
      {/* 区切り線を4分割で表示。色は白に変更し、太さを維持 */}
      <div className="absolute inset-0 grid grid-cols-4 divide-x-2 divide-white pointer-events-none opacity-50">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  )
}
