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
    const pVal   = d.seaPressure;
    const pMin   = 980, pMax = 1040;
    const angle  = pVal != null
        ? (Math.max(pMin, Math.min(pMax, pVal)) - pMin) / (pMax - pMin) * 180 - 90
        : 0;

    const trendSvg = d.tendencyCode == null
        ? `<line x1="6" y1="9" x2="58" y2="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.8" stroke-linecap="round"/>`
        : ({
            "0":`<polyline points="6,13 19,12 32,10 45,8 58,5" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "1":`<polyline points="6,14 18,13 30,11 42,7 58,4" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "2":`<polyline points="6,13 20,10 34,6 46,6 58,6" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "3":`<polyline points="6,5 18,8 30,11 42,13 58,14" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "4":`<polyline points="6,5 18,7 30,8 42,8 58,8" fill="none" stroke="currentColor" stroke-opacity="0.72" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "5":`<polyline points="6,11 18,10 30,9 42,9 58,9" fill="none" stroke="currentColor" stroke-opacity="0.72" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "6":`<polyline points="6,4 18,7 30,11 42,13 58,14" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "7":`<polyline points="6,4 18,5 30,8 42,12 58,14" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
            "8":`<polyline points="6,6 18,6 30,6 42,10 58,14" fill="none" stroke="currentColor" stroke-opacity="0.85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
        }[String(d.tendencyCode)] || `<line x1="6" y1="9" x2="58" y2="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.8" stroke-linecap="round"/>`);

    return `
    <div class="miniCard pressureMiniCard">
        <div class="small">Давление</div>
        <div class="pressureMini">
            <svg viewBox="0 0 100 100" width="100" height="100" aria-label="Давление">
                <defs>
                    <linearGradient id="pressureArcGrad" x1="18" y1="68" x2="82" y2="68" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stop-color="#58aeff"/>
                        <stop offset="20%"  stop-color="#72c3ff"/>
                        <stop offset="38%"  stop-color="#5fe08f"/>
                        <stop offset="55%"  stop-color="#b8ea63"/>
                        <stop offset="72%"  stop-color="#ffd84d"/>
                        <stop offset="88%"  stop-color="#ffb347"/>
                        <stop offset="100%" stop-color="#ff8f43"/>
                    </linearGradient>
                </defs>
                <!-- Фоновая дуга -->
                <path d="M 20 68 A 30 30 0 0 1 80 68"
                      fill="none" stroke="currentColor" stroke-opacity="0.10"
                      stroke-width="5" stroke-linecap="round"/>
                <!-- Цветная дуга -->
                <path d="M 20 68 A 30 30 0 0 1 80 68"
                      fill="none" stroke="url(#pressureArcGrad)"
                      stroke-width="4.5" stroke-linecap="round"/>
                <!-- Основные деления -->
                <g stroke="currentColor" stroke-linecap="round">
                    <line x1="20"  y1="68"   x2="25.5" y2="68"   stroke-opacity="0.50" stroke-width="1.9"/>
                    <line x1="24"  y1="53"   x2="29"   y2="55"   stroke-opacity="0.28" stroke-width="1.3"/>
                    <line x1="35"  y1="42"   x2="38.8" y2="46.1" stroke-opacity="0.42" stroke-width="1.8"/>
                    <line x1="50"  y1="38"   x2="50"   y2="43.8" stroke-opacity="0.55" stroke-width="2"/>
                    <line x1="65"  y1="42"   x2="61.2" y2="46.1" stroke-opacity="0.42" stroke-width="1.8"/>
                    <line x1="76"  y1="53"   x2="71"   y2="55"   stroke-opacity="0.28" stroke-width="1.3"/>
                    <line x1="80"  y1="68"   x2="74.5" y2="68"   stroke-opacity="0.50" stroke-width="1.9"/>
                </g>
                <!-- Промежуточные деления -->
                <g stroke="currentColor" stroke-opacity="0.20" stroke-width="1.1" stroke-linecap="round">
                    <line x1="21.1" y1="60.2" x2="25.3" y2="61.3"/>
                    <line x1="28.8" y1="47.0" x2="32.3" y2="49.6"/>
                    <line x1="42.2" y1="39.2" x2="44.2" y2="43.0"/>
                    <line x1="57.8" y1="39.2" x2="55.8" y2="43.0"/>
                    <line x1="71.2" y1="47.0" x2="67.7" y2="49.6"/>
                    <line x1="78.9" y1="60.2" x2="74.7" y2="61.3"/>
                </g>
                <!-- Подписи -->
                <text x="18" y="77" text-anchor="middle" font-size="6.5" fill="currentColor" fill-opacity="0.74">980</text>
                <text x="35" y="36.5" text-anchor="middle" font-size="6.3" fill="currentColor" fill-opacity="0.82"
                      transform="rotate(-28 35 36.5)">1000</text>
                <text x="65" y="36.5" text-anchor="middle" font-size="6.3" fill="currentColor" fill-opacity="0.82"
                      transform="rotate(28 65 36.5)">1020</text>
                <text x="82" y="77" text-anchor="middle" font-size="6.5" fill="currentColor" fill-opacity="0.74">1040</text>
                <!-- Стрелка -->
                <g transform="rotate(${angle} 50 68)">
                    <polygon points="50,36 46,44 54,44" fill="currentColor"/>
                </g>
                <!-- Значение -->
                <text x="50" y="77.5" text-anchor="middle" font-size="13.2" font-weight="800" fill="currentColor">
                    ${pVal != null ? pVal : "-"}
                </text>
                <text x="50" y="87.3" text-anchor="middle" font-size="7.1" fill="currentColor" fill-opacity="0.72">гПа</text>
            </svg>
        </div>
        <div class="pressureTrendRow">
            <svg viewBox="0 0 64 18" width="64" height="18" aria-label="Тенденция давления">
                ${trendSvg}
            </svg>
            <div class="pressureTrendValue">
                ${d.tendencyValue != null ? d.tendencyValue.toFixed(1) : "—"}
            </div>
        </div>
    </div>`;
}

/* -------------------------
   Индикатор влажности (полукруглый)
------------------------- */
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
