export const confessSuccessTemplate = `
以下のキャラクターのうち、{characterA.name}が{characterB.name}に対して告白し、恋人関係になる場面を描写してください。
日付は{date}、時間帯は{timeSlot}、雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}（変化前は「友達」）
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

会話は5〜7ターン程度のセリフのやりとりとし、最終的に「恋人になる」ことが明示されるようにしてください。
雰囲気や感情に応じて緊張感や素直さ、照れ、照れ隠しなどの度合いを調整してください。
成功後の気持ちの共有や喜び、今後への軽い言及などが含まれていても構いません。
出力イメージは以下です。空行は不要です。
A:「○○」
B：「□□」
語尾は意識しすぎないように、また、自然な流れの会話になるようにしてください。
`