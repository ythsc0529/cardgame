// scripts/tutorial.js

const Tutorial = {
    active: false,
    currentStep: 0,
    overlay: null,

    steps: [
        {
            id: 'welcome',
            title: "歡迎來到新手教學",
            content: "本教學將手把手教您如何遊玩！首先，讓我們為雙方抽取 5 張初始手牌。",
            target: "#modalBtn",
            trigger: "click",
            highlight: "#modalBtn"
        },
        {
            id: 'flip_coin',
            title: "決定出手順序",
            content: "抽完卡後，我們會投擲硬幣決定誰先開始。這非常關鍵！",
            target: "#modalBtn",
            trigger: "click",
            highlight: "#modalBtn"
        },
        {
            id: 'select_card',
            title: "選擇戰鬥卡",
            content: "現在輪到您（玩家1）選卡了。從手牌中點擊一張卡牌放入戰鬥區。",
            target: ".hand-card",
            trigger: "click",
            highlight: "#handModal .modal-content"
        },
        {
            id: 'battle_ui',
            title: "戰鬥介面說明",
            content: "這是戰鬥主區域。左邊是您的卡片，右邊是對手的。上方可以看到目前回合數。",
            target: ".battle-main",
            trigger: "next",
            highlight: ".battle-main"
        },
        {
            id: 'stats',
            title: "血量與攻擊",
            content: "卡片上有 HP（血量）和 ATK（攻擊力）。當 HP 歸零時，該卡片就會退場。",
            target: ".player1-side .battle-card",
            trigger: "next",
            highlight: ".player1-side .battle-card"
        },
        {
            id: 'attack',
            title: "發動攻擊",
            content: "輪到您的回合時，您可以點擊「普攻」對敵方造成傷害。普攻不需要冷卻時間。",
            target: "#attackBtn",
            trigger: "click",
            highlight: "#attackBtn"
        },
        {
            id: 'skill_menu',
            title: "技能系統",
            content: "點擊您的卡面，可以打開技能選單。每個角色都有獨特的強力技能！",
            target: ".player1-side .battle-card",
            trigger: "click",
            highlight: ".player1-side .battle-card"
        },
        {
            id: 'use_skill',
            title: "使用技能",
            content: "在這裡選擇一個技能發動。請注意，技能發動後會進入冷卻（CD）時間。",
            target: ".skill-item-btn",
            trigger: "click",
            highlight: "#skillModal .modal-content"
        },
        {
            id: 'bench',
            title: "備戰與撤退",
            content: "如果您想換下受傷的卡片，可以點擊「撤退」。或者點擊右上角的「備戰區」查看您的後續部隊。",
            target: "#showBenchBtn",
            trigger: "next",
            highlight: ".game-header"
        },
        {
            id: 'surrender',
            title: "結束與投降",
            content: "如果您覺得無法獲勝，可以使用「投降」。注意：每回合必須行動，不能無故跳過回合。",
            target: "#surrenderBtn",
            trigger: "next",
            highlight: ".action-buttons"
        },
        {
            id: 'finish',
            title: "教學完成！",
            content: "您已經掌握了基本操作。準備好開始真正的對決了嗎？",
            target: null,
            trigger: "finish",
            highlight: null
        }
    ],

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mode') !== 'tutorial') return;

        console.log("Tutorial Mode Active");
        this.active = true;
        this.createOverlay();
        this.showStep(0);

        // 禁止某些隨機行為以保證教學流暢 (可選)
    },

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-box">
                <h2 id="tutorialTitle"></h2>
                <div id="tutorialContent"></div>
                <div class="tutorial-footer">
                    <button id="tutorialNextBtn" class="tutorial-btn">下一步</button>
                    <button id="tutorialSkipBtn" class="tutorial-btn secondary">跳過教學</button>
                </div>
            </div>
            <div class="tutorial-arrow"></div>
        `;
        document.body.appendChild(this.overlay);

        document.getElementById('tutorialSkipBtn').onclick = () => this.finish();
        document.getElementById('tutorialNextBtn').onclick = () => this.nextStep();
    },

    showStep(index) {
        if (index >= this.steps.length) {
            this.finish();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];

        document.getElementById('tutorialTitle').innerText = step.title;
        document.getElementById('tutorialContent').innerText = step.content;

        const nextBtn = document.getElementById('tutorialNextBtn');
        if (step.trigger === 'next') {
            nextBtn.style.display = 'block';
            nextBtn.innerText = "下一步";
        } else if (step.trigger === 'finish') {
            nextBtn.style.display = 'block';
            nextBtn.innerText = "開始正式遊戲";
            nextBtn.onclick = () => window.location.href = 'game.html';
        } else {
            nextBtn.style.display = 'none'; // 等待用戶點擊目標
        }

        // 移除舊的高亮
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

        // 添加新高亮
        if (step.highlight) {
            const el = document.querySelector(step.highlight);
            if (el) {
                el.classList.add('tutorial-highlight');
                this.positionBox(el);
            }
        } else {
            this.centerBox();
        }

        // 綁定觸發器
        if (step.trigger === 'click' && step.target) {
            this.bindTargetTrigger(step.target);
        }
    },

    bindTargetTrigger(selector) {
        // 使用事件委託或其他方式監聽，因為有些元素是動態生成的
        const observer = new MutationObserver((mutations) => {
            const el = document.querySelector(selector);
            if (el && !el.dataset.tutorialListened) {
                el.dataset.tutorialListened = 'true';
                const originalClick = el.onclick;
                el.addEventListener('click', () => {
                    setTimeout(() => this.nextStep(), 100);
                }, { once: true });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // 直接檢查一次
        const el = document.querySelector(selector);
        if (el) {
            el.addEventListener('click', () => {
                setTimeout(() => this.nextStep(), 100);
            }, { once: true });
        }
    },

    nextStep() {
        this.showStep(this.currentStep + 1);
    },

    positionBox(targetEl) {
        const box = this.overlay.querySelector('.tutorial-box');
        const rect = targetEl.getBoundingClientRect();

        box.style.position = 'absolute';

        // 簡單的定位邏輯：放在目標下方或中央
        if (rect.top > window.innerHeight / 2) {
            // 在上方
            box.style.bottom = (window.innerHeight - rect.top + 20) + 'px';
            box.style.top = 'auto';
        } else {
            // 在下方
            box.style.top = (rect.bottom + 20) + 'px';
            box.style.bottom = 'auto';
        }

        box.style.left = '50%';
        box.style.transform = 'translateX(-50%)';
    },

    centerBox() {
        const box = this.overlay.querySelector('.tutorial-box');
        box.style.position = 'absolute';
        box.style.top = '50%';
        box.style.left = '50%';
        box.style.transform = 'translate(-50%, -50%)';
        box.style.bottom = 'auto';
    },

    finish() {
        this.active = false;
        if (this.overlay) document.body.removeChild(this.overlay);
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        // 如果是點擊結束教學，可以重新導向或直接開始
    }
};

window.Tutorial = Tutorial;
document.addEventListener('DOMContentLoaded', () => Tutorial.init());
