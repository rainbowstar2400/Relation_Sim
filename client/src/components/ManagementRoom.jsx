import React, { useState, useEffect } from 'react'
import { mbtiQuestions, mbtiDescriptions, mbtiTypes, calculateMbti } from '../lib/mbti.js'
import RangeSlider from './RangeSlider.jsx'
import { speechTemplates } from '../lib/speechTemplates.js'
import { drawSleepTimes } from '../lib/timeUtils.js'

const defaultAffections = {
  'なし': 0,
  '認知': 5,
  '友達': 20,
  '親友': 40,
  '恋人': 50,
  '家族': 50
}


export default function ManagementRoom({
  characters,
  relationships,
  nicknames,
  affections,
  onSaveCharacter,
  onDeleteCharacter,
  onBack
}) {
  const blankPersonality = { social:3, kindness:3, stubbornness:3, activity:3, expressiveness:3 }
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('男性')
  const [personality, setPersonality] = useState(blankPersonality)
  const [talkTemplate, setTalkTemplate] = useState('優しい敬語')
  const [talkDesc, setTalkDesc] = useState('')
  const [activityPattern, setActivityPattern] = useState('通常')
  const [interests, setInterests] = useState('')
  const [mbtiMode, setMbtiMode] = useState('diag')
  const [mbtiSliders, setMbtiSliders] = useState(Array(16).fill(2))
  const [mbtiManual, setMbtiManual] = useState('INFP')
  const [mbtiResult, setMbtiResult] = useState('')
  const [showQuestions, setShowQuestions] = useState(false)
  const [tempRelations, setTempRelations] = useState({})

  const handleTemplateChange = (e) => {
    const value = e.target.value
    setTalkTemplate(value)
    const found = speechTemplates.find(t => t.template === value)
    if (value === 'その他') {
      setTalkDesc('')
    } else {
      setTalkDesc(found?.description || '')
    }
  }

  // 編集開始
  const startEdit = (char) => {
    setEditingId(char.id)
    setName(char.name)
    setAge(char.age || '')
    setGender(char.gender || '男性')
    setPersonality(char.personality || blankPersonality)
    const tmpl = char.talkStyle?.template || '優しい敬語'
    setTalkTemplate(tmpl)
    const found = speechTemplates.find(t => t.template === tmpl)
    setTalkDesc(char.talkStyle?.description ?? found?.description ?? '')
    setActivityPattern(char.activityPattern || '通常')
    setInterests((char.interests || []).join(', '))
    setMbtiManual(char.mbti || 'INFP')
    setMbtiResult('')
    setMbtiSliders(char.mbti_slider || Array(16).fill(2))
    setMbtiMode('diag')
    setShowForm(true)
    // 編集用既存関係を抽出
    const rels = {}
    relationships.filter(r => r.pair.includes(char.id)).forEach(r => {
      const targetId = r.pair.find(id => id !== char.id)
      const affTo = affections.find(a => a.from === char.id && a.to === targetId)?.score || 0
      const affFrom = affections.find(a => a.from === targetId && a.to === char.id)?.score || 0
      const nickTo = nicknames.find(n => n.from === char.id && n.to === targetId)?.nickname || ''
      const nickFrom = nicknames.find(n => n.from === targetId && n.to === char.id)?.nickname || ''
      rels[targetId] = { type:r.label, nicknameTo:nickTo, nicknameFrom:nickFrom, affectionTo:affTo, affectionFrom:affFrom }
    })
    setTempRelations(rels)
  }

  // 削除
  const remove = (id) => {
    if (window.confirm('本当に削除しますか？')) onDeleteCharacter(id)
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setAge('')
    setGender('男性')
    setPersonality(blankPersonality)
    setTalkTemplate('優しい敬語')
    setTalkDesc(speechTemplates.find(t=>t.template==='優しい敬語')?.description || '')
    setActivityPattern('通常')
    setInterests('')
    setMbtiMode('diag')
    setMbtiManual('INFP')
    setMbtiResult('')
    setMbtiSliders(Array(16).fill(2))
    setShowQuestions(false)
    setTempRelations({})
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name) return
    const id = editingId || 'char_' + Date.now()
    const existing = characters.find(c => c.id === id)
    const times = existing ? { sleepStart: existing.sleepStart, sleepEnd: existing.sleepEnd } : drawSleepTimes(activityPattern)
    const char = {
      id,
      name,
      age: age ? parseInt(age) : undefined,
      gender,
      personality,
      mbti: mbtiMode === 'diag' ? (mbtiResult || calculateMbti(mbtiSliders, personality)) : mbtiManual,
      mbti_slider: mbtiMode === 'diag' ? mbtiSliders : [],
      talkStyle: { template: talkTemplate, description: talkDesc },
      activityPattern,
      interests: interests.split(',').map(i => i.trim()).filter(i => i),
      condition: existing?.condition || '活動中',
      sleepStart: times.sleepStart,
      sleepEnd: times.sleepEnd,
      lastConsultation: existing?.lastConsultation || 0
    }
    const rels = []
    const nicks = []
    const affs = []
    Object.keys(tempRelations).forEach(targetId => {
      const data = tempRelations[targetId]
      if (data.type !== 'なし') rels.push({ pair:[id,targetId].sort(), label:data.type })
      if (data.nicknameTo) nicks.push({ from:id, to:targetId, nickname:data.nicknameTo })
      if (data.nicknameFrom) nicks.push({ from:targetId, to:id, nickname:data.nicknameFrom })
      const now = Date.now()
      affs.push({ from:id, to:targetId, score:data.affectionTo, lastInteracted: now })
      affs.push({ from:targetId, to:id, score:data.affectionFrom, lastInteracted: now })
    })
    onSaveCharacter(char, rels, nicks, affs)
    setShowForm(false)
    resetForm()
  }

  const handleRelTargetChange = (e) => {
    const targetId = e.target.value
    if (!targetId) {
      setRelForm(prev => ({ ...prev, targetId: '' }))
      return
    }
    const existing = tempRelations[targetId]
    if (existing) {
      setRelForm({
        targetId,
        type: existing.type,
        nicknameTo: existing.nicknameTo,
        nicknameFrom: existing.nicknameFrom,
        affectionTo: existing.affectionTo,
        affectionFrom: existing.affectionFrom
      })
    } else {
      setRelForm({
        targetId,
        type: 'なし',
        nicknameTo: characters.find(c=>c.id===targetId)?.name || '',
        nicknameFrom: name || '',
        affectionTo: defaultAffections['なし'],
        affectionFrom: defaultAffections['なし']
      })
    }
  }

  const [relForm, setRelForm] = useState({
    targetId:'',
    type:'なし',
    nicknameTo:'',
    nicknameFrom:'',
    affectionTo:0,
    affectionFrom:0
  })

  const saveRelation = () => {
    if (!relForm.targetId) return
    setTempRelations(prev => ({ ...prev, [relForm.targetId]: {
      type: relForm.type,
      nicknameTo: relForm.nicknameTo,
      nicknameFrom: relForm.nicknameFrom,
      affectionTo: relForm.affectionTo,
      affectionFrom: relForm.affectionFrom
    }}))
    setRelForm({ targetId:'', type:'なし', nicknameTo:'', nicknameFrom:'', affectionTo:0, affectionFrom:0 })
  }

  const editRelation = (id) => {
    const data = tempRelations[id]
    if (!data) return
    setRelForm({
      targetId:id,
      type:data.type,
      nicknameTo:data.nicknameTo,
      nicknameFrom:data.nicknameFrom,
      affectionTo:data.affectionTo,
      affectionFrom:data.affectionFrom
    })
  }

  const deleteRelation = (id) => {
    if (!window.confirm('この関係を削除しますか？')) return
    setTempRelations(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  const otherCharsForSelect = characters.filter(c => c.id !== editingId && !Object.keys(tempRelations).includes(c.id))

  return (
    <section id="management-room" className="mb-6">
      <h2 className="text-sm text-gray-300 border-b border-gray-600 pb-1 mb-2">▼ 管理室</h2>
        {!showForm && (
        <button onClick={() => {setShowForm(true);resetForm()}}>+ 新規住人登録</button>
        )}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 border p-2">
          <h3 className="mb-2">{editingId ? '住人情報編集' : '新規住人登録'}</h3>
          <div className="mb-2">
            <label className="mr-2">名前:</label>
            <input className="text-black" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div className="mb-2">
            <label className="mr-2">年齢:</label>
            <input type="number" className="text-black w-20" value={age} onChange={e=>setAge(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="mr-2">性別:</label>
            <select className="text-black" value={gender} onChange={e=>setGender(e.target.value)}>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
              <option value="その他">その他</option>
            </select>
          </div>
          <h4>性格 (1-5)</h4>
          {Object.keys(personality).map(key => (
            <div className="mb-2" key={key}>
              <label className="mr-2">{ key === 'social' ? '社交性' :
                key === 'kindness' ? '気配り' :
                key === 'stubbornness' ? '頑固さ' :
                key === 'activity' ? '行動力' : '表現力'}: {personality[key]}</label>
              <RangeSlider min={1} max={5} value={personality[key]}
                onChange={e=>setPersonality(prev=>({...prev,[key]:parseInt(e.target.value)}))} />
            </div>
          ))}
          <h4>話し方</h4>
          <div className="mb-2 flex items-center">
            <select className="text-black mr-2" value={talkTemplate} onChange={handleTemplateChange}>
              {speechTemplates.map(t => (
                <option key={t.template} value={t.template}>
                  {t.template === 'その他' ? 'その他（自由入力）' : t.template}
                </option>
              ))}
            </select>
            {talkTemplate === 'その他' ? (
              <input className="text-black flex-1" value={talkDesc} onChange={e=>setTalkDesc(e.target.value)} placeholder="自由記述" />
            ) : (
              <span>{talkDesc}</span>
            )}
          </div>
          <h4>活動傾向</h4>
          <div className="mb-2">
            <label className="mr-2"><input type="radio" name="act" value="通常" checked={activityPattern==='通常'} onChange={e=>setActivityPattern(e.target.value)} />通常</label>
            <label className="ml-4 mr-2"><input type="radio" name="act" value="朝型" checked={activityPattern==='朝型'} onChange={e=>setActivityPattern(e.target.value)} />朝型</label>
            <label className="ml-4 mr-2"><input type="radio" name="act" value="夜型" checked={activityPattern==='夜型'} onChange={e=>setActivityPattern(e.target.value)} />夜型</label>
          </div>
          <h4>興味関心ジャンル</h4>
          <div className="mb-2">
            <label className="mr-2">興味・関心:</label>
            <input className="text-black" value={interests} onChange={e=>setInterests(e.target.value)} placeholder="例: 読書, 映画鑑賞" />
          </div>
          <h4>初期関係設定</h4>
          <div className="border p-2 mb-2">
            <div className="mb-2">
              <label className="mr-2">相手を選択:</label>
            <select className="text-black" value={relForm.targetId} onChange={handleRelTargetChange}>
                <option value="">--選択してください--</option>
                {otherCharsForSelect.map(c=> (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {relForm.targetId && !otherCharsForSelect.some(c=>c.id===relForm.targetId) && (
                  <option value={relForm.targetId}>{characters.find(c=>c.id===relForm.targetId)?.name}</option>
                )}
              </select>
            </div>
            <div className="mb-2">
              <label className="mr-2">関係:</label>
              <select className="text-black" value={relForm.type} onChange={e=>setRelForm(prev=>({...prev,type:e.target.value, affectionTo:defaultAffections[e.target.value]??0, affectionFrom:defaultAffections[e.target.value]??0}))}>
                {Object.keys(defaultAffections).map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="mb-2">
              <label className="mr-2">相手への好感度:{relForm.affectionTo}</label>
              <RangeSlider min={-100} max={100} tickStep={50} value={relForm.affectionTo}
                onChange={e=>setRelForm(prev=>({...prev,affectionTo:parseInt(e.target.value)}))}
                showNumbers={false} />
            </div>
            <div className="mb-2">
              <label className="mr-2">相手からの好感度:{relForm.affectionFrom}</label>
              <RangeSlider min={-100} max={100} tickStep={50} value={relForm.affectionFrom}
                onChange={e=>setRelForm(prev=>({...prev,affectionFrom:parseInt(e.target.value)}))}
                showNumbers={false} />
            </div>
            <div className="mb-2">
              <label className="mr-2">相手の呼び方:</label>
              <input className="text-black" value={relForm.nicknameTo} onChange={e=>setRelForm(prev=>({...prev,nicknameTo:e.target.value}))} />
            </div>
            <div className="mb-2">
              <label className="mr-2">相手からの呼ばれ方:</label>
              <input className="text-black" value={relForm.nicknameFrom} onChange={e=>setRelForm(prev=>({...prev,nicknameFrom:e.target.value}))} />
            </div>
            <button type="button" onClick={saveRelation}>この関係を登録</button>
            <div className="mt-2">
              {Object.keys(tempRelations).length === 0 ? (
                <p>特に関係を持っていません。</p>
              ) : (
                <ul className="ml-4 list-none">
                  {Object.entries(tempRelations).map(([id,data])=> (
                    <li key={id}>
                      <strong>{characters.find(c=>c.id===id)?.name}</strong>: {data.type} ({data.affectionTo}/{data.affectionFrom})
                      <button type="button" className="ml-2" onClick={()=>editRelation(id)}>編集</button>
                      <button type="button" className="ml-1" onClick={()=>deleteRelation(id)}>削除</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <h4>MBTIタイプ</h4>
          <div className="mb-2">
            <button type="button" className={mbtiMode==='diag'?'font-bold mr-2':'mr-2'} onClick={()=>setMbtiMode('diag')}>診断で決定</button>
            <button type="button" className={mbtiMode==='manual'?'font-bold':''} onClick={()=>setMbtiMode('manual')}>手動で設定</button>
          </div>
          {mbtiMode==='diag' && (
            <div className="mb-2">
              {!showQuestions && (
                <button type="button" onClick={()=>setShowQuestions(true)}>診断スタート</button>
              )}
              {showQuestions && (
                <div className="mb-2">
                  <p>各質問にスライダーで回答してください。</p>
                  {mbtiSliders.map((v,i)=> (
                    <div className="mb-1" key={i}>
                      <label className="mr-2">Q{i+1}: {mbtiQuestions[i]}</label>
                      <RangeSlider min={0} max={4} value={v}
                        onChange={e=>setMbtiSliders(prev=>{ const arr=[...prev]; arr[i]=parseInt(e.target.value); return arr })}
                        showNumbers={false} />
                    </div>
                  ))}
                  <button type="button" onClick={()=>setMbtiResult(calculateMbti(mbtiSliders, personality))}>診断する</button>
                  {mbtiResult && (
                    <p className="mt-1">診断結果: {mbtiResult}<br />{mbtiDescriptions[mbtiResult]}</p>
                  )}
                </div>
              )}
            </div>
          )}
          {mbtiMode==='manual' && (
            <div className="mb-2">
              <select className="text-black" value={mbtiManual} onChange={e=>setMbtiManual(e.target.value)}>
                {mbtiTypes.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="mt-2">{editingId ? '更新する' : '追加する'}</button>
          <button type="button" className="ml-2" onClick={()=>{setShowForm(false);resetForm()}}>キャンセル</button>
        </form>
      )}
      <h3 className="mb-2">▼ 住人一覧</h3>
      <ul className="list-none pl-4">
        {characters.map(c => (
          <li key={c.id} className="mb-1 flex justify-between items-center">
            <span>{c.name}</span>
            <div>
              <button className="ml-2" onClick={() => startEdit(c)}>編集</button>
              <button className="ml-1" onClick={() => remove(c.id)}>削除</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
