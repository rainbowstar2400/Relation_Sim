export async function generateDialogue(promptText) {
  // サーバー側の API にリクエストを転送する
  const response = await fetch('/api/generateDialogue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: promptText })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('APIエラー:', data)
    throw new Error(data.error || 'GPT呼び出しに失敗しました')
  }

  // サーバーから返されたテキストのみを利用
  return data.text
}

// デバッグ実行ブロック: Node.js で直接実行されたときのみ動作
if (typeof process !== 'undefined' && process.argv[1] === new URL(import.meta.url).pathname) {
  const samplePrompt = `キャラクターAとBが夕方に二人で話しています。会話スタイル["open", "gentle"]。関係は友達。雰囲気はややポジティブ。5ターンの会話を自然に書いてください。`

  generateDialogue(samplePrompt).then(result => {
    console.log('GPT出力:\n', result)
  })
}
