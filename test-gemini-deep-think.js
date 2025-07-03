import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from 'child_process';

// ==============================================
// Gemini 2.5 Pro Deep Think System Design Test
// ==============================================

class GeminiDeepThinkTester {
  constructor() {
    this.apiKey = this.getSecureApiKey();
    
    // --- KEY CHANGE: ADD REQUEST OPTIONS WITH TIMEOUT ---
    this.genAI = new GoogleGenerativeAI(this.apiKey, {
        requestOptions: {
            // Set timeout to 5 minutes (300,000 milliseconds)
            timeout: 300000, 
        }
    });

    this.modelName = "gemini-2.5-pro";
  }

  getSecureApiKey() {
    try {
      return execSync('gcloud secrets versions access latest --secret="google-ai-api-key"', 
                     { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error("❌ Failed to retrieve API key from Google Cloud Secret Manager.");
      console.error("   Make sure you have the secret 'google-ai-api-key' configured.");
      process.exit(1);
    }
  }

  getModelConfiguration() {
    return {
      model: this.modelName,
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
      ]
    };
  }

  getComplexSystemDesignPrompt() {
    return `You are a senior software architect tasked with designing a distributed system architecture that can handle 1 million concurrent users with the following requirements:

**SYSTEM REQUIREMENTS:**
1. Load Balancing Strategy: Explain horizontal scaling approach with specific algorithms.
2. Database Architecture: Sharding, replication, and consistency models (CAP theorem considerations).
3. Caching Layer: Redis/Memcached implementation with cache invalidation strategies.
4. Fault Tolerance: Circuit breakers, retries, graceful degradation, and disaster recovery.
5. Monitoring: Health checks, observability, and real-time alerting systems.

**DELIVERABLES NEEDED:**
• High-level architecture diagram description with data flow.
• Python code examples for key components (FastAPI/Flask microservices).
• Specific technology stack recommendations with justifications.
• Performance benchmarks and bottleneck analysis.
• Deployment strategy (Docker/Kubernetes).

**CONSTRAINTS:**
- Budget: \$50,000/month cloud infrastructure.
- Response time: <100ms for 95% of requests.
- Uptime: 99.9% availability requirement.
- Security: Handle PII data with encryption at rest and in transit.

Please provide a comprehensive solution with detailed explanations and practical implementation examples.`;
  }

  async executeDeepThinkTest() {
    const startTime = Date.now();
    
    try {
      console.log("🧠 Initializing Gemini 2.5 Pro Deep Think Test");
      console.log("=".repeat(80));
      console.log(`🎯 Model: ${this.modelName}`);
      console.log("⚙️  Configuration: Request timeout set to 5 minutes");
      console.log("=".repeat(80));

      const model = this.genAI.getGenerativeModel(this.getModelConfiguration());
      const complexProblem = this.getComplexSystemDesignPrompt();

      console.log("🚀 Sending complex system design challenge to Gemini 2.5 Pro...");
      console.log("⏳ Waiting for a comprehensive response (this could take over a minute)...");
      console.log("");

      const result = await model.generateContent(complexProblem);
      const endTime = Date.now();
      const executionTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log("✅ DEEP THINK RESPONSE GENERATED SUCCESSFULLY");
      console.log("=".repeat(80));
      console.log(`⏱️  Execution Time: ${executionTime} seconds`);
      console.log(`📊 Response Length: ${result.response.text().length} characters`);
      console.log("=".repeat(80));
      console.log("");
      console.log("🎯 GEMINI 2.5 PRO SYSTEM ARCHITECTURE RESPONSE:");
      console.log(result.response.text());

    } catch (error) {
      this.handleDetailedError(error, Date.now() - startTime);
    }
  }

  handleDetailedError(error, duration) {
    const executionTime = (duration / 1000).toFixed(2);
    console.error("❌ DEEP THINK TEST FAILED");
    console.error("=".repeat(80));
    console.error(`⏱️  Failed after: ${executionTime} seconds`);
    console.error(`🎯 Model attempted: ${this.modelName}`);
    console.error("=".repeat(80));
    console.error("🔴 Primary Error:", error.message);
    
    if (error.cause) {
      console.error("");
      console.error("🔍 Underlying Cause:", JSON.stringify(error.cause, null, 2));
    }
    
    console.error("");
    console.error("💡 TROUBLESHOOTING:");
    
    if (parseFloat(executionTime) >= 59) {
        console.error("   The request timed out. This is common for very complex prompts.");
        console.error("   The timeout has been increased in this script. If it fails again, the model may be overloaded.");
    }
    
    console.error("   Verify API key permissions and region availability in your Google Cloud Console.");
    console.error("=".repeat(80));
  }
}

async function runDeepThinkTest() {
  const tester = new GeminiDeepThinkTester();
  await tester.executeDeepThinkTest();
}

runDeepThinkTest().catch(console.error);
