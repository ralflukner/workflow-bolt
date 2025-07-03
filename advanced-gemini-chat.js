import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';

class AdvancedGeminiChat {
  constructor() {
    this.apiKey = this.getSecureApiKey();
    this.genAI = new GoogleGenerativeAI(this.apiKey, {
      requestOptions: { timeout: 180000 } // 3 minute timeout
    });
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    this.chat = null;
    this.conversationHistory = [];
    this.sessionStartTime = new Date();
    this.messageCount = 0;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '💬 You: '
    });
  }

  getSecureApiKey() {
    try {
      return execSync('gcloud secrets versions access latest --secret="google-ai-api-key"', 
                     { encoding: 'utf8' }).trim();
    } catch (error) {
      console.error("❌ Failed to retrieve API key.");
      process.exit(1);
    }
  }

  displayWelcome() {
    console.clear();
    console.log("🚀 Advanced Gemini 2.5 Pro Chat Interface");
    console.log("=".repeat(60));
    console.log("🎯 Enhanced Features:");
    console.log("   • Conversation history tracking");
    console.log("   • Session statistics");
    console.log("   • Export conversation to file");
    console.log("   • Multi-model support (coming soon)");
    console.log("");
    console.log("💡 Commands:");
    console.log("   • /help     - Show all commands");
    console.log("   • /export   - Save conversation to file");
    console.log("   • /stats    - Show session statistics");
    console.log("   • /clear    - Clear conversation history");
    console.log("   • /quit     - Exit the chat");
    console.log("=".repeat(60));
    console.log("");
  }

  async startChat() {
    this.chat = this.model.startChat({ history: [] });
  }

  async processCommand(command) {
    const cmd = command.toLowerCase().trim();
    
    switch (cmd) {
      case '/quit':
      case '/exit':
        await this.exportConversation();
        console.log("\n👋 Chat session ended. Conversation exported!");
        this.rl.close();
        process.exit(0);
        break;
        
      case '/clear':
        await this.startChat();
        this.conversationHistory = [];
        this.messageCount = 0;
        console.log("\n🔄 Conversation cleared!");
        break;
        
      case '/help':
        this.displayHelp();
        break;
        
      case '/stats':
        this.displayStats();
        break;
        
      case '/export':
        await this.exportConversation();
        console.log("
        console.log("\n💾 Conversation exported to file!");
        
      default:
        console.log(`
❓ Unknown command: ${command}`);
        console.log("Type '/help' for available commands.");
    }
  }

  displayHelp() {
    console.log("
📚 ADVANCED COMMANDS:");
    console.log("\n� ADVANCED COMMANDS:");
    console.log("🔹 /clear           - Clear conversation history");
    console.log("🔹 /help            - Show this help");
    console.log("🔹 /stats           - Session statistics");
    console.log("🔹 /export          - Export conversation to file");
    console.log("─".repeat(40));
  }

  displayStats() {
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    
    console.log("
📊 SESSION STATISTICS:");
    console.log("─".repeat(40));
    console.log("\n� SESSION STATISTICS:");
    console.log(`📝 History Length: ${this.conversationHistory.length} entries`);
    console.log(`🤖 Model: gemini-2.5-pro`);
    console.log("─".repeat(40));
  }

  async exportConversation() {
    if (this.conversationHistory.length === 0) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gemini-conversation-${timestamp}.md`;
    
    let content = `# Gemini 2.5 Pro Conversation

`;
    content += `**Session Started:** ${this.sessionStartTime.toISOString()}
`;
    let content = `# Gemini 2.5 Pro Conversation\n\n`;
    content += `**Session Started:** ${this.sessionStartTime.toISOString()}\n`;
    content += `**Messages:** ${this.messageCount}\n\n`;
    content += `---\n\n`;
    
    this.conversationHistory.forEach((entry, index) => {
      content += `## Message ${index + 1}

`;
      content += `**You:** ${entry.user}

`;
      content += `**Gemini:** ${entry.assistant}

`;
      content += `**Time:** ${entry.timestamp}

`;
      content += `---

`;
    });
  async sendMessage(message) {
    if (!message.trim()) return;
    
    console.log(`
🧠 Gemini 2.5 Pro is thinking...`);
    
    try {
      const startTime = Date.now();
      const result = await this.chat.sendMessage(message);
      const endTime = Date.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(2);
      
      const response = result.response.text();
      console.log("─".repeat(50));
      console.log(response);
      console.log("─".repeat(50));
      console.log(`⏱️  Response time: ${responseTime}s`);
      
      // Save to history
      this.conversationHistory.push({
        user: message,
        assistant: response,
        timestamp: new Date().toISOString(),
        responseTime: responseTime
      });
      
      this.messageCount++;
      
    } catch (error) {
      console.error("❌ Error:", error.message);
      console.log("💡 Try rephrasing your question or check your connection.");
    }
  }

  async run() {
    this.displayWelcome();
    await this.startChat();
    
    this.rl.on('line', async (input) => {
      const trimmedInput = input.trim();
      
      if (trimmedInput.startsWith('/')) {
        await this.processCommand(trimmedInput);
      } else if (trimmedInput) {
        await this.sendMessage(trimmedInput);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      console.log('
👋 Goodbye!');
      console.log('\n👋 Goodbye!');
    
    this.rl.prompt();
  }
}

const chat = new AdvancedGeminiChat();
chat.run().catch(console.error);
