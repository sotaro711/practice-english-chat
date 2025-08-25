export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 最新のユーザーメッセージを取得
    const userMessage = messages[messages.length - 1]?.content || "";

    // 英語学習に特化したシステムプロンプト
    const systemPrompt = `あなたは英語学習専門のAIアシスタントです。ユーザーからのリクエストに対して、以下の形式で必ず3つの英語フレーズを提案してください：

1. 各フレーズは実用的で自然な英語表現である
2. 回答は英語で行う
3. ビジネス、日常会話、アカデミックなど幅広いシーンで使える
4. 中級レベルの学習者に適したレベル
5. 英単語1つ最低でも50単語ある文章にしてください
例：
ユーザー: "会議で使えるフレーズ"
回答:
1. "Let's get started with today's agenda."
2. "I'd like to add something to that point." 
3. "What do you think about this proposal?" 

各フレーズは番号付きリストで提示し、括弧内に日本語訳を記載してください。`;

    // Google AI APIに直接リクエスト
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Google AI API key is not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: systemPrompt + "\n\nユーザー: " + userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "申し訳ありませんが、応答を生成できませんでした。";

    // ストリーミング形式でレスポンスを返す
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(aiResponse));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
}
