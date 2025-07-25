export const becomeBestFriendsTemplate = `
以下のキャラクター同士が、これまでの関係の中で特に大事な会話を交わし、強い友情を感じる場面を描写してください。
日付は{date}、時間帯は{timeSlot}、雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}（変化前は「友達」）
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

会話の中には過去の思い出や互いへの信頼感を含め、特別な絆が形成される様子を含めてください。
やや感情的になってもよく、5〜7ターン程度のやり取りを生成してください。
「親友」という言葉をどこかに含めてください。
出力イメージは以下です。空行は不要です。
A:「○○」
B：「□□」
語尾は意識しすぎないように、また、自然な流れの会話になるようにしてください。
`