export const becomeFriendsTemplate = `
以下のキャラクター同士が、はじめてしっかりと会話を交わし、打ち解け始める様子を描写してください。
時間帯は{timeSlot}、雰囲気は{moodText}です。

- {characterA.name}：{personalityA}
- {characterB.name}：{personalityB}
- 関係：{relationLabel}（変化前は「認知」）
- 感情：A→B: {emotionAtoB}、B→A: {emotionBtoA}

会話は少しぎこちなく始まり、少しずつ自然に親しみが出てくるようにしてください。
お互いを意識し始めるきっかけが感じられるような構成で、4〜6ターン程度で構成してください。
最後には「よろしく」のような言葉で締めくくり、今後の関係の発展を匂わせるようにしてください。
`