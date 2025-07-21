import React, { useEffect, useRef, useState } from 'react'

function parseLog(line) {
  if (typeof line === 'string') {
    const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
    if (m) return { id: m[1] + m[2], time: m[1], type: m[2], text: m[3] }
    return { id: Date.now().toString(36), time: '', type: 'EVENT', text: line }
  }
  return line
}

function LogLine({ line }) {
  const { time, type, text } = parseLog(line)
  const [shown, setShown] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, 20)
    return () => clearInterval(timer)
  }, [text])

  const cls = type === 'SYSTEM' ? 'text-orange-300 font-bold' : 'text-blue-400 font-bold'

  return (
    <p className="mb-1">
      {time && <span className="text-gray-400 mr-1">[{time}]</span>}
      <span className={cls}>{type}:</span> {shown}
    </p>
  )
}

export default function LogList({ logs = [], readLogCount = 0, updateReadLogCount }) {
  const logRef = useRef(null)
  const [order, setOrder] = useState('old')
  const [showBanner, setShowBanner] = useState(false)
  const prevLen = useRef(logs.length)

  const checkScroll = () => {
    const div = logRef.current
    if (!div) return
    if (order === 'old') {
      const bottom = div.scrollTop + div.clientHeight >= div.scrollHeight - 5
      setShowBanner(!bottom)
      if (bottom && updateReadLogCount) updateReadLogCount(logs.length)
    } else {
      const top = div.scrollTop <= 5
      setShowBanner(!top)
      if (top && updateReadLogCount) updateReadLogCount(logs.length)
    }
  }

  useEffect(() => {
    const div = logRef.current
    if (!div) return
    div.addEventListener('scroll', checkScroll)
    return () => div.removeEventListener('scroll', checkScroll)
  }, [order])

  useEffect(() => {
    const div = logRef.current
    if (!div) return
    div.scrollTop = div.scrollHeight
    if (updateReadLogCount) updateReadLogCount(logs.length)
  }, [])

  useEffect(() => {
    const div = logRef.current
    if (!div) return
    if (order === 'old') {
      const bottom = div.scrollTop + div.clientHeight >= div.scrollHeight - 5
      if (bottom) {
        div.scrollTop = div.scrollHeight
        if (updateReadLogCount) updateReadLogCount(logs.length)
      } else if (prevLen.current !== logs.length) {
        setShowBanner(true)
      }
    } else {
      const top = div.scrollTop <= 5
      if (top) {
        div.scrollTop = 0
        if (updateReadLogCount) updateReadLogCount(logs.length)
      } else if (prevLen.current !== logs.length) {
        setShowBanner(true)
      }
    }
    prevLen.current = logs.length
  }, [logs, order])

  const readLogs = logs.slice(Math.max(0, readLogCount - 20), readLogCount)
  const unreadLogs = logs.slice(readLogCount)
  const displayed = [...readLogs, ...unreadLogs]
  const ordered = order === 'old' ? displayed : [...displayed].slice().reverse()

  const handleBannerClick = () => {
    const div = logRef.current
    if (!div) return
    if (order === 'old') {
      div.scrollTop = div.scrollHeight
    } else {
      div.scrollTop = 0
    }
    setShowBanner(false)
  }

  return (
    <div>
      <div className="flex justify-end mb-1">
        <button onClick={() => setOrder(order === 'old' ? 'new' : 'old')}>
          {order === 'old' ? '新しい順' : '古い順'}に切り替え
        </button>
      </div>
      <div
        ref={logRef}
        className="h-[26rem] overflow-y-auto bg-black border border-gray-600 p-3 font-mono rounded text-gray-100"
      >
        {ordered.map((line) => (
          <LogLine key={parseLog(line).id} line={line} />
        ))}
      </div>
      {showBanner && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
          onClick={handleBannerClick}
        >
          新しいログがあります
        </div>
      )}
    </div>
  )
}
