// storage.js - 状態の保存と読み込み処理

const STORAGE_KEY = 'relation_sim_state'

export function saveStateToLocal(state) {
  try {
    const data = { ...state, logs: state.logs, reports: state.reports }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('状態の保存に失敗しました', e)
  }
}

export function loadStateFromLocal() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return null
  try {
    const parsed = JSON.parse(data)
    parsed.logs = (parsed.logs || []).map(l => {
      if (typeof l === 'string') {
        const m = l.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
        if (m) {
          return { id: Date.now().toString(36), time: m[1], type: m[2], text: m[3], detail: m[3] }
        }
        return { id: Date.now().toString(36), time: '', type: 'EVENT', text: l, detail: l }
      }
      return l
    })
    parsed.reports = parsed.reports || {}
    parsed.readLogCount = parsed.readLogCount || 0
    return parsed
  } catch (e) {
    console.error('保存データの読み込みに失敗しました', e)
    return null
  }
}

export function exportState(state) {
  const data = { ...state, logs: state.logs, reports: state.reports }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'state.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        data.logs = (data.logs || []).map(l => {
          if (typeof l === 'string') {
            const m = l.match(/^\[(.*?)\]\s*(EVENT|SYSTEM):\s*(.*)$/)
            if (m) {
              return { id: Date.now().toString(36), time: m[1], type: m[2], text: m[3], detail: m[3] }
            }
            return { id: Date.now().toString(36), time: '', type: 'EVENT', text: l, detail: l }
          }
          return l
        })
        data.reports = data.reports || {}
        data.reports = data.reports || {}
        resolve(data)
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
