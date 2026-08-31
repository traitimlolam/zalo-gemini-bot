const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Hàm gọi AI có cơ chế tự động chuyển mô hình khi bị quá tải 503
async function generateResponse(prompt) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`Mô hình ${modelName} lỗi/qua tải, đang thử lại...`);
    }
  }
  throw new Error("Tất cả mô hình Gemini hiện đang bận, vui lòng thử lại sau.");
}

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const data = req.body;
    console.log("Dữ liệu nhận được:", JSON.stringify(data));

    const userMessage = data.message?.text || "";
    const chatId = data.message?.chat?.id;

    if (!userMessage || !chatId) return;

    const cleanMessage = userMessage.replace(/@\S+/g, '').trim();
    if (!cleanMessage) return;

    // 1. Gọi Gemini với cơ chế fallback
    const replyText = await generateResponse(cleanMessage);

    // 2. Gửi phản hồi về Zalo
    const response = await axios.post(
      'https://openapi.zalo.me/v2.0/oa/message',
      {
        recipient: { group_id: chatId },
        message: { text: replyText }
      },
      {
        headers: {
          'access_token': ZALO_BOT_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Kết quả gửi Zalo thành công:", response.data);

  } catch (error) {
    console.error("Lỗi xử lý:", error.response?.data || error.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server đang chạy trên port ${PORT}`));
