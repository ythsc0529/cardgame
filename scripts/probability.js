// 機率判定動畫系統
function showProbabilityRoll(skillName, probability, callback) {
    // 創建機率滾動彈窗
    const modal = document.createElement('div');
    modal.className = 'probability-modal active';
    modal.innerHTML = `
        <div class="probability-content">
            <h3>${skillName}</h3>
            <div class="probability-text">判定中...</div>
            <div class="probability-bar">
                <div class="probability-fill" id="probFill"></div>
                <div class="probability-marker" id="probMarker" style="left: ${probability * 100}%">
                    <div class="marker-line"></div>
                    <div class="marker-text">${Math.round(probability * 100)}%</div>
                </div>
            </div>
            <div class="probability-result" id="probResult"></div>
        </div>
    `;

    document.body.appendChild(modal);

    // 滾動動畫
    const fill = document.getElementById('probFill');
    let currentPercent = 0;
    let direction = 1;
    let speed = 20;
    let iterations = 0;
    const maxIterations = 6; // 滾動6次 (3個來回)

    const rollInterval = setInterval(() => {
        currentPercent += speed * direction;

        if (currentPercent >= 100) {
            currentPercent = 100;
            direction = -1;
            iterations++;
        } else if (currentPercent <= 0) {
            currentPercent = 0;
            direction = 1;
            iterations++;
        }

        fill.style.width = currentPercent + '%';

        // 滾動足夠次數後停止
        if (iterations >= maxIterations) {
            clearInterval(rollInterval);

            // 最終判定
            const finalRoll = Math.random();
            const success = finalRoll < probability;

            // 移動到最終位置
            currentPercent = finalRoll * 100;
            fill.style.width = currentPercent + '%';

            // 顯示結果
            setTimeout(() => {
                const resultDiv = document.getElementById('probResult');
                if (success) {
                    resultDiv.innerHTML = '<span style="color:#00ff00;font-size:2rem;font-weight:900;">✓ 成功！</span>';
                    fill.style.background = 'linear-gradient(90deg, #00ff00, #00ff88)';
                } else {
                    resultDiv.innerHTML = '<span style="color:#ff6666;font-size:2rem;font-weight:900;">✗ 失敗</span>';
                    fill.style.background = 'linear-gradient(90deg, #ff6666, #ff9999)';
                }

                // 短暫延遲後關閉並執行回調
                setTimeout(() => {
                    document.body.removeChild(modal);
                    callback(success);
                }, 800);
            }, 300);
        }
    }, 25);
}

// 數值滾動動畫 (用於愛因斯坦等隨機數值)
function showValueRoll(skillName, min, max, finalValue, callback) {
    const modal = document.createElement('div');
    modal.className = 'value-roll-modal';
    modal.innerHTML = `
        <div class="value-label">${skillName}</div>
        <div class="value-display" id="valueNum">0</div>
        <div style="color:#666; margin-top:20px;">RANDOMIZING...</div>
    `;
    document.body.appendChild(modal);

    // 強制重繪
    modal.offsetHeight;
    modal.classList.add('active');

    const numDisplay = document.getElementById('valueNum');
    let startTime = Date.now();
    const duration = 1500; // 1.5秒

    const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            // 隨機跳動
            numDisplay.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
            requestAnimationFrame(animate);
        } else {
            // 顯示最終結果
            numDisplay.textContent = finalValue;
            numDisplay.style.color = '#00ff00';
            numDisplay.style.textShadow = '0 0 30px #00ff00';

            setTimeout(() => {
                modal.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    if (callback) callback();
                }, 300);
            }, 1000);
        }
    };

    requestAnimationFrame(animate);
}

// 選項滾動動畫 (用於隨機被動/效果選擇)
function showOptionRoll(skillName, options, finalIndex, callback) {
    const modal = document.createElement('div');
    modal.className = 'value-roll-modal'; // 共用背景

    // 建立重複的選項列表來模擬循環滾動
    const extendedOptions = [...options, ...options, ...options, ...options, ...options];
    const itemHeight = 100;

    modal.innerHTML = `
        <div class="value-label">${skillName}</div>
        <div class="option-scroll-container">
            <div class="option-list" id="optionList">
                ${extendedOptions.map(opt => `<div class="option-item">${opt}</div>`).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.offsetHeight;
    modal.classList.add('active');

    const list = document.getElementById('optionList');
    const totalItems = extendedOptions.length;
    // 目標位置：第三組的最終索引
    const targetIndex = options.length * 2 + finalIndex;
    const targetOffset = -(targetIndex * itemHeight);

    // 設定初始位置
    list.style.transform = `translateY(0px)`;

    // 開始滾動動畫
    setTimeout(() => {
        list.style.transition = 'transform 2s cubic-bezier(0.1, 0, 0.1, 1)';
        list.style.transform = `translateY(${targetOffset}px)`;

        setTimeout(() => {
            const items = list.querySelectorAll('.option-item');
            items[targetIndex].classList.add('selected');

            setTimeout(() => {
                modal.classList.remove('active');
                setTimeout(() => {
                    document.body.removeChild(modal);
                    if (callback) callback();
                }, 300);
            }, 1200);
        }, 2200);
    }, 100);
}

window.showProbabilityRoll = showProbabilityRoll;
window.showValueRoll = showValueRoll;
window.showOptionRoll = showOptionRoll;
