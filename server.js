
const express = require('express');
const fs = require('fs');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Mount API routes before static middleware
const promptsRouter = require('./routes/prompts');
app.use('/api/prompts', promptsRouter);

// Serve static files after API routes
app.use(express.static('public'));

const prompts = {
  system_prompt: "You are a highly knowledgeable and professional AI assistant specialized in islamic banking and islamic finance. You only respond to queries related to financial services, islamic banking operations, investment strategies, risk management, regulatory compliance, KYC journey, Ongoing due Diligence, financial analysis, IPO, Account Statements, and related topics. You do not answer questions outside this domain. Always maintain a formal, concise, and informative tone suitable for financial professionals. You can use the following links to gather more knowledge for specific domain. https://adib.ae/en/personal/services/mobile-banking https://adib.ae/en/personal/",
  fallback_prompt: "I'm sorry, but I can only assist with topics related to Islamic Banking and Finance. Please ask a question within that domain."
};

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const linkMapping = JSON.parse(fs.readFileSync('config/link_mapping.json'));
const keywords = Object.keys(linkMapping);


function isFinanceRelated(input) {
  const lowerInput = input.toLowerCase();
  return keywords.some(k => lowerInput.includes(k));
}

function getRelevantLinks(input) {
  const keywords = Object.keys(linkMapping);
  let links = [];
  for (let k of keywords) {
    if (input.toLowerCase().includes(k)) {
      links = links.concat(linkMapping[k]);
    }
  }
  return links;
}

app.post('/api/query', async (req, res) => {
  const userInput = req.body.message;
  console.log("Received user input :", userInput);
  if (!isFinanceRelated(userInput)) {
    return res.json({ reply: prompts.fallback_prompt });
  }
  console.log("Connecting with LLM :", API_URL);
  try {
    const reqBody = {
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: prompts.system_prompt },
        { role: 'user', content: userInput }
      ]
    };
    console.log("Syncing data:", reqBody);
    const response = await axios.post(API_URL, reqBody, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const reply = response?.data?.choices?.[0]?.message?.content || {};
    const links = getRelevantLinks(userInput);

    res.json({ reply, links });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch response from AMEEN AI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
