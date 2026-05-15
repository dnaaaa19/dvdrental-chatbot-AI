(function() {
    'use strict';

    const _style = document.createElement('style');
    _style.textContent = '#chatToggle { background: linear-gradient(135deg, #5b7ec5, #3a9e8f)}        /* ═══════════════════════════════════════════════════════\n           CHATBOT COMPONENT — standalone, overlays any page\n           ═══════════════════════════════════════════════════════ */\n\n        /* ══ TOGGLE BUTTON ══ */\n        #chatToggle {\n            position: fixed;\n            bottom: 24px;\n            right: 24px;\n            z-index: 9999;\n            cursor: pointer;\n            background: linear-gradient(135deg, #5b7ec5, #3a9e8f);\n            width: 62px;\n            height: 62px;\n            border-radius: 50%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            box-shadow: 0 4px 24px rgba(91, 126, 197, 0.5);\n            transition: transform 0.2s, box-shadow 0.2s;\n            animation: pulseGlow 3s ease-in-out infinite;\n            border: none;\n        }\n\n        @keyframes pulseGlow {\n            0%, 100% { box-shadow: 0 4px 24px rgba(91, 126, 197, 0.5); }\n            50%       { box-shadow: 0 4px 40px rgba(58, 158, 143, 0.7); }\n        }\n\n        #chatToggle:hover {\n            transform: scale(1.1);\n        }\n\n        #chatToggle i {\n            color: white;\n            font-size: 1.8rem;\n        }\n\n        /* ══ CHAT WINDOW ══ */\n        #chatWindow {\n            display: none;\n            position: fixed;\n            bottom: 96px;\n            right: 24px;\n            width: 420px;\n            height: 600px;\n            background: var(--chat-bg, #13161f);\n            border: 1px solid var(--chat-border, #1e2535);\n            border-radius: 20px;\n            flex-direction: column;\n            z-index: 9999;\n            box-shadow: 0 16px 64px rgba(0, 0, 0, 0.75);\n            overflow: hidden;\n            animation: slideUp 0.24s cubic-bezier(.16,1,.3,1);\n        }\n\n        @keyframes slideUp {\n            from { opacity: 0; transform: translateY(20px) scale(0.96); }\n            to   { opacity: 1; transform: translateY(0) scale(1); }\n        }\n\n        /* ══ HEADER ══ */\n        .chat-header {\n            padding: 13px 16px;\n            background: var(--chat-header-bg, linear-gradient(135deg, #1a1f2e 0%, #1c2438 100%));\n            border-bottom: 1px solid var(--chat-border, #1e2535);\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n            flex-shrink: 0;\n        }\n\n        .chat-header-left {\n            display: flex;\n            align-items: center;\n            gap: 10px;\n        }\n\n        .chat-avatar {\n            width: 36px;\n            height: 36px;\n            border-radius: 50%;\n            background: linear-gradient(135deg, #5b7ec5, #3a9e8f);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 1rem;\n            color: white;\n            flex-shrink: 0;\n            box-shadow: 0 2px 10px rgba(91,126,197,0.4);\n        }\n\n        .chat-header-title {\n            font-family: \'Space Grotesk\', sans-serif;\n            font-size: 0.95rem;\n            font-weight: 700;\n            color: var(--chat-txt, #e8eaf0);\n        }\n\n        .chat-header-sub {\n            font-size: 0.69rem;\n            color: #5b7ec5;\n            display: flex;\n            align-items: center;\n            gap: 4px;\n        }\n\n        .online-dot {\n            width: 6px;\n            height: 6px;\n            border-radius: 50%;\n            background: #22c55e;\n            display: inline-block;\n            animation: blink 2s ease-in-out infinite;\n        }\n\n        @keyframes blink {\n            0%, 100% { opacity: 1; }\n            50%       { opacity: 0.4; }\n        }\n\n        .chat-header-actions {\n            display: flex;\n            gap: 2px;\n        }\n\n        .chat-header-btn {\n            background: none;\n            border: none;\n            color: var(--chat-txt3, #5a6070);\n            cursor: pointer;\n            padding: 5px 7px;\n            border-radius: 7px;\n            font-size: 0.88rem;\n            transition: color 0.2s, background 0.2s;\n        }\n\n        .chat-header-btn:hover {\n            color: var(--chat-txt, #a8b4cf);\n            background: rgba(255, 255, 255, 0.07);\n        }\n\n        /* ══ CONTEXT BANNER ══ */\n        #chatContextBanner {\n            padding: 5px 14px;\n            background: rgba(91, 126, 197, 0.07);\n            border-bottom: 1px solid rgba(91, 126, 197, 0.13);\n            font-size: 0.71rem;\n            color: #7a96cc;\n            display: flex;\n            align-items: center;\n            gap: 6px;\n            flex-shrink: 0;\n        }\n\n        /* ══ MESSAGES ══ */\n        #chatMessages {\n            flex: 1;\n            overflow-y: auto;\n            padding: 14px 12px;\n            display: flex;\n            flex-direction: column;\n            gap: 8px;\n            scroll-behavior: smooth;\n        }\n\n        #chatMessages::-webkit-scrollbar { width: 3px; }\n        #chatMessages::-webkit-scrollbar-track { background: transparent; }\n        #chatMessages::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }\n\n        .chat-msg {\n            padding: 9px 13px;\n            border-radius: 14px;\n            font-size: 0.83rem;\n            max-width: 92%;\n            word-wrap: break-word;\n            line-height: 1.55;\n            white-space: pre-wrap;\n            animation: msgIn 0.18s ease-out;\n        }\n\n        @keyframes msgIn {\n            from { opacity: 0; transform: translateY(6px); }\n            to   { opacity: 1; transform: translateY(0); }\n        }\n\n        .chat-msg.ai {\n            background: var(--chat-msg-ai-bg, #1a1f2e);\n            color: var(--chat-txt, #d4d8e2);\n            align-self: flex-start;\n            border: 1px solid var(--chat-msg-ai-border, #252e44);\n            border-bottom-left-radius: 4px;\n        }\n\n        .chat-msg.user {\n            background: linear-gradient(135deg, #3d5897, #5b7ec5);\n            color: white;\n            align-self: flex-end;\n            border-bottom-right-radius: 4px;\n        }\n\n        .chat-msg.system-notice {\n            background: rgba(58, 158, 143, 0.09);\n            border: 1px solid rgba(58, 158, 143, 0.2);\n            color: #5bb8a8;\n            align-self: center;\n            font-size: 0.72rem;\n            border-radius: 20px;\n            padding: 4px 14px;\n            max-width: 96%;\n            text-align: center;\n        }\n\n        .chat-msg.ai strong { color: #a8c4f0; }\n        .chat-msg.ai em { color: #8b91a8; font-style: italic; }\n        .chat-msg.ai code {\n            background: rgba(91,126,197,0.15);\n            border-radius: 4px;\n            padding: 1px 5px;\n            font-size: 0.8rem;\n            color: #7ab8e8;\n            font-family: monospace;\n        }\n\n        /* ══ TYPING INDICATOR ══ */\n        .typing-indicator {\n            display: flex;\n            gap: 4px;\n            align-items: center;\n            padding: 10px 14px;\n            background: var(--chat-msg-ai-bg, #1a1f2e);\n            border: 1px solid var(--chat-msg-ai-border, #252e44);\n            border-radius: 14px;\n            border-bottom-left-radius: 4px;\n            align-self: flex-start;\n            width: fit-content;\n        }\n\n        .typing-dot {\n            width: 6px;\n            height: 6px;\n            border-radius: 50%;\n            background: #5b7ec5;\n            animation: typingBounce 1.2s infinite;\n        }\n\n        .typing-dot:nth-child(2) { animation-delay: 0.2s; }\n        .typing-dot:nth-child(3) { animation-delay: 0.4s; }\n\n        @keyframes typingBounce {\n            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }\n            30%            { transform: translateY(-5px); opacity: 1; }\n        }\n\n        /* ══ SMART PROMPT SUGGESTIONS ══ */\n        #promptSuggestions {\n            padding: 7px 10px 0;\n            display: flex;\n            gap: 5px;\n            flex-wrap: wrap;\n            flex-shrink: 0;\n            min-height: 0;\n        }\n\n        .prompt-chip {\n            background: rgba(91, 126, 197, 0.1);\n            border: 1px solid rgba(91, 126, 197, 0.25);\n            border-radius: 20px;\n            color: #8ba8d4;\n            font-size: 0.7rem;\n            padding: 4px 11px;\n            cursor: pointer;\n            transition: all 0.18s;\n            white-space: nowrap;\n            max-width: 200px;\n            overflow: hidden;\n            text-overflow: ellipsis;\n            font-family: \'Inter\', sans-serif;\n        }\n\n        .prompt-chip:hover {\n            border-color: #5b7ec5;\n            color: #b8ccf0;\n            background: rgba(91, 126, 197, 0.22);\n            transform: translateY(-1px);\n        }\n\n        /* ══ QUICK ACTIONS ══ */\n        #quickActions {\n            padding: 5px 10px 7px;\n            display: flex;\n            gap: 5px;\n            flex-wrap: wrap;\n            border-top: 1px solid var(--chat-border, #1e2535);\n            flex-shrink: 0;\n        }\n\n        .quick-btn {\n            background: var(--chat-msg-ai-bg, #1a1f2e);\n            border: 1px solid var(--chat-border2, #2a3040);\n            border-radius: 20px;\n            color: #8b91a8;\n            font-size: 0.7rem;\n            padding: 4px 10px;\n            cursor: pointer;\n            transition: all 0.18s;\n            white-space: nowrap;\n            font-family: \'Inter\', sans-serif;\n        }\n\n        .quick-btn:hover {\n            border-color: #5b7ec5;\n            color: #a8b4cf;\n            background: rgba(91, 126, 197, 0.1);\n        }\n\n        /* ══ INPUT AREA ══ */\n        .chat-input-area {\n            padding: 10px 12px;\n            border-top: 1px solid var(--chat-border, #1e2535);\n            background: var(--chat-input-area-bg, #161b27);\n            display: flex;\n            gap: 8px;\n            align-items: center;\n            flex-shrink: 0;\n        }\n\n        #chatInput {\n            flex: 1;\n            background: var(--chat-input-bg, #0e1117);\n            border: 1px solid var(--chat-border2, #2a3040);\n            border-radius: 10px;\n            color: var(--chat-txt, #d4d8e2);\n            font-size: 0.84rem;\n            padding: 8px 12px;\n            outline: none;\n            transition: border-color 0.2s, box-shadow 0.2s;\n            font-family: \'Inter\', sans-serif;\n            resize: none;\n            height: 38px;\n            max-height: 90px;\n        }\n\n        #chatInput:focus {\n            border-color: #5b7ec5;\n            box-shadow: 0 0 0 2px rgba(91,126,197,0.12);\n        }\n\n        #chatInput::placeholder { color: #3a4260; }\n\n        #chatSend {\n            background: linear-gradient(135deg, #4a6db8, #5b7ec5);\n            border: none;\n            border-radius: 10px;\n            color: white;\n            padding: 8px 14px;\n            font-size: 0.85rem;\n            cursor: pointer;\n            transition: opacity 0.18s, transform 0.1s;\n            display: flex;\n            align-items: center;\n            gap: 5px;\n            font-family: \'Inter\', sans-serif;\n            font-weight: 600;\n            flex-shrink: 0;\n        }\n\n        #chatSend:hover { opacity: 0.88; }\n        #chatSend:active { transform: scale(0.95); }\n        #chatSend:disabled { opacity: 0.4; cursor: not-allowed; }\n\n        /* ══ UNDO TOAST ══ */\n        #undoToast {\n            position: fixed;\n            bottom: 106px;\n            left: 50%;\n            transform: translateX(-50%) translateY(20px);\n            background: #1a2a40;\n            border: 1px solid #3a5080;\n            color: #a8c4f0;\n            padding: 8px 18px;\n            border-radius: 20px;\n            font-size: 0.8rem;\n            z-index: 99999;\n            opacity: 0;\n            transition: opacity 0.25s, transform 0.25s;\n            pointer-events: none;\n            display: flex;\n            align-items: center;\n            gap: 8px;\n            font-family: \'Inter\', sans-serif;\n        }\n\n        #undoToast.show {\n            opacity: 1;\n            transform: translateX(-50%) translateY(0);\n            pointer-events: auto;\n        }\n\n        #undoToast .undo-action-btn {\n            background: #5b7ec5;\n            border: none;\n            border-radius: 6px;\n            color: white;\n            font-size: 0.75rem;\n            padding: 2px 10px;\n            cursor: pointer;\n            font-family: \'Inter\', sans-serif;\n        }\n\n        /* ══ LIGHT MODE OVERRIDES ══ */\n        body.light-chat #chatWindow {\n            --chat-bg: #ffffff;\n            --chat-border: #dde1ec;\n            --chat-border2: #c8cedd;\n            --chat-txt: #1a1e2e;\n            --chat-txt3: #8890a8;\n            --chat-msg-ai-bg: #f0f2f8;\n            --chat-msg-ai-border: #d8dcee;\n            --chat-header-bg: linear-gradient(135deg, #edf0fa 0%, #e8edf8 100%);\n            --chat-input-area-bg: #f5f7fc;\n            --chat-input-bg: #ffffff;\n';
    document.head.appendChild(_style);

    const _container = document.createElement('div');
    _container.id = 'dvd-chatbot-root';
    _container.innerHTML = '\n    <!-- ══ TOGGLE BUTTON ══ -->\n    <button id="chatToggle" title="DVD-AI Assistant" aria-label="Open chat">\n        <i class="bi bi-robot"></i>\n    </button>\n    <div id="chatWindow">\n        <div class="chat-header">\n            <div class="chat-header-left">\n                <div class="chat-avatar"><i class="bi bi-robot"></i></div>\n                <div>\n                    <div class="chat-header-title">DVD-AI</div>\n                    <div class="chat-header-sub"><span class="online-dot"></span> Online · Revenue Pulse</div>\n                </div>\n            </div>\n            <div class="chat-header-actions">\n                <button class="chat-header-btn" id="themeModeBtn" title="Toggle dark/light mode"><i class="bi bi-moon-stars-fill"></i></button>\n                <button class="chat-header-btn" id="btnClearChat" title="Clear history"><i class="bi bi-trash3"></i></button>\n                <button class="chat-header-btn" id="btnCloseChat" title="Close"><i class="bi bi-x-lg"></i></button>\n            </div>\n        </div>\n        <div id="chatContextBanner"><i class="bi bi-geo-alt-fill"></i><span id="bannerText">Detecting Page…</span></div>\n        <div id="chatMessages"></div>\n        <div id="promptSuggestions"></div>\n        <div id="quickActions">\n            <button class="quick-btn" data-msg="Current revenue summary">📊 Revenue</button>\n            <button class="quick-btn" data-msg="Switch monthly chart to bar chart">📈 Bar Chart</button>\n            <button class="quick-btn" data-msg="Revenue trend analysis">📉 Trends</button>\n            <button class="quick-btn" data-msg="Change theme color to teal">🎨 Theme</button>\n            <button class="quick-btn" data-msg="Reset all colors to default">🔄 Reset</button>\n        </div>\n        <div class="chat-input-area">\n            <textarea id="chatInput" placeholder="Ask about data, charts, or request a layout change…" rows="1" autocomplete="off"></textarea>\n            <button id="chatSend"><i class="bi bi-send-fill"></i></button>\n        </div>\n    </div>\n    <div id="undoToast">\n        <i class="bi bi-arrow-counterclockwise"></i>\n        <span id="undoMsg">The changes have been implemented</span>\n        <button class="undo-action-btn" id="btnExecuteUndo">↩ Undo</button>\n    </div>\n';
    document.body.appendChild(_container);

    document.getElementById('quickActions').addEventListener('click', function(e) {
        var btn = e.target.closest('.quick-btn[data-msg]');
        if (btn) quickSend(btn.getAttribute('data-msg'));
    });

    var _undoBtn = document.getElementById('btnExecuteUndo');
    if (_undoBtn) _undoBtn.addEventListener('click', function() { executeUndo(); });


    const STORAGE_KEY  = 'dvd_ai_chat_history_v3';   
    const THEME_KEY    = 'dvd_ai_theme_v2';           
    const API_ENDPOINT = '/api/chat';                 

    const DEFAULT_CHART_TYPES = {
        'chart-monthly': 'scatter', 'chart-growth': 'bar', 'chart-weekday': 'bar',
        'chart-donut': 'pie', 'chart-transactions': 'bar', 'chart-hist': 'scatter',
        'chart-forecast': 'scatter', 'chart-staff': 'bar', 'chart-duration': 'bar',
        'chart-catdonut': 'pie', 'chart-topfilms': 'bar', 'chart-scatter': 'scatter',
        'chart-quadbar': 'bar', 'chart-leakbar': 'bar', 'chart-storeleak': 'bar',
        'chart-catleak': 'bar',
    };

    const CSS_VARS_DARK = {
        '--bg': '#0e1117', '--surface': '#13161f', '--card': '#161b27',
        '--border': '#1e2535', '--border2': '#2a3040', '--txt': '#d4d8e2',
        '--txt2': '#8b91a8', '--txt3': '#5a6070', '--txt4': '#4a5270',
        '--blue': '#5b7ec5', '--teal': '#3a9e8f', '--slate': '#7c86a2',
        '--amber': '#c89a3a', '--rose': '#b05a6a', '--green': '#4a9668',
    };

    const CSS_VARS_LIGHT = {
        '--bg': '#f0f2f7', '--surface': '#ffffff', '--card': '#f8f9fc',
        '--border': '#dde1ec', '--border2': '#c8cedd', '--txt': '#1a1e2e',
        '--txt2': '#4a5070', '--txt3': '#8890a8', '--txt4': '#b0b8cc',
        '--blue': '#3d60b0', '--teal': '#2a8070', '--slate': '#5c6480',
        '--amber': '#a07a20', '--rose': '#903050', '--green': '#2a7848',
    };

    const PAGE_PROMPTS = {
        'overview.html': [
            'What has been the revenue trend over the past 6 months?',
            'Which day has the most transactions?',
            'Compare Store 1 and Store 2',
            'Change the monthly chart to a bar chart',
            'Change the color scheme to orange',
        ],
        'revenue_stores.html': [
            'Display the forecast for the next 3 months',
            'Which staff member has the highest revenue?',
            'Analyze historical revenue trends',
            'Change the time range to the last 3 months',
            'Change the color --blue to #e05060',
        ],
        'film_pricing.html': [
            'Which movie is the most profitable?',
            'Which category has the longest rental duration?',
            'Predict the rental duration for the $3.99 Action movie',
            'Change the top movies chart to a scatter plot',
            'Switch to light mode',
        ],
        'leaks_action.html': [
            'What is the total potential for late fees?',
            'Which movie category is most frequently returned late?',
            'Recommendations to reduce late returns',
            'Compare late fees for Store 1 vs Store 2',
            'Change the leak chart to a bar chart',
        ],
    };

    const DYNAMIC_PROMPTS = {
        revenue:    ['Breakdown of revenue by category?', 'Next months revenue forecast', 'Is Store 2`s revenue higher?'],
        tren:       ['When was revenue at its lowest?', 'What factors influence the trend?', 'Show a graph of the last 6 months'],
        chart:      ['Reset chart to default', 'Change chart color to red', 'Enlarge chart'],
        warna:      ['Reset colors to default', 'Switch to dark mode', 'Change text color to white'],
        late:       ['Strategies to reduce late returns?', 'Which movies are often late?', 'Compare across stores'],
        staff:      ['SWhich staff member is the most productive?', 'Analyze employee performance', 'Compare transactions per staff member'],
    };

    let undoStack    = [];
    let isDarkMode   = true;
    let isSending    = false;
    let isFirstOpen  = true;
    const chartDataBackup = {};  

    function saveHistory(history) {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch(e) {}
    }

    function loadHistory() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    function clearHistory() {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
    }

    function detectCurrentPage() {
        return window.location.pathname.split('/').pop() || 'overview.html';
    }

    function detectActiveTab() {
        const active = document.querySelector('.tab-pane.active');
        return active ? active.id : null;
    }

    function buildUIContext() {
        const page = detectCurrentPage();
        const activeTab = detectActiveTab();
        const chartCount = document.querySelectorAll('[id^="chart-"]').length;
        return {
            page: window.location.pathname || '/',
            pageName: page,
            activeTab,
            theme: isDarkMode ? 'dark' : 'light',
            chartCount,
            availableCharts: Array.from(document.querySelectorAll('[id^="chart-"]')).map(el => el.id),
        };
    }

    function updateContextBanner() {
        const page = detectCurrentPage();
        const tab  = detectActiveTab();
        const pageNames = {
            'overview.html':       '📊 Overview',
            'revenue_stores.html': '💰 Revenue & Stores',
            'film_pricing.html':   '🎬 Film & Pricing',
            'leaks_action.html':   '🚨 Leaks & Action',
        };
        let text = pageNames[page] || '📄 Dashboard';
        if (tab) {
            const tabEl = document.querySelector(`.tab-btn[data-target="${tab}"]`);
            if (tabEl) text += ` › ${tabEl.textContent.trim()}`;
        }
        text += ` · ${isDarkMode ? '🌙 Dark' : '☀️ Light'}`;
        document.getElementById('bannerText').textContent = text;
    }

    function applyTheme(dark) {
        const vars = dark ? CSS_VARS_DARK : CSS_VARS_LIGHT;
        const root = document.documentElement;
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
        isDarkMode = dark;

        document.body.classList.toggle('light-chat', !dark);

        const btn = document.getElementById('themeModeBtn');
        if (btn) {
            btn.innerHTML = dark
                ? '<i class="bi bi-moon-stars-fill"></i>'
                : '<i class="bi bi-sun-fill"></i>';
        }

        const win = document.getElementById('chatWindow');
        if (win) win.style.background = dark ? '#13161f' : '#ffffff';

        try { sessionStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch(e) {}
    }

    function toggleTheme() {
        pushUndo('toggle_theme', { wasDark: isDarkMode }, 'Theme mode has changed');
        applyTheme(!isDarkMode);
        addSystemNotice(isDarkMode ? '🌙 Dark mode is active' : '☀️ Light mode is active');
    }

    function pushUndo(type, snapshot, label) {
        undoStack.push({ type, snapshot, label, ts: Date.now() });
        if (undoStack.length > 20) undoStack.shift();
        showUndoToast(label);
    }

    function showUndoToast(label) {
        const toast = document.getElementById('undoToast');
        document.getElementById('undoMsg').textContent = label;
        toast.classList.add('show');
        clearTimeout(window._undoTimer);
        window._undoTimer = setTimeout(() => toast.classList.remove('show'), 4500);
    }

    function executeUndo() {
        if (!undoStack.length) return;
        const last = undoStack.pop();
        document.getElementById('undoToast').classList.remove('show');

        switch (last.type) {
            case 'toggle_theme':
                applyTheme(last.snapshot.wasDark);
                addSystemNotice('↩️ The theme has been restored');
                break;

            case 'change_color':
                Object.entries(last.snapshot).forEach(([k, v]) =>
                    document.documentElement.style.setProperty(k, v));
                addSystemNotice('↩️ The color have been restored');
                break;

            case 'change_chart_type':
                if (last.snapshot.chartId) {
                    const el = document.getElementById(last.snapshot.chartId);
                    if (el) Plotly.restyle(last.snapshot.chartId, { type: last.snapshot.prevType });
                    addSystemNotice('↩️ The chart type have been restoredn');
                }
                break;

            case 'change_chart_colors':
                if (last.snapshot.chartId && last.snapshot.prevColors) {
                    Plotly.restyle(last.snapshot.chartId, { 'marker.color': last.snapshot.prevColors });
                    addSystemNotice('↩️ The chart colors have been restored');
                }
                break;

            case 'change_time_range':
                if (last.snapshot.chartId && chartDataBackup[last.snapshot.chartId]) {
                    const backup = chartDataBackup[last.snapshot.chartId];
                    Plotly.react(last.snapshot.chartId, backup.data, backup.layout);
                    addSystemNotice('↩️ The time range has been restored to its original setting');
                }
                break;

            case 'swap_charts':
                executeSwapCharts(last.snapshot.chartAId, last.snapshot.chartBId, true);
                addSystemNotice('↩️ Chart positions restored');
                break;

            default:
                addSystemNotice('↩️ The change has been canceled');
        }
    }

    function renderMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    function addMessage(text, role) {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;

        if (role === 'ai') {
            div.innerHTML = renderMarkdown(text);
        } else {
            div.textContent = text;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    function addSystemNotice(text) {
        addMessage(text, 'system-notice');
    }

    function showTyping() {
        const container = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typingIndicator';
        div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    function renderPersistedMessages(history) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        history.forEach(msg => {
            if (msg.role === 'user') addMessage(msg.content, 'user');
            else if (msg.role === 'assistant') addMessage(msg.content, 'ai');
        });
    }

    function updatePromptSuggestions(aiReplyText) {
        const container = document.getElementById('promptSuggestions');
        container.innerHTML = '';

        let chips = [];

        if (aiReplyText) {
            const r = aiReplyText.toLowerCase();
            if (r.includes('revenue') || r.includes('pendapatan'))    chips.push(...DYNAMIC_PROMPTS.revenue);
            if (r.includes('tren') || r.includes('trend'))             chips.push(...DYNAMIC_PROMPTS.tren);
            if (r.includes('chart') || r.includes('grafik'))           chips.push(...DYNAMIC_PROMPTS.chart);
            if (r.includes('warna') || r.includes('tema') || r.includes('color')) chips.push(...DYNAMIC_PROMPTS.warna);
            if (r.includes('late') || r.includes('terlambat'))         chips.push(...DYNAMIC_PROMPTS.late);
            if (r.includes('staff') || r.includes('karyawan'))         chips.push(...DYNAMIC_PROMPTS.staff);
        }

        if (!chips.length) {
            const page = detectCurrentPage();
            chips = PAGE_PROMPTS[page] || PAGE_PROMPTS['overview.html'];
        }

        const seen = new Set();
        const unique = chips.filter(c => {
            if (seen.has(c)) return false;
            seen.add(c);
            return true;
        }).slice(0, 4);

        unique.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'prompt-chip';
            btn.textContent = text;
            btn.title = text;
            btn.onclick = () => quickSend(text);
            container.appendChild(btn);
        });
    }

    function executeAction(command) {
        const root = document.documentElement;
        console.log('[DVD-AI] action:', command);

        switch (command.action) {

            case 'change_chart_type': {
                const el = document.getElementById(command.target);
                if (!el) {
                    addMessage(`⚠️ Chart "${command.target}" not found on this page.`, 'ai');
                    return;
                }
                const prevType = el._fullData?.[0]?.type || DEFAULT_CHART_TYPES[command.target] || 'bar';
                pushUndo('change_chart_type', { chartId: command.target, prevType }, `The chart type has been changed → ${command.type}`);
                Plotly.restyle(command.target, { type: command.type });
                break;
            }

            case 'reset_chart': {
                const el = document.getElementById(command.target);
                if (!el) return;
                const defType = DEFAULT_CHART_TYPES[command.target] || 'bar';
                const prevType = el._fullData?.[0]?.type || defType;
                pushUndo('change_chart_type', { chartId: command.target, prevType }, `The chart has been reset to its default settings`);
                Plotly.restyle(command.target, { type: defType });
                break;
            }

            case 'reset_all_charts': {
                Object.entries(DEFAULT_CHART_TYPES).forEach(([id, type]) => {
                    const el = document.getElementById(id);
                    if (el) Plotly.restyle(id, { type });
                });
                addSystemNotice('✅ All charts have been reset to their default settings');
                break;
            }

            case 'change_color': {
                const snapshot = {};
                if (command.var && command.value) {
                    snapshot[command.var] = getComputedStyle(root).getPropertyValue(command.var).trim();
                    root.style.setProperty(command.var, command.value);
                    pushUndo('change_color', snapshot, `The color of ${command.var} has been changed`);
                } else if (Array.isArray(command.changes)) {
                    command.changes.forEach(c => {
                        snapshot[c.var] = getComputedStyle(root).getPropertyValue(c.var).trim();
                        root.style.setProperty(c.var, c.value);
                    });
                    pushUndo('change_color', snapshot, 'The theme color has been changed');
                }
                break;
            }

            case 'reset_colors': {
                const snapshot = {};
                const vars = isDarkMode ? CSS_VARS_DARK : CSS_VARS_LIGHT;
                Object.keys(vars).forEach(k => {
                    snapshot[k] = getComputedStyle(root).getPropertyValue(k).trim();
                });
                pushUndo('change_color', snapshot, 'Warna direset ke default');
                Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
                addSystemNotice('🎨 All colors reset to default');
                break;
            }

            case 'toggle_dark_mode': {
                const wantDark = command.target !== 'light';
                if (wantDark !== isDarkMode) {
                    pushUndo('toggle_theme', { wasDark: isDarkMode }, 'heme mode changed');
                    applyTheme(wantDark);
                    addSystemNotice(wantDark ? '🌙 Dark mode is active' : '☀️ Light mode is active');
                }
                break;
            }

            case 'toggle_sidebar': {
                const sidebar = document.querySelector('.sidebar');
                const main    = document.querySelector('.main, .main-content');
                if (!sidebar) return;
                if (command.mode === 'hide') {
                    sidebar.style.display = 'none';
                    if (main) { main.style.marginLeft = '0'; main.style.transition = 'margin-left 0.3s'; }
                    addSystemNotice('👁 Sidebar is hidden');
                } else {
                    sidebar.style.display = '';
                    if (main) main.style.marginLeft = '';
                    addSystemNotice('👁 Sidebar is displayed');
                }
                break;
            }

            case 'switch_tab': {
                const btn = document.querySelector(`.tab-btn[data-target="${command.tab}"]`);
                if (btn) btn.click();
                break;
            }

            case 'change_chart_colors': {
                const el = document.getElementById(command.target);
                if (!el) return;
                const prevColors = el._fullData?.[0]?.marker?.color;
                pushUndo('change_chart_colors', { chartId: command.target, prevColors }, 'The chart colors have been changed');
                Plotly.restyle(command.target, { 'marker.color': command.color });
                break;
            }

            case 'change_time_range': {
                const el = document.getElementById(command.target);
                if (!el || !el._fullData) {
                    addMessage(`⚠️ Chart "${command.target}" is not yet listed or is not available on this page.`, 'ai');
                    return;
                }
                if (!chartDataBackup[command.target]) {
                    chartDataBackup[command.target] = {
                        data:   JSON.parse(JSON.stringify(el._fullData || [])),
                        layout: JSON.parse(JSON.stringify(el._fullLayout || {})),
                    };
                }
                pushUndo('change_time_range', { chartId: command.target }, `The time range for ${command.target} has been changed`);

                const monthsBack = parseInt(command.months) || 3;
                const cutoff = new Date();
                cutoff.setMonth(cutoff.getMonth() - monthsBack);

                const newData = el._fullData.map(trace => {
                    if (!Array.isArray(trace.x)) return trace;
                    const filtered = { x: [], y: [] };
                    trace.x.forEach((x, i) => {
                        const d = new Date(x);
                        if (!isNaN(d) && d >= cutoff) {
                            filtered.x.push(x);
                            filtered.y.push(trace.y[i]);
                        }
                    });
                    return { ...trace, x: filtered.x, y: filtered.y };
                });

                Plotly.react(command.target, newData, el._fullLayout || {});
                addSystemNotice(`📅 The time range has been changed to the last ${monthsBack} months (the original data is saved and can be undone)`);
                break;
            }

            case 'resize_chart': {
                const el = document.getElementById(command.target);
                if (!el) return;
                const update = {};
                if (command.height) update.height = parseInt(command.height);
                if (command.width)  update.width  = parseInt(command.width);
                Plotly.relayout(command.target, update);
                addSystemNotice(`📐 The size of the ${command.target} chart has been changed`);
                break;
            }

            case 'update_chart_style': {
                const el = document.getElementById(command.target);
                if (!el) return;
                const update = {};
                if (command.bgcolor)   update['paper_bgcolor']   = command.bgcolor;
                if (command.fontcolor) update['font.color']       = command.fontcolor;
                if (command.gridcolor) {
                    update['xaxis.gridcolor'] = command.gridcolor;
                    update['yaxis.gridcolor'] = command.gridcolor;
                }
                Plotly.relayout(command.target, update);
                addSystemNotice(`🎨 Style chart updated`);
                break;
            }

            case 'permanent_edit': {
                executePermanentEdit(command);
                break;
            }

            case 'permanent_chart_type': {
                executePermanentChartType(command);
                break;
            }

            case 'swap_charts': {
                executeSwapCharts(command.chart_a, command.chart_b, false);
                break;
            }

            case 'permanent_swap': {
                executePermanentSwap(command);
                break;
            }

            case 'toggle_layout_mode': {
                toggleLayoutReorderMode();
                break;
            }

            case 'navigate_page': {
                var PAGE_MAP = {
                    'overview': 'overview.html', 'overview.html': 'overview.html',
                    'revenue': 'revenue_stores.html', 'revenue_stores': 'revenue_stores.html',
                    'revenue_stores.html': 'revenue_stores.html',
                    'film': 'film_pricing.html', 'film_pricing': 'film_pricing.html',
                    'film_pricing.html': 'film_pricing.html',
                    'leaks': 'leaks_action.html', 'leaks_action': 'leaks_action.html',
                    'leaks_action.html': 'leaks_action.html',
                };
                var navTarget = PAGE_MAP[command.target] || command.target;
                var navCurrent = window.location.pathname.split('/').pop() || 'overview.html';
                if (navTarget && navTarget !== navCurrent) {
                    addSystemNotice('\xf0\x9f\x94\x80 Redirecting to ' + navTarget + '...');
                    setTimeout(function() { window.location.href = '/' + navTarget; }, 900);
                } else {
                    addSystemNotice('\xf0\x9f\x93\x8d You are already on this page.');
                }
                break;
            }

                        default:
                console.warn('[DVD-AI] Unknown action:', command.action);
        }

        updateContextBanner();
    }

    async function sendMessage() {
        if (isSending) return;
        const input = document.getElementById('chatInput');
        const text  = input.value.trim();
        if (!text) return;

        isSending = true;
        document.getElementById('chatSend').disabled = true;
        input.value = '';
        input.style.height = '38px';

        addMessage(text, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, page: currentPage })
            });
            const data = await response.json();
            const aiResponse = data.response;
            
            addMessage(aiResponse, 'ai');

            if (aiResponse.includes("UPDATE_UI|")) {
                const parts = aiResponse.split("|"); 
                const oldTxt = parts[1];
                const newTxt = parts[2];
                const color  = parts[3];
                
                await applyGlobalChange(oldTxt, newTxt, color);
            }

        } catch (err) {
            addMessage('Error: ' + err.message, 'ai');
        }

        let chatHistory = loadHistory();
        const uiContext = buildUIContext();
        updateContextBanner();
        showTyping();

        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt:     text,
                    ui_context: uiContext,
                    history:    chatHistory.slice(-20),
                }),
            });

            hideTyping();

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const msg  = data.response || '';

            let displayText = msg;
            let command     = null;

            if (msg.includes('|||')) {
                const sepIdx = msg.lastIndexOf('|||');
                displayText  = msg.slice(0, sepIdx).trim();
                const jsonStr = msg.slice(sepIdx + 3).trim();
                try { command = JSON.parse(jsonStr); }
                catch(e) { console.warn('[DVD-AI] Failed to parse command:', jsonStr); }
            }

            if (displayText) addMessage(displayText, 'ai');
            if (command)     executeAction(command);

            updatePromptSuggestions(displayText);

            chatHistory.push({ role: 'user',      content: text });
            chatHistory.push({ role: 'assistant', content: displayText || msg });
            if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);
            saveHistory(chatHistory);

        } catch(err) {
            hideTyping();
            addMessage('❌ Failed to connect to the server. Make sure Flask (app.py) is running on port 5000.', 'ai');
            console.error('[DVD-AI]', err);
        } finally {
            isSending = false;
            document.getElementById('chatSend').disabled = false;
            input.focus();
        }
    }

    async function applyGlobalChange(oldTxt, newTxt, color) {
    console.log("Sedang mengubah file source code...");
    const response = await fetch('/api/update-ui-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            old_text: oldTxt,
            new_text: newTxt,
            color: color
        })
    });

    const result = await response.json();
    if (result.status === 'success') {
        alert("Source code berhasil diubah secara permanen!");
        location.reload(); 
    }
}

    
    var _pendingPermanentCmd = null;

    function showPermanentConfirm(cmd, summary) {
        _pendingPermanentCmd = cmd;
        var confirmHtml = (
            '<div id="permConfirm" style='
            + '"background:rgba(91,126,197,0.13);border:1px solid rgba(91,126,197,0.4);border-radius:12px;'
            + 'padding:10px 14px;margin:6px 0;font-size:0.78rem;color:#a8c4f0;">'
            + '<b style="color:#7ab8e8;">💾 Permanent change</b><br>'
            + summary
            + '<br><div style="display:flex;gap:8px;margin-top:8px;">'
            + '<button id="permYes" style="background:#3d5897;border:none;border-radius:7px;color:white;'
            + 'font-size:0.75rem;padding:4px 14px;cursor:pointer;">✔ Apply permanently</button>'
            + '<button id="permNo" style="background:#2a3040;border:1px solid #3a4260;border-radius:7px;'
            + 'color:#8b91a8;font-size:0.75rem;padding:4px 14px;cursor:pointer;">✖ Cancel</button>'
            + '</div></div>'
        );
        var wrapper = document.createElement('div');
        wrapper.innerHTML = confirmHtml;
        var msgContainer = document.getElementById('chatMessages');
        msgContainer.appendChild(wrapper);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        document.getElementById('permYes').addEventListener('click', function() {
            wrapper.remove();
            applyPermanentEdit(_pendingPermanentCmd);
        });
        document.getElementById('permNo').addEventListener('click', function() {
            wrapper.remove();
            addSystemNotice('✖ Permanent change cancelled');
            _pendingPermanentCmd = null;
        });
    }

    async function applyPermanentEdit(cmd) {
        var currentPage = detectCurrentPage();
        var payload = Object.assign({}, cmd, { current_page: '\/' + currentPage });
        delete payload.action; 

        addSystemNotice('🔄 Applying permanent change...');

        try {
            var res = await fetch('/api/permanent-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            var data = await res.json();

            if (data.status === 'success') {
                var files = (data.modified || []).join(', ') || 'no files matched';
                addSystemNotice('💾 Permanently saved! Files updated: ' + files);
                applyLivePreview(cmd);
            } else {
                addSystemNotice('❌ Permanent edit failed: ' + (data.message || 'unknown error'));
            }
        } catch(e) {
            addSystemNotice('❌ Could not reach server: ' + e.message);
        }
    }

    function applyLivePreview(cmd) {
        var root = document.documentElement;
        var t = cmd.type;

        if (t === 'css_var') {
            root.style.setProperty(cmd.var, cmd.value);

        } else if (t === 'css_vars_multi') {
            (cmd.changes || []).forEach(function(c) {
                root.style.setProperty(c.var, c.value);
            });

        } else if (t === 'replace_text') {
            var walker = document.createTreeWalker(
                document.body, NodeFilter.SHOW_TEXT, null, false
            );
            var node;
            while ((node = walker.nextNode())) {
                if (node.parentNode && node.parentNode.id === 'dvd-chatbot-root') continue;
                if (node.nodeValue && node.nodeValue.includes(cmd.old_text)) {
                    node.nodeValue = node.nodeValue.split(cmd.old_text).join(cmd.new_text);
                }
            }

        } else if (t === 'element_color') {
            var walker2 = document.createTreeWalker(
                document.body, NodeFilter.SHOW_TEXT, null, false
            );
            var node2;
            while ((node2 = walker2.nextNode())) {
                if (node2.parentNode && node2.parentNode.id === 'dvd-chatbot-root') continue;
                if (node2.nodeValue && node2.nodeValue.toLowerCase().includes(cmd.selector.toLowerCase())) {
                    node2.parentNode.style.color = cmd.color;
                }
            }

        } else if (t === 'inject_css') {
            var style = document.createElement('style');
            style.textContent = cmd.css;
            document.head.appendChild(style);

        } else if (t === 'page_title') {
            if (cmd.file === detectCurrentPage()) {
                document.title = cmd.value;
            }
        }
        updateContextBanner();
    }

    function executePermanentEdit(cmd) {
        var summaries = {
            replace_text:   function(c) { return 'Replace text <b>"' + (c.old_text||'?') + '"</b> → <b>"' + (c.new_text||'?') + '"</b> (scope: ' + (c.scope||'all') + ')'; },
            css_var:        function(c) { return 'Set CSS variable <b>' + c.var + '</b> to <b style="color:' + c.value + '">' + c.value + '</b> in shared.css'; },
            css_vars_multi: function(c) { return 'Update ' + (c.changes||[]).length + ' CSS variables in shared.css'; },
            element_color:  function(c) { return 'Set text color of element "<b>' + (c.selector||'?') + '</b>" to <b style="color:' + c.color + '">' + c.color + '</b>'; },
            inject_css:     function(c) { return 'Inject CSS rule: <code>' + ((c.css||'')).substring(0,80) + '</code>'; },
            page_title:     function(c) { return 'Change page title of ' + (c.file||'?') + ' to "<b>' + (c.value||'?') + '</b>"'; },
        };
        var t = cmd.type || 'unknown';
        var summaryFn = summaries[t] || function() { return 'Type: ' + t; };
        showPermanentConfirm(cmd, summaryFn(cmd));
    }


    function quickSend(text) {
        document.getElementById('chatInput').value = text;
        sendMessage();
    }

    function executePermanentChartType(cmd) {
        var summary = 'Set chart <b>' + cmd.target + '</b> to <b>' + cmd.type + '</b> permanently (survives page refresh)';
        showPermanentConfirm(cmd, summary, async function(confirmedCmd) {
            addSystemNotice('\uD83D\uDD04 Saving permanent chart type...');
            try {
                var res = await fetch('/api/permanent-chart-type', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ target: confirmedCmd.target, type: confirmedCmd.type })
                });
                var data = await res.json();
                if (data.status === 'success') {
                    var el = document.getElementById(confirmedCmd.target);
                    if (el) Plotly.restyle(confirmedCmd.target, { type: confirmedCmd.type });
                    addSystemNotice('\uD83D\uDCBE Chart type for ' + confirmedCmd.target + ' permanently set to ' + confirmedCmd.type + '! Will persist after refresh.');
                } else {
                    addSystemNotice('\u274C Failed: ' + (data.message || 'unknown error'));
                }
            } catch(e) {
                addSystemNotice('\u274C Server error: ' + e.message);
            }
        });
    }


    function executeSwapCharts(chartAId, chartBId, silent) {

        var elA = document.getElementById(chartAId);
        var elB = document.getElementById(chartBId);

        if (!elA) { addMessage('⚠️ Chart "' + chartAId + '" not found on this page.', 'ai'); return; }
        if (!elB) { addMessage('⚠️ Chart "' + chartBId + '" not found on this page.', 'ai'); return; }

        var blockA = _findChartBlock(elA);
        var blockB = _findChartBlock(elB);

        if (!blockA) { addMessage('⚠️ Could not find a swappable block for "' + chartAId + '". Make sure the page has finished loading.', 'ai'); return; }
        if (!blockB) { addMessage('⚠️ Could not find a swappable block for "' + chartBId + '". Make sure the page has finished loading.', 'ai'); return; }
        if (blockA === blockB) { addMessage('⚠️ Both charts are inside the same block — cannot swap.', 'ai'); return; }

        _domSwap(blockA, blockB);

        setTimeout(function() {
            try { Plotly.Plots.resize(chartAId); } catch(e) {}
            try { Plotly.Plots.resize(chartBId); } catch(e) {}
        }, 150);

        if (!silent) {
            pushUndo('swap_charts', { chartAId: chartAId, chartBId: chartBId }, 'Charts swapped: ' + chartAId + ' ↔ ' + chartBId);
            addSystemNotice('🔄 Grafik ' + chartAId + ' ↔ ' + chartBId + ' berhasil ditukar! (Session saja — ketik "permanen" untuk menyimpan)');
        }
    }

    function _findChartBlock(chartEl) {
        var curr = chartEl;
        while (curr && curr !== document.body) {
            if (curr.dataset && curr.dataset.dvdBlock) return curr;
            if (curr.classList && curr.classList.contains('chart-section')) return curr;
            curr = curr.parentElement;
        }
        curr = chartEl.parentElement;
        while (curr && curr !== document.body) {
            var prev = curr.previousElementSibling;
            if (prev && prev.classList && prev.classList.contains('sec-head')) return curr;
            curr = curr.parentElement;
        }
        return null;
    }

    function _domSwap(a, b) {
        var ph = document.createElement('div');
        a.parentNode.insertBefore(ph, a);
        b.parentNode.insertBefore(a, b);
        ph.parentNode.insertBefore(b, ph);
        ph.remove();
    }

    function initChartBlocks() {
        var main = document.querySelector('.main, main');
        if (!main) return;

        var heads = Array.from(main.querySelectorAll('.sec-head'));
        heads.forEach(function(head, idx) {
            if (head.parentElement && head.parentElement.dataset && head.parentElement.dataset.dvdBlock) return;

            var nodes = [head];
            var sib = head.nextElementSibling;
            while (sib && !sib.classList.contains('sec-head') && !sib.classList.contains('divider') && !sib.classList.contains('hero')) {
                nodes.push(sib);
                sib = sib.nextElementSibling;
            }
            if (nodes.length === 0) return;
            var chartEl = null;
            nodes.forEach(function(n) {
                if (!chartEl) {
                    var found = n.querySelector ? n.querySelector('[id^="chart-"]') : null;
                    if (!found && n.id && n.id.startsWith('chart-')) found = n;
                    if (found) chartEl = found;
                }
            });
            var blockId = chartEl ? chartEl.id : ('block-' + idx);

            var wrapper = document.createElement('div');
            wrapper.dataset.dvdBlock = blockId;
            wrapper.dataset.dvdBlockIdx = idx;
            wrapper.style.cssText = 'display:contents'; 
            head.parentNode.insertBefore(wrapper, head);
            nodes.forEach(function(n) { wrapper.appendChild(n); });
        });
    }

    function executePermanentSwap(cmd) {
        var summary = 'Tukar posisi <b>' + cmd.chart_a + '</b> dan <b>' + cmd.chart_b
            + '</b> secara permanen di file HTML (tetap setelah refresh)';
        showPermanentConfirm(cmd, summary, async function(confirmedCmd) {
            var currentPage = detectCurrentPage();
            addSystemNotice('🔄 Menyimpan swap layout ke source code...');
            try {
                var res = await fetch('/api/permanent-swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chart_a: confirmedCmd.chart_a,
                        chart_b: confirmedCmd.chart_b,
                        current_page: '/' + currentPage
                    })
                });
                var data = await res.json();
                if (data.status === 'success') {
                    executeSwapCharts(confirmedCmd.chart_a, confirmedCmd.chart_b, true);
                    addSystemNotice('💾 Layout disimpan permanen di ' + data.file + '! Akan tetap sama setelah refresh.');
                } else {
                    addSystemNotice('❌ Swap gagal: ' + (data.message || 'unknown'));
                }
            } catch(e) {
                addSystemNotice('❌ Server error: ' + e.message);
            }
        });
    }

    var _layoutModeActive = false;
    var _dragSource = null;
    var _dragOverTarget = null;
    var _swapLog = [];

    function toggleLayoutReorderMode() {
        _layoutModeActive = !_layoutModeActive;

        if (_layoutModeActive) {
            _activateDragMode();
        } else {
            _deactivateDragMode();
        }
    }

    function _activateDragMode() {
        initChartBlocks();

        var blocks = _getAllDraggableBlocks();

        if (blocks.length === 0) {
            addSystemNotice('⚠️ Tidak ada blok grafik yang dapat digeser di halaman ini.');
            _layoutModeActive = false;
            return;
        }

        blocks.forEach(function(block) {
            block.setAttribute('draggable', 'true');
            block.style.cursor = 'grab';
            block.style.outline = '2px dashed rgba(91,126,197,0.7)';
            block.style.outlineOffset = '6px';
            block.style.borderRadius = '8px';
            block.style.transition = 'outline 0.2s, opacity 0.2s, box-shadow 0.2s';
            block.addEventListener('dragstart', _onDragStart);
            block.addEventListener('dragend',   _onDragEnd);
            block.addEventListener('dragover',  _onDragOver);
            block.addEventListener('dragleave', _onDragLeave);
            block.addEventListener('drop',      _onDrop);
        });

        addSystemNotice('📌 Mode Atur Ulang Layout AKTIF — Seret grafik untuk memindahkannya. Klik "💾 Simpan Layout" untuk menyimpan permanen.');
        _injectLayoutModeBar(blocks.length);
    }

    function _deactivateDragMode() {
        var blocks = _getAllDraggableBlocks();
        blocks.forEach(function(block) {
            block.setAttribute('draggable', 'false');
            block.style.cursor = '';
            block.style.outline = '';
            block.style.outlineOffset = '';
            block.style.borderRadius = '';
            block.style.opacity = '';
            block.style.boxShadow = '';
            block.removeEventListener('dragstart', _onDragStart);
            block.removeEventListener('dragend',   _onDragEnd);
            block.removeEventListener('dragover',  _onDragOver);
            block.removeEventListener('dragleave', _onDragLeave);
            block.removeEventListener('drop',      _onDrop);
        });
        var bar = document.getElementById('_layoutModeBar');
        if (bar) bar.remove();
        var indicator = document.getElementById('_dropIndicator');
        if (indicator) indicator.remove();
        addSystemNotice('📌 Mode Atur Ulang Layout NONAKTIF');
    }

    function _getAllDraggableBlocks() {
        var byAttr = Array.from(document.querySelectorAll('[data-dvd-block]'));
        var byCls  = Array.from(document.querySelectorAll('.chart-section'));
        var seen = new Set();
        var result = [];
        byAttr.concat(byCls).forEach(function(el) {
            if (!seen.has(el)) { seen.add(el); result.push(el); }
        });
        return result;
    }

    function _injectLayoutModeBar(count) {
        var existing = document.getElementById('_layoutModeBar');
        if (existing) existing.remove();

        var bar = document.createElement('div');
        bar.id = '_layoutModeBar';
        bar.innerHTML = [
            '<span style="display:flex;align-items:center;gap:8px;">',
            '<i class="bi bi-arrows-move" style="font-size:1.1rem"></i>',
            '<b>Mode Atur Ulang Layout</b>',
            '<span style="opacity:0.7;font-size:0.8rem">(' + count + ' blok tersedia — seret untuk memindahkan)</span>',
            '</span>',
            '<span style="display:flex;gap:8px;">',
            '<button id="_btnSaveLayout" style="background:#3a9e8f;border:none;border-radius:8px;color:white;padding:5px 16px;cursor:pointer;font-size:0.8rem;font-weight:600;">💾 Simpan Layout Permanen</button>',
            '<button id="_btnExitLayout" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:8px;color:white;padding:5px 14px;cursor:pointer;font-size:0.8rem;">✖ Keluar</button>',
            '</span>',
        ].join('');

        bar.style.cssText = [
            'position:fixed;top:0;left:0;right:0;z-index:99999',
            'background:linear-gradient(135deg,rgba(58,158,143,0.96),rgba(91,126,197,0.96))',
            'color:white;padding:10px 20px;font-size:0.85rem;font-family:Inter,sans-serif',
            'display:flex;align-items:center;justify-content:space-between',
            'box-shadow:0 4px 24px rgba(0,0,0,0.5);backdrop-filter:blur(6px)',
        ].join(';');

        document.body.appendChild(bar);

        document.getElementById('_btnExitLayout').addEventListener('click', function() {
            _layoutModeActive = true;
            toggleLayoutReorderMode();
        });
        document.getElementById('_btnSaveLayout').addEventListener('click', _saveLayoutPermanent);
    }

    function _getOrCreateDropIndicator() {
        var el = document.getElementById('_dropIndicator');
        if (!el) {
            el = document.createElement('div');
            el.id = '_dropIndicator';
            el.style.cssText = 'height:3px;background:linear-gradient(90deg,#3a9e8f,#5b7ec5);border-radius:2px;margin:4px 0;transition:opacity 0.15s;pointer-events:none;';
            document.body.appendChild(el);
        }
        return el;
    }

    function _onDragStart(e) {
        _dragSource = this;
        this.style.opacity = '0.45';
        this.style.boxShadow = '0 0 0 2px #5b7ec5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.dvdBlock || '');
    }

    function _onDragEnd(e) {
        this.style.opacity = '1';
        this.style.boxShadow = '';
        _dragSource = null;
        _dragOverTarget = null;
        var ind = document.getElementById('_dropIndicator');
        if (ind) ind.style.opacity = '0';
        _getAllDraggableBlocks().forEach(function(b) {
            b.style.outline = '2px dashed rgba(91,126,197,0.7)';
        });
    }

    function _onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this !== _dragSource) {
            this.style.outline = '2px solid #3a9e8f';
            this.style.boxShadow = '0 0 20px rgba(58,158,143,0.3)';
            _dragOverTarget = this;
        }
    }

    function _onDragLeave(e) {
        if (!this.contains(e.relatedTarget)) {
            this.style.outline = '2px dashed rgba(91,126,197,0.7)';
            this.style.boxShadow = '';
        }
    }

    function _onDrop(e) {
        e.preventDefault();
        if (!_dragSource || _dragSource === this) return;

        var src  = _dragSource;
        var tgt  = this;

        var srcId = src.dataset.dvdBlock || (src.querySelector('[id^="chart-"]') && src.querySelector('[id^="chart-"]').id) || '';
        var tgtId = tgt.dataset.dvdBlock || (tgt.querySelector('[id^="chart-"]') && tgt.querySelector('[id^="chart-"]').id) || '';

        _domSwap(src, tgt);

        if (srcId && tgtId) _swapLog.push([srcId, tgtId]);

        setTimeout(function() {
            var allCharts = document.querySelectorAll('[id^="chart-"]');
            allCharts.forEach(function(c) {
                try { Plotly.Plots.resize(c.id); } catch(e) {}
            });
        }, 150);

        _getAllDraggableBlocks().forEach(function(b) {
            b.style.outline = '2px dashed rgba(91,126,197,0.7)';
            b.style.boxShadow = '';
            b.style.opacity = '1';
        });

        addSystemNotice('🔄 Blok dipindahkan! Klik "💾 Simpan Layout Permanen" di panel atas untuk menyimpan.');
        _dragSource = null;
    }

    async function _saveLayoutPermanent() {
        if (_swapLog.length === 0) {
            addSystemNotice('ℹ️ Tidak ada perubahan layout yang perlu disimpan.');
            return;
        }
        var currentPage = detectCurrentPage();
        addSystemNotice('🔄 Menyimpan layout baru ke source code...');

        var errors = [];
        for (var i = 0; i < _swapLog.length; i++) {
            var pair = _swapLog[i];
            try {
                var res = await fetch('/api/permanent-swap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chart_a: pair[0],
                        chart_b: pair[1],
                        current_page: '/' + currentPage
                    })
                });
                var data = await res.json();
                if (data.status !== 'success') errors.push(pair[0] + '↔' + pair[1] + ': ' + data.message);
            } catch(e) {
                errors.push(pair[0] + '↔' + pair[1] + ': ' + e.message);
            }
        }
        _swapLog = [];

        if (errors.length === 0) {
            addSystemNotice('💾 Layout berhasil disimpan permanen! Akan tetap sama setelah refresh halaman.');
        } else {
            addSystemNotice('⚠️ Sebagian berhasil. Error: ' + errors.join('; '));
        }
    }


    async function restorePermState() {
        try {
            var res = await fetch('/api/get-perm-state');
            if (!res.ok) return;
            var state = await res.json();
            var chartTypes = state.chart_types || {};
            var checkCount = 0;
            function applyTypes() {
                var anyMissing = false;
                Object.entries(chartTypes).forEach(function(entry) {
                    var chartId = entry[0], typ = entry[1];
                    var el = document.getElementById(chartId);
                    if (el && el._fullData && el._fullData.length > 0) {
                        var currentType = el._fullData[0] && el._fullData[0].type;
                        if (currentType && currentType !== typ) {
                            Plotly.restyle(chartId, { type: typ });
                        }
                    } else if (el) {
                        anyMissing = true;
                    }
                });
                if (anyMissing && checkCount < 20) {
                    checkCount++;
                    setTimeout(applyTypes, 500);
                }
            }
            setTimeout(applyTypes, 1500);
        } catch(e) {
            console.warn('[DVD-AI] Could not restore perm state:', e);
        }
    }

    function showPermanentConfirm(cmd, summary, onConfirm) {
        _pendingPermanentCmd = cmd;
        var confirmHtml = (
            '<div id="permConfirm" style='
            + '"background:rgba(91,126,197,0.13);border:1px solid rgba(91,126,197,0.4);border-radius:12px;'
            + 'padding:10px 14px;margin:6px 0;font-size:0.78rem;color:#a8c4f0;">'
            + '<b style="color:#7ab8e8;">\uD83D\uDCBE Permanent change</b><br>'
            + summary
            + '<br><div style="display:flex;gap:8px;margin-top:8px;">'
            + '<button id="permYes" style="background:#3d5897;border:none;border-radius:7px;color:white;'
            + 'font-size:0.75rem;padding:4px 14px;cursor:pointer;">\u2714 Apply permanently</button>'
            + '<button id="permNo" style="background:#2a3040;border:1px solid #3a4260;border-radius:7px;'
            + 'color:#8b91a8;font-size:0.75rem;padding:4px 14px;cursor:pointer;">\u2716 Cancel</button>'
            + '</div></div>'
        );
        var wrapper = document.createElement('div');
        wrapper.innerHTML = confirmHtml;
        var msgContainer = document.getElementById('chatMessages');
        msgContainer.appendChild(wrapper);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        document.getElementById('permYes').addEventListener('click', function() {
            wrapper.remove();
            if (onConfirm) {
                onConfirm(_pendingPermanentCmd);
            } else {
                applyPermanentEdit(_pendingPermanentCmd);
            }
        });
        document.getElementById('permNo').addEventListener('click', function() {
            wrapper.remove();
            addSystemNotice('\u2716 Permanent change cancelled');
            _pendingPermanentCmd = null;
        });
    }


    function autoResize(el) {
        el.style.height = '38px';
        el.style.height = Math.min(el.scrollHeight, 90) + 'px';
    }


    function watchTabChanges() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => {
                    updateContextBanner();
                    const chatOpen = document.getElementById('chatWindow').style.display === 'flex';
                    if (chatOpen) {
                        updatePromptSuggestions(null);
                        const activeTab  = detectActiveTab();
                        const tabEl      = document.querySelector(`.tab-btn[data-target="${activeTab}"]`);
                        if (tabEl) addSystemNotice(`📍 Tab "${tabEl.textContent.trim()}" aktif`);
                    }
                }, 120);
            });
        });
    }


    document.addEventListener('DOMContentLoaded', () => {
        const chatToggle = document.getElementById('chatToggle');
        const chatWindow = document.getElementById('chatWindow');
        const chatInput  = document.getElementById('chatInput');
        const chatSend   = document.getElementById('chatSend');
        const btnClose   = document.getElementById('btnCloseChat');
        const btnClear   = document.getElementById('btnClearChat');
        const themeBtn   = document.getElementById('themeModeBtn');

        const savedTheme = sessionStorage.getItem(THEME_KEY);
        isDarkMode = savedTheme !== 'light';
        applyTheme(isDarkMode);

        chatToggle.addEventListener('click', () => {
            const isOpen = chatWindow.style.display === 'flex';
            chatWindow.style.display = isOpen ? 'none' : 'flex';

            if (!isOpen) {
                updateContextBanner();
                updatePromptSuggestions(null);

                if (isFirstOpen) {
                    const history = loadHistory();
                    if (history.length > 0) {
                        renderPersistedMessages(history);
                        addSystemNotice('💬 Previous conversation restored - history is preserved when switching tabs!');
                    } else {
                        const page = detectCurrentPage();
                        const greetings = {
                            'overview.html':       'Hello! Im **DVD-AI** 👋 Ready to help analyze your DVD store data. Ask me about revenue, trends, or have me change the chart view!',
                            'revenue_stores.html': 'Hello! On the **Revenue & Stores** page, I can help analyze store performance, forecast revenue, and compare staff.',
                            'film_pricing.html':   'Hello! On the **Film & Pricing** page, I can explain price distribution, top-selling movies, and rental duration predictions.',
                            'leaks_action.html':   'Hello! On the **Leaks & Action** page, I can help identify potential late fee losses and recommend actions. Ready!',
                        };
                        addMessage(greetings[page] || greetings['overview.html'], 'ai');
                    }
                    isFirstOpen = false;
                    watchTabChanges();
                }

                chatInput.focus();
            }
        });

        btnClose.addEventListener('click', () => { chatWindow.style.display = 'none'; });

        btnClear.addEventListener('click', () => {
            if (confirm('Delete all chat history?')) {
                clearHistory();
                undoStack = [];
                document.getElementById('chatMessages').innerHTML = '';
                addMessage('Chat history has been deleted. Ready to help from the beginning! 😊', 'ai');
                updatePromptSuggestions(null);
            }
        });

        themeBtn.addEventListener('click', toggleTheme);

        chatSend.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        chatInput.addEventListener('input', () => autoResize(chatInput));

        updateContextBanner();
        updatePromptSuggestions(null);

        setTimeout(initChartBlocks, 2000); 

        restorePermState();
    });
    

})();