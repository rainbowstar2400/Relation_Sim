export const confessFailureTemplate = `
以下のキャラクターのうち、{characterA.name}が{characterB.name}に対して告白するが、恋人関係にはならず「気まずい」関係に変化する場面を描写してください。
時間帯は{timeSlot}、雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}（変化前は「友達」）
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

会話は5〜7ターン程度のセリフのやりとりとし、断られる場面と、その後の気まずさや距離感の変化が伝わるようにしてください。
ただし、直接的に「気まずい」という言葉はあまり使わず、会話の中でその雰囲気を醸し出してください。
雰囲気や感情に応じて謝罪・戸惑い・沈黙・取り繕いなどのバランスを調整してください。
どちらかが場を収めようとする言動を含んでも構いません。
出力イメージは以下です。
A:「○○」
B：「□□」
語尾は意識しすぎないように、また、自然な流れの会話になるようにしてください。
`