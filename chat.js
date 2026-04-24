document.addEventListener('DOMContentLoaded', () => {
    const chatWidget = document.getElementById('chat-widget');
    const chatToggle = document.getElementById('chat-toggle');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    let contextData = null;

    // Load Local Knowledge Base
    fetch('/data/context.json')
        .then(res => res.json())
        .then(data => { contextData = data; })
        .catch(err => console.error("Knowledge base failed to load:", err));

    // Local Expert Logic
    const localExpert = {
        findAnswer(query) {
            if (!contextData) return "I'm still loading my knowledge base. One second!";
            const q = query.toLowerCase();
            
            if (this.matches(q, ['education', 'degree', 'university', 'msc', 'btech', 'study', 'college', 'dbs', 'amity'])) {
                const edu = contextData.education[0];
                return `Swaraj holds an **${edu.degree}** (1.1 Honours) from ${edu.school} (${edu.year}). He also has a ${contextData.education[1].degree} from ${contextData.education[1].school}.`;
            }

            if (this.matches(q, ['contact', 'email', 'phone', 'linkedin', 'github', 'reach', 'location', 'address'])) {
                return `You can reach Swaraj at **${contextData.profile.email}** or **${contextData.profile.phone}**. He is based in **${contextData.profile.location}** and is ${contextData.profile.status}.`;
            }

            if (this.matches(q, ['meta', 'work', 'experience', 'job', 'career', 'linguist', 'hindi', 'covalen'])) {
                const meta = contextData.experience.find(e => e.company.includes('Meta'));
                return `At **Meta**, Swaraj works as a TTS Linguist for the Hindi locale. He built evaluation suites for the Ray-Ban Meta glasses and corrected over 14k phonetic errors using custom Python tooling.`;
            }

            if (this.matches(q, ['project', 'autohub', 'datadrive', 'sorted', 'build', 'github', 'llm', 'rag', 'agent'])) {
                const projects = contextData.projects.map(p => `**${p.name}**`).join(', ');
                return `Swaraj has built several high-impact AI projects including ${projects}. His work spans real-time scrapers, AI orchestration (Nexus Platform), and local-first AI (Sorted).`;
            }

            if (this.matches(q, ['skill', 'python', 'rust', 'pytorch', 'nlp', 'machine learning', 'ai', 'tech'])) {
                return `Swaraj is expert in **${contextData.skills.ml_ai.join(', ')}**. He is also proficient in systems programming with **Rust, Python, and C++**.`;
            }

            return `Swaraj is a ${contextData.profile.role} specializing in ${contextData.profile.specialties.slice(0, 3).join(', ')}. Ask me about his work at Meta, his MSc in AI, or his latest projects like AutoHub Ireland!`;
        },
        matches(q, keywords) { return keywords.some(k => q.includes(k)); }
    };

    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        
        // Simple Markdown-ish bolding support
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        msgDiv.innerHTML = `<div class="message-content">${formattedText}</div>`;
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(text, true);
        chatInput.value = '';

        // Simulate a tiny delay for "thinking" feel, but response is instant local
        setTimeout(() => {
            const answer = localExpert.findAnswer(text);
            addMessage(answer);
        }, 300);
    }

    // Auto-open logic
    setTimeout(() => {
        if (chatWidget.classList.contains('hidden')) {
            chatWidget.classList.remove('hidden');
        }
    }, 2000);

    chatToggle.addEventListener('click', () => chatWidget.classList.toggle('hidden'));
    chatClose.addEventListener('click', () => chatWidget.classList.add('hidden'));
    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
});
