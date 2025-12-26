// UI更新和控制 - 重新設計版本

// 更新整個UI
function updateUI() {
    updateBattleCards();
    updateTurnIndicator();
    updateHandCount();
}

// 更新戰鬥卡片顯示
function updateBattleCards() {
    updateBattleCard(1);
    updateBattleCard(2);
}

// 更新單個玩家的戰鬥卡
function updateBattleCard(player) {
    const playerState = player === 1 ? gameState.player1 : gameState.player2;
    const battleArea = document.getElementById(`p${player}-battle`);

    battleArea.innerHTML = '';

    if (playerState.battle) {
        const card = createBattleCardElement(playerState.battle, player);
        battleArea.appendChild(card);
    } else {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'empty-slot';
        emptySlot.textContent = '點擊選擇戰鬥卡';
        battleArea.appendChild(emptySlot);
    }
}

// 創建戰鬥卡片元素
function createBattleCardElement(card, player) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `battle-card rarity-${card.rarity}`;

    const hpPercent = Math.max(0, (card.hp / card.maxHp) * 100);
    const shieldValue = card.shield || 0;

    // 獲取玩家狀態以顯示持續傷害
    const playerState = player === 1 ? gameState.player1 : gameState.player2;
    const dotEffects = [];

    if (playerState.poisonTurns && playerState.poisonTurns > 0) {
        dotEffects.push(`<span style="color:#9d50bb;font-weight:700;">🧪 中毒: ${playerState.poisonDamage}/回合 (${playerState.poisonTurns}回合)</span>`);
    }
    if (playerState.burnTurns && playerState.burnTurns > 0) {
        dotEffects.push(`<span style="color:#ff6b35;font-weight:700;">🔥 燃燒: ${playerState.burnDamage}/回合 (${playerState.burnTurns}回合)</span>`);
    }
    if (playerState.permanentPoisonDamage && playerState.permanentPoisonDamage > 0) {
        dotEffects.push(`<span style="color:#50c878;font-weight:700;">⚗️ 持續傷害: ${playerState.permanentPoisonDamage}/回合 (永久)</span>`);
    }

    cardDiv.innerHTML = `
        <div class="card-header">
            <div class="card-name">${card.name}</div>
            <div class="card-rarity" style="background: ${getRarityColor(card.rarity)}">${card.rarity}</div>
        </div>
        <div class="card-stats">
            <div>
                <span class="stat-label">HP:</span>
                <span class="stat-value">${card.hp}/${card.maxHp}</span>
            </div>
            <div>
                <span class="stat-label">ATK:</span>
                <span class="stat-value">${card.atk}</span>
            </div>
        </div>
        ${shieldValue > 0 ? `
        <div class="shield-bar-container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="color:#66ccff;font-size:0.9rem;font-weight:700;">🛡 護盾</span>
                <span style="color:#fff;font-size:0.9rem;font-weight:700;">${shieldValue}</span>
            </div>
            <div class="shield-bar">
                <div class="shield-fill" style="width: 100%"></div>
            </div>
        </div>
        ` : ''}
        <div class="hp-bar-container">
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${hpPercent}%"></div>
            </div>
            <div class="hp-text">${Math.round(hpPercent)}%</div>
        </div>
        ${dotEffects.length > 0 ? `
        <div style="margin-top:8px;padding:6px;background:rgba(0,0,0,0.4);border-radius:4px;font-size:0.8rem;">
            ${dotEffects.join('<br>')}
        </div>
        ` : ''}
        <div class="card-hint">點擊查看技能</div>
    `;

    // 只有當前玩家可以點擊自己的戰鬥卡
    if (player === gameState.currentPlayer && gameState.gameStarted) {
        cardDiv.onclick = () => showSkillMenu(card, player);
    }

    return cardDiv;
}

// 顯示技能選單
function showSkillMenu(card, player) {
    const modal = document.getElementById('skillModal');
    const cardName = document.getElementById('skillCardName');
    const skillList = document.getElementById('skillList');

    cardName.textContent = `${card.name} - 技能選單`;
    skillList.innerHTML = '';

    const playerState = player === 1 ? gameState.player1 : gameState.player2;

    // 添加技能按鈕
    if (card.skills && card.skills.length > 0) {
        card.skills.forEach((skill, index) => {
            const skillBtn = document.createElement('button');
            skillBtn.className = 'skill-item-btn';

            const isDisabled = skill.currentCd > 0 || playerState.disabledUntil > 0;
            skillBtn.disabled = isDisabled;

            skillBtn.innerHTML = `
                <div class="skill-name">${skill.name}</div>
                ${skill.currentCd > 0 ? `<span class="skill-cooldown">冷卻: ${skill.currentCd} 回合</span>` : ''}
            `;

            if (!isDisabled) {
                skillBtn.onclick = () => {
                    modal.classList.remove('active');

                    // 如果技能有機率判定，顯示機率動畫
                    if (skill.chance && skill.chance < 1) {
                        showProbabilityRoll(skill.name, skill.chance, (success) => {
                            if (success) {
                                useSkill(index);
                                endTurn();
                            } else {
                                addLog(`${skill.name} 判定失敗！`, 'info');
                                // 技能失敗仍然消耗冷卻
                                useSkill(index);
                                endTurn();
                            }
                        });
                    } else {
                        useSkill(index);
                        endTurn();
                    }
                };
            }

            skillList.appendChild(skillBtn);
        });
    }

    modal.classList.add('active');
}

// 顯示備戰區
function showBench() {
    const player = gameState.currentPlayer;
    const playerState = player === 1 ? gameState.player1 : gameState.player2;

    const modal = document.getElementById('benchModal');
    const title = document.getElementById('benchTitle');
    const cardsContainer = document.getElementById('benchCards');

    title.textContent = `玩家${player} - 備戰區 (${playerState.hand.length}張)`;
    cardsContainer.innerHTML = '';

    if (playerState.hand.length === 0) {
        cardsContainer.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">備戰區沒有卡牌</p>';
    } else {
        playerState.hand.forEach((card, index) => {
            const cardDiv = createBenchCardElement(card);
            cardsContainer.appendChild(cardDiv);
        });
    }

    modal.classList.add('active');
}

// 創建備戰區卡片元素
function createBenchCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `bench-card rarity-${card.rarity}`;
    cardDiv.style.borderColor = getRarityColor(card.rarity);

    cardDiv.innerHTML = `
        <div class="card-header">
            <div class="card-name">${card.name}</div>
            <div class="card-rarity" style="background: ${getRarityColor(card.rarity)}">${card.rarity}</div>
        </div>
        <div class="card-stats">
            <div>
                <span class="stat-label">HP:</span>
                <span class="stat-value">${card.hp}/${card.maxHp}</span>
            </div>
            <div>
                <span class="stat-label">ATK:</span>
                <span class="stat-value">${card.atk}</span>
            </div>
        </div>
        <div class="card-skills">
            ${card.skills.map(s => `<div style="font-size:0.85rem;padding:3px;background:rgba(0,0,0,0.3);margin:2px 0;border-radius:3px;">${s.name}</div>`).join('')}
        </div>
        ${card.passive ? `<div style="font-size:0.8rem;color:#ffa500;margin-top:6px;padding:4px;background:rgba(255,165,0,0.1);border-radius:3px;">被動: ${card.passive.name}</div>` : ''}
    `;

    return cardDiv;
}

// 顯示撤退選擇
function showRetreatSelection() {
    const player = gameState.currentPlayer;
    const playerState = player === 1 ? gameState.player1 : gameState.player2;

    // 關閉技能選單
    document.getElementById('skillModal').classList.remove('active');

    if (playerState.hand.length === 0) {
        addLog('沒有可交換的卡牌', 'info');
        return;
    }

    const modal = document.getElementById('retreatModal');
    const cardsContainer = document.getElementById('retreatCards');

    cardsContainer.innerHTML = '';

    playerState.hand.forEach((card, index) => {
        const cardDiv = createRetreatCardElement(card, index, player);
        cardsContainer.appendChild(cardDiv);
    });

    modal.classList.add('active');
}

// 創建撤退用卡片元素
function createRetreatCardElement(card, index, player) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `retreat-card rarity-${card.rarity}`;
    cardDiv.style.borderColor = getRarityColor(card.rarity);

    cardDiv.innerHTML = `
        <div class="card-header">
            <div class="card-name">${card.name}</div>
            <div class="card-rarity" style="background: ${getRarityColor(card.rarity)}">${card.rarity}</div>
        </div>
        <div class="card-stats">
            <div>
                <span class="stat-label">HP:</span>
                <span class="stat-value">${card.hp}/${card.maxHp}</span>
            </div>
            <div>
                <span class="stat-label">ATK:</span>
                <span class="stat-value">${card.atk}</span>
            </div>
        </div>
    `;

    cardDiv.onclick = () => {
        performRetreat(index, player);
        document.getElementById('retreatModal').classList.remove('active');
        endTurn();
    };

    return cardDiv;
}

// 執行撤退（交換）
function performRetreat(handIndex, player) {
    const playerState = player === 1 ? gameState.player1 : gameState.player2;

    // 交換戰鬥卡和備戰卡
    const battleCard = playerState.battle;
    const benchCard = playerState.hand[handIndex];

    playerState.battle = benchCard;
    playerState.hand[handIndex] = battleCard;

    addLog(`${benchCard.name} 與 ${battleCard.name} 交換位置`, 'info');
    updateUI();
}

// 獲取稀有度顏色
function getRarityColor(rarity) {
    const colors = {
        '一般': '#808080',
        '稀有': '#00b0f0',
        '史詩': '#9900ff',
        '傳說': '#ffc000',
        '神話': '#ff0000'
    };
    return colors[rarity] || '#808080';
}

// 更新回合指示器
function updateTurnIndicator() {
    const indicator = document.getElementById('currentTurn');
    if (!gameState.gameStarted) {
        indicator.textContent = '等待開始...';
    } else {
        indicator.textContent = `玩家${gameState.currentPlayer} 的回合`;
    }
    document.getElementById('roundCount').textContent = gameState.roundCount;
}

// 更新手牌數
function updateHandCount() {
    document.getElementById('p1-hand-count').textContent = gameState.player1.hand.length;
    document.getElementById('p2-hand-count').textContent = gameState.player2.hand.length;
}

// 添加戰鬥日誌
function addLog(message, type = 'info') {
    const logContainer = document.getElementById('battle-log');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${gameState.roundCount}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;

    while (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }
}

// 顯示/隱藏模態框
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 更新模態框內容
function updateModalContent(title, body, showButton, buttonText = '確認') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    const btn = document.getElementById('modalBtn');
    if (showButton) {
        btn.style.display = 'inline-block';
        btn.textContent = buttonText;
    } else {
        btn.style.display = 'none';
    }
}

// 顯示手牌選擇
function showHandSelection(player, hand, callback) {
    const modal = document.getElementById('handModal');
    const playerText = document.getElementById('handPlayerText');
    const handCards = document.getElementById('handCards');

    playerText.textContent = `玩家${player} - 請選擇一張卡牌放入戰鬥區`;
    handCards.innerHTML = '';

    hand.forEach((card, index) => {
        const cardDiv = createHandCardElement(card);
        cardDiv.onclick = () => {
            callback(card, index);
        };
        handCards.appendChild(cardDiv);
    });

    modal.classList.add('active');
}

// 創建手牌卡片元素
function createHandCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = `hand-card rarity-${card.rarity}`;
    cardDiv.style.borderColor = getRarityColor(card.rarity);

    cardDiv.innerHTML = `
        <div class="card-header">
            <div class="card-name">${card.name}</div>
            <div class="card-rarity" style="background: ${getRarityColor(card.rarity)}">${card.rarity}</div>
        </div>
        <div class="card-stats">
            <div>
                <span class="stat-label">HP:</span>
                <span class="stat-value">${card.hp}</span>
            </div>
            <div>
                <span class="stat-label">ATK:</span>
                <span class="stat-value">${card.atk}</span>
            </div>
        </div>
        <div class="card-skills">
            ${card.skills.map(skill => `<div style="font-size:0.9rem;padding:5px;background:rgba(0,0,0,0.3);margin:4px 0;border-radius:4px;">${skill.name} (CD:${skill.cooldown})</div>`).join('')}
        </div>
        ${card.passive ? `<div style="font-size:0.85rem;color:#ffa500;margin-top:8px;padding:6px;background:rgba(255,165,0,0.1);border-radius:4px;">被動: ${card.passive.name}</div>` : ''}
    `;

    return cardDiv;
}

// 顯示卡牌替換選擇（死亡後）
function showCardReplacementSelection(player) {
    const playerState = player === 1 ? gameState.player1 : gameState.player2;

    if (playerState.hand.length === 0) {
        checkGameOver();
        return;
    }

    const modal = document.getElementById('handModal');
    const playerText = document.getElementById('handPlayerText');
    const handCards = document.getElementById('handCards');

    playerText.textContent = `玩家${player} - 選擇一張卡牌上場戰鬥！`;
    handCards.innerHTML = '';

    playerState.hand.forEach((card, index) => {
        const cardDiv = createHandCardElement(card);
        cardDiv.onclick = () => {
            playerState.battle = card;
            playerState.hand.splice(index, 1);
            addLog(`${card.name} 上場戰鬥！`, 'info');
            modal.classList.remove('active');
            updateUI();
            checkGameOver();
        };
        handCards.appendChild(cardDiv);
    });

    modal.classList.add('active');
}

// 綁定事件
document.getElementById('attackBtn').addEventListener('click', () => {
    if (gameState.gameStarted) {
        performAttack();
        endTurn();
    }
});

document.getElementById('endTurnBtn').addEventListener('click', () => {
    if (gameState.gameStarted) {
        endTurn();
    }
});

document.getElementById('showBenchBtn').addEventListener('click', () => {
    if (gameState.gameStarted) {
        showBench();
    }
});

document.getElementById('retreatModalBtn').addEventListener('click', () => {
    showRetreatSelection();
});
