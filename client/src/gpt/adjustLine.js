import { generateDialogue } from './generateDialogue.js'
import { getStyleModifiers } from '../prompt/styleModifiers.js'

function buildAdjustmentPrompt(text, char) {
  // 話し方に関する情報を取得
  const talk = char.talkStyle || {}
  const talkTemplate = talk.template || ''
  const talkDesc = talk.description || ''
  const firstPerson = talk.firstPerson || ''
  const modifiers = getStyleModifiers(char.personality || {})

  return `以下のセリフを、指定されたキャラクターの性格と話し方に合った自然な口調に言い換えてください。

# キャラクター情報
- 名前: ${char.name}
- 話し方テンプレート: ${talkTemplate}
- 話し方説明: ${talkDesc}
- 一人称: ${firstPerson}
- style_modifiers: ${JSON.stringify(modifiers)}

# セリフ
${text}

# 出力ルール
- セリフの意味は保ちつつ、キャラクターが自然に言いそうな言い回しにしてください。
${firstPerson ? `- 一人称を使う場合は「${firstPerson}」を使用してください。` : ''}
- セリフのみを返してください（余計な説明文や名前は不要です）。`
}

export async function adjustLineByPersonality(text, char) {
  const prompt = buildAdjustmentPrompt(text, char)
  const adjusted = await generateDialogue(prompt)
  return adjusted
}
