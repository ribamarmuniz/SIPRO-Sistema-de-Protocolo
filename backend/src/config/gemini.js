const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = 'sua chave de api aqui';

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

module.exports = model;