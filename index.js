const express = require('express');
const bodyParser = require('body-parser');
const { WebhookClient } = require('dialogflow-fulfillment');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  async function handleGPT(agent) {
    const prompt = agent.query;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Bạn là hướng dẫn viên du lịch Cồn Sơn, chuyên hỗ trợ khách hỏi thông tin tour."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = response.data.choices[0].message.content.trim();
      agent.add(reply);
    } catch (error) {
      console.error("❌ Lỗi gọi OpenAI:", error?.response?.data || error.message);
      agent.add("Xin lỗi, hiện tại tôi không thể kết nối đến GPT. Bạn vui lòng thử lại sau.");
    }
  }

  let intentMap = new Map();
  intentMap.set('GPT_INTENT', handleGPT);
  agent.handleRequest(intentMap);
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});
