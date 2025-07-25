export const memoryTalkTemplate = `
以下のキャラクター同士が、過去に共有した思い出について自然に話しています。
日付は{date}、時間帯は{timeSlot}、雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

「あの時さ…」のように自然に思い出を振り返る導入から始めてください。
思い出の内容は軽いエピソード（学園祭・ゲーム・食事など）を創作してください。
会話は2〜4ターンで、懐かしさや共感が感じられるようにしてください。
出力イメージは以下です。空行は不要です。
A:「○○」
B：「□□」
語尾は意識しすぎないように、また、自然な流れの会話になるようにしてください。
`