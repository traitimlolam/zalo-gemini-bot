const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

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

    // 1. Gọi Gemini AI
    const result = await model.generateContent(cleanMessage);
    const replyText = result.response.text();

// 2. Gửi câu trả lời về lại Zalo nhóm
const response = await axios.post(
  `https://openapi.zalo.me/v2.0/oa/message?access_token=${ZALO_BOT_TOKEN}`,
  {
    recipient: { 
      group_id: chatId // Dùng group_id thay vì chat_id cho nhóm
    },
    message: { text: replyText }
  }
);

    console.log("Kết quả gửi Zalo:", response.data);

  } catch (error) {
    console.error("Lỗi xử lý:", error.response?.data || error.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server đang chạy trên port ${PORT}`));
