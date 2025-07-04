// pages/api/auth.js - 認証API
export default function handler(req, res) {
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
      message: 'Method not allowed' 
    });
  }

  try {
    const { password } = req.body;

    // パスワード検証
    if (password === 'counseling2025') {
      // セッションID生成
      const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
      
      res.status(200).json({
        success: true,
        sessionId: sessionId,
        message: 'Authentication successful',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'パスワードが間違っています'
      });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
  }
}
