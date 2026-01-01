// 重新設計的新手教學 (Non-intrusive Tooltip Version)

const Tutorial = {
    active: false,
    currentStepIndex: 0,
    tooltip: null,
    highlightBox: null,

    // 定義教學步驟
    steps: [
        {
            id: 'intro',
            text: "歡迎來到卡牌對戰！我是您的引導員。第一步，請點擊【點擊抽卡】按鈕來抽取初始手牌。",
            target: "#modalBtn",
            event: "click",
            highlight: true
        },
        {
            id: 'intro_pack',
            text: "請點擊畫面中央的卡包來開啟它！",
            target: "#cardPack",
            event: "click",
            highlight: true
        },
        {
            id: 'coin_toss_wait',
            text: "抽卡完成！現在我們需要決定誰先開始。請等待硬幣投擲...",
            target: "#initModal .modal-content",
            event: "auto", // 自動等待下一步
            highlight: false
        },
        {
            id: 'start_select',
            text: "硬幣結果出爐！現在請點擊【開始選卡】進入手牌選擇。",
            target: "#modalBtn",
            event: "click",
            highlight: true
        },
        {
            id: 'select_card',
            text: "輪到您了！請從下方手牌中點擊一張，將其派遣至戰鬥區。",
            target: ".hand-card", // 會動態鎖定第一張
            event: "click",
            highlight: true
        },
        {
            id: 'battle_ui_intro',
            text: "戰鬥開始！這是您的戰鬥卡。HP顯示血量，ATK顯示攻擊力。點擊卡牌可以查看詳細技能。",
            target: "#p1-battle .battle-card",
            event: "next_btn", // 用按鈕下一步
            highlight: true
        },
        {
            id: 'skill_menu_intro',
            text: "試著點擊您的戰鬥卡來打開技能選單。",
            target: "#p1-battle .battle-card",
            event: "click",
            highlight: true
        },
        {
            id: 'use_skill',
            text: "這是技能列表。請點擊一個技能來攻擊對手！(注意：使用技能後會結束回合)",
            target: ".skill-item-btn:not([disabled])",
            event: "click",
            highlight: true
        },
        {
            id: 'end_tutorial',
            text: "恭喜！您已經學會了基本操作。接下來請擊敗對面的訓練師吧！",
            target: null,
            event: "finish_btn",
            highlight: false
        }
    ],

    // 初始化
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') === 'tutorial') {
            this.active = true;
            this.createElements();
            // 延遲一點啟動，確保 DOM 準備好
            setTimeout(() => this.startStep(0), 500);
            console.log("Tutorial Mode Initialized");
        }
    },

    // 創建 UI 元素
    createElements() {
        // Tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        document.body.appendChild(this.tooltip);

        // Highlight Box
        this.highlightBox = document.createElement('div');
        this.highlightBox.className = 'tutorial-highlight-box';
        document.body.appendChild(this.highlightBox);
    },

    // 開始指定步驟
    startStep(index) {
        if (index >= this.steps.length) {
            this.endTutorial();
            return;
        }

        this.currentStepIndex = index;
        const step = this.steps[index];
        console.log(`Starting Tutorial Step: ${step.id}`);

        // 查找目標元素
        let targetEl = null;
        if (step.target) {
            targetEl = document.querySelector(step.target);
            // 如果目標是手牌或卡包，可能還沒生成，等待一下
            if (!targetEl && (step.target === '.hand-card' || step.target === '#cardPack')) {
                setTimeout(() => this.startStep(index), 200); // Retry
                return;
            }
        }

        // 顯示 Tooltip
        this.showTooltip(step.text, targetEl, step.event);

        // 顯示 Highligh Box
        if (step.highlight && targetEl) {
            this.showHighlight(targetEl);
        } else {
            this.hideHighlight();
        }

        // 綁定事件
        this.bindEvent(step, targetEl);
    },

    // 顯示 Tooltip
    showTooltip(text, targetEl, eventType) {
        this.tooltip.innerHTML = text; // 可以包含 HTML

        // 如果是 next_btn 或 finish_btn，添加按鈕
        if (eventType === 'next_btn') {
            const btn = document.createElement('button');
            btn.className = 'tutorial-next-btn';
            btn.textContent = '下一步 →';
            btn.onclick = () => this.nextStep();
            this.tooltip.appendChild(btn);
        } else if (eventType === 'finish_btn') {
            const btn = document.createElement('button');
            btn.className = 'tutorial-next-btn';
            btn.textContent = '完成教學';
            btn.onclick = () => this.endTutorial();
            this.tooltip.appendChild(btn);
        }

        this.tooltip.classList.add('visible');

        // 定位
        if (targetEl) {
            this.positionTooltip(targetEl);
        } else {
            // 中心顯示
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
        }
    },

    // 定位 Tooltip
    positionTooltip(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        let top = rect.bottom + 15;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // 邊界檢查
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 15; // 改為上方顯示
        }

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.transform = 'translateY(0)';
    },

    // 顯示 Highlight
    showHighlight(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        this.highlightBox.style.width = `${rect.width + 10}px`;
        this.highlightBox.style.height = `${rect.height + 10}px`;
        this.highlightBox.style.top = `${rect.top + window.scrollY - 5}px`;
        this.highlightBox.style.left = `${rect.left + window.scrollX - 5}px`;
        this.highlightBox.style.display = 'block';
    },

    hideHighlight() {
        this.highlightBox.style.display = 'none';
    },

    // 綁定事件
    bindEvent(step, targetEl) {
        // 清除舊事件 (簡化版：假設事件是一次性的或者我們控制流程)
        // 這裡如果是 click 事件，我們監聽目標的 click
        if (step.event === 'click' && targetEl) {
            const handler = () => {
                targetEl.removeEventListener('click', handler);
                // 稍微延遲以讓遊戲邏輯先執行
                setTimeout(() => this.nextStep(), 300);
            };
            targetEl.addEventListener('click', handler);
        }
    },

    // 下一步
    nextStep() {
        this.hideHighlight();
        this.tooltip.classList.remove('visible');
        setTimeout(() => {
            this.startStep(this.currentStepIndex + 1);
        }, 300);
    },

    // 結束教學
    endTutorial() {
        this.active = false;
        if (this.tooltip) this.tooltip.remove();
        if (this.highlightBox) this.highlightBox.remove();
        // 清除 URL 參數 (可選)
        const url = new URL(window.location);
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url);
        console.log("Tutorial Completed");
    }
};

window.Tutorial = Tutorial;
