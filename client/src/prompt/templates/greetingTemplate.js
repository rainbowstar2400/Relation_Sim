export const greetingTemplate = `
以下のキャラクター同士が、{timeSlot}の時間帯に軽く挨拶を交わしています。
雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

短くて自然な挨拶のやりとり（1〜2ターン）を生成してください。
会話は砕けすぎず、雰囲気に合ったものにしてください。
セリフ間の余分な改行は不要です。
`