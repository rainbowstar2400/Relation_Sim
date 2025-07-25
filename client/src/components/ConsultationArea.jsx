import React, { useEffect, useState } from 'react'

import { adjustLineByPersonality } from '../gpt/adjustLine.js'

import { getTimeSlot } from "../lib/timeUtils.js"
import { generateConsultation } from '../gpt/generateConsultation.js'
import { getEventMood, evaluateConfessionResult, generateConfessionDialogue } from "../lib/confession.js"
// characters: キャラクター一覧
// trusts: 各キャラクターの信頼度
// updateTrust: 信頼度を更新する関数
// addLog: ログ追加用関数
export default function ConsultationArea({ characters, trusts, updateTrust, addLog, updateLastConsultation, relationships, emotions, affections, updateRelationship, updateEmotion }) {
  const [confessTemplates, setConfessTemplates] = useState([])
  const [consultations, setConsultations] = useState([])
  const [current, setCurrent] = useState(null)
  const [selected, setSelected] = useState('')
  const [answered, setAnswered] = useState(false)
  const [replyText, setReplyText] = useState('')
  const AUTO_INTERVAL_MS = 3600000 // 1時間ごと
  const MAX_AUTO_CONSULTATIONS = 2 // 自動生成時の上限
  const MAX_TOTAL_CONSULTATIONS = 3 // 手動追加も含めた上限

  const genres = ['雑談', '興味', '悩み']
  const chooseGenre = () => genres[Math.floor(Math.random() * genres.length)]
  const chooseLevel = (trust) => {
    if (trust > 80) return 3
    if (trust > 60) return 2
    if (trust > 40) return 1
    return 0
  }



  // 告白テンプレートも取得
  useEffect(() => {
    fetch('/data/confess_prompt_templates.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setConfessTemplates(data))
      .catch(err => console.error('告白テンプレートの取得に失敗しました', err))
  }, [])

  // 自動生成のスケジューラ（困りごと・告白をまとめて処理）
  useEffect(() => {
    const timer = setInterval(async () => {
      if (consultations.length >= MAX_AUTO_CONSULTATIONS) return

      const eventOptions = []

      // 困りごと相談候補
      const available = characters.filter(c => Date.now() - (c.lastConsultation || 0) >= AUTO_INTERVAL_MS)
      if (available.length > 0) {
        const char = available[Math.floor(Math.random() * available.length)]
        eventOptions.push({ type: 'trouble', char })
      }

      // 告白相談候補
      const candidates = []
      characters.forEach(c => {
        if (Date.now() - (c.lastConsultation || 0) < AUTO_INTERVAL_MS) return
        characters.forEach(o => {
          if (c.id === o.id) return
          const pair = [c.id, o.id].sort()
          const rel = relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
          if (!rel || rel.label !== '友達') return
          const emotion = emotions.find(e => e.from === c.id && e.to === o.id)?.label
          const affection = affections.find(a => a.from === c.id && a.to === o.id)?.score || 0
          if (emotion === '好きかも' && affection >= 70) candidates.push({ char: c, target: o })
        })
      })
      if (candidates.length > 0 && confessTemplates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)]
        const trust = trusts.find(t => t.id === pick.char.id)?.score || 50
        let base = null
        if (trust <= 20) {
          base = confessTemplates.find(t => t.id === 'Low-trust')
        } else {
          const normal = confessTemplates.filter(t => t.id !== 'Low-trust')
          if (normal.length > 0) {
            base = normal[Math.floor(Math.random() * normal.length)]
          }
        }
        if (base) {
          const template = {
            kind: 'confession',
            core_prompt: base.consultationText.replace(/B/g, pick.target.name),
            choices: base.choices
          }
          const mood = getEventMood({ affections, relationships, emotions }, pick.char.id, pick.target.id);
          eventOptions.push({ type: 'confession', char: pick.char, target: pick.target, template, mood })
        }
      }

      if (eventOptions.length === 0) return
      const ev = eventOptions[Math.floor(Math.random() * eventOptions.length)]

      if (ev.type === 'trouble') {
        const trust = trusts.find(t => t.id === ev.char.id)?.score || 50
        const level = chooseLevel(trust)
        const genre = chooseGenre()
        try {
          const res = await generateConsultation({ character: ev.char, genre, level, trust })
          const template = {
            form: res.choices ? 'choice' : 'fill',
            core_prompt: res.prompt,
            choices: res.choices || [],
            responses: res.responses || [],
            trust_change: res.trust_change || 0
          }
          const id = Date.now()
          const timeout = setTimeout(() => {
            setConsultations(p => p.filter(c => c.id !== id))
          }, AUTO_INTERVAL_MS)
          updateLastConsultation(ev.char.id)
          setConsultations(prev => [...prev, { id, type: 'trouble', char: ev.char, template, timeout }])
        } catch (err) {
          console.error('consultation generate error', err)
        }
      } else {
        const id = Date.now()
        const timeout = setTimeout(() => {
          setConsultations(p => p.filter(c => c.id !== id))
        }, AUTO_INTERVAL_MS)
        updateLastConsultation(ev.char.id)
        setConsultations(prev => [...prev, { id, ...ev, timeout }])
      }
    }, AUTO_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [confessTemplates, characters, relationships, emotions, affections, trusts, consultations])

  // 相談イベントを追加
  const addConsultation = async () => {
    if (consultations.length >= MAX_TOTAL_CONSULTATIONS) return

    const options = []

    // 困りごと相談候補
    const available = characters.filter(c => Date.now() - (c.lastConsultation || 0) >= AUTO_INTERVAL_MS)
    if (available.length > 0) {
      const char = available[Math.floor(Math.random() * available.length)]
      options.push({ type: 'trouble', char })
    }

    // 告白相談候補
    const confessionCands = []
    characters.forEach(c => {
      if (Date.now() - (c.lastConsultation || 0) < AUTO_INTERVAL_MS) return
      characters.forEach(o => {
        if (c.id === o.id) return
        const pair = [c.id, o.id].sort()
        const rel = relationships.find(r => r.pair[0] === pair[0] && r.pair[1] === pair[1])
        if (!rel || rel.label !== '友達') return
        const emotion = emotions.find(e => e.from === c.id && e.to === o.id)?.label
        const affection = affections.find(a => a.from === c.id && a.to === o.id)?.score || 0
        if (emotion === '好きかも' && affection >= 70) confessionCands.push({ char: c, target: o })
      })
    })
    if (confessionCands.length > 0 && confessTemplates.length > 0) {
      const pick = confessionCands[Math.floor(Math.random() * confessionCands.length)]
      const trust = trusts.find(t => t.id === pick.char.id)?.score || 50
      let base = null
      if (trust <= 20) {
        base = confessTemplates.find(t => t.id === 'Low-trust')
      } else {
        const normal = confessTemplates.filter(t => t.id !== 'Low-trust')
        if (normal.length > 0) {
          base = normal[Math.floor(Math.random() * normal.length)]
        }
      }
      if (base) {
        const template = {
          kind: 'confession',
          core_prompt: base.consultationText.replace(/B/g, pick.target.name),
          choices: base.choices
        }
        const mood = getEventMood({ affections, relationships, emotions }, pick.char.id, pick.target.id);
        options.push({ type: 'confession', char: pick.char, target: pick.target, template, mood })
      }
    }

    if (options.length === 0) return
    const ev = options[Math.floor(Math.random() * options.length)]
    if (ev.type === 'trouble') {
      const trust = trusts.find(t => t.id === ev.char.id)?.score || 50
      const level = chooseLevel(trust)
      const genre = chooseGenre()
      try {
        const res = await generateConsultation({ character: ev.char, genre, level, trust })
        const template = {
          form: res.choices ? 'choice' : 'fill',
          core_prompt: res.prompt,
          choices: res.choices || [],
          responses: res.responses || [],
          trust_change: res.trust_change || 0
        }
        const id = Date.now()
        const timeout = setTimeout(() => {
          setConsultations(prev => prev.filter(e => e.id !== id))
        }, AUTO_INTERVAL_MS)
        setConsultations(prev => [...prev, { id, type: 'trouble', char: ev.char, template, timeout }])
        updateLastConsultation(ev.char.id)
      } catch (err) {
        console.error('consultation generate error', err)
      }
    } else {
      const id = Date.now()
      const timeout = setTimeout(() => {
        setConsultations(prev => prev.filter(e => e.id !== id))
      }, AUTO_INTERVAL_MS)
      setConsultations(prev => [...prev, { id, ...ev, timeout }])
      updateLastConsultation(ev.char.id)
    }
  }

  const openPopup = async (c) => {
    let text = c.template.core_prompt
    if (c.type === 'confession') {
      try {
        text = await adjustLineByPersonality(text, c.char)
      } catch (err) {
        console.error('line adjust error', err)
      }
    }
    const modified = { ...c, template: { ...c.template, core_prompt: text } }
    setCurrent(modified)
    setSelected('')
    setAnswered(false)
    setReplyText('')
    addLog(`${c.char.name}がプレイヤーに相談しています…`)
  }

  // 回答を送信
  const sendAnswer = async () => {
    if (!current) return
    if (answered) {
      closePopup()
      return
    }
    if (current.type === 'confession') {
      if (!selected) return
      const choice = current.template.choices.find(c => c.text === selected)
      if (!choice) return
      updateLastConsultation(current.char.id)
      clearTimeout(current.timeout)
      if (!choice.proceed) {
        let msg = choice.resolveMessage
        try {
          msg = await adjustLineByPersonality(msg, current.char)
        } catch (err) {
          console.error('line adjust error', err)
        }
        addLog(msg)
        setAnswered(true)
        return
      }
      const { success } = evaluateConfessionResult(current.mood)
      let detail = ''
      try {
        detail = await generateConfessionDialogue(success, current.char, current.target, {
          relationLabel: success ? '恋人' : '友達',
          emotionLabels: {
            AtoB: emotions.find(e => e.from === current.char.id && e.to === current.target.id)?.label,
            BtoA: emotions.find(e => e.from === current.target.id && e.to === current.char.id)?.label
          },
          affectionScores: {
            AtoB: affections.find(a => a.from === current.char.id && a.to === current.target.id)?.score || 0,
            BtoA: affections.find(a => a.from === current.target.id && a.to === current.char.id)?.score || 0
          },
          timeSlot: getTimeSlot(),
          mood: current.mood
        })
      } catch (err) {
        addLog(`会話生成エラー: ${err.message}`, 'SYSTEM')
      }
      if (success) {
        updateRelationship(current.char.id, current.target.id, '恋人')
        addLog(`告白に成功！　${current.char.name}と${current.target.name}が恋人になりました`, 'SYSTEM', detail)
      } else {
        updateEmotion(current.char.id, current.target.id, '気まずい')
        updateEmotion(current.target.id, current.char.id, '気まずい')
        addLog(`告白に失敗…　${current.char.name}と${current.target.name}は気まずくなりました`, 'SYSTEM', detail)
      }
      setAnswered(true)
      return
    }
    let idx = 0
    if (current.template.form === 'choice') {
      if (!selected) return
      idx = current.template.choices.findIndex(c => c.text ? c.text === selected : c === selected)
      if (idx < 0) idx = 0
    }
    updateTrust(current.char.id, current.template.trust_change || 0)
    setReplyText(current.template.responses?.[idx] || '')
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
          <div className="bg-gray-700 p-4 rounded relative w-[95%] pt-12">
            <button className="absolute top-2 right-2" onClick={closePopup}>×</button>
            <p className="mb-2">{current.char.name}「{current.template.core_prompt}」</p>
            {current.template.choices && current.template.choices.length > 0 ? (
              <div className="mb-2">
                {current.template.choices.map((choice, idx) => {
                  const value = choice.text || choice
                  return (
                    <label key={idx} className="block">
                      <input
                        type="radio"
                        name="consult-answer"
                        value={value}
                        className="mr-1"
                        checked={selected === value}
                        onChange={e => setSelected(e.target.value)}
                      />
                      {value}
                    </label>
                  )
                })}
              </div>
            ) : current.template.form === 'choice' ? (
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
            {!answered ? (
              <button onClick={sendAnswer}>決定</button>
            ) : (
              <>
                <p className="mt-2">{current.type === 'confession' ? 'じゃあ、いってきます' : replyText || 'ありがとう！'}</p>
                <div className="text-right mt-2">
                  <button onClick={closePopup}>完了</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
