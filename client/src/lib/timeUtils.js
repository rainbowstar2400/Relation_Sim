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

function randMinute(min, max) {
  if (min <= max) {
    return min + Math.floor(Math.random() * (max - min + 1))
  }
  const range = (1440 - min) + (max + 1)
  const r = Math.floor(Math.random() * range)
  return (min + r) % 1440
}

const sleepRanges = {
  morning: { start: [1260, 1380], end: [180, 300] },
  normal: { start: [1380, 60], end: [300, 420] },
  night: { start: [60, 180], end: [420, 540] }
}

export function drawSleepTimes(pattern) {
  const pat = mapPattern(pattern)
  const range = sleepRanges[pat] || sleepRanges.normal
  return {
    sleepStart: randMinute(range.start[0], range.start[1]),
    sleepEnd: randMinute(range.end[0], range.end[1])
  }
}

function inPeriod(start, end, now) {
  if (start <= end) {
    return now >= start && now < end
  }
  return now >= start || now < end
}

export function getCharacterCondition(char, nowMinutes) {
  if (char.sleepStart === undefined || char.sleepEnd === undefined) return '活動中'
  if (inPeriod(char.sleepStart, char.sleepEnd, nowMinutes)) return '就寝中'
  const prepStart = (char.sleepStart - 30 + 1440) % 1440
  if (inPeriod(prepStart, char.sleepStart, nowMinutes)) return '就寝準備中'
  return '活動中'
}

export function updateCharacterConditions(characters) {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return characters.map(c => ({ ...c, condition: getCharacterCondition(c, minutes) }))
}
