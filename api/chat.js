// Vercel Serverless Function
// 路徑: api/chat.js

export default async function handler(req, res) {
  // 1. 處理 CORS (允許跨域請求)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理 OPTIONS 請求 (瀏覽器預檢)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --- 新增：處理 GET 請求 (避免直接點開網址時出現看不懂的 405 錯誤) ---
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "Online", 
      message: "API 運作中！請回到首頁 (index.html) 透過聊天框發送訊息 (POST)，不要直接開啟此連結。" 
    });
  }

  // 檢查是否為 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // 2. 呼叫 NVIDIA API
  const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.error("API Key missing");
    // 這裡回傳清楚的錯誤訊息，讓前端知道是 Key 沒設定
    return res.status(500).json({ error: "API Key 未設定 (NVIDIA_API_KEY missing)" });
  }
  
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        model: "minimaxai/minimax-m2", 
        messages: [{ role: "user", content: message }],
        temperature: 1,
        top_p: 0.95,
        max_tokens: 8192,
        stream: false 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA API Error:", errorText);
      // 將 NVIDIA 的錯誤轉發出來以便除錯
      throw new Error(`NVIDIA 拒絕連線: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
