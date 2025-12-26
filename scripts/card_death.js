// 處理卡牌死亡 - 完整版
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

        // 鳳凰復活（帶機率動畫）
        if (card.passive.effect === 'revive' && !card.passive.used) {
            if (typeof showProbabilityRoll !== 'undefined') {
                showProbabilityRoll(`${card.name} 復活判定`, card.passive.chance, (success) => {
                    if (success) {
                        card.hp = card.maxHp;
                        card.passive.used = true;
                        addLog(`${card.name} 復活了！`, 'heal');
                        updateUI();
                    } else {
                        addLog(`${card.name} 復活失敗`, 'info');
                        continueCardDeath(playerState);
                    }
                });
                return;
            } else {
                // 如果機率系統未載入，直接判定
                if (Math.random() < card.passive.chance) {
                    card.hp = card.maxHp;
                    card.passive.used = true;
                    addLog(`${card.name} 復活了！`, 'heal');
                    updateUI();
                    return;
                }
            }
        }

        // 遞減復活機率
        if (card.passive.effect === 'revive_decreasing') {
            const currentChance = (card.passive.baseChance - card.passive.deathCount) / 100;
            if (Math.random() < currentChance) {
                card.hp = card.maxHp;
                card.passive.deathCount = (card.passive.deathCount || 0) + 1;
                addLog(`${card.name} 復活了！（剩餘機率: ${Math.round(currentChance * 100)}%）`, 'heal');
                updateUI();
                return;
            } else {
                card.passive.deathCount = (card.passive.deathCount || 0) + 1;
            }
        }
    }

    continueCardDeath(playerState);
}

// 繼續處理卡牌死亡（分離出來供復活判定後使用）
function continueCardDeath(playerState) {
    // 移除戰鬥卡
    playerState.battle = null;
    updateUI();

    // 如果有手牌，讓玩家選擇上場卡牌
    if (playerState.hand.length > 0) {
        const player = playerState === gameState.player1 ? 1 : 2;
        addLog(`玩家${player} 請選擇一張卡牌上場`, 'info');

        setTimeout(() => {
            if (typeof showCardReplacementSelection !== 'undefined') {
                showCardReplacementSelection(player);
            } else {
                // 如果UI函數未定義，自動選第一張（後備方案）
                console.error('showCardReplacementSelection未定義，使用自動選擇');
                if (playerState.hand.length > 0) {
                    playerState.battle = playerState.hand[0];
                    playerState.hand.splice(0, 1);
                    addLog(`${playerState.battle.name} 上場戰鬥！`, 'info');
                    updateUI();
                } else {
                    checkGameOver();
                }
            }
        }, 500);
    } else {
        checkGameOver();
    }
}
