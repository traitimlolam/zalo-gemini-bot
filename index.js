const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const data = req.body;
    console.log("Dữ liệu từ Zalo:", JSON.stringify(data));

    const userMessage = data.message?.text || "";
    const chatId = data.chat?.id;

    if (!userMessage || !chatId) return;

    const cleanMessage = userMessage.replace(/@\S+/g, '').trim();
    if (!cleanMessage) return;

    // 1. Gửi câu hỏi sang Gemini
    const result = await model.generateContent(cleanMessage);
    const replyText = result.response.text();

    // 2. Trả lời kết quả về nhóm Zalo
    await axios.post(`https://openapi.zalo.me/v2.0/oa/message?access_token=${ZALO_BOT_TOKEN}`, {
      recipient: { chat_id: chatId },
      message: { text: replyText }
    });

  } catch (error) {
    console.error("Lỗi:", error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server đang chạy trên port ${PORT}`));
