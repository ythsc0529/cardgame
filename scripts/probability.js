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

// 添加到全局作用域
window.showProbabilityRoll = showProbabilityRoll;
