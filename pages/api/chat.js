// pages/api/chat.js - チャットAPI（Gemini連携）

// 会社特有の情報を含むシステムプロンプト
const companyContext = `
あなたは職場の匿名カウンセリング室のAIカウンセラーです。

【この会社の特徴】
- 新規事業部門での不透明な意思決定が頻発
- 事前説明や相談なしに方針変更される環境
- 上司は責任回避傾向が強く、感情的な配慮に欠ける
- 部下の努力や貢献が軽視されがち
- 透明性の欠如により、メンバーが不安や失望を感じやすい

【よくある悩み】
- 頑張ったのに突然方針変更される
- 事前説明がなく、疎外感を感じる
- 上司とのコミュニケーション不足
- 努力が正当に評価されない
- 職場での孤独感や無力感

【あなたの役割】
- 相談者の気持ちに深く共感する
- 状況を客観視する手助けをする
- 現実的で建設的なアドバイスを提供
- 「逃げ道」を含む選択肢を示す
- 決して一人じゃないことを伝える

相談者の感情を最優先に、寄り添う姿勢で対話してください。
`;

// Gemini API呼び出し関数
async function callGeminiAPI(userMessage, conversationHistory = []) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    // 会話履歴を含むプロンプトを構築
    const historyText = conversationHistory
      .slice(-6) // 直近3往復のみ保持
      .map(chat => `${chat.isUser ? 'ユーザー' : 'カウンセラー'}: ${chat.message}`)
      .join('\n\n');
    
    const fullPrompt = `${companyContext}

【これまでの会話】
${historyText}

【現在のユーザーメッセージ】
ユーザー: ${userMessage}

上記の文脈を踏まえて、カウンセラーとして共感的で建設的な回答をしてください。`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid API response from Gemini');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORSヘッダーを追加
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Gemini APIを呼び出し
    const aiResponse = await callGeminiAPI(message, conversationHistory);
    
    res.status(200).json({ 
      success: true, 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: '申し訳ありません。一時的に接続に問題があります。しばらく待ってから再度お試しください。お急ぎの場合は、専門機関（こころの健康相談統一ダイヤル: 0570-064-556）にご相談ください。' 
    });
  }
}
