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
    console.log("Dữ liệu nhận được:", JSON.stringify(data));

    // Bắt chính xác cấu trúc JSON Zalo gửi về (dựa trên Log)
    const userMessage = data.message?.text || "";
    const chatId = data.message?.chat?.id;

    if (!userMessage || !chatId) {
      console.log("Không tìm thấy userMessage hoặc chatId");
      return;
    }

    // Lọc bỏ cụm @mention
    const cleanMessage = userMessage.replace(/@\S+/g, '').trim();
    if (!cleanMessage) return;

    // 1. Gọi Gemini AI
    const result = await model.generateContent(cleanMessage);
    const replyText = result.response.text();

    // 2. Phản hồi lại Zalo
    const response = await axios.post(
      `https://openapi.zalo.me/v2.0/oa/message?access_token=${ZALO_BOT_TOKEN}`,
      {
        recipient: { chat_id: chatId },
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
