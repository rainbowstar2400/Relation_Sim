import { generateDialogue } from './generateDialogue.js'
import { getStyleModifiers } from '../prompt/styleModifiers.js'

function buildAdjustmentPrompt(text, char) {
  const talkTemplate = char.talkStyle?.template || ''
  const modifiers = getStyleModifiers(char.personality || {})
  return `以下のセリフを、指定されたキャラクターの性格に合った自然な口調に言い換えてください。

# キャラクター情報
- 名前: ${char.name}
 - 話し方テンプレート: ${talkTemplate}
- style_modifiers: ${JSON.stringify(modifiers)}

# セリフ
${text}

# 出力ルール
- セリフの意味は保ちつつ、キャラクターが自然に言いそうな言い回しにしてください。
- セリフのみを返してください（余計な説明文や名前は不要です）。`
}

export async function adjustLineByPersonality(text, char) {
  const prompt = buildAdjustmentPrompt(text, char)
  const adjusted = await generateDialogue(prompt)
  return adjusted
}
