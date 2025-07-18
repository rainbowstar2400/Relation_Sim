import React, { useEffect, useState } from 'react'

// characters: キャラクター一覧
// trusts: 各キャラクターの信頼度
// updateTrust: 信頼度を更新する関数
// addLog: ログ追加用関数
export default function ConsultationArea({ characters, trusts, updateTrust, addLog, updateLastConsultation }) {
  const [templates, setTemplates] = useState([])
  const [consultations, setConsultations] = useState([])
  const [current, setCurrent] = useState(null)
  const [selected, setSelected] = useState('')
  const [answered, setAnswered] = useState(false)
  const AUTO_INTERVAL_MS = 3600000 // 1時間ごと
  const MAX_AUTO_CONSULTATIONS = 2 // 自動生成時の上限
  const MAX_TOTAL_CONSULTATIONS = 3 // 手動追加も含めた上限

  // 初回マウント時に相談テンプレートを取得
  useEffect(() => {
    fetch('/data/trouble_prompt_templates.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setTemplates(data))
      .catch(err => console.error('テンプレートの取得に失敗しました', err))
  }, [])

  // 自動生成のスケジューラ
  useEffect(() => {
    const timer = setInterval(() => {
      setConsultations(prev => {
        if (prev.length >= MAX_AUTO_CONSULTATIONS || templates.length === 0) return prev
        const available = characters.filter(c => Date.now() - (c.lastConsultation || 0) >= AUTO_INTERVAL_MS)
        if (available.length === 0) return prev
        const char = available[Math.floor(Math.random() * available.length)]
        const template = templates[Math.floor(Math.random() * templates.length)]
        const id = Date.now()
        const timeout = setTimeout(() => {
          setConsultations(p => p.filter(c => c.id !== id))
        }, AUTO_INTERVAL_MS)
        updateLastConsultation(char.id)
        return [...prev, { id, char, template, timeout }]
      })
    }, AUTO_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [templates, characters])

  // 相談イベントを追加
  const addConsultation = () => {
    if (templates.length === 0) return
    if (consultations.length >= MAX_TOTAL_CONSULTATIONS) return
    const available = characters.filter(c => Date.now() - (c.lastConsultation || 0) >= AUTO_INTERVAL_MS)
    if (available.length === 0) return
    const char = available[Math.floor(Math.random() * available.length)]
    const template = templates[Math.floor(Math.random() * templates.length)]
    const id = Date.now()
    const timeout = setTimeout(() => {
      setConsultations(prev => prev.filter(ev => ev.id !== id))
    }, AUTO_INTERVAL_MS)
    const c = { id, char, template, timeout }
    setConsultations(prev => [...prev, c])
    updateLastConsultation(char.id)
  }

  const openPopup = (c) => {
    setCurrent(c)
    setSelected('')
    setAnswered(false)
    addLog(`${c.char.name}がプレイヤーに相談しています…`)
  }

  // 回答を送信
  const sendAnswer = () => {
    if (!current) return
    if (answered) {
      closePopup()
      return
    }
    let kind = 'neutral'
    if (current.template.form === 'choice') {
      if (!selected) return
      kind = selected
    }
    let delta = 0
    if (kind === 'good') delta = Math.floor(Math.random() * 3) + 3
    else if (kind === 'neutral') delta = Math.floor(Math.random() * 3)
    else delta = -(Math.floor(Math.random() * 3) + 2)

    updateTrust(current.char.id, delta)
    updateLastConsultation(current.char.id)
    clearTimeout(current.timeout)
    setAnswered(true)
  }

  // ポップアップを閉じる
  const closePopup = () => {
    if (answered && current) {
      clearTimeout(current.timeout)
      setConsultations(prev => prev.filter(ev => ev.id !== current.id))
    }
    setCurrent(null)
  }

  return (
    <section className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 困りごと相談エリア</h2>
      <ul className="mb-2 list-none">
        {consultations.map(c => (
          <li key={c.id} className="flex justify-between bg-gray-700 rounded px-2 py-1 mb-1">
            <span>・{c.char.name}から相談があります</span>
            <button onClick={() => openPopup(c)}>対応する</button>
          </li>
        ))}
      </ul>
      <button className="mt-2" onClick={addConsultation}>+ 相談をさらに受ける</button>

      {current && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-700 p-4 rounded relative w-11/12 max-w-sm pt-12">
            <button className="absolute top-2 right-2" onClick={closePopup}>×</button>
            <p className="mb-2">{current.char.name}「{current.template.core_prompt}」</p>
            {current.template.form === 'choice' ? (
              <div className="mb-2">
                {['good', 'neutral', 'bad'].map(type => (
                  <label key={type} className="block">
                    <input
                      type="radio"
                      name="consult-answer"
                      value={type}
                      className="mr-1"
                      checked={selected === type}
                      onChange={e => setSelected(e.target.value)}
                    />
                    {type === 'good' ? 'A: いいと思う' : type === 'neutral' ? 'B: そうだね' : 'C: やめておこう'}
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="text-black w-full mb-2"
                value={selected}
                onChange={e => setSelected(e.target.value)}
                placeholder="ここに入力"
              />
            )}
            <button onClick={answered ? closePopup : sendAnswer}>{answered ? '完了' : '決定'}</button>
            {answered && <p className="mt-2">ありがとう！</p>}
          </div>
        </div>
      )}
    </section>
  )
}
