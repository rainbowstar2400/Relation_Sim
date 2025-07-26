import React, { useRef } from 'react'

// スタート画面。続きから始める・新しく始めるの選択肢を表示する
export default function StartScreen({ onContinue, onNewGame }) {
  const fileInputRef = useRef(null)

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0]
    if (file) onContinue(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-4">
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
    </div>
  )
}
