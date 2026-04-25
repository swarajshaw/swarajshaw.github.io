document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = document.getElementById('chat-widget');
    const chatToggle = document.getElementById('chat-toggle');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const typingIndicator = document.getElementById('typing-indicator');

    let knowledge = null;
    let chatHistory = [];

    // Load Comprehensive Knowledge Base
    fetch('/data/knowledge.json')
        .then(res => res.json())
        .then(data => { knowledge = data; })
        .catch(err => console.error("Knowledge base failed to load:", err));

    const assistant = {
        async getResponse(query) {
            if (!knowledge) return "I'm still syncing my knowledge base. One moment!";
            
            const q = query.toLowerCase();
            
            // 1. Check FAQs / Direct Intents (Instant)
            for (const faq of knowledge.faqs) {
                if (q.includes(faq.q)) return faq.a;
            }

            // 2. Check Education Specifics
            if (this.matches(q, ['education', 'degree', 'university', 'study', 'college', 'msc', 'btech', 'dbs', 'amity'])) {
                const masters = knowledge.education.find(e => e.degree.includes('MSc'));
                const btech = knowledge.education.find(e => e.degree.includes('B.Tech'));
                return `Swaraj has an **${masters.degree}** (${masters.honours}) from ${masters.school} (${masters.year}) and a **${btech.degree}** from ${btech.school}.`;
            }

            // 3. Check Projects (Dynamic Search)
            for (const project of knowledge.projects) {
                if (project.keywords.some(k => q.includes(k))) {
                    return `**${project.name}** is a ${project.type}. ${project.desc}\n\n**Stack:** ${project.stack.join(', ')}`;
                }
            }

            // 4. Check Experience / Work
            if (this.matches(q, ['meta', 'hindi', 'linguist', 'work', 'experience', 'job', 'company'])) {
                const meta = knowledge.experience.find(e => e.company.includes('Meta'));
                return `At **${meta.company}**, Swaraj is a ${meta.role}. He's a major contributor to the Ray-Ban Meta smart glasses Hindi TTS pipeline, achieving 95.6% benchmark accuracy.`;
            }

            // 5. Check Skills
            if (this.matches(q, ['skill', 'python', 'rust', 'pytorch', 'nlp', 'machine learning', 'tech stack'])) {
                return `Swaraj is expert in **${knowledge.skills.ml_ai.slice(0, 5).join(', ')}** and more. His primary languages are **Rust, Python, and C++**.`;
            }

            // 6. Fallback to API (LLM) if complex
            return await this.fetchLLM(query);
        },

        matches(q, keywords) {
            return keywords.some(k => q.includes(k));
        },

        async fetchLLM(message) {
            this.showTyping(true);
            try {
                const response = await fetch("https://portfolio-ai.swaraj-shaw.workers.dev/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: message,
                        context: JSON.stringify(knowledge),
                        history: chatHistory.slice(-5)
                    }),
                });
                const data = await response.json();
                return data.response || "I'm having trouble connecting to my brain right now. Try asking about Swaraj's projects or education!";
            } catch (err) {
                return "I'm offline for a second, but I can tell you about Swaraj's work at Meta or his MSc in AI!";
            } finally {
                this.showTyping(false);
            }
        },

        showTyping(show) {
            if (typingIndicator) typingIndicator.classList.toggle('active', show);
        }
    };

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        
        // Convert markdown-ish to HTML
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n/g, '<br>');
        
        msgDiv.innerHTML = `<div class="message-content">${html}</div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (!isUser) chatHistory.push({ role: 'assistant', content: text });
        else chatHistory.push({ role: 'user', content: text });
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        chatInput.value = '';

        // Instant local response for 90% of queries
        const response = await assistant.getResponse(text);
        
        // Add a slight delay if it was instant for natural feel, unless it's the API which already has delay
        if (typeof response === 'string' && !assistant.isFetching) {
            setTimeout(() => addMessage(response), 400);
        } else {
            addMessage(response);
        }
    }

    // Auto-open logic
    setTimeout(() => {
        if (chatWidget && chatWidget.classList.contains('hidden')) {
            chatWidget.classList.remove('hidden');
        }
    }, 3000);

    chatToggle.addEventListener('click', () => {
        chatWidget.classList.toggle('hidden');
        if (!chatWidget.classList.contains('hidden')) chatInput.focus();
    });
    chatClose.addEventListener('click', () => chatWidget.classList.add('hidden'));
    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
});

