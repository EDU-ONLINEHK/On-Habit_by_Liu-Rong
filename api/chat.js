// Vercel Serverless Function
export default async function handler(req, res) {
  // 1. 處理 CORS (允許跨域請求，這對於前後端分離很重要)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 為了安全，上線後建議改成你的網域
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

  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body; // 從前端接收訊息

  // 2. 呼叫 NVIDIA API
  // 這裡以 Llama-3 為例，請根據你使用的模型更換 URL
  const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
  
  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 重要：這裡是從環境變數讀取 Key，不會暴露在程式碼中
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}` 
      },
      body: JSON.stringify({
        model: "meta/llama3-70b-instruct", // 請確認你想用的模型名稱
        messages: [{ role: "user", content: message }],
        temperature: 0.5,
        max_tokens: 1024,
        stream: false
      }),
    });

    const data = await response.json();
    
    // 3. 將 NVIDIA 的結果回傳給前端
    return res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
