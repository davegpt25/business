const axios = require('axios');

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8001/api/v1',
  timeout: 30000,
});

exports.analyzeItem = async (imageBuffer, mimeType) => {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', imageBuffer, { contentType: mimeType, filename: 'item.jpg' });
  const res = await aiClient.post('/item/analyze-item', form, {
    headers: form.getHeaders(),
  });
  return res.data;
};
