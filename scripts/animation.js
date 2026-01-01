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
        card.style.top = '90%'; // 飛向玩家手牌區大致位置
        card.style.left = '20%';
    } else {
        card.style.top = '10%'; // 飛向對手手牌區
        card.style.left = '80%';
    }

    card.style.transform = `translate(0, 0) scale(0.5) rotate(${player === 1 ? -10 : 10}deg)`;
    card.style.opacity = '1';

    // 動畫結束後移除
    setTimeout(() => {
        card.style.opacity = '0';

        setTimeout(() => {
            if (card.parentNode) {
                document.body.removeChild(card);
            }
            if (callback) callback();
        }, 150);
    }, 400); // 飛行時間
}

// 召喚與揭示動畫 (含 Gacha 特效)
function revealAndSummon(player, cardData, callback) {
    // 1. 播放 Gacha 特效 (閃光/震動)
    const flash = document.createElement('div');
    flash.className = 'gacha-flash';
    document.body.appendChild(flash);

    setTimeout(() => {
        flash.classList.add('active');
        setTimeout(() => document.body.removeChild(flash), 500);
    }, 10);

    // 2. 顯示卡牌
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
                <div class="card-face card-front" style="border-color: ${rarityColor}; box-shadow: 0 0 30px ${rarityColor};">
                    <div style="font-size: 2rem; font-weight: 900; color: #fff; margin-bottom: 15px; text-shadow: 0 0 5px black;">${cardData.name}</div>
                    <div style="background: ${rarityColor}; color: #fff; padding: 5px 15px; border-radius: 5px; font-weight: bold; margin-bottom: 20px; align-self: flex-start; text-shadow: 0 0 2px black;">${cardData.rarity}</div>
                    <div style="font-size: 1.5rem; color: #ddd; margin-bottom: 10px;">HP: ${cardData.hp}</div>
                    <div style="font-size: 1.5rem; color: #ddd;">ATK: ${cardData.atk}</div>
                    <div style="margin-top: auto; color: var(--accent-cyan); font-weight: bold;">點擊以確認</div>
                </div>
            </div>
        </div>
        <div class="reveal-hint">點擊卡牌翻開</div>
    `;

    overlay.classList.add('active');
    const summonCard = document.getElementById('summonCard');
    const hint = document.querySelector('.reveal-hint');

    // 點擊翻牌
    let isFlipped = false;
    summonCard.onclick = () => {
        if (!isFlipped) {
            summonCard.classList.add('flipped');
            isFlipped = true;
            hint.innerText = "點擊任意處收入手牌";

            // 允許關閉
            overlay.onclick = () => {
                // 播放收回動畫
                summonCard.style.transform = 'scale(0) rotate(360deg)';
                summonCard.style.opacity = '0';
                setTimeout(() => {
                    overlay.classList.remove('active');
                    overlay.onclick = null;
                    // 飛入動畫
                    animateCardDraw(player, callback);
                }, 300);
            };
        }
    };
}

// 互動式初始抽卡 (卡包點擊)
function animateInitialDraw(callback) {
    if (document.querySelector('.gacha-pack-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'gacha-pack-overlay';

    overlay.innerHTML = `
        <div class="gacha-pack-container">
            <h2>點擊卡包進行抽卡！</h2>
            <div class="card-pack" id="cardPack">
                <div class="pack-label">STARTER PACK</div>
            </div>
            <div class="pack-particles"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    const pack = document.getElementById('cardPack');

    pack.addEventListener('click', () => {
        if (pack.classList.contains('opening')) return;
        pack.classList.add('opening');

        // 震動特效
        // 這裡僅做簡單模擬，CSS需配合
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
                // 開始連續發牌
                startDealingCards(callback);
            }, 500);
        }, 800);
    });
}

function startDealingCards(callback) {
    let count = 0;
    function drawNext() {
        if (count < 5) {
            animateCardDraw(1, () => {
                count++;
                setTimeout(drawNext, 150); // 加快發牌速度
            });
        } else if (count < 10) {
            animateCardDraw(2, () => {
                count++;
                setTimeout(drawNext, 150);
            });
        } else {
            setTimeout(() => {
                if (callback) callback();
            }, 500);
        }
    }
    drawNext();
}

// 擲硬幣動畫 (改良版)
function animateCoinToss(resultPlayer, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'coin-toss-overlay';
    overlay.innerHTML = `
        <div class="coin-container-3d">
            <div class="coin-3d" id="gameCoin">
                <div class="coin-face-3d heads">P1</div>
                <div class="coin-face-3d tails">P2</div>
            </div>
        </div>
        <div class="coin-text">決定先攻...</div>
    `;
    document.body.appendChild(overlay);

    // 強制重繪
    overlay.offsetHeight;

    const coin = document.getElementById('gameCoin');
    const container = document.querySelector('.coin-container-3d');

    // 1. 拋起動畫 (Container Y軸移動)
    container.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-300px) scale(1.5)', offset: 0.5 }, // 拋到最高點
        { transform: 'translateY(0) scale(1)' }
    ], {
        duration: 2000,
        easing: 'ease-in-out',
        fill: 'forwards'
    });

    // 2. 旋轉動畫 (Coin X/Y軸旋轉)
    const totalRotation = 1440 + (resultPlayer === 1 ? 0 : 180); // 4圈 + 結果

    coin.animate([
        { transform: 'rotateX(0deg) rotateY(0deg)' },
        { transform: `rotateX(${totalRotation}deg) rotateY(720deg)` } // 多軸旋轉更真實
    ], {
        duration: 2000,
        easing: 'cubic-bezier(0.1, 0, 0.2, 1)', // 快 -> 慢
        fill: 'forwards'
    });

    setTimeout(() => {
        const text = document.querySelector('.coin-text');
        text.innerText = `玩家 ${resultPlayer} 先攻！`;
        text.style.color = '#00ff00';
        text.style.transform = 'scale(1.2)';

        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(overlay);
                if (callback) callback();
            }, 500);
        }, 1500);
    }, 2000);
}

// 骰子動畫 (維持原樣，微調樣式)
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
                    if (overlay.parentNode) document.body.removeChild(overlay);
                    if (callback) callback();
                }, 300);
            }, 800);
        }, 1200);
    }, 600);
}

// 選項滾動動畫 (Slot Machine) - 修正置中與高亮
function showOptionRoll(skillName, options, finalIndex, callback) {
    const modal = document.createElement('div');
    modal.className = 'value-roll-modal';

    // 構造列表
    const itemHeight = 60; // 配合 CSS
    const repeatCount = 5;
    let htmlContent = '';

    for (let i = 0; i < repeatCount; i++) {
        options.forEach((opt, idx) => {
            htmlContent += `<div class="option-item" data-idx="${idx}">${opt}</div>`;
        });
    }

    modal.innerHTML = `
        <div class="slot-machine-container">
            <div class="value-label">${skillName}</div>
            <div class="slot-window">
                <div class="slot-highlight-bar"></div>
                <div class="slot-list" id="optionList">
                    ${htmlContent}
                </div>
            </div>
            <div class="slot-status">SPINNING...</div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.offsetHeight;
    modal.classList.add('active');

    const list = document.getElementById('optionList');

    const targetSetIndex = 3; // 第4組
    const totalItemIndex = targetSetIndex * options.length + finalIndex;
    const windowHeight = 180;
    // 目標位置計算：讓目標項目中心對齊視窗中心
    const targetOffset = -(totalItemIndex * itemHeight) + (windowHeight / 2 - itemHeight / 2);

    // 初始隨機偏移增加動感
    list.style.transform = `translateY(0)`;

    setTimeout(() => {
        list.style.transition = 'transform 3s cubic-bezier(0.1, 0, 0.1, 1)';
        list.style.transform = `translateY(${targetOffset}px)`;

        setTimeout(() => {
            // 高亮
            const items = list.querySelectorAll('.option-item');
            const targetItem = items[totalItemIndex];
            if (targetItem) {
                targetItem.classList.add('selected');
                targetItem.style.color = '#fff';
                targetItem.style.textShadow = '0 0 10px #ff00ff';
            }

            modal.querySelector('.slot-status').innerText = options[finalIndex].toUpperCase() + "!";
            modal.querySelector('.slot-status').style.color = '#00ff00';

            setTimeout(() => {
                modal.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    if (callback) callback();
                }, 300);
            }, 1500);
        }, 3000);
    }, 100);
}

window.animateCardDraw = animateCardDraw;
window.animateInitialDraw = animateInitialDraw;
window.revealAndSummon = revealAndSummon;
window.animateCoinToss = animateCoinToss;
window.showDiceRoll = showDiceRoll;
window.showOptionRoll = showOptionRoll;
