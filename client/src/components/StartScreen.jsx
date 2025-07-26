import React, { useRef, useState, useEffect } from 'react'

// スタート画面。続きから始める・新しく始めるの選択肢を表示する
export default function StartScreen({ onContinue, onNewGame, showIntro, onIntroFinish }) {
  const fileInputRef = useRef(null)
  const texts = [
    'ようこそ、「Relation Sim」の世界へ。',
    'ここは、あなたのキャラクターたちが暮らす小さな箱庭。彼らは日々の中で、少しずつ関係を築いていきます。',
    'どんなつながりが生まれていくのかは、まだ誰にもわかりません。あなたは、その日常をそっと見守ることができます。',
    'まずは、一人目の住人を迎え入れてみましょう。',
  ]

  const [visible, setVisible] = useState(0)

  // showIntro が切り替わったときに段落表示をリセット
  useEffect(() => {
    if (showIntro) {
      setVisible(0)
    }
  }, [showIntro])

  // 段落を順に表示
  useEffect(() => {
    if (showIntro && visible < texts.length) {
      const timer = setTimeout(() => setVisible(v => v + 1), 1500)
      return () => clearTimeout(timer)
    }
  }, [showIntro, visible])

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0]
    if (file) onContinue(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-4">
      {!showIntro ? (
        <>
          <h1 className="text-lg mb-4">セーブデータの選択</h1>
          <button onClick={() => fileInputRef.current?.click()}>続きからはじめる</button>
          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            onChange={handleSelectFile}
            className="hidden"
          />
          <button onClick={onNewGame}>新しくはじめる</button>
        </>
      ) : (
        <>
          {texts.map((t, i) => (
            <p key={i} className={`mb-4 ${i < visible ? '' : 'invisible'}`}>{t}</p>
          ))}
          {visible === texts.length && (
            <button onClick={onIntroFinish}>▶ はじめる</button>
          )}
        </>
      )}
    </div>
  )
}
