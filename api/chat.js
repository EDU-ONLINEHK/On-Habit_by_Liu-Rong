// Vercel Serverless Function
// 路徑: api/chat.js

export default async function handler(req, res) {
  // 1. 處理 CORS (允許跨域請求，這對於前後端分離很重要)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 開發階段允許所有來源，上線建議鎖定網域
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理 OPTIONS 請求 (瀏覽器預檢 Request)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body; // 從前端接收訊息

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 2. 呼叫 NVIDIA API
  const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
  
  // 你的 API Key 應該設定在 Vercel 的 Environment Variables 中
  // 名稱: NVIDIA_API_KEY
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.error("API Key missing");
    return res.status(500).json({ error: "Server Configuration Error" });
  }
  
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        // 修正點 1: 改為正確的 Minimax 模型名稱
        model: "minimaxai/minimax-m2", 
        messages: [{ role: "user", content: message }],
        
        // 修正點 2: 根據 Minimax 官方範例調整參數
        temperature: 1,      // Minimax 建議值
        top_p: 0.95,        // Minimax 建議值
        max_tokens: 8192,   // 增加 Token 上限
        
        stream: false       // 保持 false (非串流模式)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA API Error:", errorText);
      throw new Error(`NVIDIA API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // 3. 將 NVIDIA 的結果回傳給前端
    return res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error: " + error.message });
  }
}
