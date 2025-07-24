import { drawMood } from './mood.js'
import { generateConversation } from '../gpt/generateConversation.js'

export function getEventMood(state, idA, idB) {
  return drawMood(state, idA, idB)
}

// 成功確率テーブル
const successRateTable = {
  2: 0.8,
  1: 0.6,
  0: 0.3,
  '-1': 0.1,
  '-2': 0.05,
}

export function evaluateConfessionResult(mood) {
  const rate = successRateTable[mood] ?? 0.3
  return { success: Math.random() < rate, rate }
}

export async function generateConfessionDialogue(success, charA, charB, context) {
  const type = success ? '告白成功' : '告白失敗'
  return generateConversation(type, charA, charB, context)
}
