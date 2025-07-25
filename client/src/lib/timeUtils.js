const patternMap = {
  '朝型': 'morning',
  '夜型': 'night',
  '通常': 'normal',
  morning: 'morning',
  night: 'night',
  normal: 'normal',
}

let globalTimeModifiers = {}
let personalTimeModifiers = {}

export async function loadTimeModifiers() {
  const res = await fetch('/data/time_modifiers.json')
  const data = await res.json()
  globalTimeModifiers = data.globalTimeModifiers
  personalTimeModifiers = data.personalTimeModifiers
}

function mapPattern(pattern) {
  return patternMap[pattern] || 'normal'
}

export function getTimeSlot(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h <= 10) return 'morning'
  if (h >= 11 && h <= 15) return 'noon'
  if (h >= 16 && h <= 18) return 'evening'
  if (h >= 19 && h <= 23) return 'night'
  return 'midnight'
}

// YYYY/MM/DD 形式の日付文字列を返すヘルパー
export function getDateString(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

export function getTimeWeight(activityPattern) {
  const slot = getTimeSlot()
  const pat = mapPattern(activityPattern)
  const global = globalTimeModifiers[slot] || 1.0
  const personal = (personalTimeModifiers[pat] || personalTimeModifiers.normal || {})[slot] || 1.0
  return global * personal
}

export function isSleeping(activityPattern, hour) {
  const pat = mapPattern(activityPattern)
  switch (pat) {
    case 'morning':
      return hour >= 22 || hour < 5
    case 'night':
      return hour >= 2 && hour < 8
    default:
      return hour >= 0 && hour < 6
  }
}

export function updateCharacterConditions(characters) {
  const now = new Date()
  const hour = now.getHours()
  return characters.map(c => {
    const asleep = isSleeping(c.activityPattern, hour)
    return { ...c, condition: asleep ? '就寝中' : '活動中' }
  })
}
