import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from 'child_process';

const apiKey = execSync('gcloud secrets versions access latest --secret="google-ai-api-key"', 
                       { encoding: 'utf8' }).trim();
const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini25Pro() {
  try {
    console.log("🧠 Testing Gemini 2.5 Pro - Advanced Reasoning Model");
    
    // Try the main model first
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    // Test with a complex coding problem
    const prompt = `
    Create a Python function that calculates the fibonacci sequence using memoization.
    Include error handling and explain the time complexity.
    `;
    
    const result = await model.generateContent(prompt);
    console.log("✅ Gemini 2.5 Pro Response:");
    console.log(result.response.text());
    
  } catch (error) {
    console.log("❌ Gemini 2.5 Pro Error:", error.message);
    console.log("Trying experimental version...");
    
    // Try experimental version
    try {
      const expModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp" });
      const expResult = await expModel.generateContent("Solve: What is the derivative of x^3 + 2x^2 - 5x + 3?");
      console.log("✅ Gemini 2.5 Pro Experimental Response:");
      console.log(expResult.response.text());
    } catch (expError) {
      console.log("❌ Experimental Error:", expError.message);
    }
  }
}

testGemini25Pro();
