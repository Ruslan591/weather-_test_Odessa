/* =========================================================
   INDICATORS.JS — SVG индикаторы
   Зависит от: utils.js
========================================================= */

/* -------------------------
   Индикатор ветра (роза)
------------------------- */
function windIndicatorSvg(d){
    const color =
        d.windSpeed == null ? "rgba(255,255,255,0.14)" :
        d.windSpeed <= 2    ? "#7ec8ff" :
        d.windSpeed <= 5    ? "#67d7a7" :
        d.windSpeed <= 9    ? "#ffd166" :
        d.windSpeed <= 14   ? "#ff9f5c" :
                              "#ff6b6b";

    const dir = d.windDir != null ? d.windDir : 0;

    return `
    <div class="miniCard windMiniCard" style="min-width:120px;display:flex;flex-direction:column;align-items:center;">
        <div class="small" style="margin-bottom:4px;">Ветер</div>
        <svg viewBox="0 0 100 100" width="110" height="110" aria-label="Ветер">
            <!-- Деления по кругу -->
            <line x1="50" y1="12" x2="50" y2="18" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="72.6" y1="18.1" x2="69.6" y2="23.3" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="81.9" y1="27.4" x2="76.7" y2="30.4" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="88" y1="50" x2="82" y2="50" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="81.9" y1="72.6" x2="76.7" y2="69.6" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="72.6" y1="81.9" x2="69.6" y2="76.7" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="50" y1="88" x2="50" y2="82" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="27.4" y1="81.9" x2="30.4" y2="76.7" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="18.1" y1="72.6" x2="23.3" y2="69.6" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="12" y1="50" x2="18" y2="50" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="18.1" y1="27.4" x2="23.3" y2="30.4" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <line x1="27.4" y1="18.1" x2="30.4" y2="23.3" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6"/>
            <!-- Стороны света -->
            <text x="50" y="9"    text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">С</text>
            <text x="91" y="52.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">В</text>
            <text x="50" y="96"   text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">Ю</text>
            <text x="9"  y="52.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">З</text>
            <!-- Цветное кольцо -->
            <circle cx="50" cy="50" r="31" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="3"/>
            <!-- Стрелка (вращается вокруг центра) -->
            <g transform="rotate(${dir} 50 50)">
                <polygon points="50,16 45,26 55,26" fill="currentColor"/>
            </g>
            <!-- Скорость поверх всего -->
            <text x="50" y="53" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">
                ${d.windSpeed != null ? d.windSpeed : "-"}
            </text>
            <text x="50" y="64" text-anchor="middle" font-size="8.5" fill="currentColor" fill-opacity="0.72">м/с</text>
        </svg>
        <div class="small" style="margin-top:2px;text-align:center;">
            ${escapeHtml(degToText(d.windDir))}${d.windDir != null ? ` · ${d.windDir}°` : ""}
        </div>
    </div>`;
}

/* -------------------------
   Индикатор давления
------------------------- */
function pressureIndicatorSvg(d){
    const pVal     = d.seaPressure;
    const pMin     = 980, pMax = 1040;
    const pClamped = pVal != null ? Math.max(pMin, Math.min(pMax, pVal)) : null;
    // angle: 980 → -180° (лево), 1040 → 0° (право), относительно rotate вокруг cx,cy
    const angle = pClamped != null ? (pClamped - pMin) / (pMax - pMin) * 180 - 180 : -90;

    const valColor = pVal == null   ? "#aaa"
        : pVal < 990  ? "#58aeff"
        : pVal < 1005 ? "#5fe08f"
        : pVal < 1020 ? "#ffd84d"
        : "#ff8f43";

    const trendPaths = {
        "0":"M2,12 L12,10 L22,8 L32,6 L42,4",
        "1":"M2,13 L12,11 L22,9 L32,6 L42,3",
        "2":"M2,12 L12,9 L22,6 L32,5 L42,5",
        "3":"M2,4 L12,6 L22,9 L32,11 L42,13",
        "4":"M2,8 L12,8 L22,8 L32,8 L42,8",
        "5":"M2,10 L12,9 L22,8 L32,8 L42,8",
        "6":"M2,4 L12,6 L22,10 L32,12 L42,13",
        "7":"M2,4 L12,5 L22,8 L32,11 L42,13",
        "8":"M2,6 L12,6 L22,7 L32,10 L42,13"
    };
    const trendPath = d.tendencyCode != null ? (trendPaths[String(d.tendencyCode)] || null) : null;
    const trendSign = d.tendencyValue != null
        ? (d.tendencyValue > 0 ? "+" : "") + d.tendencyValue.toFixed(1)
        : null;

    const trendHtml = trendPath
        ? `<path d="${trendPath}" fill="none" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M2,8 L42,8" fill="none" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3,3"/>`;

    return `
    <div class="miniCard pressureMiniCard" style="min-width:150px;display:flex;flex-direction:column;align-items:center;">
        <div class="small" style="margin-bottom:4px;text-align:center;">Давление</div>
        <svg viewBox="0 0 130 115" width="150" height="133" aria-label="Давление" style="display:block;overflow:visible;">
            <defs>
                <linearGradient id="pArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#58aeff"/>
                    <stop offset="30%"  stop-color="#5fe08f"/>
                    <stop offset="60%"  stop-color="#ffd84d"/>
                    <stop offset="100%" stop-color="#ff8f43"/>
                </linearGradient>
                <linearGradient id="pValGrad${pVal}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${valColor}"/>
                    <stop offset="100%" stop-color="${valColor}" stop-opacity="0.55"/>
                </linearGradient>
            </defs>

            <!-- Фоновая дуга -->
            <path d="M 15 75 A 50 50 0 0 1 115 75"
                  fill="none" stroke="currentColor" stroke-opacity="0.10"
                  stroke-width="7" stroke-linecap="round"/>
            <!-- Цветная дуга -->
            <path d="M 15 75 A 50 50 0 0 1 115 75"
                  fill="none" stroke="url(#pArcGrad)"
                  stroke-width="6" stroke-linecap="round"/>

            <!-- Деления и подписи -->
            <line x1="15.0" y1="75.0" x2="24.0" y2="75.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="21.7" y1="50.0" x2="29.5" y2="54.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="40.0" y1="31.7" x2="44.5" y2="39.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="65.0" y1="25.0" x2="65.0" y2="34.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="90.0" y1="31.7" x2="85.5" y2="39.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="108.3" y1="50.0" x2="100.5" y2="54.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="115.0" y1="75.0" x2="106.0" y2="75.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16.7" y1="62.1" x2="21.5" y2="63.4" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="29.6" y1="39.6" x2="33.2" y2="43.2" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="52.1" y1="26.7" x2="53.4" y2="31.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="77.9" y1="26.7" x2="76.6" y2="31.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="100.4" y1="39.6" x2="96.8" y2="43.2" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="113.3" y1="62.1" x2="108.5" y2="63.4" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <text x="1.0" y="78.0" text-anchor="end" font-size="6.2" fill="currentColor" fill-opacity="0.68">980</text>
            <text x="9.6" y="43.0" text-anchor="end" font-size="6.2" fill="currentColor" fill-opacity="0.68">990</text>
            <text x="33.0" y="19.6" text-anchor="middle" font-size="6.2" fill="currentColor" fill-opacity="0.68">1000</text>
            <text x="65.0" y="11.0" text-anchor="middle" font-size="6.2" fill="currentColor" fill-opacity="0.68">1010</text>
            <text x="97.0" y="19.6" text-anchor="middle" font-size="6.2" fill="currentColor" fill-opacity="0.68">1020</text>
            <text x="120.4" y="43.0" text-anchor="start" font-size="6.2" fill="currentColor" fill-opacity="0.68">1030</text>
            <text x="129.0" y="78.0" text-anchor="start" font-size="6.2" fill="currentColor" fill-opacity="0.68">1040</text>

            <!-- Только треугольник-стрелка, вращается вокруг cx=65,cy=75 -->
            <g transform="rotate(${angle} 65 75)">
                <polygon points="65,26 61,38 69,38" fill="currentColor" opacity="0.90"/>
            </g>
            <!-- Центр -->
            <circle cx="65" cy="75" r="4" fill="#1e1e1e" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.5"/>

            <!-- Значение давления — НАД стрелкой (ниже центра дуги) -->
            <text x="65" y="94" text-anchor="middle"
                  font-size="15" font-weight="800" fill="url(#pValGrad${pVal})">
                ${pVal != null ? pVal : "-"}
            </text>
            <text x="65" y="103" text-anchor="middle"
                  font-size="7" fill="currentColor" fill-opacity="0.50">гПа</text>

            <!-- Тенденция: график + значение рядом -->
            <g transform="translate(22,107)">
                ${trendHtml}
            </g>
            <text x="70" y="113" text-anchor="start"
                  font-size="7" fill="currentColor" fill-opacity="0.60">
                ${trendSign != null ? trendSign + " гПа" : ""}
            </text>
        </svg>
    </div>`;
}

/* -------------------------
   Индикатор влажности
------------------------- */
function humidityIndicatorSvg(humidity){
    const val    = humidity != null ? Math.round(humidity) : null;
    const arcLen = 157;
    const offset = val != null ? arcLen * (1 - val / 100) : arcLen;

    return `
    <div class="miniCard" style="min-width:120px;display:flex;flex-direction:column;align-items:center;">
        <div class="small" style="margin-bottom:4px;">Влажность</div>
        <svg viewBox="0 0 120 70" width="130" height="76" aria-label="Влажность">
            <defs>
                <linearGradient id="humGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#ffd166"/>
                    <stop offset="40%"  stop-color="#5fe08f"/>
                    <stop offset="100%" stop-color="#58aeff"/>
                </linearGradient>
            </defs>
            <!-- Фон -->
            <path d="M10,58 A50,50 0 0,1 110,58"
                  stroke="currentColor" stroke-opacity="0.12"
                  stroke-width="8" fill="none" stroke-linecap="round"/>
            <!-- Активная дуга -->
            <path d="M10,58 A50,50 0 0,1 110,58"
                  stroke="url(#humGrad)"
                  stroke-width="8" fill="none"
                  stroke-dasharray="${arcLen}"
                  stroke-dashoffset="${offset}"
                  stroke-linecap="round"/>
            <!-- Значение -->
            <text x="60" y="52" text-anchor="middle"
                  font-size="19" font-weight="800" fill="currentColor">
                ${val != null ? val : "-"}
            </text>
            <text x="60" y="64" text-anchor="middle"
                  font-size="9" fill="currentColor" fill-opacity="0.65">%</text>
        </svg>
    </div>`;
}
