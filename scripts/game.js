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
    updateModalContent('遊戲準備', `
        <p>歡迎來到卡牌對戰！</p>
        <p>點擊下方按鈕開始抽取雙方初始手牌</p>
        <div style="font-size: 3rem; margin: 20px;">🎴</div>
    `, true, '點擊抽卡');

    document.getElementById('modalBtn').onclick = () => {
        // 隱藏按鈕，顯示動畫
        updateModalContent('正在抽卡', '正在為雙方玩家抽取卡牌...', false);

        animateInitialDraw(() => {
            // 動畫結束後正式加入手牌並更新
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
            }, 1000);
        });
    };
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

    // 處理持續效果 (在回合開始時)
    if (playerState.battle) {
        let dotDamage = 0;
        const dotEffects = [];
        const card = playerState.battle;

        // 處理中毒
        if (card.poisonTurns && card.poisonTurns > 0) {
            dotDamage += card.poisonDamage || 0;
            dotEffects.push(`中毒${card.poisonDamage}`);
            card.poisonTurns--;
            if (card.poisonTurns === 0) {
                card.poisonDamage = 0;
                addLog(`${card.name} 的中毒效果結束`, 'info');
            }
        }

        // 處理燃燒
        if (card.burnTurns && card.burnTurns > 0) {
            dotDamage += card.burnDamage || 0;
            dotEffects.push(`燃燒${card.burnDamage}`);
            card.burnTurns--;
            if (card.burnTurns === 0) {
                card.burnDamage = 0;
                addLog(`${card.name} 的燃燒效果結束`, 'info');
            }
        }

        // 處理永久持續傷害
        if (card.permanentPoisonDamage && card.permanentPoisonDamage > 0) {
            dotDamage += card.permanentPoisonDamage;
            dotEffects.push(`持續傷害${card.permanentPoisonDamage}`);
        }

        // 造成持續傷害
        if (dotDamage > 0) {
            addLog(`${card.name} 受到持續傷害: ${dotEffects.join(', ')} = ${dotDamage}`, 'damage');
            dealDamage(playerState, dotDamage, currentPlayer === 1 ? 2 : 1, true);
        }

        // 每回合護盾
        if (card.shieldPerTurn && card.shieldTurns > 0) {
            card.shield = (card.shield || 0) + card.shieldPerTurn;
            card.shieldTurns--;
            addLog(`${card.name} 獲得回合護盾 +${card.shieldPerTurn}`, 'info');
        }

        // 攻擊減益更新
        if (card.atkDebuffTurns && card.atkDebuffTurns > 0) {
            card.atkDebuffTurns--;
            if (card.atkDebuffTurns === 0) {
                card.atk += (card.atkDebuff || 0);
                card.atkDebuff = 0;
                addLog(`${card.name} 的攻擊減益已結束`, 'info');
            }
        }
        if (card.atkDebuffFlatTurns && card.atkDebuffFlatTurns > 0) {
            card.atkDebuffFlatTurns--;
            if (card.atkDebuffFlatTurns === 0) {
                card.atk += (card.atkDebuffFlat || 0);
                card.atkDebuffFlat = 0;
                addLog(`${card.name} 的固定攻擊減益已結束`, 'info');
            }
        }

        // 減傷更新
        if (card.damageReductionTurns && card.damageReductionTurns > 0) {
            card.damageReductionTurns--;
            if (card.damageReductionTurns === 0) {
                card.damageReduction = 0;
                addLog(`${card.name} 的減傷效果結束`, 'info');
            }
        }

        // 攻擊倍率更新
        if (card.atkBoostTurns && card.atkBoostTurns > 0) {
            card.atkBoostTurns--;
            if (card.atkBoostTurns === 0) {
                card.atkBoostMultiplier = 0;
                addLog(`${card.name} 的攻擊強化結束`, 'info');
            }
        }

        // 睡眠判定 (改為非同步動畫)
        if (card.sleeping) {
            addLog(`正在判定 ${card.name} 是否甦醒...`, 'info');
            showProbabilityRoll(`${card.name} 甦醒判定`, card.wakeChance || 0.5, (success) => {
                if (success) {
                    card.sleeping = false;
                    addLog(`${card.name} 從睡眠中醒來！`, 'info');
                    proceedTurn(playerState, currentPlayer, card);
                } else {
                    addLog(`${card.name} 正在熟睡中...`, 'info');
                    endTurn();
                }
            });
            return;
        }
    }

    proceedTurn(playerState, currentPlayer, playerState.battle);
}

// 繼續執行回合邏輯 (處理暈眩、冷卻、被動等)
function proceedTurn(playerState, currentPlayer, card) {
    // 減少所有卡牌（戰鬥卡與手牌）的冷卻時間
    const allCards = playerState.hand.slice();
    if (playerState.battle) allCards.push(playerState.battle);

    allCards.forEach(c => {
        if (c && c.skills) {
            c.skills.forEach(skill => {
                if (skill.currentCd > 0) skill.currentCd--;
            });
        }
    });

    // 檢查暈眩
    if (card && card.stunned) {
        addLog(`玩家${currentPlayer} 的 ${card.name} 被暈眩，跳過回合！`, 'info');
        if (!card.stunnedTurns || card.stunnedTurns <= 1) {
            card.stunned = false;
            card.stunnedTurns = 0;
        } else {
            card.stunnedTurns--;
        }
        endTurn();
        return;
    }

    // 檢查技能禁用
    if (card && card.disabledUntil > 0) {
        card.disabledUntil--;
        if (card.disabledUntil === 0) {
            addLog(`${card.name} 的技能封鎖已解除`, 'info');
        }
    }

    // 處理被動效果
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
        addLog(`${card.name} 被動：最大生命值增加 ${passive.value}！`, 'heal');
    }

    // 超凡：每回合扣除50點生命值上限，增加10攻
    if (passive.effect === 'hp_to_atk') {
        const lossLimit = card.maxHp - 400; // 假設上限扣除800點生命值，這裡簡化邏輯或依據data設定
        if (card.maxHp > 400) {
            card.maxHp -= passive.hpLoss;
            if (card.hp > card.maxHp) card.hp = card.maxHp;
            card.atk += passive.atkGain;
            addLog(`${card.name} 被動：增加10攻擊，減少50最大生命！`, 'info');
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

    // 處理攻擊倍率
    if (attackerState.battle.atkBoostTurns && attackerState.battle.atkBoostTurns > 0) {
        damage = Math.floor(damage * (attackerState.battle.atkBoostMultiplier || 1));
        // 倍率不在此處減少，在回合結束或傷害結算後？
    }

    if (attackerState.battle.nextAtkMultiplier) {
        damage = Math.floor(damage * attackerState.battle.nextAtkMultiplier);
        attackerState.battle.nextAtkMultiplier = 0;
        addLog(`${attackerState.battle.name} 蓄力一擊！`, 'attack');
    }

    // 檢查隨機攻擊被動
    if (attackerState.battle.passive && attackerState.battle.passive.effect === 'random_atk') {
        damage = Math.floor(Math.random() * (attackerState.battle.passive.max - attackerState.battle.passive.min + 1)) + attackerState.battle.passive.min;
        addLog(`${attackerState.battle.name} 隨機發揮：造成 ${damage} 傷害`, 'info');
    }

    addLog(`玩家${attacker} 的 ${attackerState.battle.name} 發動普攻！造成 ${damage} 傷害`, 'attack');
    dealDamage(defenderState, damage, attacker);

    // 處理護盾獲取 (鳳凰技能)
    if (attackerState.battle.shieldOnHit) {
        const shieldGained = Math.floor(damage * attackerState.battle.shieldOnHit);
        attackerState.battle.shield = (attackerState.battle.shield || 0) + shieldGained;
        attackerState.battle.shieldOnHit = 0;
        addLog(`${attackerState.battle.name} 從攻擊中獲得 ${shieldGained} 護盾`, 'info');
    }

    // 厭世：攻擊時對自己造成一樣傷害
    if (attackerState.battle.passive && attackerState.battle.passive.effect === 'self_damage_on_attack') {
        addLog(`${attackerState.battle.name} 厭世被動：對自己造成等量傷害`, 'damage');
        dealDamage(attackerState, damage, attacker, true);
    }

    // 小吉/額外攻擊處理
    let extraAtk = false;
    if (attackerState.battle.passive && attackerState.battle.passive.effect === 'combo_attack') {
        const comboChance = Math.min(99, attackerState.battle.passive.baseChance + (attackerState.battle.comboBonus || 0));
        if (Math.random() * 100 < comboChance) {
            extraAtk = true;
            addLog(`${attackerState.battle.name} 觸發連擊！`, 'attack');
        }
    }

    if (attackerState.battle.extraAttack) {
        extraAtk = true;
        attackerState.battle.extraAttack = false;
        addLog(`${attackerState.battle.name} 獲得額外攻擊機會！`, 'attack');
    }

    if (extraAtk) {
        setTimeout(() => {
            if (attackerState.battle && defenderState.battle) {
                dealDamage(defenderState, damage, attacker);
            }
        }, 500);
    }

    updateUI();
    checkGameOver();
}

// 造成傷害
function dealDamage(targetPlayerState, damage, attackerPlayer, isSelf = false) {
    if (!targetPlayerState.battle) return;
    const card = targetPlayerState.battle;
    const attackerState = attackerPlayer === 1 ? gameState.player1 : gameState.player2;

    // 檢查免疫
    if (card.immuneOnce && !isSelf) {
        card.immuneOnce = false;
        addLog(`${card.name} 消耗了免疫次數，不受傷害！`, 'info');
        return;
    }

    // 檢查閃避
    if (card.dodgeTurns && card.dodgeTurns > 0 && !isSelf) {
        if (Math.random() < (card.dodgeChance || 0)) {
            addLog(`${card.name} 成功閃避了攻擊！`, 'info');
            card.dodgeTurns--;
            return;
        }
        card.dodgeTurns--;
    }

    if (card.dodgeShieldChance && !isSelf) {
        if (Math.random() < card.dodgeShieldChance) {
            addLog(`${card.name} 閃避並獲得護盾！`, 'info');
            card.shield = (card.shield || 0) + (card.dodgeShield || 0);
            card.dodgeShieldChance = 0;
            return;
        }
        card.dodgeShieldChance = 0;
    }

    // 檢查閃避被動 (機率型選手/球球)
    if (card.passive && card.passive.effect === 'dodge_passive' && !isSelf) {
        if (Math.random() < card.passive.chance) {
            addLog(`${card.name} 運氣極好，閃避了攻擊！`, 'info');
            return;
        }
    }

    // 傷害加成/減免計算
    let finalDamage = damage;

    if (card.nextDamageIncrease && !isSelf) {
        finalDamage = Math.floor(finalDamage * (1 + card.nextDamageIncrease));
        card.nextDamageIncrease = 0;
    }

    if (card.damageReduction && !isSelf) {
        finalDamage = Math.floor(finalDamage * (1 - card.damageReduction));
    }

    if (card.nextDamageReduction && !isSelf) {
        finalDamage = Math.floor(finalDamage * (1 - card.nextDamageReduction));
        card.nextDamageReduction = 0;
    }

    if (card.nextDamageReductionFlat && !isSelf) {
        finalDamage = Math.max(0, finalDamage - card.nextDamageReductionFlat);
        card.nextDamageReductionFlat = 0;
    }

    // 治療轉化 (英國紳士)
    if (card.healNextDamage && !isSelf) {
        const healAmt = Math.floor(finalDamage * card.healNextDamage);
        card.hp = Math.min(card.maxHp, card.hp + healAmt);
        addLog(`${card.name} 將傷害轉化為 ${healAmt} 點治療！`, 'heal');
        card.healNextDamage = 0;
        return;
    }

    // 反射處理
    if (card.reflectTurns && card.reflectTurns > 0 && !isSelf) {
        const reflectDmg = Math.floor(finalDamage * (card.reflectMultiplier || 1));
        addLog(`${card.name} 反射了 ${reflectDmg} 點傷害！`, 'damage');
        dealDamage(attackerState, reflectDmg, attackerPlayer === 1 ? 2 : 1, true);
        card.reflectTurns--;
    }

    // 傷害轉化為屬性
    if (card.damageToAtkPercent && !isSelf) {
        const atkGain = Math.floor(finalDamage * card.damageToAtkPercent);
        card.atk += atkGain;
        addLog(`${card.name} 將傷害轉化為 ${atkGain} 點攻擊！`, 'info');
        card.damageToAtkPercent = 0;
    }

    if (card.damageToMaxHp && !isSelf) {
        card.maxHp += finalDamage;
        card.hp += finalDamage;
        addLog(`${card.name} 將傷害轉化為最大生命值！`, 'heal');
        card.damageToMaxHp = false;
    }

    // 檢查護盾
    if (card.shield && card.shield > 0) {
        if (card.shield >= finalDamage) {
            card.shield -= finalDamage;
            addLog(`護盾吸收了全部 ${finalDamage} 點傷害！剩餘護盾：${card.shield}`, 'info');
            return;
        } else {
            finalDamage -= card.shield;
            addLog(`護盾吸收了部分傷害，破碎！還剩 ${finalDamage} 點傷害`, 'damage');
            card.shield = 0;
        }
    }

    // 扣血
    card.hp -= finalDamage;
    addLog(`${card.name} 受到 ${finalDamage} 點傷害！剩餘HP：${Math.max(0, card.hp)}`, 'damage');

    // 瘋狗騎士被動：每受到一次攻擊增加10最大生命值
    if (card.passive && card.passive.effect === 'max_hp_on_hit' && !isSelf) {
        card.maxHp += card.passive.value;
        addLog(`${card.name} 愈戰愈勇，最大生命值增加 ${card.passive.value}！`, 'heal');
    }

    // 檢查死亡
    if (card.hp <= 0) {
        handleCardDeath(targetPlayerState, attackerPlayer);
    }

    updateUI();
}

// 處理卡牌死亡已移至 scripts/card_death.js

// 使用技能
function useSkill(skillIndex, onComplete) {
    const currentPlayer = gameState.currentPlayer;
    const playerState = currentPlayer === 1 ? gameState.player1 : gameState.player2;

    if (!playerState.battle) return;

    const skill = playerState.battle.skills[skillIndex];
    if (!skill) return;

    // 檢查冷卻
    if (skill.currentCd && skill.currentCd > 0) {
        addLog(`${skill.name} 冷卻中！還需 ${skill.currentCd} 回合`, 'info');
        console.log(`[CD Check] Skill: ${skill.name}, CD: ${skill.currentCd}`);
        return;
    }

    // 檢查技能禁用
    if (playerState.battle.disabledUntil > 0) {
        addLog('技能被禁用中！', 'info');
        return;
    }

    addLog(`玩家${currentPlayer} 使用技能：${skill.name}`, 'skill');

    // 重置冷卻 (優先從 skill.cooldown 讀取，若無則預設為 0)
    skill.currentCd = parseInt(skill.cooldown) || 0;

    // 立即更新UI顯示冷卻中狀態
    updateUI();

    // 執行技能效果 (從skills.js引入)
    applySkillEffect(skill, playerState, currentPlayer, onComplete);

    // 再次確認UI更新及遊戲狀態
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
