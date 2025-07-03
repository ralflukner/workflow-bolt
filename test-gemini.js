import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from 'child_process';

// Get API key from Secret Manager
const apiKey = execSync('gcloud secrets versions access latest --secret="google-ai-api-key"', 
                       { encoding: 'utf8' }).trim();

const genAI = new GoogleGenerativeAI(apiKey);
console.log("Gemini ready! 🚀");

// Quick test
try {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent("Hello Gemini!");
  console.log("Response:", result.response.text());
} catch (error) {
  console.error("Error:", error.message);
}
