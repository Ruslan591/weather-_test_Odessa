/* =========================================================
   PWS_PAGE.JS — страница pws.html
   Несколько станций, индикаторы 2×2, ручная калибровка давления
   Зависит от: utils.js, indicators.js, pws.js (WU_KEYS)
========================================================= */

const PWS_STATIONS = [
    { id:"IODESA138",  name:"Центр",           pressureOffset:0 },
    { id:"IODESS16", name:"Таирова",          pressureOffset:0 },
    { id:"IODESS44", name:"Аркадия",          pressureOffset:0 },
    { id:"IODESS37", name:"Застава",          pressureOffset:0 },
    { id:"IODESA137", name:"пос. Котовского",  pressureOffset:0 },
];

const PWS_REFRESH = 15; // секунд
const CALIB_KEY   = "pwsPageCalib"; // { stationId: offset }

let _timer   = null;
let _lastData = {}; // { stationId: parsedData | {error} }

/* =========================================================
   КАЛИБРОВКА
========================================================= */
function getOffset(id){
    try{ return JSON.parse(localStorage.getItem(CALIB_KEY)||"{}")[id] ?? 0; }
    catch(e){ return 0; }
}

function setOffset(id, val){
    const c = JSON.parse(localStorage.getItem(CALIB_KEY)||"{}");
    c[id] = val;
    localStorage.setItem(CALIB_KEY, JSON.stringify(c));
}

function resetOffset(id){
    const c = JSON.parse(localStorage.getItem(CALIB_KEY)||"{}");
    delete c[id];
    localStorage.setItem(CALIB_KEY, JSON.stringify(c));
    renderPWSPage();
}

function applyCalib(id){
    const inp = document.getElementById(`calib_${id}`);
    if(!inp) return;
    const val = parseFloat(inp.value);
    if(isNaN(val)){ inp.style.borderColor="#ff6b6b"; return; }
    inp.style.borderColor="";
    setOffset(id, val);
    renderPWSPage();
}

/* =========================================================
   ЗАГРУЗКА
========================================================= */
async function fetchStation(stationId){
    const url =
        `https://api.weather.com/v2/pws/observations/current` +
        `?stationId=${encodeURIComponent(stationId)}` +
        `&format=json&units=m&numericPrecision=decimal` +
        `&apiKey=${WU_KEYS[0]}`;
    const ctrl  = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 10000);
    try {
        const r = await fetch(url, {signal:ctrl.signal, cache:"no-store"});
        if(!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        if(data?.errors?.length) throw new Error(data.errors[0]?.error?.message || "Ошибка API");
        if(!data?.observations?.length) throw new Error("Нет данных");
        return parsePWSStation(data.observations[0]);
    } finally { clearTimeout(timer); }
}

function parsePWSStation(obs){
    const m = obs.metric || {};
    const km = v => v != null ? Math.round(v/3.6*10)/10 : null;
    return {
        stationID:    obs.stationID      || null,
        softwareType: obs.softwareType   || null,
        obsTimeLocal: obs.obsTimeLocal   || null,
        lat:          obs.lat            ?? null,
        lon:          obs.lon            ?? null,
        elev:         m.elev             ?? null,
        temp:         m.temp             ?? null,
        dewpt:        m.dewpt            ?? null,
        heatIndex:    m.heatIndex        ?? null,
        windChill:    m.windChill        ?? null,
        pressure:     m.pressure         ?? null,
        precipRate:   m.precipRate       ?? null,
        precipTotal:  m.precipTotal      ?? null,
        windDir:      obs.winddir        ?? null,
        humidity:     obs.humidity       ?? null,
        uv:           obs.uv             ?? null,
        solarRad:     obs.solarRadiation ?? null,
        windSpeedMs:  km(m.windSpeed),
        windGustMs:   km(m.windGust),
    };
}

async function loadAll(){
    await Promise.allSettled(
        PWS_STATIONS.map(async st => {
            try { _lastData[st.id] = await fetchStation(st.id); }
            catch(e) { _lastData[st.id] = { error: e.message }; }
        })
    );
}

/* =========================================================
   РЕНДЕР ОДНОЙ СТАНЦИИ
========================================================= */
function renderStation(cfg){
    const p   = _lastData[cfg.id];
    const off = getOffset(cfg.id);

    let html = `<div class="pws-station-card">`;

    // Заголовок
    html += `<div class="pws-station-header">
        <div>
            <div class="districtName">${escapeHtml(cfg.name)}</div>
            <div class="small" style="color:#666;">${escapeHtml(cfg.id)}</div>
        </div>`;

    if(!p || p.error){
        html += `</div>
        <div style="padding:12px 0;color:#888;font-size:13px;">
            ${p?.error ? "⚠️ " + escapeHtml(p.error) : "Станция недоступна"}
        </div>`;
    } else {
        const timeStr = p.obsTimeLocal
            ? (()=>{ const d=new Date(p.obsTimeLocal.replace(" ","T")); return isNaN(d)?p.obsTimeLocal:d.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); })()
            : "-";

        const pCorr = p.pressure != null
            ? Math.round((p.pressure + (cfg.pressureOffset||0) + off)*10)/10
            : null;

        const feelsLike =
            p.temp!=null&&p.temp>=27&&p.heatIndex!=null ? p.heatIndex :
            p.temp!=null&&p.temp<=10&&p.windChill!=null  ? p.windChill : p.temp;

        html += `<div class="small" style="color:#666;">${escapeHtml(timeStr)}</div>
        </div>`;

        // Индикаторы 2×2: температура | давление / ветер | влажность
        html += `<div class="ind-grid-2x2" style="margin:8px 0;">
            ${tempIndicatorSvg(p.temp, feelsLike)}
            ${humidityIndicatorSvg(p.humidity)}
            ${pressureIndicatorSvg({seaPressure: pCorr, tendencyCode: null, tendencyValue: null})}
            ${windIndicatorSvg({windSpeed: p.windSpeedMs, windDir: p.windDir})}
            
        </div>`;

        // Данные
        const fields = [
            p.dewpt      != null ? ["Точка росы",   fmt1(p.dewpt,"°C")] : null,
            p.precipRate != null && p.precipRate > 0 ? ["Интенсивность", fmt1(p.precipRate," мм/ч")] : null,
            p.precipTotal!= null && p.precipTotal> 0 ? ["Осадки",        fmt1(p.precipTotal," мм")]   : null,
            p.solarRad   != null ? ["Радиация",      fmt0(p.solarRad," Вт/м²")] : null,
            p.uv         != null ? ["УФ-индекс",     String(p.uv)] : null,
            p.windGustMs != null && p.windGustMs > 0 ? ["Порывы",        fmt1(p.windGustMs," м/с")]   : null,
            p.elev       != null ? ["Высота",        fmt0(p.elev," м")] : null,
            off !== 0 ? ["Поправка давления", `${off > 0 ? "+" : ""}${off} гПа`] : null,
        ].filter(Boolean);

        if(fields.length){
            html += `<div class="pws-fields">`;
            fields.forEach(([k,v]) => {
                html += `<div class="districtLine"><span>${k}</span><span>${v}</span></div>`;
            });
            html += `</div>`;
        }

        if(p.softwareType){
            html += `<div class="small" style="color:#555;margin-top:4px;">${escapeHtml(p.softwareType)}</div>`;
        }
    }

    // Калибровка давления
    html += `<div class="pws-calib">
        <span class="small" style="color:#555;">Коррекция давления:</span>
        <input id="calib_${cfg.id}" type="number" step="0.1" value="${off}"
               style="width:60px;background:#2a2a2a;border:1px solid #333;border-radius:6px;
                      color:#eee;font-size:12px;padding:3px 6px;text-align:center;">
        <button onclick="applyCalib('${cfg.id}')"
                style="width:auto;padding:3px 10px;font-size:11px;background:#2a2a2a;">✓</button>
        <button onclick="resetOffset('${cfg.id}')"
                style="width:auto;padding:3px 10px;font-size:11px;background:#2a2a2a;">✕ сброс</button>
    </div>`;

    html += `</div>`; // pws-station-card
    return html;
}

/* =========================================================
   РЕНДЕР СТРАНИЦЫ
========================================================= */
function renderPWSPage(){
    const box = document.getElementById("pwsContent");
    if(!box) return;
    const now = new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    let html = `<div class="small" style="color:#666;margin-bottom:8px;padding:0 2px;">Обновлено: ${now}</div>`;
    PWS_STATIONS.forEach(cfg => { html += renderStation(cfg); });
    box.innerHTML = html;
}

/* =========================================================
   UI И АВТООБНОВЛЕНИЕ
========================================================= */
async function loadPWSPage(){
    const btn = document.getElementById("btnPWS");
    if(btn) btn.disabled = true;
    clearLog("pwsLog");
    showLogBox("pwsLogBox");

    try {
        logTo("pwsLog","🚀 Загрузка PWS станций");
        await loadAll();
        const ok = PWS_STATIONS.filter(s=>!_lastData[s.id]?.error).length;
        logTo("pwsLog",`📥 ${ok}/${PWS_STATIONS.length} станций`);
        renderPWSPage();
        logTo("pwsLog","✅ Готово");
        hideLogBoxLater("pwsLogBox", 2000);
        startAutoRefresh();
    } catch(e){
        logTo("pwsLog","❌ " + (e?.message||e));
    } finally {
        if(btn) btn.disabled = false;
    }
}

function startAutoRefresh(){
    if(_timer) clearInterval(_timer);
    _timer = setInterval(async ()=>{
        await loadAll();
        renderPWSPage();
    }, PWS_REFRESH * 1000);
}

// Автозапуск
loadPWSPage();
