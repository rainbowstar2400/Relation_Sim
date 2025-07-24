import { drawMood } from './mood.js'
import { generateDialogue } from '../gpt/generateDialogue.js'
import { buildPrompt } from '../prompt/promptBuilder.js'

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

export function buildConfessionPrompt(success, charA, charB, context) {
  const type = success ? '告白成功' : '告白失敗'
  return buildPrompt(type, charA, charB, context)
}

export async function generateConfessionDialogue(success, charA, charB, context) {
  const prompt = buildConfessionPrompt(success, charA, charB, context)
  const text = await generateDialogue(prompt.core_prompt)
  return text
}
