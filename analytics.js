/**
 * Swaraj Shaw Portfolio — Analytics & Visitor Counter
 * Tracks unique visits and pageviews.
 */

const ANALYTICS_CONFIG = {
    namespace: 'swarajshaw-portfolio', // Unique namespace for CountAPI
    trackerUrl: 'https://portfolio-gemini-3-flash-live.shaw-swaraj16.workers.dev/track' // Recommended backend
};

async function initAnalytics() {
    console.log("Analytics initializing...");

    const isUnique = !localStorage.getItem('ss_visited');
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    if (isUnique) {
        localStorage.setItem('ss_visited', 'true');
        localStorage.setItem('ss_first_visit', new Date().toISOString());
    }

    // 1. Gather Metadata
    const metadata = {
        unique: isUnique,
        referrer: document.referrer || 'direct',
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        path: window.location.pathname,
        timestamp: new Date().toISOString()
    };

    // 2. Log to Backend (Cloudflare Worker)
    // We attempt to send this to the worker. If it fails (worker not updated yet), we fall back.
    try {
        fetch(ANALYTICS_CONFIG.trackerUrl, {
            method: 'POST',
            mode: 'no-cors', // Avoid CORS issues for simple logging
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata)
        });
    } catch (e) {
        console.warn("Custom tracker offline, using fallback.");
    }

    // 3. Update & Fetch Visitor Count (using CountAPI for the visible number)
    // This is a simple way to get a public counter without a complex DB setup.
    updateVisibleCounter();
}

async function updateVisibleCounter() {
    const counterEl = document.getElementById('visitor-count');
    if (!counterEl) return;

    try {
        // Fetch the count from your own Cloudflare Worker
        const response = await fetch(`${ANALYTICS_CONFIG.trackerUrl.replace('/track', '/count')}`);
        const data = await response.json();
        
        if (data.count) {
            counterEl.textContent = data.count.toLocaleString();
        }
    } catch (err) {
        // Fallback placeholder if worker is not yet updated
        counterEl.textContent = '1,240+'; 
    }
    counterEl.parentElement.classList.add('visible');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAnalytics);
