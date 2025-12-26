// 抽卡系統 - Gacha System

// 根據稀有度概率抽取一張卡
function drawCard(excludeNames = []) {
    const availableChars = CHARACTERS.filter(char => !excludeNames.includes(char.name));

    // 計算總概率
    const totalProb = {
        "神話": 0.05,
        "傳說": 0.12,
        "史詩": 0.18,
        "稀有": 0.25,
        "一般": 0.40
    };

    // 按稀有度分組
    const rarityGroups = {
        "神話": [],
        "傳說": [],
        "史詩": [],
        "稀有": [],
        "一般": []
    };

    availableChars.forEach(char => {
        if (rarityGroups[char.rarity]) {
            rarityGroups[char.rarity].push(char);
        }
    });

    // 先確定稀有度
    const rand = Math.random();
    let cumulative = 0;
    let selectedRarity = null;

    for (const [rarity, prob] of Object.entries(totalProb)) {
        cumulative += prob;
        if (rand < cumulative) {
            selectedRarity = rarity;
            break;
        }
    }

    // 從該稀有度中隨機選一張
    const group = rarityGroups[selectedRarity];
    if (!group || group.length === 0) {
        // 如果該稀有度沒有卡，降級
        return drawCard(excludeNames);
    }

    const randomIndex = Math.floor(Math.random() * group.length);
    const selectedChar = group[randomIndex];

    // 返回卡牌的副本，避免修改原始數據
    return createCardCopy(selectedChar);
}

// 創建卡牌副本
function createCardCopy(character) {
    const copy = JSON.parse(JSON.stringify(character));

    // 重置冷卻
    if (copy.skills) {
        copy.skills.forEach(skill => {
            skill.currentCd = 0;
        });
    }

    // 為某些特殊角色初始化計數器
    if (copy.name === "廚師") copy.foodCount = 0;
    if (copy.name === "羅伯特") copy.chargeCount = 0;
    if (copy.name === "冰淇淋" && copy.passive) copy.passive.deathCount = 0;
    if (copy.name === "鳳梨" && copy.skills[0]) copy.skills[0].currentChance = 25;

    // 為隨機屬性角色設置初始值
    if (copy.name === "骰子怪獸") {
        copy.hp = Math.floor(Math.random() * 800) + 1;
        copy.maxHp = copy.hp;
        copy.atk = Math.floor(Math.random() * 70) + 1;
    }

    if (copy.name === "???") {
        copy.hp = Math.floor(Math.random() * 500) + 100;
        copy.maxHp = copy.hp;
        copy.atk = Math.floor(Math.random() * 100) + 1;
    }

    if (copy.name === "暗夜騎士") {
        copy.atk = Math.floor(Math.random() * 75) + 1;
    }

    if (copy.name === "機率型選手") {
        copy.atk = Math.floor(Math.random() * 21) + 10;
    }

    // 生成唯一ID
    copy.uniqueId = `${copy.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return copy;
}

// 抽取初始手牌(5張)
function drawInitialHand() {
    const hand = [];
    for (let i = 0; i < 5; i++) {
        hand.push(drawCard());
    }
    return hand;
}

// 投擲硬幣決定先手
function flipCoin() {
    return Math.random() < 0.5 ? 1 : 2;
}

// 從牌池召喚特定角色
function summonCharacterByName(name) {
    const character = CHARACTERS.find(char => char.name === name);
    if (character) {
        return createCardCopy(character);
    }
    return null;
}

// 召喚隨機球類(一般稀有度)
function summonRandomBall() {
    const balls = ["足球", "籃球", "排球", "撞球", "羽球", "高爾夫球"];
    const availableBalls = CHARACTERS.filter(char =>
        balls.includes(char.name) && char.rarity === "一般"
    );

    if (Math.random() < 0.5) {
        // 50%機率召喚失敗
        return null;
    }

    if (availableBalls.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableBalls.length);
        return createCardCopy(availableBalls[randomIndex]);
    }
    return null;
}

// 抽取神話角色(用於籃球技能)
function drawMythicCard() {
    const mythics = CHARACTERS.filter(char => char.rarity === "神話");
    if (mythics.length > 0) {
        const randomIndex = Math.floor(Math.random() * mythics.length);
        return createCardCopy(mythics[randomIndex]);
    }
    return null;
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        drawCard,
        createCardCopy,
        drawInitialHand,
        flipCoin,
        summonCharacterByName,
        summonRandomBall,
        drawMythicCard
    };
}
