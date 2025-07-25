import React, { useEffect, useRef, useState } from 'react'

function parseLog(line) {
  if (typeof line === 'string') {
    const m = line.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
    if (m) {
      return { id: m[1] + m[2], time: m[1], type: m[2], text: m[3], detail: m[3] }
    }
    return { id: Date.now().toString(36), time: '', type: 'EVENT', text: line, detail: line }
  }
  return { ...line, detail: line.detail || line.text }
}

function LogLine({ line }) {
  const { time, type, text, detail } = parseLog(line)
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
    <div className="mb-2">
      <p className="mb-1">
        {time && <span className="text-gray-400 mr-1">[{time}]</span>}
        <span className={cls}>{type}:</span> {shown}
      </p>
      {detail && detail !== text && shown === text && (
        <pre className="whitespace-pre-wrap ml-4 text-gray-300">{detail}</pre>
      )}
    </div>
  )
}

export default function LogList({ logs = [], readLogCount = 0, updateReadLogCount }) {
  const logRef = useRef(null)
  const readEndRef = useRef(null) // 既読と未読の境目
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

  // 画面表示時に既読範囲の末尾までスクロール
  useEffect(() => {
    // 表示完了後 1 秒待ってからスクロールする
    const timer = setTimeout(() => {
      const div = logRef.current
      const end = readEndRef.current
      if (!div) return
      if (order === 'old') {
        if (end) {
          // 境界要素の位置にスクロール
          div.scrollTop = Math.max(0, end.offsetTop - div.clientHeight)
        } else {
          div.scrollTop = div.scrollHeight
        }
      } else {
        if (end) {
          div.scrollTop = end.offsetTop
        } else {
          div.scrollTop = 0
        }
      }
      // 初期状態でバナー表示を判定
      checkScroll()
    }, 1000)
    return () => clearTimeout(timer)
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
  const boundaryIndex = order === 'old' ? readLogs.length : unreadLogs.length

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
        className="h-[32rem] overflow-y-auto bg-black border border-gray-600 p-3 font-mono rounded text-gray-100"
      >
        {ordered.map((line, idx) => (
          <React.Fragment key={parseLog(line).id}>
            <LogLine line={line} />
            {idx === boundaryIndex - 1 && <div ref={readEndRef} />}
          </React.Fragment>
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
