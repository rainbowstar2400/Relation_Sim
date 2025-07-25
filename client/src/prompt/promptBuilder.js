import { greetingTemplate } from './templates/greetingTemplate.js'
import { smalltalkTemplate } from './templates/smalltalkTemplate.js'
import { memoryTalkTemplate } from './templates/memoryTalkTemplate.js'
import { aloneTimeTemplate } from './templates/aloneTimeTemplate.js'
import { becomeFriendsTemplate } from './templates/becomeFriendsTemplate.js'
import { confessSuccessTemplate } from './templates/confessSuccessTemplate.js'
import { confessFailureTemplate } from './templates/confessFailureTemplate.js'
import { becomeBestFriendsTemplate } from './templates/becomeBestFriendsTemplate.js'
import { getStyleModifiers } from './styleModifiers.js'

// イベントタイプごとのテンプレート対応表
const templateMap = {
  "挨拶": greetingTemplate,
  "雑談": smalltalkTemplate,
  "思い出し会話": memoryTalkTemplate,
  "二人きりの時間": aloneTimeTemplate,
  "友達になる": becomeFriendsTemplate,
  "親友になる": becomeBestFriendsTemplate,
  "告白成功": confessSuccessTemplate,
  "告白失敗": confessFailureTemplate,
}

// 雰囲気数値をテキストに変換
function moodToText(value) {
  switch (value) {
    case -2: return "ネガティブ"
    case -1: return "ややネガティブ"
    case 0: return "普通"
    case 1: return "ややポジティブ"
    case 2: return "ポジティブ"
    default: return "普通"
  }
}

// 性格オブジェクトを指定フォーマットの文字列へ
function formatPersonality(p = {}) {
  const {
    sociability = 0,
    empathy = 0,
    stubbornness = 0,
    activeness = 0,
    expressiveness = 0
  } = p
  return `社交性：${sociability}/5、気配り：${empathy}/5、頑固さ：${stubbornness}/5、行動力：${activeness}/5、表現力：${expressiveness}/5`
}

/**
 * 指定のイベント種類に基づき、GPT へ送るプロンプトを生成します。
 * @param {string} eventType - イベントの種類
 * @param {Object} characterA - キャラクターAの情報
 * @param {Object} characterB - キャラクターBの情報
 * @param {Object} context - 関係性や感情などの状況情報
 * @returns {Object} プロンプトおよび補足情報
 */
export function buildPrompt(eventType, characterA, characterB, context) {
  const template = templateMap[eventType]
  if (!template) throw new Error(`unknown eventType: ${eventType}`)

  const moodText = moodToText(context.mood)
  const personalityA = formatPersonality(characterA.personality)
  const personalityB = formatPersonality(characterB.personality)

  let core = template
    .replaceAll('{characterA.name}', characterA.name)
    .replaceAll('{characterB.name}', characterB.name)
    .replaceAll('{characterA.age}', characterA.age ?? '不明')
    .replaceAll('{characterB.age}', characterB.age ?? '不明')
    .replaceAll('{characterA.gender}', characterA.gender || '不明')
    .replaceAll('{characterB.gender}', characterB.gender || '不明')
    .replaceAll('{mbtiA}', characterA.mbti || '不明')
    .replaceAll('{mbtiB}', characterB.mbti || '不明')
    .replaceAll('{personalityA}', personalityA)
    .replaceAll('{personalityB}', personalityB)
    .replaceAll('{relationLabel}', context.relationLabel)
    .replaceAll('{emotionAtoB}', context.emotionLabels?.AtoB)
    .replaceAll('{emotionBtoA}', context.emotionLabels?.BtoA)
    .replaceAll('{timeSlot}', context.timeSlot)
    .replaceAll('{date}', context.date)
    .replaceAll('{moodText}', moodText)

  const styleModifiersA = getStyleModifiers(characterA.personality)
  const styleModifiersB = getStyleModifiers(characterB.personality)
  core += `\n${characterA.name}の会話スタイルの特徴：${JSON.stringify(styleModifiersA)}`
  core += `\n${characterB.name}の会話スタイルの特徴：${JSON.stringify(styleModifiersB)}`

  const talkA = characterA.talkStyle || {}
  const talkB = characterB.talkStyle || {}
  core += `\n${characterA.name}の話し方: テンプレート「${talkA.template || '不明'}」 ${talkA.description || ''}`
  core += `\n${characterB.name}の話し方: テンプレート「${talkB.template || '不明'}」 ${talkB.description || ''}`

  const interestsA = (characterA.interests || []).join('、') || '特になし'
  const interestsB = (characterB.interests || []).join('、') || '特になし'
  core += `\n${characterA.name}の興味関心: ${interestsA}`
  core += `\n${characterB.name}の興味関心: ${interestsB}`

  return {
    core_prompt: core,
    event_type: eventType,
    time_slot: context.timeSlot,
    date: context.date,
    mood: moodText,
    style_modifiers: styleModifiersA
  }
}

// デバッグ実行用: `node promptBuilder.js` で単体確認可能
if (
  typeof process !== 'undefined' &&
  process.argv[1] === new URL(import.meta.url).pathname
) {
  const sampleChar = {
    name: "ユウタ",
    age: 18,
    gender: "男性",
    mbti: "INFP",
    personality: {
      sociability: 4,
      empathy: 3,
      stubbornness: 1,
      activeness: 3,
      expressiveness: 4
    }
  }

  const prompt = buildPrompt("雑談", sampleChar, sampleChar, {
    relationLabel: "友達",
    emotionLabels: { AtoB: "気になる", BtoA: "普通" },
    affectionScores: { AtoB: 60, BtoA: 48 },
    timeSlot: "evening",
    mood: 1
  })

  console.log(prompt.core_prompt)
}
