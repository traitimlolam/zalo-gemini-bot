const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.json());

// Lấy Key từ cấu hình của Render
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.post('/webhook', async (req, res) => {
  // Báo cho Zalo biết server đã nhận được dữ liệu thành công
  res.sendStatus(200);

  try {
    const data = req.body;
    console.log("Dữ liệu từ Zalo:", JSON.stringify(data));

    const userMessage = data.message?.text || "";
    const chatId = data.chat?.id;

    if (!userMessage || !chatId) return;

    // Lọc bỏ cụm @mention tên bot trong tin nhắn
    const cleanMessage = userMessage.replace(/@\S+/g, '').trim();
    if (!cleanMessage) return;

    // 1. Gửi câu hỏi sang cho Gemini AI
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanMessage,
    });
    const replyText = response.text;

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
