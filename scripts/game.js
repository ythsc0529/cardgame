// 遊戲邏輯核心
// 遊戲狀態
const gameState = {
    player1: {
        hand: [],
        battle: null,
        effects: {},
        disabledUntil: 0,
        stunned: false
    },
    player2: {
        hand: [],
        battle: null,
        effects: {},
        disabledUntil: 0,
        stunned: false
    },
    currentPlayer: 1,
    roundCount: 0,
    gameStarted: false,
    firstPlayer: null
};

// 初始化遊戲
function initGame() {
    showModal('initModal');
    updateModalContent('遊戲初始化', '正在為雙方玩家抽取卡牌...', false);

    setTimeout(() => {
        // 雙方各抽5張卡
        gameState.player1.hand = drawInitialHand();
        gameState.player2.hand = drawInitialHand();

        updateModalContent('抽卡完成', `
            <p>玩家1 抽到 ${gameState.player1.hand.length} 張卡牌</p>
            <p>玩家2 抽到 ${gameState.player2.hand.length} 張卡牌</p>
            <p class="loading-spinner"></p>
            <p>投擲硬幣決定先手...</p>
        `, false);

        setTimeout(() => {
            // 投擲硬幣
            const firstPlayer = flipCoin();
            gameState.firstPlayer = firstPlayer;
            gameState.currentPlayer = firstPlayer;

            updateModalContent('先手決定', `
                <p>🪙 硬幣結果：玩家${firstPlayer} 先手！</p>
                <p>接下來請雙方選擇初始戰鬥卡牌</p>
            `, true, '開始選卡');

            document.getElementById('modalBtn').onclick = () => {
                hideModal('initModal');
                startCardSelection();
            };
        }, 2000);
    }, 1000);
}

// 開始選卡流程
function startCardSelection() {
    selectBattleCardForPlayer(1);
}

function selectBattleCardForPlayer(player) {
    const hand = player === 1 ? gameState.player1.hand : gameState.player2.hand;
    showHandSelection(player, hand, (selectedCard, index) => {
        // 移除手牌
        if (player === 1) {
            gameState.player1.hand.splice(index, 1);
            gameState.player1.battle = selectedCard;
        } else {
            gameState.player2.hand.splice(index, 1);
            gameState.player2.battle = selectedCard;
        }

        // 更新UI
        updateUI();

        // 下一個玩家選卡
        if (player === 1) {
            selectBattleCardForPlayer(2);
        } else {
            // 兩位玩家都選完了，開始遊戲
            hideModal('handModal');
            startGame();
        }
    });
}

// 開始遊戲
function startGame() {
    gameState.gameStarted = true;
    gameState.roundCount = 1;
    updateUI();
    startTurn();
}

// 開始回合
function startTurn() {
    const currentPlayer = gameState.currentPlayer;
    const playerState = currentPlayer === 1 ? gameState.player1 : gameState.player2;

    // 處理持續傷害 (在回合開始時)
    if (playerState.battle) {
        let dotDamage = 0;
        const dotEffects = [];

        // 處理中毒
        if (playerState.poisonTurns && playerState.poisonTurns > 0) {
            dotDamage += playerState.poisonDamage;
            dotEffects.push(`中毒${playerState.poisonDamage}`);
            playerState.poisonTurns--;
            if (playerState.poisonTurns === 0) {
                playerState.poisonDamage = 0;
                addLog(`${playerState.battle.name} 的中毒效果結束`, 'info');
            }
        }

        // 處理燃燒
        if (playerState.burnTurns && playerState.burnTurns > 0) {
            dotDamage += playerState.burnDamage;
            dotEffects.push(`燃燒${playerState.burnDamage}`);
            playerState.burnTurns--;
            if (playerState.burnTurns === 0) {
                playerState.burnDamage = 0;
                addLog(`${playerState.battle.name} 的燃燒效果結束`, 'info');
            }
        }

        // 處理永久持續傷害
        if (playerState.permanentPoisonDamage && playerState.permanentPoisonDamage > 0) {
            dotDamage += playerState.permanentPoisonDamage;
            dotEffects.push(`持續傷害${playerState.permanentPoisonDamage}`);
        }

        // 造成持續傷害
        if (dotDamage > 0) {
            addLog(`${playerState.battle.name} 受到持續傷害: ${dotEffects.join(', ')} = ${dotDamage}`, 'damage');
            dealDamage(playerState, dotDamage, currentPlayer === 1 ? 2 : 1, true);
        }
    }

    // 減少冷卻時間
    if (playerState.battle && playerState.battle.skills) {
        playerState.battle.skills.forEach(skill => {
            if (skill.currentCd > 0) skill.currentCd--;
        });
    }

    // 檢查暈眩
    if (playerState.stunned) {
        addLog(`玩家${currentPlayer} 被暈眩，跳過回合！`, 'info');
        playerState.stunned = false;
        endTurn();
        return;
    }

    // 檢查技能禁用
    if (playerState.disabledUntil > 0) {
        playerState.disabledUntil--;
    }

    // 處理被動效果（每回合觸發）
    processPassiveEffects(currentPlayer);

    updateUI();
    addLog(`--- 玩家${currentPlayer} 的回合開始 ---`, 'info');
}

// 處理被動效果
function processPassiveEffects(player) {
    const playerState = player === 1 ? gameState.player1 : gameState.player2;
    const card = playerState.battle;

    if (!card || !card.passive) return;

    const passive = card.passive;

    // 莉安娜：每回合血量上限+50
    if (passive.effect === 'max_hp_increase') {
        card.maxHp += passive.value;
        card.hp += passive.value;
        addLog(`${card.name} 最大生命值增加 ${passive.value}！`, 'heal');
    }

    // 超凡：每回合扣除50點生命值上限，增加10攻
    if (passive.effect === 'hp_to_atk') {
        if (card.maxHp - passive.hpLoss > 0) {
            card.maxHp -= passive.hpLoss;
            if (card.hp > card.maxHp) card.hp = card.maxHp;
            card.atk += passive.atkGain;
            addLog(`${card.name} 犧牲${passive.hpLoss}最大血量，獲得${passive.atkGain}攻擊！`, 'info');
        }
    }

    updateUI();
}

// 普攻
function performAttack() {
    const attacker = gameState.currentPlayer;
    const defender = attacker === 1 ? 2 : 1;
    const attackerState = attacker === 1 ? gameState.player1 : gameState.player2;
    const defenderState = defender === 1 ? gameState.player1 : gameState.player2;

    if (!attackerState.battle || !defenderState.battle) {
        addLog('無法攻擊：沒有戰鬥卡牌！', 'info');
        return;
    }

    let damage = attackerState.battle.atk;

    // 檢查隨機攻擊被動
    if (attackerState.battle.passive && attackerState.battle.passive.effect === 'random_atk') {
        damage = Math.floor(Math.random() * (attackerState.battle.passive.max - attackerState.battle.passive.min + 1)) + attackerState.battle.passive.min;
        addLog(`${attackerState.battle.name} 隨機攻擊力：${damage}`, 'info');
    }

    addLog(`玩家${attacker} 的 ${attackerState.battle.name} 發動普攻！造成 ${damage} 傷害`, 'attack');
    dealDamage(defenderState, damage, attacker);

    // 厭世：攻擊時對自己造成一樣傷害
    if (attackerState.battle.passive && attackerState.battle.passive.effect === 'self_damage_on_attack') {
        addLog(`${attackerState.battle.name} 的被動觸發：對自己造成 ${damage} 傷害`, 'damage');
        dealDamage(attackerState, damage, attacker, true);
    }

    // 小吉連續攻擊被動
    if (attackerState.battle.passive && attackerState.battle.passive.effect === 'combo_attack') {
        const comboChance = Math.min(99, attackerState.battle.passive.baseChance + (attackerState.battle.comboBonus || 0));
        if (Math.random() * 100 < comboChance) {
            addLog(`${attackerState.battle.name} 觸發連續攻擊！`, 'attack');
            setTimeout(() => {
                dealDamage(defenderState, damage, attacker);
            }, 500);
        }
    }

    updateUI();
    checkGameOver();
}

// 造成傷害
function dealDamage(targetPlayerState, damage, attackerPlayer, isSelf = false) {
    if (!targetPlayerState.battle) return;

    // 檢查護盾
    if (targetPlayerState.battle.shield && targetPlayerState.battle.shield > 0) {
        if (targetPlayerState.battle.shield >= damage) {
            targetPlayerState.battle.shield -= damage;
            addLog(`護盾抵擋了 ${damage} 點傷害！剩餘護盾：${targetPlayerState.battle.shield}`, 'info');
            return;
        } else {
            damage -= targetPlayerState.battle.shield;
            addLog(`護盾破碎！還剩 ${damage} 點傷害`, 'damage');
            targetPlayerState.battle.shield = 0;
        }
    }

    // 檢查迴避被動
    if (targetPlayerState.battle.passive && targetPlayerState.battle.passive.effect === 'dodge_passive' && !isSelf) {
        if (Math.random() < targetPlayerState.battle.passive.chance) {
            addLog(`${targetPlayerState.battle.name} 閃避了攻擊！`, 'info');
            return;
        }
    }

    // 扣血
    targetPlayerState.battle.hp -= damage;
    addLog(`${targetPlayerState.battle.name} 受到 ${damage} 點傷害！剩餘HP：${Math.max(0, targetPlayerState.battle.hp)}`, 'damage');

    // 瘋狗騎士被動：每受到一次攻擊增加10最大生命值
    if (targetPlayerState.battle.passive && targetPlayerState.battle.passive.effect === 'max_hp_on_hit' && !isSelf) {
        targetPlayerState.battle.maxHp += targetPlayerState.battle.passive.value;
        addLog(`${targetPlayerState.battle.name} 最大生命值增加${targetPlayerState.battle.passive.value}！`, 'heal');
    }

    // 檢查死亡
    if (targetPlayerState.battle.hp <= 0) {
        handleCardDeath(targetPlayerState, attackerPlayer === 1 ? 2 : 1);
    }

    updateUI();
}

// 處理卡牌死亡
function handleCardDeath(playerState, killerPlayer) {
    const card = playerState.battle;
    addLog(`${card.name} 被擊敗了！`, 'damage');

    // 死亡被動
    if (card.passive) {
        // 死亡抽卡
        if (card.passive.effect === 'draw_on_death') {
            for (let i = 0; i < card.passive.value; i++) {
                const newCard = drawCard();
                playerState.hand.push(newCard);
            }
            addLog(`${card.name} 死亡，抽取了 ${card.passive.value} 張卡`, 'info');
        }

        // 死亡造成傷害
        if (card.passive.effect === 'death_damage') {
            const enemy = killerPlayer === 1 ? gameState.player1 : gameState.player2;
            dealDamage(enemy, card.passive.value, killerPlayer === 1 ? 2 : 1);
        }

        // 鳳凰復活
        if (card.passive.effect === 'revive' && !card.passive.used) {
            if (Math.random() < card.passive.chance) {
                card.hp = card.maxHp;
                card.passive.used = true;
                addLog(`${card.name} 復活了！`, 'heal');
                updateUI();
                return;
            }
        }
    }

    // 移除戰鬥卡
    playerState.battle = null;

    // 如果有手牌，自動選第一張上場
    if (playerState.hand.length > 0) {
        setTimeout(() => {
            if (playerState.hand.length > 0) {
                playerState.battle = playerState.hand[0];
                playerState.hand.splice(0, 1);
                addLog(`${playerState.battle.name} 上場戰鬥！`, 'info');
                updateUI();
            } else {
                checkGameOver();
            }
        }, 1000);
    } else {
        checkGameOver();
    }

    checkGameOver();
}

// 使用技能
function useSkill(skillIndex) {
    const currentPlayer = gameState.currentPlayer;
    const playerState = currentPlayer === 1 ? gameState.player1 : gameState.player2;

    if (!playerState.battle) return;

    const skill = playerState.battle.skills[skillIndex];
    if (!skill) return;

    // 檢查冷卻
    if (skill.currentCd > 0) {
        addLog(`技能冷卻中！還需 ${skill.currentCd} 回合`, 'info');
        return;
    }

    // 檢查技能禁用
    if (playerState.disabledUntil > 0) {
        addLog('技能被禁用中！', 'info');
        return;
    }

    addLog(`玩家${currentPlayer} 使用技能：${skill.name}`, 'skill');

    // 重置冷卻
    skill.currentCd = skill.cooldown;

    // 執行技能效果 (從skills.js引入)
    applySkillEffect(skill, playerState, currentPlayer);

    updateUI();
    checkGameOver();
}

// 撤退（切換戰鬥卡牌）
function retreat() {
    const currentPlayer = gameState.currentPlayer;
    const playerState = currentPlayer === 1 ? gameState.player1 : gameState.player2;

    if (!playerState.battle) {
        addLog('沒有戰鬥卡牌可以撤退', 'info');
        return;
    }

    if (playerState.hand.length === 0) {
        addLog('沒有可替換的卡牌', 'info');
        return;
    }

    // 簡化版：直接結束回合
    addLog('撤退視同完成回合', 'info');
    endTurn();
}

// 結束回合
function endTurn() {
    const currentPlayer = gameState.currentPlayer;
    const playerState = currentPlayer === 1 ? gameState.player1 : gameState.player2;

    addLog(`玩家${currentPlayer} 結束回合`, 'info');

    // 切換玩家
    gameState.currentPlayer = currentPlayer === 1 ? 2 : 1;

    // 如果回到先手玩家，增加回合數
    if (gameState.currentPlayer === gameState.firstPlayer) {
        gameState.roundCount++;
    }

    updateUI();
    checkGameOver();

    // 開始新回合
    setTimeout(startTurn, 500);
}

// 檢查遊戲結束
function checkGameOver() {
    const p1Total = (gameState.player1.battle ? 1 : 0) + gameState.player1.hand.length;
    const p2Total = (gameState.player2.battle ? 1 : 0) + gameState.player2.hand.length;

    if (p1Total === 0) {
        endGame(2);
        return true;
    }

    if (p2Total === 0) {
        endGame(1);
        return true;
    }

    return false;
}

// 遊戲結束
function endGame(winner) {
    gameState.gameStarted = false;
    const modal = document.getElementById('victoryModal');
    const text = document.getElementById('victoryText');
    text.textContent = `玩家${winner} 獲勝！`;
    modal.classList.add('active');
}

// 初始化遊戲
window.addEventListener('load', () => {
    initGame();
});
