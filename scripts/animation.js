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
