const apiKey = import.meta.env.VITE_OPENAI_API_KEY
if (!apiKey) {
  throw new Error("OpenAI APIキーが設定されていません")
}

export async function generateDialogue(promptText) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "あなたは登場人物のセリフを書き出すAIです。" },
        { role: "user", content: promptText }
      ],
      temperature: 0.85,
      max_tokens: 800
    })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error("OpenAI APIエラー:", data)
    throw new Error(data.error?.message || "GPT呼び出しに失敗しました")
  }

  return data.choices[0].message.content.trim()
}

// デバッグ実行ブロック: Node.js で直接実行されたときのみ動作
if (typeof process !== 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  const samplePrompt = `キャラクターAとBが夕方に二人で話しています。会話スタイル["open", "gentle"]。関係は友達。雰囲気はややポジティブ。5ターンの会話を自然に書いてください。`

  generateDialogue(samplePrompt).then(result => {
    console.log("GPT出力:\n", result)
  })
}
