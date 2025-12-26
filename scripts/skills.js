// ============================================
// 完整重寫的技能系統 - 100%實裝所有角色技能
// ============================================

function applySkillEffect(skill, playerState, player) {
    const enemy = player === 1 ? gameState.player2 : gameState.player1;
    const enemyPlayer = player === 1 ? 2 : 1;
    const card = playerState.battle;

    if (!card) {
        addLog('沒有戰鬥卡牌', 'info');
        return;
    }

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
            dealDamage(enemy, Math.floor(Math.random() * (skill.max - skill.min + 1)) + skill.min, player);
            break;

        case 'random_percent_damage':
            const randPct = Math.random() * (skill.max - skill.min) + skill.min;
            dealDamage(enemy, Math.floor(card.atk * randPct), player);
            break;

        case 'chance_damage':
            const ch = skill.chance || (skill.currentChance || skill.baseChance) / 100;
            if (Math.random() < ch) {
                dealDamage(enemy, skill.damage, player);
                if (skill.currentChance) skill.currentChance = skill.baseChance;
            } else {
                if (skill.currentChance && skill.chanceIncrease) {
                    skill.currentChance += skill.chanceIncrease;
                }
            }
            break;

        case 'chance_boost':
            if (Math.random() < skill.chance) {
                dealDamage(enemy, Math.floor(card.atk * skill.multiplier), player);
            }
            break;

        case 'chance_half_damage':
            if (enemy.battle && Math.random() < skill.chance) {
                dealDamage(enemy, Math.floor(enemy.battle.hp / 2), player);
            }
            break;

        case 'chance_damage_dual':
            dealDamage(enemy, Math.random() < skill.highChance ? skill.highDamage : skill.lowDamage, player);
            break;

        case 'random_chance_damage':
            const rch = Math.random() * 0.3 + 0.3;
            const rdm = Math.floor(Math.random() * 81) + 20;
            if (Math.random() < rch) dealDamage(enemy, rdm, player);
            break;

        case 'triple_chance_damage':
            const r3 = Math.random();
            if (r3 < 0.9) dealDamage(enemy, 10, player);
            else if (r3 < 0.95) dealDamage(enemy, 50, player);
            break;

        case 'dice_damage':
            const dice = Math.floor(Math.random() * 6) + 1;
            addLog(`擲骰子: ${dice}`, 'info');
            if ((dice === 3 || dice === 6) && enemy.battle) {
                dealDamage(enemy, Math.floor(enemy.battle.hp / 2), player);
            }
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
            const rh = Math.floor(Math.random() * (skill.max - skill.min + 1)) + skill.min;
            card.hp = Math.max(1, Math.min(card.maxHp, card.hp + rh));
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
            break;

        // ========== 護盾系列 ==========
        case 'shield':
            card.shield = (card.shield || 0) + skill.value;
            addLog(`+${skill.value}護盾`, 'info');
            break;

        case 'random_shield':
            const rs = Math.floor(Math.random() * (skill.max - skill.min + 1)) + skill.min;
            card.shield = (card.shield || 0) + rs;
            break;

        case 'shield_per_turn':
            card.shieldPerTurn = skill.value;
            card.shieldTurns = skill.duration;
            break;

        case 'shield_on_hit':
            card.shieldOnHit = skill.multiplier;
            break;

        case 'dodge_shield':
            card.dodgeShieldChance = skill.chance;
            card.dodgeShield = skill.shield;
            break;

        // ========== 攻擊增益 ==========
        case 'permanent_atk':
            card.atk += skill.value;
            addLog(`永久+${skill.value}ATK`, 'info');
            break;

        case 'atk_boost':
            card.atkBoostMultiplier = skill.multiplier;
            card.atkBoostTurns = 1;
            break;

        case 'next_atk_boost':
            card.nextAtkMultiplier = skill.multiplier;
            break;

        case 'atk_debuff':
            if (enemy.battle) {
                const red = Math.floor(enemy.battle.atk * skill.value);
                enemy.battle.atkDebuff = red;
                enemy.battle.atkDebuffTurns = skill.duration;
                enemy.battle.atk -= red;
            }
            break;

        case 'atk_debuff_flat':
            if (enemy.battle) {
                enemy.battle.atkDebuffFlat = skill.value;
                enemy.battle.atkDebuffFlatTurns = skill.duration;
                enemy.battle.atk -= skill.value;
            }
            break;

        case 'atk_to_hp':
            card.atk -= skill.atkLoss;
            card.maxHp += skill.hpGain;
            card.hp = Math.min(card.maxHp, card.hp + skill.hpGain);
            break;

        case 'hp_to_atk_skill':
            if (card.hp > skill.hpLoss) {
                card.hp -= skill.hpLoss;
                card.atk += skill.atkGain;
            }
            break;

        // ========== 減傷/閃避 ==========
        case 'damage_reduction':
            card.damageReduction = skill.value;
            card.damageReductionTurns = skill.duration;
            break;

        case 'damage_reduction_next':
            card.nextDamageReduction = skill.value;
            break;

        case 'reduce_next_damage_flat':
            card.nextDamageReductionFlat = skill.value;
            break;

        case 'dodge':
            card.dodgeChance = skill.chance;
            card.dodgeTurns = 1;
            break;

        case 'immune_once':
            card.immuneOnce = true;
            break;

        // ========== 反射/轉換 ==========
        case 'reflect':
        case 'reflect_next':
            card.reflectMultiplier = skill.multiplier || 1;
            card.reflectTurns = 1;
            break;

        case 'damage_to_atk':
        case 'damage_conversion':
            card.damageToAtkPercent = skill.value || 0.6;
            card.damageToAtkTurns = 1;
            break;

        case 'damage_to_max_hp':
            card.damageToMaxHp = true;
            break;

        case 'reduce_next_damage':
            if (enemy.battle) {
                enemy.battle.nextDamageIncrease = -(skill.value || 0.9);
            }
            break;

        case 'swap_and_stun':
            if (enemy.battle) {
                [enemy.battle.hp, enemy.battle.atk] = [Math.min(enemy.battle.atk, enemy.battle.maxHp), enemy.battle.hp];
                enemy.stunned = true;
            }
            break;

        //========== 狀態異常 ==========
        case 'disable_skill':
            enemy.disabledUntil = skill.duration || 1;
            addLog(`對方技能被禁用${skill.duration || 1}回合`, 'info');
            break;

        case 'conditional_disable':
            if (skill.condition === 'hp_higher' && enemy.battle && enemy.battle.hp > card.hp) {
                enemy.disabledUntil = skill.duration;
                addLog(`對方技能被禁用${skill.duration}回合`, 'info');
            }
            break;

        case 'stun':
            if (!skill.chance || Math.random() < skill.chance) {
                enemy.stunned = true;
                enemy.stunnedTurns = skill.duration || 1;
                addLog(`對方被暈眩${skill.duration || 1}回合`, 'info');
            }
            break;

        case 'sleep':
            enemy.sleeping = true;
            enemy.wakeChance = skill.wakeChance || 0.5;
            addLog('對方進入睡眠狀態', 'info');
            break;

        case 'poison':
            enemy.poisonDamage = skill.damage;
            enemy.poisonTurns = skill.duration || 2;
            addLog(`對方中毒，每回合${skill.damage}傷害，持續${skill.duration || 2}回合`, 'damage');
            break;

        case 'poison_percent':
            if (enemy.battle) {
                enemy.poisonDamage = Math.floor(enemy.battle.maxHp * skill.value);
                enemy.poisonTurns = skill.duration || 3;
                addLog(`對方中毒，每回合${enemy.poisonDamage}傷害`, 'damage');
            }
            break;

        case 'permanent_poison':
            enemy.permanentPoisonDamage = skill.damage;
            addLog(`對方永久中毒，每回合${skill.damage}傷害`, 'damage');
            break;

        case 'burn':
            enemy.burnDamage = skill.damage || 20;
            enemy.burnTurns = skill.duration || 3;
            addLog(`對方燃燒，每回合${skill.damage || 20}傷害`, 'damage');
            break;

        case 'burn_multiplier':
            if (enemy.burnTurns && enemy.burnTurns > 0) {
                dealDamage(enemy, enemy.burnTurns * skill.multiplier, player);
            }
            break;

        case 'cleanse':
            card.poisonTurns = 0;
            card.burnTurns = 0;
            card.stunned = false;
            card.sleeping = false;
            playerState.disabledUntil = 0;
            addLog('解除所有負面效果', 'heal');
            break;

        case 'reduce_max_hp':
            if (enemy.battle && (!skill.chance || Math.random() < skill.chance)) {
                enemy.battle.maxHp -= skill.value;
                enemy.battle.hp = Math.min(enemy.battle.hp, enemy.battle.maxHp);
                addLog(`對方最大生命值減少${skill.value}`, 'damage');
            }
            break;

        // ========== 召喚/抽卡 ==========
        case 'draw':
            for (let i = 0; i < skill.value; i++) {
                playerState.hand.push(drawCard());
            }
            addLog(`抽${skill.value}張牌`, 'info');
            break;

        case 'summon':
            const sc = summonCharacterByName(skill.cardName);
            if (sc) {
                playerState.hand.push(sc);
                addLog(`召喚${skill.cardName}`, 'info');
            }
            break;

        case 'summon_chance':
            if (Math.random() < skill.chance) {
                const sc2 = summonCharacterByName(skill.cardName);
                if (sc2) {
                    playerState.hand.push(sc2);
                    addLog(`召喚${skill.cardName}`, 'info');
                }
            }
            break;

        case 'summon_multiple':
            for (let i = 0; i < skill.count; i++) {
                const sc3 = summonCharacterByName(skill.cardName);
                if (sc3) playerState.hand.push(sc3);
            }
            addLog(`召喚${skill.count}隻${skill.cardName}`, 'info');
            break;

        case 'summon_random_ball':
            const rb = summonRandomBall();
            if (rb) {
                playerState.hand.push(rb);
                addLog(`召喚球類角色${rb.name}`, 'info');
            }
            break;

        // ========== 特殊效果 ==========
        case 'execute':
            if (enemy.battle && enemy.battle.hp / enemy.battle.maxHp < skill.threshold) {
                enemy.battle.hp = 0;
                addLog('斬殺！', 'damage');
                setTimeout(() => handleCardDeath(enemy, player), 100);
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
            addLog(`蓄力+1(${card.chargeCount})`, 'info');
            break;

        case 'charge_attack':
            const chargeDmg = Math.floor(card.atk * (3 + 2 * (card.chargeCount || 0)));
            dealDamage(enemy, chargeDmg, player);
            card.chargeCount = 0;
            break;

        case 'combo_chance':
            card.comboBonus = (card.comboBonus || 0) + skill.value;
            addLog(`連擊機率+${skill.value}%`, 'info');
            break;

        case 'random_passive':
            const re = ['攻擊', '血量', '666', '隨便你'][Math.floor(Math.random() * 4)];
            if (re === '攻擊') {
                card.atk += 20;
                addLog('獲得：增加20攻擊力', 'info');
            } else if (re === '血量') {
                card.hp = Math.min(card.maxHp, card.hp + 50);
                addLog('獲得：增加50血量', 'heal');
            } else if (re === '666') {
                card.extraAttack = true;
                addLog('獲得：可連續攻擊1次', 'info');
            } else if (re === '隨便你') {
                const rc = summonCharacterByName('隨便你');
                if (rc) {
                    playerState.hand.push(rc);
                    addLog('獲得：召喚一隻隨便你', 'info');
                }
            }
            break;

        case 'copy_skill':
            if (enemy.battle && enemy.battle.skills && enemy.battle.skills.length > 0) {
                const cs = enemy.battle.skills[Math.floor(Math.random() * enemy.battle.skills.length)];
                addLog(`複製: ${cs.name}`, 'info');
                applySkillEffect(cs, playerState, player);
            }
            break;

        case 'conditional_damage':
            if (skill.condition === 'atk_higher' && enemy.battle && enemy.battle.atk > card.atk) {
                dealDamage(enemy, skill.value, player);
            }
            break;

        case 'none':
            addLog('此技能無效果', 'info');
            break;

        default:
            addLog(`技能效果 ${skill.effect} 尚未實裝`, 'info');
            console.warn('未實裝的技能:', skill);
    }

    updateUI();
}
