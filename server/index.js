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
    let text = response.text();
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
      text = text.substring(startIndex, endIndex + 1);
    }
    const ideas = JSON.parse(text);
    res.json(ideas);

  } catch (error) {
    console.error("Error generating ideas:", error);
    res.status(500).json({ error: 'Failed to generate ideas from AI model.' });
  }
});

app.post('/api/generate-guide', async (req, res) => {
  try {
    const { datasetContext, selectedIdea } = req.body;

    const prompt = `You are an expert data science mentor providing a detailed project plan.

    A student has chosen a project idea based on a Kaggle dataset. Your task is to provide a clear, step-by-step guide for them to follow.

    Here is the original dataset information:
    - Title: "${datasetContext.title}"
    - Description: "${datasetContext.description}"
    - Data Schema: "${datasetContext.schema}"

    Here is the project idea the student selected:
    - Project Title: "${selectedIdea.title}"
    - Project Description: "${selectedIdea.description}"
    - Machine Learning Problem Type: "${selectedIdea.problemType}"

    Please generate a practical, high-level guide with the following sections:
    1.  **Data Cleaning & Preprocessing:** Suggest specific steps relevant to this dataset (e.g., handling missing values in certain columns, converting data types).
    2.  **Feature Engineering:** Propose 2-3 new features the student could create from the existing data to improve model performance.
    3.  **Model Selection:** Recommend a simple baseline model to start with, and then a more advanced model that would be suitable for this problem.
    4.  **Evaluation Metrics:** State the most important metric(s) to use for evaluating the model's performance (e.g., Accuracy, F1-Score, Mean Absolute Error) and explain why.

    Format your response as a single string of text using markdown for headers and lists.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const guideText = response.text();

    res.json({ guide: guideText });

  } catch (error) {
    console.error("Error generating guide:", error);
    res.status(500).json({ error: 'Failed to generate guide from AI model.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});