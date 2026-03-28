/* =========================================================
   INDICATORS.JS — SVG индикаторы
   Зависит от: utils.js
========================================================= */

/* -------------------------
   Индикатор ветра (роза)
------------------------- */
function windIndicatorSvg(d){
    const color =
        d.windSpeed == null      ? "rgba(255,255,255,0.14)" :
        d.windSpeed <= 2         ? "#7ec8ff" :
        d.windSpeed <= 5         ? "#67d7a7" :
        d.windSpeed <= 9         ? "#ffd166" :
        d.windSpeed <= 14        ? "#ff9f5c" :
                                   "#ff6b6b";

    const dir = d.windDir != null ? d.windDir : 0;

    return `
    <div class="miniCard windMiniCard">
        <div class="small">Ветер</div>
        <div class="windMini">
            <svg viewBox="0 0 100 100" width="100" height="100" aria-label="Ветер">
                <!-- Деления -->
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
                <text x="50" y="9"  text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">С</text>
                <text x="91" y="52.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">В</text>
                <text x="50" y="96" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">Ю</text>
                <text x="9"  y="52.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">З</text>
                <!-- Цветное кольцо -->
                <circle cx="50" cy="50" r="31"
                        fill="none"
                        stroke="${color}"
                        stroke-opacity="0.75"
                        stroke-width="3"/>
                <!-- Стрелка направления -->
                <g transform="rotate(${dir} 50 50)">
                    <polygon points="50,16 45,26 55,26" fill="currentColor"/>
                </g>
                <!-- Скорость -->
                <text x="50" y="53" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">
                    ${d.windSpeed != null ? d.windSpeed : "-"}
                </text>
                <text x="50" y="64" text-anchor="middle" font-size="8.5" fill="currentColor" fill-opacity="0.72">м/с</text>
            </svg>
        </div>
        <div class="small">
            ${escapeHtml(degToText(d.windDir))}${d.windDir != null ? ` · ${d.windDir}°` : ""}
        </div>
    </div>`;
}

/* -------------------------
   Индикатор давления (полукруглый манометр)
------------------------- */
function pressureIndicatorSvg(d){
    const pVal     = d.seaPressure;
    const pMin     = 980, pMax = 1040;
    const pClamped = pVal != null ? Math.max(pMin, Math.min(pMax, pVal)) : null;
    const angle    = pClamped != null ? (pClamped - pMin) / (pMax - pMin) * 180 - 180 : -180;

    const valColor = pVal == null ? "currentColor"
        : pVal < 990  ? "#58aeff"
        : pVal < 1005 ? "#5fe08f"
        : pVal < 1020 ? "#ffd84d"
        : "#ff8f43";

    const trendPaths = {
        "0":"M4,13 L14,11 L24,9 L34,7 L44,5",
        "1":"M4,14 L14,12 L24,10 L34,7 L44,4",
        "2":"M4,13 L14,10 L24,7 L34,6 L44,6",
        "3":"M4,5 L14,7 L24,10 L34,12 L44,14",
        "4":"M4,7 L14,8 L24,8 L34,8 L44,8",
        "5":"M4,11 L14,10 L24,9 L34,9 L44,9",
        "6":"M4,5 L14,7 L24,11 L34,13 L44,14",
        "7":"M4,5 L14,6 L24,9 L34,12 L44,14",
        "8":"M4,7 L14,7 L24,7 L34,11 L44,14"
    };
    const trendPath = d.tendencyCode != null ? (trendPaths[String(d.tendencyCode)] || null) : null;
    const trendSign = d.tendencyValue != null
        ? (d.tendencyValue > 0 ? "+" : "") + d.tendencyValue.toFixed(1)
        : "—";

    const trendHtml = trendPath
        ? `<g transform="translate(31,87)"><path d="${trendPath}" fill="none" stroke="currentColor" stroke-opacity="0.80" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g><text x="60" y="99" text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.65">${trendSign} гПа/3ч</text>`
        : `<text x="60" y="97" text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.30">тенденция —</text>`;

    return `
    <div class="miniCard pressureMiniCard">
        <div class="small" style="text-align:center;margin-bottom:2px;">Давление</div>
        <svg viewBox="0 0 120 102" width="140" height="119" aria-label="Давление" style="display:block;margin:0 auto;overflow:visible;">
            <defs>
                <linearGradient id="pArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#58aeff"/>
                    <stop offset="30%"  stop-color="#5fe08f"/>
                    <stop offset="60%"  stop-color="#ffd84d"/>
                    <stop offset="100%" stop-color="#ff8f43"/>
                </linearGradient>
                <linearGradient id="pValGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${valColor}"/>
                    <stop offset="100%" stop-color="${valColor}" stop-opacity="0.6"/>
                </linearGradient>
            </defs>

            <!-- Фоновая дуга -->
            <path d="M 14 80 A 46 46 0 0 1 106 80"
                  fill="none" stroke="currentColor" stroke-opacity="0.10"
                  stroke-width="6" stroke-linecap="round"/>
            <!-- Цветная дуга -->
            <path d="M 14 80 A 46 46 0 0 1 106 80"
                  fill="none" stroke="url(#pArcGrad)"
                  stroke-width="5" stroke-linecap="round"/>

            <!-- Деления и подписи -->
            <line x1="16.0" y1="80.0" x2="24.0" y2="80.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="4.0" y="80.0" text-anchor="end" font-size="6" fill="currentColor" fill-opacity="0.70">980</text>
                <line x1="21.9" y1="58.0" x2="28.8" y2="62.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="11.5" y="52.0" text-anchor="end" font-size="6" fill="currentColor" fill-opacity="0.70">990</text>
                <line x1="38.0" y1="41.9" x2="42.0" y2="48.8" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="32.0" y="31.5" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.70">1000</text>
                <line x1="60.0" y1="36.0" x2="60.0" y2="44.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="60.0" y="24.0" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.70">1010</text>
                <line x1="82.0" y1="41.9" x2="78.0" y2="48.8" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="88.0" y="31.5" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.70">1020</text>
                <line x1="98.1" y1="58.0" x2="91.2" y2="62.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="108.5" y="52.0" text-anchor="start" font-size="6" fill="currentColor" fill-opacity="0.70">1030</text>
                <line x1="104.0" y1="80.0" x2="96.0" y2="80.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
                <text x="116.0" y="80.0" text-anchor="start" font-size="6" fill="currentColor" fill-opacity="0.70">1040</text>
                <line x1="17.5" y1="68.6" x2="22.3" y2="69.9" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>
                <line x1="28.9" y1="48.9" x2="32.4" y2="52.4" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>
                <line x1="48.6" y1="37.5" x2="49.9" y2="42.3" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>
                <line x1="71.4" y1="37.5" x2="70.1" y2="42.3" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>
                <line x1="91.1" y1="48.9" x2="87.6" y2="52.4" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>
                <line x1="102.5" y1="68.6" x2="97.7" y2="69.9" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>

            <!-- Стрелка -->
            <g transform="rotate(${angle} 60 80)">
                <line x1="60" y1="80" x2="60" y2="92" stroke="currentColor" stroke-opacity="0.30" stroke-width="2" stroke-linecap="round"/>
                <line x1="60" y1="80" x2="60" y2="40" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round"/>
                <polygon points="60,36 57,45 63,45" fill="currentColor" opacity="0.85"/>
            </g>
            <circle cx="60" cy="80" r="3.5" fill="currentColor" opacity="0.65"/>

            <!-- Значение -->
            <text x="60" y="70" text-anchor="middle" font-size="14" font-weight="800" fill="url(#pValGrad)">${pVal != null ? pVal : "-"}</text>
            <text x="60" y="79" text-anchor="middle" font-size="6.5" fill="currentColor" fill-opacity="0.50">гПа</text>

            <!-- Тенденция -->
            ${trendHtml}
        </svg>
    </div>`;
}


function humidityIndicatorSvg(humidity){
    const val     = humidity != null ? Math.round(humidity) : null;
    // Полная длина дуги M10,50 A50,50 0 0,1 110,50 ≈ 157
    const arcLen  = 157;
    const offset  = val != null ? arcLen * (1 - val / 100) : arcLen;

    const color =
        val == null   ? "#888" :
        val < 30      ? "#ffd166" :
        val < 60      ? "#5fe08f" :
        val < 80      ? "#72c3ff" :
                        "#58aeff";

    return `
    <svg viewBox="0 0 120 66" width="120" height="66" aria-label="Влажность">
        <defs>
            <linearGradient id="humGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stop-color="#ffd166"/>
                <stop offset="40%"  stop-color="#5fe08f"/>
                <stop offset="100%" stop-color="#58aeff"/>
            </linearGradient>
        </defs>
        <!-- Фон -->
        <path d="M10,55 A50,50 0 0,1 110,55"
              stroke="currentColor" stroke-opacity="0.12"
              stroke-width="8" fill="none" stroke-linecap="round"/>
        <!-- Активная дуга -->
        <path d="M10,55 A50,50 0 0,1 110,55"
              stroke="url(#humGrad)"
              stroke-width="8" fill="none"
              stroke-dasharray="${arcLen}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round"/>
        <!-- Значение -->
        <text x="60" y="50" text-anchor="middle"
              font-size="18" font-weight="800" fill="currentColor">
            ${val != null ? val : "-"}
        </text>
        <text x="60" y="62" text-anchor="middle"
              font-size="9" fill="currentColor" fill-opacity="0.7">%</text>
    </svg>
    <div class="small" style="text-align:center;margin-top:2px">Влажность</div>`;
}
