// 抽卡動畫系統
function animateCardDraw(player, callback) {
    const card = document.createElement('div');
    card.className = 'flying-card';

    // 設置起始位置 (螢幕中央)
    card.style.top = '50%';
    card.style.left = '50%';
    card.style.transform = 'translate(-50%, -50%) scale(0)';
    card.style.opacity = '0';

    document.body.appendChild(card);

    // 強制重繪
    card.offsetHeight;

    // 根據玩家決定目標位置
    if (player === 1) {
        card.style.top = '30px';
        card.style.left = '30px';
    } else {
        card.style.top = '30px';
        card.style.left = 'auto';
        card.style.right = '30px';
    }

    card.style.transform = `translate(0, 0) scale(1) rotate(${player === 1 ? -10 : 10}deg)`;
    card.style.opacity = '1';

    // 動畫結束後移除
    setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform += ' scale(0.5)';

        setTimeout(() => {
            if (card.parentNode) {
                document.body.removeChild(card);
            }
            if (callback) callback();
        }, 150);
    }, 350);
}

// 召喚與揭示動畫
function revealAndSummon(player, cardData, callback) {
    // 檢查是否已存在 overlay
    let overlay = document.querySelector('.reveal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'reveal-overlay';
        document.body.appendChild(overlay);
    }

    const rarityColor = (typeof getRarityColor === 'function') ? getRarityColor(cardData.rarity) : '#00ffff';

    overlay.innerHTML = `
        <div class="reveal-title">新角色召喚！</div>
        <div class="reveal-card-container">
            <div class="reveal-card" id="summonCard">
                <div class="card-face card-back">🎴</div>
                <div class="card-face card-front" style="border-color: ${rarityColor}">
                    <div style="font-size: 2rem; font-weight: 900; color: #fff; margin-bottom: 15px;">${cardData.name}</div>
                    <div style="background: ${rarityColor}; color: #fff; padding: 5px 15px; border-radius: 5px; font-weight: bold; margin-bottom: 20px; align-self: flex-start;">${cardData.rarity}</div>
                    <div style="font-size: 1.5rem; color: #aaa; margin-bottom: 10px;">HP: ${cardData.hp}</div>
                    <div style="font-size: 1.5rem; color: #aaa;">ATK: ${cardData.atk}</div>
                    <div style="margin-top: auto; color: var(--accent-cyan); font-weight: bold;">點擊收回備戰區</div>
                </div>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    const summonCard = document.getElementById('summonCard');

    // 點擊翻牌
    setTimeout(() => {
        summonCard.classList.add('flipped');

        // 再次點擊收回
        overlay.onclick = () => {
            overlay.classList.remove('active');
            animateCardDraw(player, callback);
            overlay.onclick = null; // 防止重複觸發
        };
    }, 500);
}

// 批量抽卡動畫 (用於開局)
function animateInitialDraw(callback) {
    let count = 0;

    function drawNext() {
        if (count < 5) {
            animateCardDraw(1, () => {
                count++;
                setTimeout(drawNext, 50);
            });
        } else if (count < 10) {
            animateCardDraw(2, () => {
                count++;
                setTimeout(drawNext, 50);
            });
        } else {
            if (callback) callback();
        }
    }

    drawNext();
}

window.animateCardDraw = animateCardDraw;
window.animateInitialDraw = animateInitialDraw;
window.revealAndSummon = revealAndSummon;

// 擲骰子動畫
function showDiceRoll(result, callback) {
    let overlay = document.querySelector('.dice-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'dice-overlay';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <h2 style="color:var(--accent-cyan); text-shadow:0 0 15px var(--accent-cyan); margin-bottom:20px;">擲骰判定中...</h2>
        <div class="dice-container">
            <div class="dice rolling" id="diceElement">
                <div class="dice-face face-1">1</div>
                <div class="dice-face face-2">2</div>
                <div class="dice-face face-3">3</div>
                <div class="dice-face face-4">4</div>
                <div class="dice-face face-5">5</div>
                <div class="dice-face face-6">6</div>
            </div>
        </div>
        <div class="dice-result-text" id="diceResultText"></div>
    `;

    overlay.classList.add('active');

    const dice = document.getElementById('diceElement');
    const resultText = document.getElementById('diceResultText');

    // 旋轉對應結果的角度
    const rotations = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: -90 },
        3: { x: 0, y: -180 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 }
    };

    setTimeout(() => {
        dice.classList.remove('rolling');
        const rot = rotations[result];
        // 增加額外圈數讓動畫更自然
        const extraX = Math.floor(Math.random() * 2 + 1) * 360;
        const extraY = Math.floor(Math.random() * 2 + 1) * 360;
        dice.style.transform = `rotateX(${rot.x + extraX}deg) rotateY(${rot.y + extraY}deg)`;

        setTimeout(() => {
            resultText.textContent = `結果: ${result} 點！`;
            if (result === 3 || result === 6) {
                resultText.style.color = '#2ecc71';
                resultText.style.textShadow = '0 0 20px #2ecc71';
            }

            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    if (callback) callback();
                }, 300);
            }, 800);
        }, 1200);
    }, 600);
}

window.showDiceRoll = showDiceRoll;

