import React, { useState } from 'react'

export default function ConsultationArea({ characters }) {
  const [consultations, setConsultations] = useState([])
  const [current, setCurrent] = useState(null)
  const [answer, setAnswer] = useState('')

  const addConsultation = () => {
    if (consultations.length >= 3) return
    const char = characters[Math.floor(Math.random() * characters.length)]
    const c = {
      id: Date.now(),
      char,
      question: '相談内容の例です。どうしたらいいと思う？'
    }
    setConsultations(prev => [...prev, c])
  }

  const open = (c) => {
    setCurrent(c)
    setAnswer('')
  }

  const close = () => {
    setCurrent(null)
  }

  const send = () => {
    setConsultations(prev => prev.filter(item => item.id !== current.id))
    setCurrent(null)
  }

  return (
    <section className="consultation-area mb-4">
      <h2 className="mb-2">▼ 困りごと相談エリア</h2>
      <ul className="mb-2">
        {consultations.slice(0, 3).map(c => (
          <li key={c.id} className="consultation-item flex justify-between bg-gray-700 rounded px-2 py-1 mb-1">
            <span>・{c.char.name}から相談があります</span>
            <button onClick={() => open(c)}>対応する</button>
          </li>
        ))}
      </ul>
      <button className="add-consultation" onClick={addConsultation}>+ 相談をさらに受ける</button>

      {current && (
        <div className="consultation-popup fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="popup-inner bg-gray-700 p-4 rounded relative w-11/12 max-w-sm">
            <button className="popup-close absolute top-1 right-2" onClick={close}>×</button>
            <p className="mb-2">{current.char.name}「{current.question}」</p>
            <input className="text-black w-full mb-2" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="ここに入力" />
            <button onClick={send}>送信する</button>
          </div>
        </div>
      )}
    </section>
  )
}
