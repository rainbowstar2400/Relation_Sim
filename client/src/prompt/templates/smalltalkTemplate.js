export const smalltalkTemplate = `
以下のキャラクター同士が、{timeSlot}の時間帯に雑談をしています。
雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

性格に応じて自然な話題を選び、3〜5ターンの会話を生成してください。
話題は日常的なもの（例：天気、食事、最近の出来事）にしてください。
出力イメージは以下です。空行は不要です。
A:「○○」
B：「□□」
語尾は意識しすぎないように、また、自然な流れの会話になるようにしてください。
`