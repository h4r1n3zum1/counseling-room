import React, { useState, useEffect, useRef } from 'react';
import { Lock, MessageCircle, Heart, Shield, LogOut, User } from 'lucide-react';

export default function CounselingRoom() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentSession, setCurrentSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // 認証API呼び出し
  const authenticateUser = async (password) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth API Error:', error);
      return { success: false, message: 'ネットワークエラーが発生しました' };
    }
  };

  // チャットAPI呼び出し
  const callChatAPI = async (userMessage, conversationHistory = []) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.error || 'API response error');
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      throw error;
    }
  };

  // ログイン処理
  const handleLogin = async () => {
    const result = await authenticateUser(password);
    
    if (result.success) {
      setIsAuthenticated(true);
      setCurrentSession(result.sessionId);
      setChatHistory([
        {
          message: "こんにちは。匿名カウンセリング室へようこそ。\n\nここは完全に安全で匿名の空間です。どんなことでも遠慮なくお話しください。\n\n今日はどんなことでお困りですか？",
          isUser: false,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } else {
      alert(result.message || 'パスワードが間違っています');
    }
  };

  // AI応答取得
  const getAIResponse = async (userMessage) => {
    setIsTyping(true);
    
    try {
      const response = await callChatAPI(userMessage, chatHistory);
      
      setChatHistory(prev => [...prev, {
        message: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory(prev => [...prev, {
        message: '申し訳ありません。システムに問題が発生しました。しばらく待ってから再度お試しください。お急ぎの場合は、専門機関（こころの健康相談統一ダイヤル: 0570-064-556）にご相談ください。',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // メッセージ送信
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    const newMessage = {
      message: userInput,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    getAIResponse(userInput);
    setUserInput('');
  };

  // セッション終了
  const endSession = () => {
    if (window.confirm('セッションを終了しますか？\n会話内容は完全に削除され、復元できません。')) {
      setChatHistory([]);
      setCurrentSession(null);
      setIsAuthenticated(false);
      setPassword('');
    }
  };

  // 新しいセッション開始
  const startNewSession = () => {
    if (window.confirm('新しいセッションを開始しますか？\n現在の会話内容は削除されます。')) {
      setCurrentSession('session_' + Math.random().toString(36).substr(2, 9));
      setChatHistory([
        {
          message: "新しいセッションを開始しました。\n\n今日はどんなことでお困りですか？",
          isUser: false,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  // 自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // ログイン画面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">匿名カウンセリング室</h1>
            <p className="text-gray-600">完全プライベートな相談空間</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アクセスコード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="パスワードを入力してください"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              入室する
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-gray-800">プライバシー保護</p>
                <p className="text-gray-600">会話内容は暗号化され、セッション終了時に完全削除されます</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <p>※ 緊急時は専門機関にご相談ください</p>
            <p>こころの健康相談統一ダイヤル: 0570-064-556</p>
          </div>
        </div>
      </div>
    );
  }

  // メインカウンセリング画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-800">匿名カウンセリング室</h1>
              <p className="text-xs text-gray-500">セッション: {currentSession}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={startNewSession}
              className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-1"
            >
              <User className="w-4 h-4" />
              <span>新セッション</span>
            </button>
            <button
              onClick={endSession}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>退室</span>
            </button>
          </div>
        </div>
      </div>

      {/* チャットエリア */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  chat.isUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-line">{chat.message}</p>
                  <p className="text-xs opacity-70 mt-2">{chat.timestamp}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* 入力エリア */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="気持ちを話してください..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !userInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        </div>

        {/* フッター情報 */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p className="flex items-center justify-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>このセッションは完全匿名で、終了時に全データが削除されます</span>
          </p>
        </div>
      </div>
    </div>
  );
}
