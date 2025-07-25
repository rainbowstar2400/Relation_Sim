import { generateDialogue } from './generateDialogue.js'
import { getStyleModifiers } from '../prompt/styleModifiers.js'

// 入力情報から相談イベントを生成するプロンプトを作成
function buildConsultPrompt(character, genre, level, trust) {
  const modifiers = getStyleModifiers(character.personality || {})
  return `以下の条件でプレイヤーに相談する文章を1件生成してください。\n` +
    `# キャラクター\n` +
    `名前: ${character.name}\n` +
    `信頼度: ${trust}\n` +
    `ジャンル: ${genre}\n` +
    `レベル: ${level}\n` +
    `style_modifiers: ${JSON.stringify(modifiers)}\n` +
    `# 出力形式\n` +
    `{ "prompt": "相談文", "choices": ["選択肢A", "選択肢B"], "trust_change": 0, "responses": ["返答A", "返答B"] }`
}

/**
 * GPT を用いて相談イベントを生成します。
 * @param {Object} params 入力情報
 * @param {Object} params.character キャラクター情報
 * @param {string} params.genre ジャンル
 * @param {number} params.level レベル
 * @param {number} params.trust 信頼度
 * @returns {Promise<Object>} { prompt, choices?, trust_change, responses }
 */
export async function generateConsultation({ character, genre, level, trust }) {
  const prompt = buildConsultPrompt(character, genre, level, trust)
  const text = await generateDialogue(prompt)
  try {
    return JSON.parse(text)
  } catch (err) {
    console.error('parse error', err)
    throw new Error('GPT 出力の解析に失敗しました')
  }
}
