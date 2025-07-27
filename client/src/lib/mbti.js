export const mbtiQuestions = [
  '初対面の人とすぐ話せる ⇔ 少し様子を見る',
  '話すときは具体的 ⇔ 抽象的',
  '決断は論理で考える ⇔ 気持ちを重視する',
  '計画通りに進めたい ⇔ 成り行きに任せたい',
  'にぎやかな場が好き ⇔ 一人の時間が落ち着く',
  '今の現実を大事にする ⇔ 未来や可能性を考える',
  'はっきり意見を伝える ⇔ 相手の気持ちを優先',
  '予定を立てるのが得意 ⇔ その場の流れで動く',
  '話すことで元気になる ⇔ 話すと疲れる',
  '実体験や事実をもとに話す ⇔ たとえ話が多い',
  '事実を整理して判断 ⇔ 感情の動きに従う',
  '物事をきっちり終わらせたい ⇔ とりあえず動きたい',
  '大人数の中でも自分を出せる ⇔ 少人数の方が安心',
  '現実的だと言われる ⇔ 空想的だと言われる',
  '冷静だねと言われる ⇔ 優しいねと言われる',
  '決断は早い方 ⇔ 保留にしがち'
]

export const mbtiDescriptions = {
  INFP: '仲介者：控えめだけど思慮深く、感受性豊かなタイプのようです。',
  INFJ: '提唱者：物静かですが、強い信念を内に秘めている理想主義者です。',
  INTP: '論理学者：知的な探求心が旺盛で、ユニークな視点を持つアイデアマンです。',
  INTJ: '建築家：戦略的な思考が得意で、計画を立てて物事を進める完璧主義者です。',
  ISFP: '冒険家：感受性豊かでマイペース、自分らしさを大切にする芸術家肌です。',
  ISFJ: '擁護者：思いやりにあふれ、周囲の人を静かに支える献身的なタイプです。',
  ISTP: '巨匠：冷静沈着で実践的、手先が器用で物事を効率よくこなす職人肌です。',
  ISTJ: '管理者：責任感が強く、秩序と安定を重視する几帳面な現実主義者です。',
  ENFP: '運動家：好奇心が旺盛で、人とのつながりや新しい体験を楽しむ自由人です。',
  ENFJ: '主人公：人を励まし導くのが得意な、情熱的で面倒見のよいリーダーです。',
  ENTP: '討論者：柔軟な発想と話術で人を惹きつける、好奇心旺盛な挑戦者です。',
  ENTJ: '指揮官：目標に向かって突き進む、論理的で自信に満ちたリーダーです。',
  ESFP: 'エンターテイナー：陽気でムードメーカー、場を明るく盛り上げる社交家です。',
  ESFJ: '領事官：社交的で人に尽くすのが好きな、面倒見のよい協調型タイプです。',
  ESTP: '起業家：行動力とスリルを愛し、即断即決で状況を切り開く冒険者です。',
  ESTJ: '幹部：実行力と判断力に優れ、物事をきちんと進める現場の指揮官です。'
}

export const mbtiTypes = Object.keys(mbtiDescriptions)

export function calculateMbti(sliderValues, personality) {
  const scores = {
    ei: sliderValues[0] + sliderValues[4] + sliderValues[8] + sliderValues[12],
    sn: sliderValues[1] + sliderValues[5] + sliderValues[9] + sliderValues[13],
    tf: sliderValues[2] + sliderValues[6] + sliderValues[10] + sliderValues[14],
    jp: sliderValues[3] + sliderValues[7] + sliderValues[11] + sliderValues[15]
  }
  let result = ''
  result += scores.ei <= 7 ? 'E' : scores.ei >= 9 ? 'I' : (personality.social >= 3 ? 'E' : 'I')
  result += scores.sn <= 7 ? 'S' : scores.sn >= 9 ? 'N' : (personality.expressiveness >= 3 ? 'N' : 'S')
  result += scores.tf <= 7 ? 'T' : scores.tf >= 9 ? 'F' : (personality.kindness >= 3 ? 'F' : 'T')
  result += scores.jp <= 7 ? 'J' : scores.jp >= 9 ? 'P' : (personality.activity >= 3 ? 'J' : 'P')
  return result
}
