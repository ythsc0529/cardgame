// 角色數據庫
const RARITIES = {
    COMMON: { name: "一般", probability: 0.40, color: "#808080" },
    RARE: { name: "稀有", probability: 0.25, color: "#00b0f0" },
    EPIC: { name: "史詩", probability: 0.18, color: "#9900ff" },
    LEGENDARY: { name: "傳說", probability: 0.12, color: "#ffc000" },
    MYTHIC: { name: "神話", probability: 0.05, color: "#ff0000" }
};

const CHARACTERS = [
    // 神話 (5%)
    {
        id: 1, rarity: "神話", name: "魔眼", hp: 300, maxHp: 300, atk: 50,
        skills: [
            { name: "封禁對方技能1回合", cooldown: 3, currentCd: 0, effect: "disable_skill" },
            { name: "對敵方造成敵方最大血量30%傷害", cooldown: 5, currentCd: 0, effect: "percent_damage", value: 0.3 },
            { name: "對己身加上可抵擋1次任意傷害", cooldown: 3, currentCd: 0, effect: "shield", value: 1 }
        ],
        passive: { name: "死亡抽一張", effect: "draw_on_death", value: 1 }
    },
    {
        id: 2, rarity: "神話", name: "夏天與你", hp: 500, maxHp: 500, atk: 35,
        skills: [
            { name: "對方不能發動技能2回合", cooldown: 4, currentCd: 0, effect: "disable_skill", duration: 2 },
            { name: "下回合攻擊力×3", cooldown: 3, currentCd: 0, effect: "atk_boost", multiplier: 3 },
            { name: "恢復最大生命值10%", cooldown: 4, currentCd: 0, effect: "heal_percent", value: 0.1 }
        ],
        passive: { name: "死亡之後抽三張牌", effect: "draw_on_death", value: 3 }
    },
    {
        id: 3, rarity: "神話", name: "超級坦克", hp: 700, maxHp: 700, atk: 5,
        skills: [
            { name: "增加50血量", cooldown: 3, currentCd: 0, effect: "heal", value: 50 }
        ],
        passive: null
    },
    {
        id: 4, rarity: "神話", name: "法特", hp: 500, maxHp: 500, atk: 60,
        skills: [
            { name: "提米,我肚子餓了，炸個屁傷害100", cooldown: 8, currentCd: 0, effect: "damage", value: 100 }
        ],
        passive: null
    },
    {
        id: 5, rarity: "神話", name: "小吉", hp: 500, maxHp: 500, atk: 5,
        skills: [
            { name: "攻擊力+10", cooldown: 1, currentCd: 0, effect: "permanent_atk", value: 10 },
            { name: "血量恢復已損失生命值20%", cooldown: 5, currentCd: 0, effect: "heal_lost", value: 0.2 },
            { name: "連續攻擊機率上升5%", cooldown: 2, currentCd: 0, effect: "combo_chance", value: 5 }
        ],
        passive: { name: "有(60+連續攻擊上升機率)%的機率再攻擊一次(上限99%)", effect: "combo_attack", baseChance: 60 }
    },
    {
        id: 6, rarity: "神話", name: "莉安娜", hp: 400, maxHp: 400, atk: 70,
        skills: [
            { name: "將艾倫加入手牌", cooldown: 99, currentCd: 0, effect: "summon", cardName: "艾倫" },
            { name: "下次攻擊×3.5", cooldown: 2, currentCd: 0, effect: "next_atk_boost", multiplier: 3.5 },
            { name: "恢復最大生命值60%", cooldown: 7, currentCd: 0, effect: "heal_percent", value: 0.6 }
        ],
        passive: { name: "每回合血量上限+50", effect: "max_hp_increase", value: 50 }
    },
    {
        id: 7, rarity: "神話", name: "艾倫", hp: 500, maxHp: 500, atk: 50,
        skills: [
            { name: "造成(攻擊力×4)點傷害", cooldown: 4, currentCd: 0, effect: "atk_multiplier", multiplier: 4 },
            { name: "恢復15%最大生命值", cooldown: 3, currentCd: 0, effect: "heal_percent", value: 0.15 },
            { name: "下次受到的傷害以150%的傷害反彈回去", cooldown: 3, currentCd: 0, effect: "reflect", multiplier: 1.5 }
        ],
        passive: { name: "如果莉安娜不在手牌中，血量-100；如果莉安娜被殺死過，攻擊+80", effect: "liliana_bond" }
    },
    {
        id: 8, rarity: "神話", name: "琉璃", hp: 500, maxHp: 500, atk: 50,
        skills: [
            { name: "下次受到的(傷害×60%)轉換成攻擊力", cooldown: 3, currentCd: 0, effect: "damage_to_atk", value: 0.6 },
            { name: "恢復下次攻擊造成的150%血量", cooldown: 3, currentCd: 0, effect: "lifesteal", value: 1.5 },
            { name: "如果對方血量低於30%，直接斬殺", cooldown: 0, currentCd: 0, effect: "execute", threshold: 0.3 }
        ],
        passive: { name: "如果對手是艾倫，血量-400，攻擊力-40", effect: "allen_curse" }
    },
    {
        id: 9, rarity: "神話", name: "超凡", hp: 1200, maxHp: 1200, atk: 5,
        skills: [
            { name: "增加50點血量上限", cooldown: 3, currentCd: 0, effect: "increase_max_hp", value: 50 },
            { name: "增加5攻擊", cooldown: 1, currentCd: 0, effect: "permanent_atk", value: 5 },
            { name: "獲得40點護盾", cooldown: 1, currentCd: 0, effect: "shield", value: 40 }
        ],
        passive: { name: "每回合扣除50點生命值上限，增加10攻(上限扣除800點生命值)", effect: "hp_to_atk", hpLoss: 50, atkGain: 10, maxLoss: 800 }
    },
    {
        id: 10, rarity: "神話", name: "追根", hp: 800, maxHp: 800, atk: 70,
        skills: [
            { name: "火-使對方炙燒每回合扣20血效果不可疊加", cooldown: 4, currentCd: 0, effect: "burn", damage: 20 }
        ],
        passive: null
    },

    // 傳說 (12%)
    {
        id: 11, rarity: "傳說", name: "伊魯帕恩", hp: 400, maxHp: 400, atk: 5,
        skills: [
            { name: "三回合內受到的傷害減少25%", cooldown: 5, currentCd: 0, effect: "damage_reduction", value: 0.25, duration: 3 },
            { name: "對對手造成我已損失生命值×80%的傷害", cooldown: 99, currentCd: 0, effect: "lost_hp_damage", multiplier: 0.8 }
        ],
        passive: { name: "死亡時 對對手造成30點傷害", effect: "death_damage", value: 30 }
    },
    {
        id: 12, rarity: "傳說", name: "鯊魚鞋子", hp: 200, maxHp: 200, atk: 40,
        skills: [
            { name: "造成2×回合數的傷害", cooldown: 4, currentCd: 0, effect: "turn_damage", multiplier: 2 },
            { name: "造成兩段普攻傷害", cooldown: 4, currentCd: 0, effect: "double_atk" }
        ],
        passive: null
    },
    {
        id: 13, rarity: "傳說", name: "扛壩子", hp: 300, maxHp: 300, atk: 50,
        skills: [
            { name: "恢復已損失生命值50%", cooldown: 5, currentCd: 0, effect: "heal_lost", value: 0.5 },
            { name: "下次攻擊攻擊力增加50%", cooldown: 5, currentCd: 0, effect: "next_atk_boost", multiplier: 1.5 },
            { name: "對對手造成(回合)傷害", cooldown: 3, currentCd: 0, effect: "turn_damage", multiplier: 1 }
        ],
        passive: null
    },
    {
        id: 14, rarity: "傳說", name: "結膜炎", hp: 250, maxHp: 250, atk: 50,
        skills: [
            { name: "傳染結膜炎造成20傷害持續兩回合", cooldown: 3, currentCd: 0, effect: "poison", damage: 20, duration: 2 }
        ],
        passive: null
    },
    {
        id: 15, rarity: "傳說", name: "致命", hp: 120, maxHp: 120, atk: 60,
        skills: [
            { name: "造成100傷害己身損血20", cooldown: 3, currentCd: 0, effect: "damage_and_self", damage: 100, selfDamage: 20 }
        ],
        passive: null
    },
    {
        id: 16, rarity: "傳說", name: "花店老闆", hp: 300, maxHp: 300, atk: 20,
        skills: [
            { name: "丟花-每回合加30護盾持續三回合", cooldown: 5, currentCd: 0, effect: "shield_per_turn", value: 30, duration: 3 },
            { name: "劍弗-砍一下50傷害", cooldown: 2, currentCd: 0, effect: "damage", value: 50 },
            { name: "弗花-下次敵方攻擊40%機率免傷並加30護盾", cooldown: 5, currentCd: 0, effect: "dodge_shield", chance: 0.4, shield: 30 }
        ],
        passive: null
    },
    {
        id: 17, rarity: "傳說", name: "黑爾", hp: 500, maxHp: 500, atk: 1,
        skills: [
            { name: "血量恢復最大生命值的4%", cooldown: 3, currentCd: 0, effect: "heal_percent", value: 0.04 },
            { name: "有99%迴避下一次攻擊", cooldown: 2, currentCd: 0, effect: "dodge", chance: 0.99 },
            { name: "造成(回合數×1.1)點攻擊", cooldown: 3, currentCd: 0, effect: "turn_damage", multiplier: 1.1 }
        ],
        passive: null
    },
    {
        id: 18, rarity: "傳說", name: "英國紳士", hp: 20, maxHp: 20, atk: 10,
        skills: [
            { name: "下次受到的傷害量減少90%", cooldown: 1, currentCd: 0, effect: "damage_reduction_next", value: 0.9 },
            { name: "恢復下次受到的傷害值110%", cooldown: 3, currentCd: 0, effect: "heal_next_damage", value: 1.1 },
            { name: "下次受到傷害值轉化為下次攻擊附帶的額外攻擊力，並且增加(下次受到的傷害×50%)的最大生命值", cooldown: 4, currentCd: 0, effect: "damage_conversion" }
        ],
        passive: null
    },
    {
        id: 19, rarity: "傳說", name: "橘子", hp: 150, maxHp: 150, atk: 50,
        skills: [
            { name: "增加30血，5攻", cooldown: 1, currentCd: 0, effect: "heal_and_atk", heal: 30, atk: 5 },
            { name: "蛋白粉：增加10攻", cooldown: 5, currentCd: 0, effect: "permanent_atk", value: 10 },
            { name: "肌貼：恢復20%最大生命值", cooldown: 8, currentCd: 0, effect: "heal_percent", value: 0.2 }
        ],
        passive: null
    },
    {
        id: 20, rarity: "傳說", name: "鳳凰", hp: 100, maxHp: 100, atk: 150,
        skills: [
            { name: "下次攻擊時，獲得(造成傷害×1.5)點護盾", cooldown: 1, currentCd: 0, effect: "shield_on_hit", multiplier: 1.5 },
            { name: "造成300~500%的傷害", cooldown: 3, currentCd: 0, effect: "random_percent_damage", min: 3, max: 5 },
            { name: "增加100攻擊", cooldown: 99, currentCd: 0, effect: "permanent_atk", value: 100 }
        ],
        passive: { name: "死亡後，有100%的機率復活一次(只能一次)", effect: "revive", chance: 1, used: false }
    },
    {
        id: 21, rarity: "傳說", name: "羅伯特", hp: 400, maxHp: 400, atk: 30,
        skills: [
            { name: "咆哮：造成(攻擊力×(3+2×蓄力次數))點傷害", cooldown: 3, currentCd: 0, effect: "charge_attack" },
            { name: "蓄力：蓄力次數+1", cooldown: 0, currentCd: 0, effect: "charge_up" },
            { name: "格擋：接下來兩回合受到的傷害減少80%", cooldown: 3, currentCd: 0, effect: "damage_reduction", value: 0.8, duration: 2 }
        ],
        passive: null,
        chargeCount: 0
    },

    // 史詩 (18%)
    {
        id: 22, rarity: "史詩", name: "火車", hp: 220, maxHp: 220, atk: 10,
        skills: [
            { name: "使敵方血量損失敵方普攻傷害×2", cooldown: 2, currentCd: 0, effect: "enemy_atk_damage", multiplier: 2 },
            { name: "擲骰子擲出3、6則可對敵方發動目前血量一半傷害", cooldown: 5, currentCd: 0, effect: "dice_damage" },
            { name: "增加50點的護盾", cooldown: 3, currentCd: 0, effect: "shield", value: 50 }
        ],
        passive: null
    },
    {
        id: 23, rarity: "史詩", name: "迪斯查", hp: 1, maxHp: 1, atk: 60,
        skills: [
            { name: "免疫一次傷害", cooldown: 10, currentCd: 0, effect: "immune_once" }
        ],
        passive: null
    },
    {
        id: 24, rarity: "史詩", name: "愛因斯坦", hp: 314, maxHp: 314, atk: 30,
        skills: [
            { name: "質能等價-可對敵方造成對方普攻傷害", cooldown: 3, currentCd: 0, effect: "enemy_atk_damage", multiplier: 1 },
            { name: "布朗運動-隨機造成1-100傷害", cooldown: 3, currentCd: 0, effect: "random_damage", min: 1, max: 100 }
        ],
        passive: null
    },
    {
        id: 25, rarity: "史詩", name: "抽卡員", hp: 180, maxHp: 180, atk: 20,
        skills: [
            { name: "抽兩張牌", cooldown: 99, currentCd: 0, effect: "draw", value: 2 },
            { name: "抽兩張牌", cooldown: 2, currentCd: 0, effect: "draw", value: 2 },
            { name: "抽兩張牌", cooldown: 2, currentCd: 0, effect: "draw", value: 2 }
        ],
        passive: null
    },
    {
        id: 26, rarity: "史詩", name: "瘋狗騎士", hp: 500, maxHp: 500, atk: 5,
        skills: [
            { name: "恢復4%最大生命值", cooldown: 1, currentCd: 0, effect: "heal_percent", value: 0.04 },
            { name: "造成最大生命值×80%點傷害", cooldown: 12, currentCd: 0, effect: "max_hp_damage", value: 0.8 }
        ],
        passive: { name: "每受到一次攻擊，增加10點最大生命值", effect: "max_hp_on_hit", value: 10 }
    },
    {
        id: 27, rarity: "史詩", name: "冰淇淋", hp: 150, maxHp: 150, atk: 1,
        skills: [
            { name: "下次受到的傷害，反彈200%給對手", cooldown: 5, currentCd: 0, effect: "reflect", multiplier: 2 },
            { name: "將生命值扣為1，扣除的生命值對對手造成(扣除值×60%)點傷害", cooldown: 99, currentCd: 0, effect: "sacrifice_damage", multiplier: 0.6 }
        ],
        passive: { name: "死亡之後有(50-死亡次數)的機會復活", effect: "revive_decreasing", baseChance: 50, deathCount: 0 }
    },
    {
        id: 28, rarity: "史詩", name: "史詩", hp: 300, maxHp: 300, atk: 40,
        skills: [
            { name: "史詩-可獲得隨機能力（詳見被動）", cooldown: 2, currentCd: 0, effect: "random_passive" }
        ],
        passive: { name: "攻擊：增加20攻擊力 血量：增加50血量 666：可連續攻擊1次 隨便你：召喚一隻隨便你", effect: "epic_passive" }
    },
    {
        id: 29, rarity: "史詩", name: "聖女", hp: 150, maxHp: 150, atk: 40,
        skills: [
            { name: "解除自身所有效果", cooldown: 1, currentCd: 0, effect: "cleanse" },
            { name: "如果對手攻擊力高於自身，造成100點傷害", cooldown: 5, currentCd: 0, effect: "conditional_damage", condition: "atk_higher", value: 100 },
            { name: "獲得150點護盾", cooldown: 10, currentCd: 0, effect: "shield", value: 150 }
        ],
        passive: null
    },
    {
        id: 30, rarity: "史詩", name: "不洗澡勇士", hp: 250, maxHp: 250, atk: 50,
        skills: [
            { name: "使對手中毒，造成對手最大生命值8%但傷害，持續三回合", cooldown: 5, currentCd: 0, effect: "poison_percent", value: 0.08, duration: 3 },
            { name: "換衣服：加血量50", cooldown: 3, currentCd: 0, effect: "heal", value: 50 }
        ],
        passive: null
    },
    {
        id: 31, rarity: "史詩", name: "鳳梨", hp: 450, maxHp: 450, atk: 20,
        skills: [
            { name: "有25%機率造成60傷害，每次使用完機率加10", cooldown: 2, currentCd: 0, effect: "chance_damage", baseChance: 25, damage: 60, chanceIncrease: 10, currentChance: 25 }
        ],
        passive: null
    },
    {
        id: 32, rarity: "史詩", name: "皇家騎士", hp: 250, maxHp: 250, atk: 40,
        skills: [
            { name: "召喚一隻騎士", cooldown: 5, currentCd: 0, effect: "summon", cardName: "騎士" },
            { name: "造成60傷害", cooldown: 5, currentCd: 0, effect: "damage", value: 60 }
        ],
        passive: null
    },
    {
        id: 33, rarity: "史詩", name: "阿福", hp: 200, maxHp: 200, atk: 20,
        skills: [
            { name: "將扁佛狹加入手牌", cooldown: 99, currentCd: 0, effect: "summon", cardName: "扁佛狹" },
            { name: "造成80點傷害", cooldown: 3, currentCd: 0, effect: "damage", value: 80 },
            { name: "獲得100護盾", cooldown: 5, currentCd: 0, effect: "shield", value: 100 }
        ],
        passive: null
    },
    {
        id: 34, rarity: "史詩", name: "扁佛狹", hp: 250, maxHp: 250, atk: 40,
        skills: [
            { name: "有99%概率減少對手下次對我造成的傷害的90%", cooldown: 2, currentCd: 0, effect: "reduce_next_damage", chance: 0.99, value: 0.9 },
            { name: "造成90點傷害", cooldown: 2, currentCd: 0, effect: "damage", value: 90 }
        ],
        passive: null
    },

    // 稀有 (25%)
    {
        id: 35, rarity: "稀有", name: "卡德", hp: 50, maxHp: 50, atk: 10,
        skills: [
            { name: "抽三張牌", cooldown: 5, currentCd: 0, effect: "draw", value: 3 }
        ],
        passive: null
    },
    {
        id: 36, rarity: "稀有", name: "赫特", hp: 200, maxHp: 200, atk: 15,
        skills: [
            { name: "造成50傷害", cooldown: 3, currentCd: 0, effect: "damage", value: 50 },
            { name: "增加100護盾", cooldown: 4, currentCd: 0, effect: "shield", value: 100 }
        ],
        passive: null
    },
    {
        id: 37, rarity: "稀有", name: "仙人掌象", hp: 200, maxHp: 200, atk: 20,
        skills: [
            { name: "lilili larerla-造成40傷害", cooldown: 2, currentCd: 0, effect: "damage", value: 40 },
            { name: "仙人掌-下回合敵方傷害反彈一半回去", cooldown: 3, currentCd: 0, effect: "reflect_next", multiplier: 0.5 }
        ],
        passive: null
    },
    {
        id: 38, rarity: "稀有", name: "隨便你", hp: 400, maxHp: 400, atk: 5,
        skills: [
            { name: "隨便你-增加150護盾", cooldown: 3, currentCd: 0, effect: "shield", value: 150 }
        ],
        passive: null
    },
    {
        id: 39, rarity: "稀有", name: "護理師", hp: 200, maxHp: 200, atk: 30,
        skills: [
            { name: "恢復50點生命值", cooldown: 4, currentCd: 0, effect: "heal", value: 50 },
            { name: "砍一刀，造成1點傷害", cooldown: 1, currentCd: 0, effect: "damage", value: 1 }
        ],
        passive: null
    },
    {
        id: 40, rarity: "稀有", name: "暗夜騎士", hp: 150, maxHp: 150, atk: 37, // 1-75隨機
        skills: [
            { name: "有50%增加2倍傷害", cooldown: 2, currentCd: 0, effect: "chance_boost", chance: 0.5, multiplier: 2 },
            { name: "增加10-100護盾", cooldown: 4, currentCd: 0, effect: "random_shield", min: 10, max: 100 },
            { name: "25%機率使對方損血一半", cooldown: 3, currentCd: 0, effect: "chance_half_damage", chance: 0.25 }
        ],
        passive: { name: "每次攻擊都是1-75隨機", effect: "random_atk", min: 1, max: 75 }
    },
    {
        id: 41, rarity: "稀有", name: "廚師", hp: 150, maxHp: 150, atk: 25,
        skills: [
            { name: "造成(食物×攻擊力)點傷害", cooldown: 3, currentCd: 0, effect: "food_damage" },
            { name: "煮一個食物", cooldown: 1, currentCd: 0, effect: "cook_food" }
        ],
        passive: null,
        foodCount: 0
    },
    {
        id: 42, rarity: "稀有", name: "下半身", hp: 150, maxHp: 150, atk: 25,
        skills: [
            { name: "攻擊50", cooldown: 2, currentCd: 0, effect: "damage", value: 50 },
            { name: "50%攻擊75", cooldown: 3, currentCd: 0, effect: "chance_damage", chance: 0.5, damage: 75 }
        ],
        passive: null
    },
    {
        id: 43, rarity: "稀有", name: "城之內", hp: 30, maxHp: 30, atk: 20,
        skills: [
            { name: "造成30點傷害", cooldown: 1, currentCd: 0, effect: "damage", value: 30 }
        ],
        passive: null
    },
    {
        id: 44, rarity: "稀有", name: "摳屎不累", hp: 200, maxHp: 200, atk: 1,
        skills: [
            { name: "複製對手一個技能", cooldown: 2, currentCd: 0, effect: "copy_skill" }
        ],
        passive: null
    },
    {
        id: 45, rarity: "稀有", name: "狗", hp: 1, maxHp: 1, atk: 100,
        skills: [],
        passive: null
    },
    {
        id: 46, rarity: "稀有", name: "貓", hp: 50, maxHp: 50, atk: 1,
        skills: [
            { name: "造成(血量)×1.1點傷害", cooldown: 3, currentCd: 0, effect: "hp_damage", multiplier: 1.1 }
        ],
        passive: null
    },
    {
        id: 47, rarity: "稀有", name: "體育生", hp: 200, maxHp: 200, atk: 10,
        skills: [
            { name: "召喚隨機一顆一般稀有度的球或者召喚失敗", cooldown: 1, currentCd: 0, effect: "summon_random_ball" }
        ],
        passive: null
    },
    {
        id: 48, rarity: "稀有", name: "球", hp: 180, maxHp: 180, atk: 20,
        skills: [
            { name: "有90%機率造成30點傷害，10%機率造成10點傷害", cooldown: 1, currentCd: 0, effect: "chance_damage_dual", highChance: 0.9, highDamage: 30, lowDamage: 10 }
        ],
        passive: null
    },
    {
        id: 49, rarity: "稀有", name: "蝦子", hp: 200, maxHp: 200, atk: 20,
        skills: [
            { name: "有30~60%的機率造成20~100點傷害", cooldown: 0, currentCd: 0, effect: "random_chance_damage" }
        ],
        passive: null
    },
    {
        id: 50, rarity: "稀有", name: "骰子怪獸", hp: 400, maxHp: 400, atk: 35,
        skills: [
            { name: "50%機率攻擊50", cooldown: 3, currentCd: 0, effect: "chance_damage", chance: 0.5, damage: 50 },
            { name: "增加自身(-10)~50血量", cooldown: 3, currentCd: 0, effect: "random_heal", min: -10, max: 50 }
        ],
        passive: { name: "血量1-800隨機，攻擊1-70隨機", effect: "random_stats" }
    },
    {
        id: 51, rarity: "稀有", name: "吸血鬼", hp: 150, maxHp: 150, atk: 30,
        skills: [
            { name: "增加(對手生命值×80%)點生命值", cooldown: 2, currentCd: 0, effect: "steal_hp", value: 0.8 },
            { name: "有5%的機率抽到莉安娜", cooldown: 0, currentCd: 0, effect: "summon_chance", cardName: "莉安娜", chance: 0.05 }
        ],
        passive: null
    },
    {
        id: 52, rarity: "稀有", name: "騎士", hp: 180, maxHp: 180, atk: 30,
        skills: [
            { name: "造成40點傷害", cooldown: 1, currentCd: 0, effect: "damage", value: 40 },
            { name: "抽一張牌", cooldown: 99, currentCd: 0, effect: "draw", value: 1 }
        ],
        passive: null
    },
    {
        id: 53, rarity: "稀有", name: "魔導士", hp: 120, maxHp: 120, atk: 40,
        skills: [
            { name: "燃燒對手，造成30點傷害，持續三回合", cooldown: 5, currentCd: 0, effect: "burn", damage: 30, duration: 3 },
            { name: "造成(燃燒剩餘回合×30)點傷害", cooldown: 10, currentCd: 0, effect: "burn_multiplier", multiplier: 30 }
        ],
        passive: null
    },
    {
        id: 54, rarity: "稀有", name: "橡皮擦", hp: 200, maxHp: 200, atk: 20,
        skills: [
            { name: "禁用對方技能兩回合", cooldown: 4, currentCd: 0, effect: "disable_skill", duration: 2 },
            { name: "造成(剩餘血量×30%)點傷害", cooldown: 3, currentCd: 0, effect: "hp_percent_damage", value: 0.3 }
        ],
        passive: null
    },
    {
        id: 55, rarity: "稀有", name: "輪胎", hp: 100, maxHp: 100, atk: 3,
        skills: [
            { name: "將對方角色攻擊力與血量交換，且暈眩一回合", cooldown: 99, currentCd: 0, effect: "swap_and_stun" }
        ],
        passive: null
    },
    {
        id: 56, rarity: "稀有", name: "臭臭", hp: 80, maxHp: 80, atk: 30,
        skills: [
            { name: "對方攻擊力-80%，持續兩回合", cooldown: 4, currentCd: 0, effect: "atk_debuff", value: 0.8, duration: 2 }
        ],
        passive: null
    },
    {
        id: 57, rarity: "稀有", name: "燒杯", hp: 30, maxHp: 30, atk: 50,
        skills: [
            { name: "下次受到的傷害轉化為增加最大血量", cooldown: 2, currentCd: 0, effect: "damage_to_max_hp" }
        ],
        passive: null
    },

    // 一般 (40%)
    {
        id: 58, rarity: "一般", name: "戰士", hp: 100, maxHp: 100, atk: 20,
        skills: [
            { name: "砍一刀30", cooldown: 2, currentCd: 0, effect: "damage", value: 30 }
        ],
        passive: null
    },
    {
        id: 59, rarity: "一般", name: "小混混", hp: 150, maxHp: 150, atk: 25,
        skills: [
            { name: "加10護盾", cooldown: 2, currentCd: 0, effect: "shield", value: 10 }
        ],
        passive: null
    },
    {
        id: 60, rarity: "一般", name: "小圓盾", hp: 250, maxHp: 250, atk: 5,
        skills: [
            { name: "減少下回合受到的傷害5", cooldown: 2, currentCd: 0, effect: "reduce_next_damage_flat", value: 5 }
        ],
        passive: null
    },
    {
        id: 61, rarity: "一般", name: "玻璃心", hp: 50, maxHp: 50, atk: 1,
        skills: [
            { name: "發出50攻擊 並對自己造成50傷害", cooldown: 1, currentCd: 0, effect: "damage_and_self", damage: 50, selfDamage: 50 }
        ],
        passive: null
    },
    {
        id: 62, rarity: "一般", name: "醫生", hp: 80, maxHp: 80, atk: 10,
        skills: [
            { name: "恢復10點生命值", cooldown: 3, currentCd: 0, effect: "heal", value: 10 }
        ],
        passive: null
    },
    {
        id: 63, rarity: "一般", name: "安拉奇", hp: 10, maxHp: 10, atk: 10,
        skills: [
            { name: "無意義", cooldown: 0, currentCd: 0, effect: "none" }
        ],
        passive: null
    },
    {
        id: 64, rarity: "一般", name: "僕從", hp: 50, maxHp: 50, atk: 10,
        skills: [
            { name: "沒啥用", cooldown: 0, currentCd: 0, effect: "none" }
        ],
        passive: null
    },
    {
        id: 65, rarity: "一般", name: "瑞賭斯", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "減少對手攻擊20，持續兩回合", cooldown: 5, currentCd: 0, effect: "atk_debuff_flat", value: 20, duration: 2 }
        ],
        passive: null
    },
    {
        id: 66, rarity: "一般", name: "團", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "丟刀子對敵方造成30傷害", cooldown: 2, currentCd: 0, effect: "damage", value: 30 }
        ],
        passive: null
    },
    {
        id: 67, rarity: "一般", name: "蘇賽德", hp: 30, maxHp: 30, atk: 1,
        skills: [
            { name: "造成30攻擊並使自己死亡", cooldown: 2, currentCd: 0, effect: "sacrifice", damage: 30 }
        ],
        passive: null
    },
    {
        id: 68, rarity: "一般", name: "抽卡員", hp: 100, maxHp: 100, atk: 5,
        skills: [
            { name: "抽一張牌", cooldown: 3, currentCd: 0, effect: "draw", value: 1 }
        ],
        passive: null
    },
    {
        id: 69, rarity: "一般", name: "砲灰", hp: 100, maxHp: 100, atk: 20,
        skills: [
            { name: "沒有技能", cooldown: 0, currentCd: 0, effect: "none" }
        ],
        passive: null
    },
    {
        id: 70, rarity: "一般", name: "法師", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "使對方中毒，傷害10，持續兩回合", cooldown: 4, currentCd: 0, effect: "poison", damage: 10, duration: 2 }
        ],
        passive: null
    },
    {
        id: 71, rarity: "一般", name: "多舉", hp: 1, maxHp: 1, atk: 5,
        skills: [
            { name: "有99%閃避下一次對手的攻擊", cooldown: 1, currentCd: 0, effect: "dodge", chance: 0.99 }
        ],
        passive: null
    },
    {
        id: 72, rarity: "一般", name: "修修", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "造成(回合數×當前血量×10%)的傷害", cooldown: 3, currentCd: 0, effect: "turn_hp_damage", multiplier: 0.1 }
        ],
        passive: null
    },
    {
        id: 73, rarity: "一般", name: "上半身", hp: 75, maxHp: 75, atk: 25,
        skills: [
            { name: "將下半身加入手牌", cooldown: 99, currentCd: 0, effect: "summon", cardName: "下半身" }
        ],
        passive: null
    },
    {
        id: 74, rarity: "一般", name: "左手", hp: 10, maxHp: 10, atk: 20,
        skills: [
            { name: "造成40點傷害", cooldown: 5, currentCd: 0, effect: "damage", value: 40 }
        ],
        passive: null
    },
    {
        id: 75, rarity: "一般", name: "右手", hp: 20, maxHp: 20, atk: 10,
        skills: [
            { name: "造成45點傷害", cooldown: 5, currentCd: 0, effect: "damage", value: 45 }
        ],
        passive: null
    },
    {
        id: 76, rarity: "一般", name: "機率型選手", hp: 100, maxHp: 100, atk: 20,
        skills: [],
        passive: { name: "攻擊力10~30隨機", effect: "random_atk", min: 10, max: 30 }
    },
    {
        id: 77, rarity: "一般", name: "排球", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "加10血量", cooldown: 2, currentCd: 0, effect: "heal", value: 10 }
        ],
        passive: null
    },
    {
        id: 78, rarity: "一般", name: "厭世", hp: 50, maxHp: 50, atk: 50,
        skills: [],
        passive: { name: "攻擊時會對自己造成一樣的傷害", effect: "self_damage_on_attack" }
    },
    {
        id: 79, rarity: "一般", name: "猛寵", hp: 100, maxHp: 100, atk: 20,
        skills: [],
        passive: null
    },
    {
        id: 80, rarity: "一般", name: "暴怒戰士", hp: 80, maxHp: 80, atk: 25,
        skills: [
            { name: "憤怒：攻擊力增加30", cooldown: 2, currentCd: 0, effect: "permanent_atk", value: 30 }
        ],
        passive: null
    },
    {
        id: 81, rarity: "一般", name: "山海", hp: 6, maxHp: 6, atk: 6,
        skills: [
            { name: "有10%機率造成50點傷害", cooldown: 1, currentCd: 0, effect: "chance_damage", chance: 0.1, damage: 50 }
        ],
        passive: null
    },
    {
        id: 82, rarity: "一般", name: "撞球", hp: 40, maxHp: 40, atk: 20,
        skills: [
            { name: "以70%機率暈眩對手兩回合", cooldown: 4, currentCd: 0, effect: "stun", chance: 0.7, duration: 2 }
        ],
        passive: null
    },
    {
        id: 83, rarity: "一般", name: "羽球", hp: 200, maxHp: 200, atk: 10,
        skills: [
            { name: "90%造成10傷害，5%造成50傷，5%造成0傷害", cooldown: 0, currentCd: 0, effect: "triple_chance_damage" }
        ],
        passive: null
    },
    {
        id: 84, rarity: "一般", name: "高爾夫球", hp: 150, maxHp: 150, atk: 30,
        skills: [],
        passive: null
    },
    {
        id: 85, rarity: "一般", name: "足球", hp: 30, maxHp: 30, atk: 5,
        skills: [
            { name: "踢足球-對敵方造成永久持續直到死亡，每回合持續傷害5，不可累加", cooldown: 3, currentCd: 0, effect: "permanent_poison", damage: 5 }
        ],
        passive: null
    },
    {
        id: 86, rarity: "一般", name: "神益州", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "使敵人睡眠，但可有50%機率恢復狀態", cooldown: 3, currentCd: 0, effect: "sleep", wakeChance: 0.5 }
        ],
        passive: null
    },
    {
        id: 87, rarity: "一般", name: "泉的", hp: 10, maxHp: 10, atk: 10,
        skills: [],
        passive: null
    },
    {
        id: 88, rarity: "一般", name: "不是泉的", hp: 20, maxHp: 20, atk: 1,
        skills: [
            { name: "將泉的加入手牌", cooldown: 99, currentCd: 0, effect: "summon", cardName: "泉的" }
        ],
        passive: null
    },
    {
        id: 89, rarity: "一般", name: "我很軟", hp: 50, maxHp: 50, atk: 50,
        skills: [
            { name: "變軟：攻擊+30", cooldown: 3, currentCd: 0, effect: "permanent_atk", value: 30 }
        ],
        passive: null
    },
    {
        id: 90, rarity: "一般", name: "我很硬", hp: 150, maxHp: 150, atk: 10,
        skills: [
            { name: "變硬：血量+30", cooldown: 3, currentCd: 0, effect: "increase_max_hp", value: 30 }
        ],
        passive: null
    },
    {
        id: 91, rarity: "一般", name: "戰爭女神", hp: 101, maxHp: 101, atk: 20,
        skills: [
            { name: "暈眩對手一回合", cooldown: 1, currentCd: 0, effect: "stun", duration: 1 }
        ],
        passive: null
    },
    {
        id: 92, rarity: "一般", name: "球球", hp: 10, maxHp: 10, atk: 1,
        skills: [
            { name: "有70%的機率扣除對手30點生命值上限", cooldown: 0, currentCd: 0, effect: "reduce_max_hp", chance: 0.7, value: 30 }
        ],
        passive: { name: "有90%迴避任何傷害", effect: "dodge_passive", chance: 0.9 }
    },
    {
        id: 93, rarity: "一般", name: "???", hp: 300, maxHp: 300, atk: 50,
        skills: [
            { name: "造成攻擊力×3點傷害", cooldown: 0, currentCd: 0, effect: "atk_multiplier", multiplier: 3 }
        ],
        passive: { name: "有50%機率會行動成功", effect: "action_chance", chance: 0.5 }
    },
    {
        id: 94, rarity: "一般", name: "大吉", hp: 150, maxHp: 150, atk: 1,
        skills: [
            { name: "有5%機率將小吉加入手牌", cooldown: 0, currentCd: 0, effect: "summon_chance", cardName: "小吉", chance: 0.05 }
        ],
        passive: null
    },
    {
        id: 95, rarity: "一般", name: "沒錢", hp: 1, maxHp: 1, atk: 1,
        skills: [
            { name: "如果對方血量高於我，禁用對方技能4回合", cooldown: 99, currentCd: 0, effect: "conditional_disable", condition: "hp_higher", duration: 4 }
        ],
        passive: null
    },
    {
        id: 96, rarity: "一般", name: "音符蘭姆", hp: 40, maxHp: 40, atk: 10,
        skills: [
            { name: "哈哈皮炎，造成0點傷害", cooldown: 0, currentCd: 0, effect: "damage", value: 0 }
        ],
        passive: null
    },
    {
        id: 97, rarity: "一般", name: "阿基里斯腱人", hp: 100, maxHp: 100, atk: 10,
        skills: [
            { name: "暈眩對方一回合", cooldown: 1, currentCd: 0, effect: "stun", duration: 1 }
        ],
        passive: null
    },
    {
        id: 98, rarity: "一般", name: "無意義", hp: 99, maxHp: 99, atk: 1,
        skills: [],
        passive: null
    },
    {
        id: 99, rarity: "一般", name: "是真的", hp: 50, maxHp: 50, atk: 20,
        skills: [
            { name: "下次受到的傷害-50%", cooldown: 2, currentCd: 0, effect: "damage_reduction_next", value: 0.5 }
        ],
        passive: null
    },
    {
        id: 100, rarity: "一般", name: "不是真的", hp: 20, maxHp: 20, atk: 50,
        skills: [
            { name: "下次攻擊增加50%", cooldown: 2, currentCd: 0, effect: "next_atk_boost", multiplier: 1.5 }
        ],
        passive: null
    },
    {
        id: 101, rarity: "一般", name: "嘻嘻", hp: 5, maxHp: 5, atk: 15,
        skills: [
            { name: "減少5點攻擊力，血量增加200", cooldown: 2, currentCd: 0, effect: "atk_to_hp", atkLoss: 5, hpGain: 200 },
            { name: "減少4點生命，增加30點攻擊", cooldown: 5, currentCd: 0, effect: "hp_to_atk_skill", hpLoss: 4, atkGain: 30 }
        ],
        passive: null
    },
    {
        id: 102, rarity: "一般", name: "不嘻嘻", hp: 5, maxHp: 5, atk: 15,
        skills: [
            { name: "召喚3隻嘻嘻到手牌中", cooldown: 5, currentCd: 0, effect: "summon_multiple", cardName: "嘻嘻", count: 3 },
            { name: "自殺並造成35攻擊", cooldown: 2, currentCd: 0, effect: "sacrifice", damage: 35 }
        ],
        passive: null
    }
];

// 創建稀有度池
function createRarityPool() {
    const pool = [];
    CHARACTERS.forEach(char => {
        const rarity = RARITIES[Object.keys(RARITIES).find(key =>
            RARITIES[key].name === char.rarity
        )];
        if (rarity) {
            char.rarityData = rarity;
        }
    });
    return CHARACTERS;
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CHARACTERS, RARITIES, createRarityPool };
}
