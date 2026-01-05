// 檔案路徑: api/chat.js

export default async function handler(req, res) {
  // --------------------------------------------------------
  // 1. CORS 設定 (允許你的前端網頁呼叫這個後端)
  // --------------------------------------------------------
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理瀏覽器的預檢請求 (OPTIONS) - 這是解決跨域錯誤的關鍵
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // --------------------------------------------------------
  // 2. 限制請求方法 (解決 405 的第一道防線)
  // --------------------------------------------------------
  // 這裡明確規定：只接受 POST，如果用 GET (瀏覽器直接開) 就會報錯
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please use POST.' });
  }

  try {
    const { message } = req.body;

    // --------------------------------------------------------
    // 3. 設定 NVIDIA API (Minimax M2)
    // --------------------------------------------------------
    // 注意：fetch 需要完整的 URL，包含 /chat/completions
    const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
    
    // 從環境變數讀取你的新 Key (千萬不要寫死在這裡！)
    const apiKey = process.env.NVIDIA_API_KEY; 

    if (!apiKey) {
      throw new Error("API Key 未設定");
    }

    // --------------------------------------------------------
    // 4. 發送請求給 NVIDIA
    // --------------------------------------------------------
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "minimaxai/minimax-m2", // 更新為你指定的 Minimax 模型
        messages: [
          // 系統提示詞：設定 AI 的角色
          { 
            role: "system", 
            content: "你是一位精通中國古文的香港中學中文科老師。你的學生正在學習劉蓉的《習慣說》。請用繁體中文回答學生的問題，解釋要生動有趣，並鼓勵學生思考。" 
          },
          // 使用者的問題
          { role: "user", content: message }
        ],
        temperature: 1,      // 根據你的 Python 範例設定
        top_p: 0.95,        // 根據你的 Python 範例設定
        max_tokens: 1024,   // 限制回答長度，避免超時
        stream: false       // ★重要：先設為 false，讓前端比較好處理 (一次回傳)
      }),
    });

    // 檢查 NVIDIA 是否回傳錯誤
    if (!response.ok) {
      const errorData = await response.json();
      console.error("NVIDIA API Error:", errorData);
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    
    // --------------------------------------------------------
    // 5. 回傳結果給前端
    // --------------------------------------------------------
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
