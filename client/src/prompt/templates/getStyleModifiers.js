export const aloneTimeTemplate = `
以下のキャラクター同士が、周囲に誰もいない状況で、二人きりで過ごしています。
時間帯は{timeSlot}、雰囲気は{moodText}です。

- {characterA.name}（{characterA.age}歳・{characterA.gender}）：{personalityA}
- {characterB.name}（{characterB.age}歳・{characterB.gender}）：{personalityB}
- 関係：{relationLabel}
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

普段より少し落ち着いたトーンで、互いのことを少し踏み込んで話すような内容にしてください。
会話は3〜5ターン程度で、沈黙や間の空気感も感じられるように演出してください。
セリフ間の余分な改行は不要です。
`