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

  // 表示完了した段落の一覧
  const [finished, setFinished] = useState([])
  // タイピング中の段落テキスト
  const [typing, setTyping] = useState('')

  // showIntro が切り替わったときに状態をリセット
  useEffect(() => {
    if (showIntro) {
      setFinished([])
      setTyping('')
    }
  }, [showIntro])

  // 段落を1つずつタイピング表示
  useEffect(() => {
    if (!showIntro) return
    if (finished.length >= texts.length) return

    const full = texts[finished.length].replace(/。/g, '。\n')
    let i = 0
    setTyping('')
    const timer = setInterval(() => {
      i++
      setTyping(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(timer)
        setTimeout(() => {
          setFinished(prev => [...prev, full])
          setTyping('')
        }, 300)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [showIntro, finished])

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
          {finished.map((t, i) => (
            <p key={i} className="mb-4 whitespace-pre-wrap font-mono">{t}</p>
          ))}
          {typing && (
            <p className="mb-4 whitespace-pre-wrap font-mono">{typing}</p>
          )}
          {finished.length === texts.length && !typing && (
            <button onClick={onIntroFinish}>▶ はじめる</button>
          )}
        </>
      )}
    </div>
  )
}
