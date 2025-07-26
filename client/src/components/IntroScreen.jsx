import React, { useState, useEffect } from 'react'

export default function IntroScreen({ onStart }) {
  // 段落ごとに表示する文章一覧
  const texts = [
    'ようこそ、「Relation Sim」の世界へ。',
    'ここは、あなたのキャラクターたちが暮らす小さな箱庭。彼らは日々の中で、少しずつ関係を築いていきます。',
    'どんなつながりが生まれていくのかは、まだ誰にもわかりません。あなたは、その日常をそっと見守ることができます。',
    'まずは、一人目の住人を迎え入れてみましょう。',
  ]

  // 現在表示している段落数
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (visible < texts.length) {
      const timer = setTimeout(() => setVisible(v => v + 1), 1500)
      return () => clearTimeout(timer)
    }
  }, [visible])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-black bg-opacity-50 p-4 rounded text-xl w-full max-w-md">
        {texts.map((t, i) => (
          <p key={i} className={`mb-4 ${i < visible ? '' : 'invisible'}`}>{t}</p>
        ))}
        <div className={`mt-4 text-center ${visible === texts.length ? '' : 'invisible'}`}>
          <button onClick={onStart}>▶ はじめる</button>
        </div>
      </div>
    </div>
  )
}
