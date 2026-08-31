const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// Lấy chìa khóa API từ biến môi trường trên Render
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

// Khởi tạo Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

app.post('/webhook', async (req, res) => {
  // Trả về 200 OK ngay lập tức để Zalo không báo lỗi timeout
  res.sendStatus(200);

  try {
    const data = req.body;
    console.log("Dữ liệu nhận được:", JSON.stringify(data));

    // Bắt đúng cấu trúc tin nhắn và ID nhóm từ Zalo
    const userMessage = data.message?.text || "";
    const chatId = data.message?.chat?.id;

    if (!userMessage || !chatId) return;

    // Lọc bỏ tag @Bot khỏi nội dung gửi tới AI
    const cleanMessage = userMessage.replace(/@\S+/g, '').trim();
    if (!cleanMessage) return;

    // 1. Gửi câu hỏi sang Gemini
    const result = await model.generateContent(cleanMessage);
    const replyText = result.response.text();

    // 2. Gửi phản hồi về nhóm Zalo (Dùng group_id thay vì chat_id)
    const response = await axios.post(
      `https://openapi.zalo.me/v2.0/oa/message?access_token=${ZALO_BOT_TOKEN}`,
      {
        recipient: { group_id: chatId },
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
