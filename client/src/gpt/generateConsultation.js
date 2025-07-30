import { generateDialogue } from './generateDialogue.js'
import { getStyleModifiers } from '../prompt/styleModifiers.js'

// 入力情報から相談イベントを生成するプロンプトを作成
function buildConsultPrompt(character, genre, level, trust) {
  const modifiers = getStyleModifiers(character.personality || {})
  const talk = character.talkStyle || {}
  return (
    `以下の条件でプレイヤーに相談する文章を1件生成してください。\n` +
    `# キャラクター\n` +
    `名前: ${character.name}\n` +
    `話し方テンプレート: ${talk.template || ''}\n` +
    `話し方説明: ${talk.description || ''}\n` +
    `一人称: ${talk.firstPerson || '私'}\n` +
    `信頼度: ${trust}\n` +
    `ジャンル: ${genre}\n` +
    `レベル: ${level}\n` +
    `style_modifiers: ${JSON.stringify(modifiers)}\n` +
    `# 出力形式\n` +
    `{ "prompt": "相談文", "choices": ["<選択肢1>", "<選択肢2>", "<選択肢3>"], "trust_change": 0, "responses": ["<返答1>", "<返答2>", "<返答3>"] }`
  )
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
    const res = JSON.parse(text)
    // GPT から不完全なデータが返ってきた場合に備えてプレースホルダを除去
    const sanitize = (arr, pattern) =>
      (Array.isArray(arr) ? arr : [])
        .map(v => String(v))
        .filter(v => !pattern.test(v))
        .slice(0, 3)

    res.choices = sanitize(res.choices, /^選択肢[ABC]?$|^<選択肢\d+>$/)
    res.responses = sanitize(res.responses, /^返答[ABC]?$|^<返答\d+>$/)
    return res
  } catch (err) {
    console.error('parse error', err)
    throw new Error('GPT 出力の解析に失敗しました')
  }
}
