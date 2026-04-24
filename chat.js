/**
 * Swaraj Shaw Portfolio - AI Chatbot (RAG)
 * Functional retrieval-augmented generation for portfolio insights.
 */

const CHAT_CONFIG = {
  endpoint: 'https://portfolio-chat-proxy.swarajs.workers.dev/chat', // Placeholder - User to deploy Worker
  contextPath: '/data/context.json'
};

class PortfolioChat {
  constructor() {
    this.context = null;
    this.isOpen = false; // Start closed, but we'll open it in init
    this.messages = [];
    this.init();
  }

  async init() {
    this.createUI();
    this.attachEvents();
    await this.loadContext();
    this.addMessage('assistant', "Hi! I'm Swaraj's AI assistant. Ask me anything about his projects, skills, or experience!");
    
    // Automatically open after a short delay
    setTimeout(() => {
      if (!this.isOpen) this.toggleChat();
    }, 1500);
  }

  async loadContext() {
    try {
      const res = await fetch(CHAT_CONFIG.contextPath);
      this.context = await res.json();
      console.log('Chat context loaded');
    } catch (e) {
      console.error('Failed to load chat context', e);
    }
  }

  createUI() {
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML = `
      <div class="chat-bubble" id="chat-toggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <div class="chat-window" id="chat-window">
        <div class="chat-header">
          <div class="chat-header-icon">🧠</div>
          <div class="chat-header-info">
            <h3>Portfolio AI</h3>
            <p>Knowledge: Swaraj's Projects & Skills</p>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="typing-indicator" id="typing-indicator">AI is thinking...</div>
        <form class="chat-input-area" id="chat-form">
          <input type="text" class="chat-input" id="chat-input" placeholder="Ask about AutoHub, Meta, or Skills..." autocomplete="off">
          <button type="submit" class="chat-send" id="chat-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(widget);
  }

  attachEvents() {
    const toggle = document.getElementById('chat-toggle');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    toggle.onclick = () => this.toggleChat();
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        input.value = '';
        await this.handleUserMessage(text);
      }
    };
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    document.getElementById('chat-window').classList.toggle('active', this.isOpen);
  }

  addMessage(role, content) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${role}`;
    msgDiv.textContent = content;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    this.messages.push({ role, content });
  }

  setTyping(isActive) {
    document.getElementById('typing-indicator').classList.toggle('active', isActive);
    document.getElementById('chat-send').disabled = isActive;
  }

  // Simple RAG: Find relevant snippets from context
  getRelevantContext(query) {
    if (!this.context) return "";
    
    const queryLower = query.toLowerCase();
    let relevantSnippets = [];

    // Search Projects
    this.context.projects.forEach(p => {
      if (queryLower.includes(p.name.toLowerCase()) || p.stack.some(s => queryLower.includes(s.toLowerCase()))) {
        relevantSnippets.push(`Project: ${p.name}. Desc: ${p.description}. Tech: ${p.stack.join(', ')}.`);
      }
    });

    // Search Experience
    this.context.experience.forEach(e => {
      if (queryLower.includes(e.company.toLowerCase()) || queryLower.includes(e.role.toLowerCase())) {
        relevantSnippets.push(`Experience: ${e.role} at ${e.company} (${e.date}).`);
      }
    });

    return relevantSnippets.join('\n');
  }

  async handleUserMessage(text) {
    this.addMessage('user', text);
    this.setTyping(true);

    const contextSnippet = this.getRelevantContext(text);
    
    try {
      const response = await fetch(CHAT_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: contextSnippet,
          history: this.messages.slice(-5) // Send last 5 messages for context
        })
      });

      if (!response.ok) throw new Error('API Error');
      
      const data = await response.json();
      this.addMessage('assistant', data.response);
    } catch (e) {
      console.error('Chat Error:', e);
      // Fallback if API fails or isn't deployed yet
      const fallback = this.getStaticResponse(text, contextSnippet);
      this.addMessage('assistant', fallback);
    } finally {
      this.setTyping(false);
    }
  }

  // Fallback response generator if the serverless function isn't live
  getStaticResponse(text, context) {
    if (context) {
      return `I found some relevant info in Swaraj's portfolio: ${context} Swaraj is currently working on advanced AI systems like this one!`;
    }
    return "I'm currently in 'offline' mode as the backend proxy isn't deployed yet. Swaraj is an ML Engineer specializing in TTS, NLP, and LLMs. Check out his AutoHub Ireland or DataDrive.ai projects!";
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioChat();
});
