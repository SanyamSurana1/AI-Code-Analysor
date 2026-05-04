

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

const elements = {
    analyzeBtn: document.getElementById('analyzeBtn'),
    codeInput: document.getElementById('codeInput'),
    outputSection: document.getElementById('outputSection'),
    loader: document.getElementById('loader'),
    cleanCode: document.getElementById('cleanCodeView'),
    analysis: document.getElementById('analysisView'),
    highlighted: document.getElementById('highlightedCode'),
    cards: document.getElementById('analysisCards'),
    lang: document.getElementById('language'),
    export: document.getElementById('exportBtn'),
    themeBtn: document.getElementById('themeToggle'),
    loadSample: document.getElementById('loadSampleBtn')
};

// --- Theme Toggle ---
elements.themeBtn.onclick = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    elements.themeBtn.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
};

// --- AI Analyze Logic ---
elements.analyzeBtn.onclick = async () => {
    const code = elements.codeInput.value.trim();
    const lang = elements.lang.value;
    
    if(!code) {
        alert("Please paste some code first!");
        return;
    }

    // UI Prep
    elements.outputSection.style.display = "flex";
    elements.outputSection.classList.add('active');
    elements.loader.style.display = "flex";
    elements.cleanCode.style.display = "none";
    elements.analysis.style.display = "none";
    elements.export.style.display = "none";

    const prompt = `You are a Senior Developer. Analyze this ${lang} code.
    1. Refactor it to be clean and efficient.
    2. List every function/method with its Time and Space Complexity.
    
    Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    {
        "refactored": "cleaned code string",
        "analysis": [
            {"method": "name", "time": "O(n)", "space": "O(1)", "explanation": "reason"}
        ]
    }`;

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt + "\n\nCODE:\n" + code }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error Details:", errorData);
            throw new Error(errorData.error?.message || "API Request Failed");
        }

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        
        // Clean up AI response in case it wrapped JSON in markdown
        const cleanJsonText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleanJsonText);

        // Update UI
        elements.highlighted.textContent = result.refactored;
        elements.highlighted.className = `language-${lang}`;
        Prism.highlightElement(elements.highlighted);

        elements.cards.innerHTML = result.analysis.map(item => `
            <div class="method-card">
                <div style="font-weight:bold; color:var(--accent)">${item.method}()</div>
                <div class="complexity">
                    <span>Time: <span class="badge">${item.time}</span></span>
                    <span>Space: <span class="badge">${item.space}</span></span>
                </div>
                <div style="font-size:0.8rem; opacity:0.8">${item.explanation}</div>
            </div>
        `).join('');

        elements.loader.style.display = "none";
        elements.cleanCode.style.display = "block";
        elements.analysis.style.display = "block";
        elements.export.style.display = "block";

    } catch (err) {
        console.error("Full Error Object:", err);
        alert("Critical Error: " + err.message + "\n\nCheck the Browser Console (F12) for details.");
        elements.loader.style.display = "none";
    }
};

// --- Export & Samples ---
elements.export.onclick = () => {
    const ext = { java: 'java', python: 'py', javascript: 'js', cpp: 'cpp' }[elements.lang.value];
    const blob = new Blob([elements.highlighted.textContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `optimized_code.${ext}`;
    a.click();
};

elements.loadSample.onclick = () => {
    elements.lang.value = "java";
    elements.codeInput.value = "public class Calc{ public int sum(int n){ int s=0; for(int i=0; i<n; i++){ s+=i; } return s; }}";
};
