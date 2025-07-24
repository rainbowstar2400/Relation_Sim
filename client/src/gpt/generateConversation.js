import { generateDialogue } from './generateDialogue.js'
import { buildPrompt } from '../prompt/promptBuilder.js'

/**
 * イベント種別に合わせたプロンプトを生成し、GPT から会話文を取得します。
 * @param {string} eventType - イベントの種類
 * @param {Object} charA - キャラクターA
 * @param {Object} charB - キャラクターB
 * @param {Object} context - 関係性や感情などの追加情報
 * @returns {Promise<string>} GPT が生成した会話文
 */
export async function generateConversation(eventType, charA, charB, context) {
  const prompt = buildPrompt(eventType, charA, charB, context)
  const text = await generateDialogue(prompt.core_prompt)
  return text
}
