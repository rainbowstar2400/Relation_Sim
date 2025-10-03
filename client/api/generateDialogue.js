export default async function handler(req, res) {
  // POST 以外のリクエストは拒否
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI APIキーが設定されていません' })
    return
  }

  try {
    const { prompt } = req.body

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5-chat-latest',
        messages: [
          { role: 'system', content: 'あなたは登場人物のセリフを書き出すAIです。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: 800
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI APIエラー:', data)
      res.status(response.status).json({ error: data.error?.message || 'GPT呼び出しに失敗しました' })
      return
    }

    const text = data.choices[0].message.content.trim()
    res.status(200).json({ text })
  } catch (err) {
    console.error('API処理中にエラーが発生しました:', err)
    res.status(500).json({ error: 'サーバーエラー' })
  }
}
