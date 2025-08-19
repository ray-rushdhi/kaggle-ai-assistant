require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors()); 
app.use(express.json()); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate-ideas', async (req, res) => {
  try {
    const { title, description, schema } = req.body;

    const prompt = `You are an expert data science mentor. Based on the following Kaggle dataset information, generate 3 unique and feasible machine learning project ideas for a student's portfolio.

    For each project idea, you MUST provide:
    1. A short, engaging title.
    2. A one-paragraph description of the project goal and approach.
    3. The type of machine learning problem it is (e.g., 'Binary Classification', 'Regression', 'Clustering').

    Dataset Information:
    - Title: "${title}"
    - Description: "${description}"
    - Data Schema: "${schema}"

    Please format your response ONLY as a valid JSON array of objects, with no other text before or after the array. Each object in the array should have three keys: "title", "description", and "problemType".`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const ideas = JSON.parse(text);
    res.json(ideas);

  } catch (error) {
    console.error("Error generating ideas:", error);
    res.status(500).json({ error: 'Failed to generate ideas from AI model.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});