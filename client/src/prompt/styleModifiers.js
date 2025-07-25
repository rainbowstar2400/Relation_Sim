
/**
 * 性格情報から style modifiers を取得します。
 * @param {Object} personality - 各特性は 0〜4 の数値
 * @returns {string[]} 最大3件のスタイル修飾語
 */
export function getStyleModifiers(personality) {
  const {
    social = 0,
    kindness = 0,
    stubbornness = 0,
    activity = 0,
    expressiveness = 0,
  } = personality || {}

  const modifiers = []

  // 基本判定
  if (social >= 3) modifiers.push('open')
  else if (social <= 1) modifiers.push('reserved')

  if (kindness >= 3) modifiers.push('gentle')
  else if (kindness <= 1) modifiers.push('blunt')

  if (stubbornness >= 3) modifiers.push('firm')

  if (expressiveness >= 3) modifiers.push('emotive')
  else if (expressiveness <= 1) modifiers.push('dry')

  // 複合判定
  if (social >= 3 && expressiveness >= 3) modifiers.push('casual')
  if (stubbornness <= 1 && kindness >= 3) modifiers.push('deliberate')

  // 重複を除外し、最大3件まで返す
  const unique = []
  for (const m of modifiers) {
    if (!unique.includes(m)) unique.push(m)
    if (unique.length === 3) break
  }

  return unique
}

// 実行例（デバッグ用）: `node styleModifiers.js` で確認可能
if (
  typeof process !== 'undefined' &&
  process.argv[1] === new URL(import.meta.url).pathname
) {
  console.log('styleModifiers example:', getStyleModifiers({
    social: 4,
    kindness: 3,
    stubbornness: 1,
    activity: 2,
    expressiveness: 4,
  }))
}
