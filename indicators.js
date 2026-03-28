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
    <div style="display:flex;flex-direction:column;align-items:center;padding:0 8px;">
        <div class="small" style="margin-bottom:4px;">Ветер</div>
        <svg viewBox="0 0 100 100" width="110" height="110" aria-label="Ветер">
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
            <text x="50" y="9"    text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">С</text>
            <text x="91" y="52.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">В</text>
            <text x="50" y="96"   text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">Ю</text>
            <text x="9"  y="52.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.8">З</text>
            <circle cx="50" cy="50" r="31" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="3"/>
            <g transform="rotate(${dir} 50 50)">
                <polygon points="50,16 45,26 55,26" fill="currentColor"/>
            </g>
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

    // Треугольник нарисован вертикально вверх.
    // 980 = левый конец дуги → rotate(-90)
    // 1010 = верх дуги → rotate(0)
    // 1040 = правый конец → rotate(+90)
    // Формула: (p - 1010) / 30 * 90
    const angle = pClamped != null ? (pClamped - 1010) / 30 * 90 : 0;

    const valColor = pVal == null   ? "#aaa"
        : pVal < 990  ? "#58aeff"
        : pVal < 1005 ? "#5fe08f"
        : pVal < 1020 ? "#ffd84d"
        : "#ff8f43";

    const trendPaths = {
        "0":"M0,10 L10,8 L20,6 L30,4 L40,2",
        "1":"M0,11 L10,9 L20,7 L30,4 L40,1",
        "2":"M0,10 L10,7 L20,4 L30,3 L40,3",
        "3":"M0,2 L10,4 L20,7 L30,9 L40,11",
        "4":"M0,6 L10,6 L20,6 L30,6 L40,6",
        "5":"M0,9 L10,8 L20,7 L30,6 L40,6",
        "6":"M0,2 L10,5 L20,8 L30,10 L40,11",
        "7":"M0,2 L10,4 L20,7 L30,9 L40,11",
        "8":"M0,5 L10,5 L20,6 L30,9 L40,11"
    };
    const trendPath  = d.tendencyCode != null ? (trendPaths[String(d.tendencyCode)] || null) : null;
    const trendSign  = d.tendencyValue != null
        ? (d.tendencyValue > 0 ? "+" : "") + d.tendencyValue.toFixed(1) + " гПа"
        : "—";
    const trendLabel = d.tendencyCode != null ? trendSign : "";

    return `
    <div style="display:flex;flex-direction:column;align-items:center;padding:0 8px;">
        <div class="small" style="margin-bottom:4px;text-align:center;">Давление</div>

        <!-- Манометр -->
        <svg viewBox="0 0 130 90" width="150" height="104" aria-label="Давление" style="display:block;overflow:visible;">
            <defs>
                <linearGradient id="pArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#58aeff"/>
                    <stop offset="30%"  stop-color="#5fe08f"/>
                    <stop offset="60%"  stop-color="#ffd84d"/>
                    <stop offset="100%" stop-color="#ff8f43"/>
                </linearGradient>
                <linearGradient id="pValGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${valColor}"/>
                    <stop offset="100%" stop-color="${valColor}" stop-opacity="0.5"/>
                </linearGradient>
            </defs>

            <!-- Фоновая дуга: центр (65,65), r=50 -->
            <path d="M 15.0 65.0 A 50 50 0 0 1 115.0 65.0"
                  fill="none" stroke="currentColor" stroke-opacity="0.10"
                  stroke-width="7" stroke-linecap="round"/>
            <!-- Цветная дуга -->
            <path d="M 15.0 65.0 A 50 50 0 0 1 115.0 65.0"
                  fill="none" stroke="url(#pArcGrad)"
                  stroke-width="6" stroke-linecap="round"/>

            <!-- Деления и подписи -->
            <line x1="15.0" y1="65.0" x2="23.0" y2="65.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="21.7" y1="40.0" x2="28.6" y2="44.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="40.0" y1="21.7" x2="44.0" y2="28.6" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="65.0" y1="15.0" x2="65.0" y2="23.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="90.0" y1="21.7" x2="86.0" y2="28.6" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="108.3" y1="40.0" x2="101.4" y2="44.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="115.0" y1="65.0" x2="107.0" y2="65.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="16.7" y1="52.1" x2="21.5" y2="53.4" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="29.6" y1="29.6" x2="33.2" y2="33.2" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="52.1" y1="16.7" x2="53.4" y2="21.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="77.9" y1="16.7" x2="76.6" y2="21.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="100.4" y1="29.6" x2="96.8" y2="33.2" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <line x1="113.3" y1="52.1" x2="108.5" y2="53.4" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.1" stroke-linecap="round"/>
            <text x="1.0" y="66.0" text-anchor="end" font-size="6.2" fill="currentColor" fill-opacity="0.68">980</text>
            <text x="11.3" y="35.0" text-anchor="end" font-size="6.2" fill="currentColor" fill-opacity="0.68">990</text>
            <text x="34.0" y="12.3" text-anchor="middle" font-size="6.2" fill="currentColor" fill-opacity="0.68">1000</text>
            <text x="65.0" y="4.0" text-anchor="middle" font-size="6.2" fill="currentColor" fill-opacity="0.68">1010</text>
            <text x="96.0" y="12.3" text-anchor="middle" font-size="6.2" fill="currentColor" fill-opacity="0.68">1020</text>
            <text x="118.7" y="35.0" text-anchor="start" font-size="6.2" fill="currentColor" fill-opacity="0.68">1030</text>
            <text x="129.0" y="66.0" text-anchor="start" font-size="6.2" fill="currentColor" fill-opacity="0.68">1040</text>

            <!-- Стрелка: вращается вокруг (65,65) -->
            <g transform="rotate(${angle} 65 65)">
                <polygon points="65,21 60,33 70,33"
                         fill="currentColor" opacity="0.90"/>
            </g>
            <!-- Центральная точка -->
            <circle cx="65" cy="65" r="4" fill="#1e1e1e"
                    stroke="currentColor" stroke-opacity="0.5" stroke-width="1.5"/>

            <!-- Значение: ниже центра, вне зоны стрелки -->
            <text x="65" y="${pVal != null ? cy+16 : cy+16}" text-anchor="middle"
                  font-size="15" font-weight="800" fill="url(#pValGrad)">
                ${pVal != null ? pVal : "-"}
            </text>
            <text x="65" y="91" text-anchor="middle"
                  font-size="7" fill="currentColor" fill-opacity="0.50">гПа</text>
        </svg>

        <!-- Тенденция: отдельно под манометром, не в SVG -->
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <svg viewBox="0 0 44 14" width="60" height="19" aria-label="Тенденция давления">
                ${trendPath
                    ? `<path d="${trendPath}" fill="none" stroke="currentColor" stroke-opacity="0.80" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
                    : `<line x1="0" y1="7" x2="44" y2="7" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.4" stroke-dasharray="3,3"/>`
                }
            </svg>
            <div class="small">${trendLabel}</div>
        </div>
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
    <div style="display:flex;flex-direction:column;align-items:center;padding:0 8px;">
        <div class="small" style="margin-bottom:4px;">Влажность</div>
        <svg viewBox="0 0 120 70" width="130" height="76" aria-label="Влажность">
            <defs>
                <linearGradient id="humGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#ffd166"/>
                    <stop offset="40%"  stop-color="#5fe08f"/>
                    <stop offset="100%" stop-color="#58aeff"/>
                </linearGradient>
            </defs>
            <path d="M10,58 A50,50 0 0,1 110,58"
                  stroke="currentColor" stroke-opacity="0.12"
                  stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M10,58 A50,50 0 0,1 110,58"
                  stroke="url(#humGrad)"
                  stroke-width="8" fill="none"
                  stroke-dasharray="${arcLen}"
                  stroke-dashoffset="${offset}"
                  stroke-linecap="round"/>
            <text x="60" y="52" text-anchor="middle"
                  font-size="19" font-weight="800" fill="currentColor">
                ${val != null ? val : "-"}
            </text>
            <text x="60" y="64" text-anchor="middle"
                  font-size="9" fill="currentColor" fill-opacity="0.65">%</text>
        </svg>
    </div>`;
}
