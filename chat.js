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

  // Improved RAG: Better keyword extraction and semantic-ish matching
  getRelevantContext(query) {
    if (!this.context) return "";
    
    const queryLower = query.toLowerCase();
    const matches = new Set();

    // 1. Check Projects (Name, Desc, Stack, Highlights)
    this.context.projects.forEach(p => {
      const pText = `${p.name} ${p.description} ${p.stack.join(' ')} ${p.highlights.join(' ')}`.toLowerCase();
      if (pText.split(/\W+/).some(word => word.length > 3 && queryLower.includes(word))) {
        matches.add(`[Project: ${p.name}] ${p.description} (Stack: ${p.stack.join(', ')})`);
      }
    });

    // 2. Check Skills (Directly from summary and stack tags)
    const allStack = [...new Set(this.context.projects.flatMap(p => p.stack))];
    allStack.forEach(skill => {
      if (queryLower.includes(skill.toLowerCase())) {
        matches.add(`[Skill Found] Swaraj is proficient in ${skill}.`);
      }
    });

    // 3. Check Experience
    this.context.experience.forEach(e => {
      if (queryLower.includes(e.company.toLowerCase()) || queryLower.includes(e.role.toLowerCase())) {
        matches.add(`[Experience] Swaraj worked as a ${e.role} at ${e.company} (${e.date}).`);
      }
    });

    // 4. Check Summary
    if (this.context.summary.toLowerCase().includes(queryLower)) {
       matches.add(`[Summary Info] ${this.context.summary.substring(0, 200)}...`);
    }

    return Array.from(matches).slice(0, 3).join('\n\n');
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
          history: this.messages.slice(-5)
        })
      });

      if (!response.ok) throw new Error('Offline/API Error');
      
      const data = await response.json();
      this.addMessage('assistant', data.response);
    } catch (e) {
      console.warn('Chat using Local RAG:', e.message);
      const fallback = this.getStaticResponse(text, contextSnippet);
      
      // Add a slight artificial delay for the fallback to feel "AI-like"
      setTimeout(() => {
        this.addMessage('assistant', fallback);
        this.setTyping(false);
      }, 800);
      return;
    }
    this.setTyping(false);
  }

  getStaticResponse(text, context) {
    if (context) {
      return `Based on Swaraj's portfolio:\n\n${context}\n\n(Note: I'm currently answering using local data. For full LLM capabilities, Swaraj needs to deploy the backend worker.)`;
    }
    
    // Default answers for common questions
    const q = text.toLowerCase();
    if (q.includes('skill') || q.includes('know') || q.includes('tech')) {
      const skills = [...new Set(this.context.projects.flatMap(p => p.stack))].slice(0, 10).join(', ');
      return `Swaraj has expertise in ${skills}, and more. He specializes in NLP, TTS, and LLM systems.`;
    }
    if (q.includes('contact') || q.includes('email') || q.includes('hire')) {
      return `You can reach Swaraj at ${this.context.contact.email} or via LinkedIn. He is currently based in Dublin and has a Stamp 4 visa.`;
    }

    return "I'm currently in local search mode. I couldn't find a direct match for that in the portfolio, but you can ask about specific projects like AutoHub, DataDrive, or his experience at Meta!";
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  new PortfolioChat();
});
