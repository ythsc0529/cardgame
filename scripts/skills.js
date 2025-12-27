// ============================================
// 完整重寫的技能系統 - 100%實裝所有角色技能
// ============================================

function applySkillEffect(skill, playerState, player, onComplete) {
    const enemy = player === 1 ? gameState.player2 : gameState.player1;
    const enemyPlayer = player === 1 ? 2 : 1;
    const card = playerState.battle;

    if (!card) {
        if (onComplete) onComplete();
        return;
    }

    let isAsync = false;
    const done = () => {
        updateUI();
        if (onComplete) onComplete();
    };

    switch (skill.effect) {
        // ========== 直接傷害系列 ==========
        case 'damage':
            dealDamage(enemy, skill.value, player);
            break;

        case 'turn_damage':
            const turnDmg = Math.floor(gameState.roundCount * (skill.multiplier || 1));
            dealDamage(enemy, turnDmg, player);
            break;

        case 'double_atk':
            dealDamage(enemy, card.atk, player);
            setTimeout(() => dealDamage(enemy, card.atk, player), 200);
            break;

        case 'atk_multiplier':
            dealDamage(enemy, Math.floor(card.atk * skill.multiplier), player);
            break;

        case 'lost_hp_damage':
            const lostHp = card.maxHp - card.hp;
            dealDamage(enemy, Math.floor(lostHp * skill.multiplier), player);
            break;

        case 'enemy_atk_damage':
            if (enemy.battle) {
                dealDamage(enemy, Math.floor(enemy.battle.atk * skill.multiplier), player);
            }
            break;

        case 'max_hp_damage':
            dealDamage(enemy, Math.floor(card.maxHp * skill.value), player);
            break;

        case 'hp_damage':
        case 'hp_percent_damage':
            dealDamage(enemy, Math.floor(card.hp * (skill.multiplier || skill.value)), player);
            break;

        case 'turn_hp_damage':
            dealDamage(enemy, Math.floor(gameState.roundCount * card.hp * skill.multiplier), player);
            break;

        case 'percent_damage':
            if (enemy.battle) {
                dealDamage(enemy, Math.floor(enemy.battle.maxHp * skill.value), player);
            }
            break;

        case 'damage_and_self':
            dealDamage(enemy, skill.damage, player);
            dealDamage(playerState, skill.selfDamage, enemyPlayer, true);
            break;

        // ========== 隨機/機率傷害 ==========
        case 'random_damage':
            isAsync = true;
            const rdmDmg = Math.floor(Math.random() * (skill.max - skill.min + 1)) + skill.min;
            showValueRoll(skill.name, skill.min, skill.max, rdmDmg, () => {
                dealDamage(enemy, rdmDmg, player);
                done();
            });
            break;

        case 'random_percent_damage':
            isAsync = true;
            const randVal = Math.random() * (skill.max - skill.min) + skill.min;
            const rdmPctDmg = Math.floor(card.atk * randVal);
            showValueRoll(skill.name, Math.floor(card.atk * skill.min), Math.floor(card.atk * skill.max), rdmPctDmg, () => {
                dealDamage(enemy, rdmPctDmg, player);
                done();
            });
            break;

        case 'chance_damage':
            isAsync = true;
            const chanceVal = (skill.currentChance || skill.baseChance || (skill.chance * 100)) / 100;
            showProbabilityRoll(skill.name, chanceVal, (success) => {
                if (success) {
                    dealDamage(enemy, skill.damage, player);
                    if (skill.currentChance) skill.currentChance = skill.baseChance;
                } else {
                    if (skill.currentChance && skill.chanceIncrease) {
                        skill.currentChance += skill.chanceIncrease;
                    }
                    addLog(`${skill.name} 判定失敗`, 'info');
                }
                done();
            });
            break;

        case 'chance_boost':
            isAsync = true;
            showProbabilityRoll(skill.name, skill.chance, (success) => {
                if (success) {
                    dealDamage(enemy, Math.floor(card.atk * skill.multiplier), player);
                } else {
                    addLog(`${skill.name} 判定失敗`, 'info');
                }
                done();
            });
            break;

        case 'chance_half_damage':
            if (enemy.battle) {
                isAsync = true;
                showProbabilityRoll(skill.name, skill.chance, (success) => {
                    if (success) {
                        dealDamage(enemy, Math.floor(enemy.battle.hp / 2), player);
                    } else {
                        addLog(`${skill.name} 判定失敗`, 'info');
                    }
                    done();
                });
            }
            break;

        case 'chance_damage_dual':
            isAsync = true;
            showProbabilityRoll(skill.name, skill.highChance, (success) => {
                dealDamage(enemy, success ? skill.highDamage : skill.lowDamage, player);
                done();
            });
            break;

        case 'random_chance_damage':
            isAsync = true;
            const rch = Math.random() * 0.3 + 0.3;
            showProbabilityRoll(skill.name, rch, (success) => {
                if (success) {
                    const rdm = Math.floor(Math.random() * 81) + 20;
                    dealDamage(enemy, rdm, player);
                } else {
                    addLog(`${skill.name} 判定失敗`, 'info');
                }
                done();
            });
            break;

        case 'triple_chance_damage':
            isAsync = true;
            showProbabilityRoll(skill.name, 0.95, (success) => {
                const r3 = Math.random();
                if (r3 < 0.9) {
                    dealDamage(enemy, 10, player);
                } else if (r3 < 0.95) {
                    dealDamage(enemy, 50, player);
                } else {
                    addLog(`${skill.name} 造成 0 傷害`, 'info');
                }
                done();
            });
            break;

        case 'dice_damage':
            isAsync = true;
            const dice = Math.floor(Math.random() * 6) + 1;
            showDiceRoll(dice, () => {
                addLog(`背景擲骰: ${dice}`, 'info');
                if ((dice === 3 || dice === 6) && enemy.battle) {
                    dealDamage(enemy, Math.floor(enemy.battle.hp / 2), player);
                } else {
                    addLog('骰子點數未達標，判定失敗', 'info');
                }
                done();
            });
            break;

        // ========== 犧牲/自殘 ==========
        case 'sacrifice_damage':
            const sac = card.hp - 1;
            card.hp = 1;
            dealDamage(enemy, Math.floor(sac * skill.multiplier), player);
            break;

        case 'sacrifice':
            dealDamage(enemy, skill.damage, player);
            card.hp = 0;
            setTimeout(() => handleCardDeath(playerState, enemyPlayer), 100);
            break;

        // ========== 廚師專屬 ==========
        case 'cook_food':
            card.foodCount = (card.foodCount || 0) + 1;
            addLog(`煮了食物！目前: ${card.foodCount}`, 'info');
            break;

        case 'food_damage':
            dealDamage(enemy, (card.foodCount || 0) * card.atk, player);
            break;

        // ========== 治療系列 ==========
        case 'heal':
            card.hp = Math.min(card.maxHp, card.hp + skill.value);
            addLog(`恢復${skill.value}HP`, 'heal');
            break;

        case 'heal_percent':
            const hpct = Math.floor(card.maxHp * skill.value);
            card.hp = Math.min(card.maxHp, card.hp + hpct);
            addLog(`恢復${hpct}HP`, 'heal');
            break;

        case 'heal_lost':
            const hlost = Math.floor((card.maxHp - card.hp) * skill.value);
            card.hp = Math.min(card.maxHp, card.hp + hlost);
            addLog(`恢復${hlost}HP`, 'heal');
            break;

        case 'heal_and_atk':
            card.hp = Math.min(card.maxHp, card.hp + skill.heal);
            card.atk += skill.atk;
            addLog(`+${skill.heal}HP +${skill.atk}ATK`, 'heal');
            break;

        case 'random_heal':
            isAsync = true;
            const rh = Math.floor(Math.random() * (skill.max - skill.min + 1)) + skill.min;
            showValueRoll(skill.name, skill.min, skill.max, rh, () => {
                card.hp = Math.max(1, Math.min(card.maxHp, card.hp + rh));
                addLog(`${rh > 0 ? '恢復' : '扣除'}${Math.abs(rh)}HP`, rh > 0 ? 'heal' : 'damage');
                done();
            });
            break;

        case 'steal_hp':
            if (enemy.battle) {
                const st = Math.floor(enemy.battle.hp * skill.value);
                enemy.battle.hp = Math.max(0, enemy.battle.hp - st);
                card.hp = Math.min(card.maxHp, card.hp + st);
                addLog(`吸取${st}HP`, 'heal');
            }
            break;

        case 'heal_next_damage':
            card.healNextDamage = skill.value;
            addLog('下次受到的傷害將轉化為治療', 'info');
            break;

        // ========== 護盾系列 ==========
        case 'shield':
            card.shield = (card.shield || 0) + skill.value;
            addLog(`+${skill.value}護盾`, 'info');
            break;

        case 'random_shield':
            isAsync = true;
            const rs = Math.floor(Math.random() * (skill.max - skill.min + 1)) + skill.min;
            showValueRoll(skill.name, skill.min, skill.max, rs, () => {
                card.shield = (card.shield || 0) + rs;
                addLog(`+${rs}隨機護盾`, 'info');
                done();
            });
            break;

        case 'shield_per_turn':
            card.shieldPerTurn = skill.value;
            card.shieldTurns = skill.duration;
            addLog(`每回合獲得${skill.value}護盾，持續${skill.duration}回合`, 'info');
            break;

        case 'shield_on_hit':
            card.shieldOnHit = skill.multiplier;
            addLog(`下次攻擊將獲得造成傷害${skill.multiplier * 100}%的護盾`, 'info');
            break;

        case 'dodge_shield':
            card.dodgeShieldChance = skill.chance;
            card.dodgeShield = skill.shield;
            addLog(`下次敵方攻擊有${skill.chance * 100}%幾率免傷並加${skill.shield}護盾`, 'info');
            break;

        // ========== 攻擊增益 ==========
        case 'permanent_atk':
            card.atk += skill.value;
            addLog(`永久+${skill.value}ATK`, 'info');
            break;

        case 'atk_boost':
            card.atkBoostMultiplier = skill.multiplier;
            card.atkBoostTurns = (skill.duration || 1);
            addLog(`攻擊力變為 ${skill.multiplier} 倍，持續 ${skill.duration || 1} 回合`, 'info');
            break;

        case 'next_atk_boost':
            card.nextAtkMultiplier = skill.multiplier;
            addLog(`下次普攻倍率 x${skill.multiplier}`, 'info');
            break;

        case 'atk_debuff':
            if (enemy.battle) {
                const red = Math.floor(enemy.battle.atk * skill.value);
                enemy.battle.atkDebuff = (enemy.battle.atkDebuff || 0) + red;
                enemy.battle.atkDebuffTurns = skill.duration;
                enemy.battle.atk -= red;
                addLog(`對手攻擊力降低 ${red}，持續 ${skill.duration} 回合`, 'info');
            }
            break;

        case 'atk_debuff_flat':
            if (enemy.battle) {
                enemy.battle.atkDebuffFlat = (enemy.battle.atkDebuffFlat || 0) + skill.value;
                enemy.battle.atkDebuffFlatTurns = skill.duration;
                enemy.battle.atk -= skill.value;
                addLog(`對手攻擊力降低 ${skill.value}，持續 ${skill.duration} 回合`, 'info');
            }
            break;

        case 'atk_to_hp':
            card.atk -= skill.atkLoss;
            card.maxHp += skill.hpGain;
            card.hp = Math.min(card.maxHp, card.hp + skill.hpGain);
            addLog(`攻擊-${skill.atkLoss}，最大生命+${skill.hpGain}`, 'heal');
            break;

        case 'hp_to_atk_skill':
            if (card.hp > skill.hpLoss) {
                card.hp -= skill.hpLoss;
                card.atk += skill.atkGain;
                addLog(`消耗${skill.hpLoss}血量，獲得${skill.atkGain}攻擊`, 'info');
            }
            break;

        // ========== 減傷/閃避 ==========
        case 'damage_reduction':
            card.damageReduction = skill.value;
            card.damageReductionTurns = skill.duration;
            addLog(`受到的傷害減少${skill.value * 100}%，持續${skill.duration}回合`, 'info');
            break;

        case 'damage_reduction_next':
            card.nextDamageReduction = (card.nextDamageReduction || 0) + skill.value;
            addLog(`下次受到的傷害減少${skill.value * 100}%`, 'info');
            break;

        case 'reduce_next_damage_flat':
            card.nextDamageReductionFlat = (card.nextDamageReductionFlat || 0) + skill.value;
            addLog(`下次受到的傷害減少 ${skill.value}`, 'info');
            break;

        case 'dodge':
            isAsync = true;
            showProbabilityRoll(skill.name, skill.chance, (success) => {
                if (success) {
                    card.dodgeChance = 1; // 100% dodge
                    card.dodgeTurns = 1;
                    addLog('準備閃避下一次攻擊', 'info');
                } else {
                    addLog('閃避準備失敗', 'info');
                }
                done();
            });
            break;

        case 'immune_once':
            card.immuneOnce = true;
            addLog('獲得一次傷害免疫', 'info');
            break;

        // ========== 反射/轉換 ==========
        case 'reflect':
        case 'reflect_next':
            card.reflectMultiplier = skill.multiplier || 1;
            card.reflectTurns = 1;
            addLog(`準備反射下次傷害的 ${Math.round((skill.multiplier || 1) * 100)}%`, 'info');
            break;

        case 'damage_to_atk':
        case 'damage_conversion':
            card.damageToAtkPercent = skill.value || 0.6;
            card.damageToAtkTurns = 1;
            addLog('準備將下次所受傷害轉化為攻擊力', 'info');
            break;

        case 'damage_to_max_hp':
            card.damageToMaxHp = true;
            addLog('準備將下次所受傷害轉化為最大生命值', 'info');
            break;

        case 'reduce_next_damage':
            if (enemy.battle) {
                enemy.battle.nextDamageIncrease = -(skill.value || 0.9);
                addLog(`對手下次傷害將減少 ${Math.round((skill.value || 0.9) * 100)}%`, 'info');
            }
            break;

        case 'swap_and_stun':
            if (enemy.battle) {
                const oldAtk = enemy.battle.atk;
                const oldHp = enemy.battle.hp;
                enemy.battle.hp = Math.min(oldAtk, enemy.battle.maxHp);
                enemy.battle.atk = oldHp;
                enemy.battle.stunned = true;
                enemy.battle.stunnedTurns = 1;
                addLog('對手攻守交換並被暈眩！', 'info');
            }
            break;

        //========== 狀態異常 ==========
        case 'disable_skill':
            if (enemy.battle) {
                enemy.battle.disabledUntil = skill.duration || 1;
                addLog(`對方 ${enemy.battle.name} 技能被禁用${skill.duration || 1}回合`, 'info');
            }
            break;

        case 'conditional_disable':
            if (skill.condition === 'hp_higher' && enemy.battle && enemy.battle.hp > card.hp) {
                enemy.battle.disabledUntil = skill.duration;
                addLog(`對方 ${enemy.battle.name} 血量較高，技能被禁用${skill.duration}回合`, 'info');
            }
            break;

        case 'stun':
            isAsync = true;
            showProbabilityRoll(skill.name, skill.chance || 1, (success) => {
                if (success && enemy.battle) {
                    enemy.battle.stunned = true;
                    enemy.battle.stunnedTurns = skill.duration || 1;
                    addLog(`對方 ${enemy.battle.name} 被暈眩${skill.duration || 1}回合`, 'info');
                } else if (!success) {
                    addLog(`暈眩判定失敗`, 'info');
                }
                done();
            });
            break;

        case 'sleep':
            isAsync = true;
            showProbabilityRoll(skill.name, 1, (success) => {
                if (enemy.battle) {
                    enemy.battle.sleeping = true;
                    enemy.battle.wakeChance = skill.wakeChance || 0.5;
                    addLog(`對方 ${enemy.battle.name} 進入睡眠狀態`, 'info');
                }
                done();
            });
            break;

        case 'poison':
            if (enemy.battle) {
                enemy.battle.poisonDamage = skill.damage;
                enemy.battle.poisonTurns = skill.duration || 2;
                addLog(`對方 ${enemy.battle.name} 中毒，每回合${skill.damage}傷害，持續${skill.duration || 2}回合`, 'damage');
            }
            break;

        case 'poison_percent':
            if (enemy.battle) {
                enemy.battle.poisonDamage = Math.floor(enemy.battle.maxHp * skill.value);
                enemy.battle.poisonTurns = skill.duration || 3;
                addLog(`對方 ${enemy.battle.name} 中毒，每回合${enemy.battle.poisonDamage}傷害`, 'damage');
            }
            break;

        case 'permanent_poison':
            if (enemy.battle) {
                enemy.battle.permanentPoisonDamage = skill.damage;
                addLog(`對方 ${enemy.battle.name} 永久中毒，每回合${skill.damage}傷害`, 'damage');
            }
            break;

        case 'burn':
            if (enemy.battle) {
                enemy.battle.burnDamage = skill.damage || 20;
                enemy.battle.burnTurns = skill.duration || 3;
                addLog(`對方 ${enemy.battle.name} 燃燒，每回合${skill.damage || 20}傷害`, 'damage');
            }
            break;

        case 'burn_multiplier':
            if (enemy.burnTurns && enemy.burnTurns > 0) {
                dealDamage(enemy, enemy.burnTurns * skill.multiplier, player);
                addLog(`引爆燃燒！造成 ${enemy.burnTurns * skill.multiplier} 點傷害`, 'damage');
            }
            break;

        case 'cleanse':
            card.poisonTurns = 0;
            card.burnTurns = 0;
            card.permanentPoisonDamage = 0;
            card.stunned = false;
            card.stunnedTurns = 0;
            card.sleeping = false;
            card.disabledUntil = 0;
            card.atkDebuff = 0;
            card.atkDebuffTurns = 0;
            card.atkDebuffFlat = 0;
            card.atkDebuffFlatTurns = 0;
            addLog(`${card.name} 解除所有負面效果`, 'heal');
            break;

        case 'reduce_max_hp':
            isAsync = true;
            showProbabilityRoll(skill.name, skill.chance || 1, (success) => {
                if (success && enemy.battle) {
                    enemy.battle.maxHp -= skill.value;
                    enemy.battle.hp = Math.min(enemy.battle.hp, enemy.battle.maxHp);
                    addLog(`對方最大生命值減少${skill.value}`, 'damage');
                } else {
                    addLog('判定失敗', 'info');
                }
                done();
            });
            break;

        // ========== 召喚/抽卡 ==========
        case 'draw':
            isAsync = true;
            let drawCount = 0;
            const drawOne = () => {
                if (drawCount < skill.value) {
                    const drawn = drawCard();
                    if (drawn) {
                        playerState.hand.push(drawn);
                        revealAndSummon(currentPlayer, drawn, () => {
                            drawCount++;
                            drawOne();
                        });
                    } else {
                        drawOne();
                    }
                } else {
                    addLog(`抽${skill.value}張牌`, 'info');
                    done();
                }
            };
            drawOne();
            break;

        case 'summon':
            const sc = summonCharacterByName(skill.cardName);
            if (sc) {
                isAsync = true;
                playerState.hand.push(sc);
                revealAndSummon(currentPlayer, sc, () => {
                    addLog(`召喚${skill.cardName}到手牌`, 'info');
                    done();
                });
            }
            break;

        case 'summon_chance':
            isAsync = true;
            showProbabilityRoll(skill.name, skill.chance, (success) => {
                if (success) {
                    const sc2 = summonCharacterByName(skill.cardName);
                    if (sc2) {
                        playerState.hand.push(sc2);
                        revealAndSummon(currentPlayer, sc2, () => {
                            addLog(`召喚${skill.cardName}成功`, 'info');
                            done();
                        });
                    } else {
                        done();
                    }
                } else {
                    addLog(`召喚失敗`, 'info');
                    done();
                }
            });
            break;

        case 'summon_multiple':
            isAsync = true;
            let summonCount = 0;
            const summonOne = () => {
                if (summonCount < skill.count) {
                    const sc3 = summonCharacterByName(skill.cardName);
                    if (sc3) {
                        playerState.hand.push(sc3);
                        revealAndSummon(currentPlayer, sc3, () => {
                            summonCount++;
                            summonOne();
                        });
                    } else {
                        summonOne();
                    }
                } else {
                    addLog(`召喚${skill.count}隻${skill.cardName}到手牌`, 'info');
                    done();
                }
            };
            summonOne();
            break;

        case 'summon_random_ball':
            const rb = summonRandomBall();
            if (rb) {
                isAsync = true;
                playerState.hand.push(rb);
                revealAndSummon(currentPlayer, rb, () => {
                    addLog(`召喚球類角色${rb.name}`, 'info');
                    done();
                });
            } else {
                addLog('召喚失敗', 'info');
            }
            break;

        // ========== 特殊效果 ==========
        case 'execute':
            if (enemy.battle && enemy.battle.hp / enemy.battle.maxHp < skill.threshold) {
                enemy.battle.hp = 0;
                addLog('斬殺！', 'damage');
                setTimeout(() => handleCardDeath(enemy, player), 100);
            } else {
                addLog('對手血量未達斬殺線', 'info');
            }
            break;

        case 'increase_max_hp':
            card.maxHp += skill.value;
            card.hp += skill.value;
            addLog(`最大生命值增加${skill.value}`, 'heal');
            break;

        case 'lifesteal':
            const lifestealDmg = Math.floor(card.atk * (skill.value || 1));
            dealDamage(enemy, lifestealDmg, player);
            card.hp = Math.min(card.maxHp, card.hp + lifestealDmg);
            addLog(`造成傷害並吸血${lifestealDmg}`, 'heal');
            break;

        case 'charge_up':
            card.chargeCount = (card.chargeCount || 0) + 1;
            addLog(`蓄力+1(目前:${card.chargeCount})`, 'info');
            break;

        case 'charge_attack':
            const curCharge = (card.chargeCount || 0);
            const chargeDmg = Math.floor(card.atk * (3 + 2 * curCharge));
            dealDamage(enemy, chargeDmg, player);
            card.chargeCount = 0;
            addLog(`發動咆哮！(消耗${curCharge}層蓄力)`, 'attack');
            break;

        case 'combo_chance':
            card.comboBonus = (card.comboBonus || 0) + skill.value;
            addLog(`連擊機率上限提升至 ${60 + (card.comboBonus || 0)}%`, 'info');
            break;

        case 'random_passive':
            isAsync = true;
            const options = ['攻擊', '血量', '666', '隨便你'];
            const finalIdx = Math.floor(Math.random() * options.length);
            const re = options[finalIdx];
            showOptionRoll(skill.name, options, finalIdx, () => {
                if (re === '攻擊') {
                    card.atk += 20;
                    addLog('隨機獲得：增加20攻擊力', 'info');
                } else if (re === '血量') {
                    card.maxHp += 50;
                    card.hp += 50;
                    addLog('隨機獲得：增加50血量', 'heal');
                } else if (re === '666') {
                    card.extraAttack = true;
                    addLog('隨機獲得：下輪可額外攻擊1次', 'info');
                } else if (re === '隨便你') {
                    const rc = summonCharacterByName('隨便你');
                    if (rc) {
                        playerState.hand.push(rc);
                        addLog('隨機獲得：召喚一隻隨便你', 'info');
                    }
                }
                done();
            });
            break;

        case 'copy_skill':
            isAsync = true;
            if (enemy.battle && enemy.battle.skills && enemy.battle.skills.length > 0) {
                const skillsList = enemy.battle.skills;
                const skillIdx = Math.floor(Math.random() * skillsList.length);
                const cs = skillsList[skillIdx];

                showOptionRoll('技能複製', skillsList.map(s => s.name), skillIdx, () => {
                    addLog(`複製: ${cs.name}`, 'info');
                    // 非同步遞迴調用
                    applySkillEffect(cs, playerState, player, done);
                });
            } else {
                addLog('對手沒有可複製的技能', 'info');
                done();
            }
            break;

        case 'conditional_damage':
            if (skill.condition === 'atk_higher' && enemy.battle && enemy.battle.atk > card.atk) {
                dealDamage(enemy, skill.value, player);
                addLog(`對手攻擊較高，觸發${skill.value}點傷害`, 'damage');
            } else {
                addLog('條件未達成', 'info');
            }
            break;

        case 'none':
            addLog('此技能無效果', 'info');
            break;

        default:
            addLog(`技能效果 ${skill.effect} 尚未實裝`, 'info');
            console.warn('未實裝的技能:', skill);
    }

    if (!isAsync) {
        done();
    }
}
