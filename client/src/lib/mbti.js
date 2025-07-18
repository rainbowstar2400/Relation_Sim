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
  INFP: '控えめだけど思慮深く、感受性豊かなタイプのようです。',
  INFJ: '物静かですが、強い信念を内に秘めている理想主義者です。',
  INTP: '知的な探求心が旺盛で、ユニークな視点を持つアイデアマンです。',
  INTJ: '戦略的な思考が得意で、計画を立てて物事を進める完璧主義者です。',
  ISFP: '柔軟な考え方を持ち、芸術的なセンスに優れた冒険家です。',
  ISFJ: '献身的で、大切な人を守ろうとする心温かい擁護者です。',
  ISTP: '大胆で実践的な思考を持ち、物事の仕組みを探求する職人です。',
  ISTJ: '実直で責任感が強く、伝統や秩序を重んじる管理者です。',
  ENFP: '情熱的で想像力豊か、常に新しい可能性を追い求める運動家です。',
  ENFJ: 'カリスマ性と共感力を兼ね備え、人々を導く主人公タイプです。',
  ENTP: '頭の回転が速く、知的な挑戦を好む、鋭い論客です。',
  ENTJ: 'リーダーシップに優れ、大胆な決断力で道を切り開く指揮官です。',
  ESFP: '陽気でエネルギッシュ、その場の注目を集めるエンターテイナーです。',
  ESFJ: '社交的で思いやりがあり、人々をサポートすることに喜びを感じる領事官です。',
  ESTP: '賢く、エネルギッシュで、リスクを恐れない起業家精神の持ち主です。',
  ESTJ: '優れた管理能力を持ち、物事を着実に実行していく、頼れる幹部タイプです。'
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
