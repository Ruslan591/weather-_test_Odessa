/* =========================================================
   INDICATORS.JS — SVG индикаторы (ветер, давление, влажность, температура)
   Единый viewBox: 0 0 160 110
   Зависит от: utils.js
========================================================= */

const IND_VB  = "0 0 160 110";  // единый viewBox
const IND_W   = 200;             // ширина в px (масштабируется CSS)
const IND_H   = 138;             // высота в px

/* =========================================================
   ВЕТЕР
========================================================= */
function windIndicatorSvg(d){
    const color =
        d.windSpeed == null ? "rgba(255,255,255,0.14)" :
        d.windSpeed <= 2    ? "#7ec8ff" :
        d.windSpeed <= 5    ? "#67d7a7" :
        d.windSpeed <= 9    ? "#ffd166" :
        d.windSpeed <= 14   ? "#ff9f5c" : "#ff6b6b";
    const dir = d.windDir ?? 0;

    return `
    <div class="ind-card">
        <div class="ind-title">Ветер</div>
        <svg viewBox="0 0 160 160" width="${IND_W}" height="${IND_W}" aria-label="Ветер">
            <!-- Деления (роза, центр 80,80, r=55) -->
            <line x1="80" y1="24" x2="80" y2="15" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="114.9" y1="32.3" x2="110.6" y2="32.3" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="130" y1="65" x2="121" y2="65" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="114.9" y1="97.7" x2="110.6" y2="90.3" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="80" y1="106" x2="80" y2="115" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="45.1" y1="97.7" x2="49.4" y2="90.3" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <line x1="30" y1="65" x2="39" y2="65" stroke="currentColor" stroke-opacity="0.55" stroke-width="2.2"/>
            <line x1="45.1" y1="32.3" x2="49.4" y2="39.7" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.8"/>
            <!-- Промежуточные -->
            <line x1="128.9" y1="41.1" x2="123.5" y2="45" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.4"/>
            <line x1="128.9" y1="88.9" x2="123.5" y2="85" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.4"/>
            <line x1="31.1" y1="88.9" x2="36.5" y2="85" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.4"/>
            <line x1="31.1" y1="41.1" x2="36.5" y2="45" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.4"/>
            <!-- Стороны света -->
            <text x="80"  y="12"  text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.8">С</text>
            <text x="138" y="68"  text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.8">В</text>
            <text x="80"  y="125" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.8">Ю</text>
            <text x="22"  y="68"  text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.8">З</text>
            <!-- Кольцо -->
            <circle cx="80" cy="65" r="43" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="3.5"/>
            <!-- Стрелка с анимацией -->
            <g style="transform-origin:80px 65px;transform:rotate(${dir}deg);transition:transform 0.8s cubic-bezier(0.34,1.56,0.64,1);">
                <polygon points="80,19 74,32 86,32" fill="currentColor"/>
            </g>
            <!-- Значение -->
            <text x="80" y="70" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">
                ${d.windSpeed ?? "-"}
            </text>
            <text x="80" y="82" text-anchor="middle" font-size="9.5" fill="currentColor" fill-opacity="0.65">м/с</text>
            <text x="80" y="139" text-anchor="middle" font-size="12" fill="currentColor" color="#888" fill-opacity="0.65">
            ${escapeHtml(degToText(d.windDir))}${d.windDir != null ? ` · ${d.windDir}°` : ""}</text>
        </svg>
        
    </div>`;
}

/* =========================================================
   ДАВЛЕНИЕ
========================================================= */
function pressureIndicatorSvg(d){
    const pVal = d.seaPressure;
    const pMin = 980, pMax = 1040;
    const pC   = pVal != null ? Math.max(pMin, Math.min(pMax, pVal)) : null;
    const angle = pC != null ? (pC - 1010) / 30 * 90 : 0;

    const vc = pVal == null ? "#aaa"
        : pVal < 1000 ? "#58aeff"
        : pVal < 1025 ? "#5fe08f"
        : pVal < 1035 ? "#ffd84d" : "#ff8f43";

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
    const tp = d.tendencyCode != null ? (trendPaths[String(d.tendencyCode)] || null) : null;
    const ts = d.tendencyValue != null
        ? (d.tendencyValue > 0 ? "+" : "") + d.tendencyValue.toFixed(1) + " гПа" : "";

    return `
    <div class="ind-card">
        <div class="ind-title">Давление</div>
        <svg viewBox="${IND_VB}" width="${IND_W}" height="${IND_H}" aria-label="Давление" style="overflow:visible;">
            <defs>
                <linearGradient id="pArc" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#3a8fff"/>
                    <stop offset="33%"  stop-color="#72c8ff"/>
                    <stop offset="55%"  stop-color="#5fe08f"/>
                    <stop offset="75%"  stop-color="#c8e05f"/>
                    <stop offset="92%"  stop-color="#ffb347"/>
                    <stop offset="100%" stop-color="#ff6b3a"/>
                </linearGradient>
                <linearGradient id="pVal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${vc}"/>
                    <stop offset="100%" stop-color="${vc}" stop-opacity="0.5"/>
                </linearGradient>
            </defs>
            <path d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none" stroke="currentColor" stroke-opacity="0.10" stroke-width="8" stroke-linecap="round"/>
            <path d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none" stroke="url(#pArc)" stroke-width="7" stroke-linecap="round"/>
            <line x1="15.0" y1="85.0" x2="24.0" y2="85.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="23.7" y1="52.5" x2="31.5" y2="57.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="47.5" y1="28.7" x2="52.0" y2="36.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="80.0" y1="20.0" x2="80.0" y2="29.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="112.5" y1="28.7" x2="108.0" y2="36.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="136.3" y1="52.5" x2="128.5" y2="57.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="145.0" y1="85.0" x2="136.0" y2="85.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="17.2" y1="68.2" x2="22.0" y2="69.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="34.0" y1="39.0" x2="37.6" y2="42.6" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="63.2" y1="22.2" x2="64.5" y2="27.0" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="96.8" y1="22.2" x2="95.5" y2="27.0" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="126.0" y1="39.0" x2="122.4" y2="42.6" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="142.8" y1="68.2" x2="138.0" y2="69.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <text x="1.0" y="86.5" text-anchor="end" font-size="8" fill="currentColor" fill-opacity="0.60">980</text>
            <text x="11.6" y="47.0" text-anchor="end" font-size="8" fill="currentColor" fill-opacity="0.60">990</text>
            <text x="40.5" y="18.1" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.60">1000</text>
            <text x="80.0" y="7.5" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.60">1010</text>
            <text x="119.5" y="18.1" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.60">1020</text>
            <text x="148.4" y="47.0" text-anchor="start" font-size="8" fill="currentColor" fill-opacity="0.60">1030</text>
            <text x="159.0" y="86.5" text-anchor="start" font-size="8" fill="currentColor" fill-opacity="0.60">1040</text>
            <g style="transform-origin:80px 85px;transform:rotate(${angle}deg);transition:transform 0.8s ease;">
                <polygon points="80,28 73,42 87,42" fill="currentColor" opacity="0.92"/>
            </g>
            
            <text x="80" y="85" text-anchor="middle" font-size="20" font-weight="800" fill="url(#pVal)">
                ${pVal ?? "-"}
            </text>
            <text x="80" y="65" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.50">гПа</text>
        </svg>
        <div class="ind-trend">
            <svg viewBox="0 0 52 14" width="70" height="19">
                ${tp
                    ? `<path d="${tp}" fill="none" stroke="currentColor" stroke-opacity="0.80" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
                    : `<line x1="0" y1="7" x2="52" y2="7" stroke="currentColor" stroke-opacity="0.20" stroke-width="1.5" stroke-dasharray="3,3"/>`
                }
            </svg>
            <div class="small">${ts}</div>
        </div>
    </div>`;
}

/* =========================================================
   ВЛАЖНОСТЬ
========================================================= */
function humidityIndicatorSvg(humidity){
    const val    = humidity != null ? Math.round(humidity) : null;
    const arcLen = 204.2;
    const offset = val != null ? arcLen * (1 - val / 100) : arcLen;

    return `
    <div class="ind-card">
        <div class="ind-title">Влажность</div>
        <svg viewBox="${IND_VB}" width="${IND_W}" height="${IND_H}" aria-label="Влажность">
            <defs>
                <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#ffd166"/>
                    <stop offset="40%"  stop-color="#5fe08f"/>
                    <stop offset="100%" stop-color="#58aeff"/>
                </linearGradient>
            </defs>
            <path d="M 15 85 A 65 65 0 0 1 145 85"
                  stroke="currentColor" stroke-opacity="0.12" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path d="M 15 85 A 65 65 0 0 1 145 85"
                  stroke="url(#hGrad)" stroke-width="7" fill="none"
                  stroke-dasharray="${arcLen}"
                  stroke-dashoffset="${offset.toFixed(1)}"
                  stroke-linecap="round"/>
            <line x1="15.0" y1="85.0" x2="23.0" y2="85.0" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="34.0" y1="39.0" x2="39.7" y2="44.7" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="80.0" y1="20.0" x2="80.0" y2="28.0" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="126.0" y1="39.0" x2="120.3" y2="44.7" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="145.0" y1="85.0" x2="137.0" y2="85.0" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
            <text x="1.0" y="86.5" text-anchor="end" font-size="8" fill="currentColor" fill-opacity="0.55">0</text>
            <text x="24.1" y="30.6" text-anchor="end" font-size="8" fill="currentColor" fill-opacity="0.55">25</text>
            <text x="80.0" y="7.5" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.55">50</text>
            <text x="135.9" y="30.6" text-anchor="start" font-size="8" fill="currentColor" fill-opacity="0.55">75</text>
            <text x="159.0" y="86.5" text-anchor="start" font-size="8" fill="currentColor" fill-opacity="0.55">100</text>
            <text x="80" y="85" text-anchor="middle" font-size="20" font-weight="800" fill="currentColor">
                ${val != null ? val + "%" : "-"}
            </text>
        </svg>
    </div>`;
}

/* =========================================================
   ТЕМПЕРАТУРА (циферблат -20..+40°C)
========================================================= */
function tempIndicatorSvg(temp, feelsLike){
    const tMin = -20, tMax = 40;
    const tC   = temp != null ? Math.max(tMin, Math.min(tMax, temp)) : null;
    const angle = tC != null ? (tC - 10) / 30 * 90 : 0;
    // 10°C = середина шкалы (вверх), -20 = -90°, +40 = +90°

    const vc = temp == null ? "#aaa"
        : temp < 0    ? "#58aeff"
        : temp < 10   ? "#9dd6ff"
        : temp < 20   ? "#5fe08f"
        : temp < 30   ? "#ffd84d" : "#ff6b3a";

    return `
    <div class="ind-card">
        <div class="ind-title">Температура</div>
        <svg viewBox="${IND_VB}" width="${IND_W}" height="${IND_H}" aria-label="Температура" style="overflow:visible;">
            <defs>
                <linearGradient id="tArc" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#3a8fff"/>
                    <stop offset="25%"  stop-color="#9dd6ff"/>
                    <stop offset="50%"  stop-color="#5fe08f"/>
                    <stop offset="75%"  stop-color="#ffd84d"/>
                    <stop offset="100%" stop-color="#ff6b3a"/>
                </linearGradient>
                <linearGradient id="tVal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${vc}"/>
                    <stop offset="100%" stop-color="${vc}" stop-opacity="0.5"/>
                </linearGradient>
            </defs>
            <path d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none" stroke="currentColor" stroke-opacity="0.10" stroke-width="8" stroke-linecap="round"/>
            <path d="M 15 85 A 65 65 0 0 1 145 85"
                  fill="none" stroke="url(#tArc)" stroke-width="7" stroke-linecap="round"/>
            <line x1="15.0" y1="85.0" x2="24.0" y2="85.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="23.7" y1="52.5" x2="31.5" y2="57.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="47.5" y1="28.7" x2="52.0" y2="36.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="80.0" y1="20.0" x2="80.0" y2="29.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="112.5" y1="28.7" x2="108.0" y2="36.5" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="136.3" y1="52.5" x2="128.5" y2="57.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="145.0" y1="85.0" x2="136.0" y2="85.0" stroke="currentColor" stroke-opacity="0.55" stroke-width="2" stroke-linecap="round"/>
            <line x1="17.2" y1="68.2" x2="22.0" y2="69.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="34.0" y1="39.0" x2="37.6" y2="42.6" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="63.2" y1="22.2" x2="64.5" y2="27.0" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="96.8" y1="22.2" x2="95.5" y2="27.0" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="126.0" y1="39.0" x2="122.4" y2="42.6" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <line x1="142.8" y1="68.2" x2="138.0" y2="69.5" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2" stroke-linecap="round"/>
            <text x="1.0" y="86.5" text-anchor="end" font-size="8" fill="currentColor" fill-opacity="0.60">-20</text>
            <text x="11.6" y="47.0" text-anchor="end" font-size="8" fill="currentColor" fill-opacity="0.60">-10</text>
            <text x="40.5" y="18.1" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.60">0</text>
            <text x="80.0" y="7.5" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.60">10</text>
            <text x="119.5" y="18.1" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.60">20</text>
            <text x="148.4" y="47.0" text-anchor="start" font-size="8" fill="currentColor" fill-opacity="0.60">30</text>
            <text x="159.0" y="86.5" text-anchor="start" font-size="8" fill="currentColor" fill-opacity="0.60">40</text>
            <g style="transform-origin:80px 85px;transform:rotate(${angle}deg);transition:transform 0.8s ease;">
                <polygon points="80,28 73,42 87,42" fill="currentColor" opacity="0.92"/>
            </g>
            
            <text x="80" y="85" text-anchor="middle" font-size="22" font-weight="800" fill="url(#tVal)">
                ${temp != null ? fmt1(temp,"°") : "-"}
            </text>
            ${feelsLike != null && Math.abs(feelsLike - temp) >= 0.5 ? `
            <text x="80" y="65" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.50">
                ощущ. ${fmt1(feelsLike,"°")}
            </text>` : `
            <text x="80" y="95" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.50">°C</text>`
            }
        </svg>
    </div>`;
}
