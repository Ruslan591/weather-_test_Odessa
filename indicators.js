/* =========================================================
   INDICATORS.JS — SVG индикаторы
   Зависит от: utils.js
   Единый viewBox: 0 0 160 130 для всех трёх
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
    <div class="ind-card">
        <div class="small ind-title">Ветер</div>
        <svg viewBox="0 0 160 130" width="190" height="154" aria-label="Ветер">
            <!-- Деления по кругу (роза перемасштабирована под cx=80,cy=65,r=50) -->
            <line x1="80" y1="13" x2="80" y2="21" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="107.3" y1="20.8" x2="103.7" y2="27" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="118.4" y1="37.7" x2="112.3" y2="41.2" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="130" y1="65" x2="122" y2="65" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="118.4" y1="92.3" x2="112.3" y2="88.8" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="107.3" y1="109.2" x2="103.7" y2="103" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="80" y1="117" x2="80" y2="109" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="52.7" y1="109.2" x2="56.3" y2="103" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="41.6" y1="92.3" x2="47.7" y2="88.8" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="30" y1="65" x2="38" y2="65" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="41.6" y1="37.7" x2="47.7" y2="41.2" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="52.7" y1="20.8" x2="56.3" y2="27" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <!-- Стороны света -->
            <text x="80"  y="10"  text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.8">С</text>
            <text x="153" y="68"  text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.8">В</text>
            <text x="80"  y="126" text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.8">Ю</text>
            <text x="7"   y="68"  text-anchor="middle" font-size="9" fill="currentColor" fill-opacity="0.8">З</text>
            <!-- Цветное кольцо cx=80,cy=65,r=40 -->
            <circle cx="80" cy="65" r="40" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="3.5"/>
            <!-- Стрелка -->
            <g transform="rotate(${dir} 80 65)">
                <polygon points="80,22 74,35 86,35" fill="currentColor"/>
            </g>
            <!-- Скорость -->
            <text x="80" y="69" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">
                ${d.windSpeed != null ? d.windSpeed : "-"}
            </text>
            <text x="80" y="81" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.72">м/с</text>
        </svg>
        <div class="small ind-sub">
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
    const angle    = pClamped != null ? (pClamped - 1010) / 30 * 90 : 0;

    const valColor = pVal == null   ? "#aaa"
        : pVal < 1000 ? "#58aeff"
        : pVal < 1025 ? "#5fe08f"
        : pVal < 1035 ? "#ffd84d"
        : "#ff8f43";

    const trendPaths = {
        "0":"M0,10 L12,8 L24,6 L36,4 L48,2",
        "1":"M0,11 L12,9 L24,7 L36,4 L48,1",
        "2":"M0,10 L12,7 L24,4 L36,3 L48,3",
        "3":"M0,2 L12,4 L24,7 L36,9 L48,11",
        "4":"M0,6 L12,6 L24,6 L36,6 L48,6",
        "5":"M0,9 L12,8 L24,7 L36,6 L48,6",
        "6":"M0,2 L12,5 L24,8 L36,10 L48,11",
        "7":"M0,2 L12,4 L24,7 L36,9 L48,11",
        "8":"M0,5 L12,5 L24,6 L36,9 L48,11"
    };
    const trendPath  = d.tendencyCode != null ? (trendPaths[String(d.tendencyCode)] || null) : null;
    const trendSign  = d.tendencyValue != null
        ? (d.tendencyValue > 0 ? "+" : "") + d.tendencyValue.toFixed(1) + " гПа"
        : "—";
    const trendLabel = d.tendencyCode != null ? trendSign : "";

    return `
    <div class="ind-card">
        <div class="small ind-title">Давление</div>
        <svg viewBox="0 0 160 130" width="190" height="154" aria-label="Давление" style="overflow:visible;">
            <defs>
                <linearGradient id="pArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#3a8fff"/>
                    <stop offset="33%"  stop-color="#72c8ff"/>
                    <stop offset="55%"  stop-color="#5fe08f"/>
                    <stop offset="75%"  stop-color="#c8e05f"/>
                    <stop offset="92%"  stop-color="#ffb347"/>
                    <stop offset="100%" stop-color="#ff6b3a"/>
                </linearGradient>
                <linearGradient id="pValGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${valColor}"/>
                    <stop offset="100%" stop-color="${valColor}" stop-opacity="0.5"/>
                </linearGradient>
            </defs>
            <!-- Дуга: центр (80,90), r=65 -->
            <path d="M 15.0 90.0 A 65 65 0 0 1 145.0 90.0"
                  fill="none" stroke="currentColor" stroke-opacity="0.10"
                  stroke-width="8" stroke-linecap="round"/>
            <path d="M 15.0 90.0 A 65 65 0 0 1 145.0 90.0"
                  fill="none" stroke="url(#pArcGrad)"
                  stroke-width="7" stroke-linecap="round"/>
            <!-- Деления и подписи -->
            <line x1="15.0" y1="90.0" x2="25.0" y2="90.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="23.7" y1="57.5" x2="32.4" y2="62.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="47.5" y1="33.7" x2="52.5" y2="42.4" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="80.0" y1="25.0" x2="80.0" y2="35.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="112.5" y1="33.7" x2="107.5" y2="42.4" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="136.3" y1="57.5" x2="127.6" y2="62.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="145.0" y1="90.0" x2="135.0" y2="90.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="17.2" y1="73.2" x2="23.0" y2="74.7" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="34.0" y1="44.0" x2="38.3" y2="48.3" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="63.2" y1="27.2" x2="64.7" y2="33.0" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="96.8" y1="27.2" x2="95.3" y2="33.0" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="126.0" y1="44.0" x2="121.7" y2="48.3" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="142.8" y1="73.2" x2="137.0" y2="74.7" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <text x="0.0" y="91.5" text-anchor="end" font-size="7.5" fill="currentColor" fill-opacity="0.65">980</text>
            <text x="10.7" y="51.5" text-anchor="end" font-size="7.5" fill="currentColor" fill-opacity="0.65">990</text>
            <text x="40.0" y="22.2" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.65">1000</text>
            <text x="80.0" y="11.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.65">1010</text>
            <text x="120.0" y="22.2" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.65">1020</text>
            <text x="149.3" y="51.5" text-anchor="start" font-size="7.5" fill="currentColor" fill-opacity="0.65">1030</text>
            <text x="160.0" y="91.5" text-anchor="start" font-size="7.5" fill="currentColor" fill-opacity="0.65">1040</text>
            <!-- Стрелка: вращается вокруг (80,90) -->
            <g transform="rotate(${angle} 80 90)">
                <polygon points="80,33 73,47 87,47"
                         fill="currentColor" opacity="0.92"/>
            </g>
            <circle cx="80" cy="90" r="5" fill="#1e1e1e"
                    stroke="currentColor" stroke-opacity="0.5" stroke-width="1.8"/>
            <!-- Значение давления под центром -->
            <text x="80" y="108" text-anchor="middle"
                  font-size="18" font-weight="800" fill="url(#pValGrad)">
                ${pVal != null ? pVal : "-"}
            </text>
            <text x="80" y="120" text-anchor="middle"
                  font-size="8.5" fill="currentColor" fill-opacity="0.50">гПа</text>
        </svg>
        <div class="ind-trend">
            <svg viewBox="0 0 52 14" width="70" height="19" aria-label="Тенденция">
                ${trendPath
                    ? `<path d="${trendPath}" fill="none" stroke="currentColor" stroke-opacity="0.80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
                    : `<line x1="0" y1="7" x2="52" y2="7" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.5" stroke-dasharray="3,3"/>`
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
    const arcLen = 204.2;
    const offset = val != null ? arcLen * (1 - val / 100) : arcLen;

    return `
    <div class="ind-card">
        <div class="small ind-title">Влажность</div>
        <svg viewBox="0 0 160 130" width="190" height="154" aria-label="Влажность">
            <defs>
                <linearGradient id="humGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#ffd166"/>
                    <stop offset="40%"  stop-color="#5fe08f"/>
                    <stop offset="100%" stop-color="#58aeff"/>
                </linearGradient>
            </defs>
            <!-- Дуга та же: центр (80,90), r=65 -->
            <path d="M 15.0 90.0 A 65 65 0 0 1 145.0 90.0"
                  stroke="currentColor" stroke-opacity="0.12"
                  stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M 15.0 90.0 A 65 65 0 0 1 145.0 90.0"
                  stroke="url(#humGrad)"
                  stroke-width="7" fill="none"
                  stroke-dasharray="${arcLen}"
                  stroke-dashoffset="${offset.toFixed(1)}"
                  stroke-linecap="round"/>
            <!-- Деления и метки -->
            <line x1="15.0" y1="90.0" x2="23.0" y2="90.0" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="34.0" y1="44.0" x2="39.7" y2="49.7" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="80.0" y1="25.0" x2="80.0" y2="33.0" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="126.0" y1="44.0" x2="120.3" y2="49.7" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="145.0" y1="90.0" x2="137.0" y2="90.0" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <text x="1.0" y="91.5" text-anchor="end" font-size="7.5" fill="currentColor" fill-opacity="0.60">0</text>
            <text x="24.1" y="35.6" text-anchor="end" font-size="7.5" fill="currentColor" fill-opacity="0.60">25</text>
            <text x="80.0" y="12.5" text-anchor="middle" font-size="7.5" fill="currentColor" fill-opacity="0.60">50</text>
            <text x="135.9" y="35.6" text-anchor="start" font-size="7.5" fill="currentColor" fill-opacity="0.60">75</text>
            <text x="159.0" y="91.5" text-anchor="start" font-size="7.5" fill="currentColor" fill-opacity="0.60">100</text>
            <!-- Значение — по центру как у давления -->
            <text x="80" y="106" text-anchor="middle"
                  font-size="22" font-weight="800" fill="currentColor">
                ${val != null ? val + "%" : "-"}
            </text>
        </svg>
    </div>`;
}
