/* =========================================================
   DISTRICTS.JS — районы: PWS карточка + Open-Meteo карточка
   Индикаторы: 2 рядом (ветер+давление) и 2 рядом (влажность+температура)
   Зависит от: utils.js, pws.js (WU_KEYS)
========================================================= */

/* =========================================================
   1. КОНФИГУРАЦИЯ
========================================================= */
const DISTRICTS = [
    { name:"Центр",           pwsId:"IODESA138",  lat:46.482, lon:30.723, pressureOffset:0, autoCalib:true },
    { name:"Таирова",         pwsId:"IODESS16", lat:46.400, lon:30.650, pressureOffset:0, autoCalib:true },
    { name:"Аркадия",         pwsId:"IODESS44", lat:46.430, lon:30.760, pressureOffset:0, autoCalib:true },
    { name:"Застава",         pwsId:"IODESS37", lat:46.520, lon:30.650, pressureOffset:0, autoCalib:true },
    { name:"пос. Котовского", pwsId:"IODESA137", lat:46.560, lon:30.800, pressureOffset:0, autoCalib:true },
];

const D_REFRESH_SEC  = 15;
const OM_REFRESH_MIN = 15;
const SYNOP_HOURS    = [0, 6, 12, 18];
const CALIB_WIN_MIN  = 20;
const CALIB_KEY      = "pwsCalibOffsets";

/* =========================================================
   2. КАЛИБРОВКА
========================================================= */
function loadCalib(){ try{ return JSON.parse(localStorage.getItem(CALIB_KEY)||"{}"); }catch(e){ return {}; } }
function saveCalib(id, offset){ const c=loadCalib(); c[id]={offset:+offset.toFixed(2),ts:Date.now()}; localStorage.setItem(CALIB_KEY,JSON.stringify(c)); }
function getCalib(id){ return loadCalib()[id]?.offset ?? 0; }
function isNearSynop(){ const t=new Date(); const m=t.getUTCHours()*60+t.getUTCMinutes(); return SYNOP_HOURS.some(h=>Math.abs(m-h*60)<=CALIB_WIN_MIN); }

function calibratePWSBySynop(synopPressure){
    if(synopPressure==null||!isNearSynop()) return;
    DISTRICTS.forEach(d=>{
        if(!d.autoCalib||!d.pwsId) return;
        const raw=_pwsRaw[d.pwsId]; if(raw==null) return;
        const diff=synopPressure-(raw+(d.pressureOffset||0));
        if(Math.abs(diff)>15){ console.warn(`calib ${d.pwsId}: ${diff.toFixed(1)} гПа — skip`); return; }
        saveCalib(d.pwsId, diff);
    });
    renderDistricts();
}

function resetCalib(){ localStorage.removeItem(CALIB_KEY); renderDistricts(); }

function correctedP(pwsId, raw, manOff){
    if(raw==null) return null;
    const d=DISTRICTS.find(x=>x.pwsId===pwsId);
    return Math.round((raw+(manOff||0)+(d?.autoCalib?getCalib(pwsId):0))*10)/10;
}

function nextSynopStr(){
    const t=new Date(), m=t.getUTCHours()*60+t.getUTCMinutes();
    const next=SYNOP_HOURS.map(h=>h*60).find(x=>x>m)??(SYNOP_HOURS[0]*60+1440);
    const diff=next-m, h=Math.floor(diff/60), mm=diff%60;
    return h>0?`через ${h} ч ${mm} мин`:`через ${mm} мин`;
}

/* =========================================================
   3. СОСТОЯНИЕ
========================================================= */
let _dTimer=null, _omTimer=null;
let _pwsRaw={}, _pwsData={}, _omData={};

/* =========================================================
   4. ЗАГРУЗКА
========================================================= */
async function fetchOnePWS(stationId){
    const url=`https://api.weather.com/v2/pws/observations/current?stationId=${encodeURIComponent(stationId)}&format=json&units=m&numericPrecision=decimal&apiKey=${WU_KEYS[0]}`;
    const ctrl=new AbortController(), t=setTimeout(()=>ctrl.abort(),10000);
    try{
        const r=await fetch(url,{signal:ctrl.signal,cache:"no-store"});
        if(!r.ok) throw new Error("HTTP "+r.status);
        const data=await r.json();
        if(data?.errors?.length) throw new Error(data.errors[0]?.error?.message||"API error");
        if(!data?.observations?.length) throw new Error("Нет данных");
        return parsePWSOne(data.observations[0]);
    }finally{ clearTimeout(t); }
}

function parsePWSOne(obs){
    const m=obs.metric||{}, km=v=>v!=null?Math.round(v/3.6*10)/10:null;
    return {
        stationID:obs.stationID||null, obsTimeLocal:obs.obsTimeLocal||null, epoch:obs.epoch??null,
        temp:m.temp??null, dewpt:m.dewpt??null, heatIndex:m.heatIndex??null, windChill:m.windChill??null,
        pressure:m.pressure??null, precipRate:m.precipRate??null, precipTotal:m.precipTotal??null,
        windDir:obs.winddir??null, humidity:obs.humidity??null, uv:obs.uv??null,
        solarRad:obs.solarRadiation??null, windSpeedMs:km(m.windSpeed), windGustMs:km(m.windGust),
    };
}

async function fetchOneOM(lat,lon){
    const d=new Date().toISOString().slice(0,10);
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,is_day,relative_humidity_2m,rain,apparent_temperature,showers,snowfall,surface_pressure&timezone=auto&wind_speed_unit=ms&start_date=${d}&end_date=${d}`;
    const r=await fetch(url); if(!r.ok) throw new Error("HTTP "+r.status);
    const j=await r.json(); if(!j?.current) throw new Error("Нет данных"); return j.current;
}

async function loadAllDistricts(){
    await Promise.allSettled([
        ...DISTRICTS.filter(d=>d.pwsId).map(async d=>{
            try{ const p=await fetchOnePWS(d.pwsId); _pwsData[d.pwsId]=p; if(p.pressure!=null)_pwsRaw[d.pwsId]=p.pressure; }
            catch(e){ _pwsData[d.pwsId]={error:e.message}; }
        }),
        ...DISTRICTS.map(async d=>{
            try{ _omData[d.name]=await fetchOneOM(d.lat,d.lon); }
            catch(e){ _omData[d.name]={error:e.message}; }
        })
    ]);
}

/* =========================================================
   5. ИНДИКАТОРЫ (2+2 рядом, без скролла)
========================================================= */
function mkWindSvg(speed, gust, dir, uid){
    const color=speed==null?"rgba(255,255,255,0.14)":speed<=2?"#7ec8ff":speed<=5?"#67d7a7":speed<=9?"#ffd166":speed<=14?"#ff9f5c":"#ff6b6b";
    const d=dir??0;
    return `<div class="di-wrap">
        <div class="di-label">Ветер</div>
        <svg viewBox="0 0 100 105" width="100" height="105">
            <line x1="50" y1="12" x2="50" y2="18" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="71" y1="18" x2="68" y2="23" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="80" y1="30" x2="75" y2="33" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="84" y1="50" x2="78" y2="50" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="80" y1="70" x2="75" y2="67" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="71" y1="82" x2="68" y2="77" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="50" y1="88" x2="50" y2="82" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="29" y1="82" x2="32" y2="77" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="20" y1="70" x2="25" y2="67" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="16" y1="50" x2="22" y2="50" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>
            <line x1="20" y1="30" x2="25" y2="33" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <line x1="29" y1="18" x2="32" y2="23" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.5"/>
            <text x="50" y="9"  text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.75">С</text>
            <text x="91" y="53" text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.75">В</text>
            <text x="50" y="97" text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.75">Ю</text>
            <text x="9"  y="53" text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.75">З</text>
            <circle cx="50" cy="50" r="28" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="3"/>
            <g id="warr_${uid}" style="transform-origin:50px 50px;transform:rotate(${d}deg);transition:transform 0.8s cubic-bezier(0.34,1.56,0.64,1);">
                <polygon points="50,19 45,30 55,30" fill="currentColor"/>
            </g>
            <text x="50" y="54" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">${speed??"-"}</text>
            <text x="50" y="63" text-anchor="middle" font-size="7" fill="currentColor" fill-opacity="0.65">м/с</text>
        </svg>
        <div class="di-sub">${escapeHtml(degToText(dir))}${dir!=null?` · ${dir}°`:""}</div>
        ${gust!=null&&gust>0?`<div class="di-sub">порывы ${fmt1(gust," м/с")}</div>`:""}
    </div>`;
}

function mkPressSvg(pressure, uid){
    const pMin=980,pMax=1040;
    const pc=pressure!=null?Math.max(pMin,Math.min(pMax,pressure)):null;
    const angle=pc!=null?(pc-1010)/30*90:0;
    const vc=pressure==null?"#aaa":pressure<1000?"#58aeff":pressure<1025?"#5fe08f":pressure<1035?"#ffd84d":"#ff8f43";
    return `<div class="di-wrap">
        <div class="di-label">Давление</div>
        <svg viewBox="0 0 100 90" width="100" height="90" style="overflow:visible;">
            <defs>
                <linearGradient id="pa_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"  stop-color="#3a8fff"/>
                    <stop offset="33%" stop-color="#72c8ff"/>
                    <stop offset="55%" stop-color="#5fe08f"/>
                    <stop offset="75%" stop-color="#c8e05f"/>
                    <stop offset="92%" stop-color="#ffb347"/>
                    <stop offset="100%" stop-color="#ff6b3a"/>
                </linearGradient>
                <linearGradient id="pv_${uid}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stop-color="${vc}"/>
                    <stop offset="100%" stop-color="${vc}" stop-opacity="0.5"/>
                </linearGradient>
            </defs>
            <path d="M8,62 A42,42 0 0,1 92,62" fill="none" stroke="currentColor" stroke-opacity="0.10" stroke-width="6" stroke-linecap="round"/>
            <path d="M8,62 A42,42 0 0,1 92,62" fill="none" stroke="url(#pa_${uid})" stroke-width="5" stroke-linecap="round"/>
            <line x1="8"  y1="62" x2="14" y2="62" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="13" y1="42" x2="18" y2="45" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="27" y1="25" x2="30" y2="30" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="50" y1="20" x2="50" y2="26" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="73" y1="25" x2="70" y2="30" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="87" y1="42" x2="82" y2="45" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <line x1="92" y1="62" x2="86" y2="62" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"/>
            <text x="5"  y="71" text-anchor="end"    font-size="5.5" fill="currentColor" fill-opacity="0.6">980</text>
            <text x="8"  y="37" text-anchor="end"    font-size="5.5" fill="currentColor" fill-opacity="0.6">1000</text>
            <text x="50" y="16" text-anchor="middle" font-size="5.5" fill="currentColor" fill-opacity="0.6">1010</text>
            <text x="92" y="37" text-anchor="start"  font-size="5.5" fill="currentColor" fill-opacity="0.6">1020</text>
            <text x="95" y="71" text-anchor="start"  font-size="5.5" fill="currentColor" fill-opacity="0.6">1040</text>
            <g id="parr_${uid}" style="transform-origin:50px 62px;transform:rotate(${angle}deg);transition:transform 0.8s ease;">
                <polygon points="50,22 45,33 55,33" fill="currentColor" opacity="0.9"/>
            </g>
            <circle cx="50" cy="62" r="4" fill="#1e1e1e" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.5"/>
            <text x="50" y="77" text-anchor="middle" font-size="13" font-weight="800" fill="url(#pv_${uid})">${pressure??"-"}</text>
            <text x="50" y="86" text-anchor="middle" font-size="6.5" fill="currentColor" fill-opacity="0.5">гПа</text>
        </svg>
    </div>`;
}

function mkHumSvg(humidity, uid){
    const val=humidity!=null?Math.round(humidity):null;
    const aLen=Math.PI*38; const off=val!=null?aLen*(1-val/100):aLen;
    return `<div class="di-wrap">
        <div class="di-label">Влажность</div>
        <svg viewBox="0 0 100 90" width="100" height="90">
            <defs>
                <linearGradient id="hg_${uid}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#ffd166"/>
                    <stop offset="40%"  stop-color="#5fe08f"/>
                    <stop offset="100%" stop-color="#58aeff"/>
                </linearGradient>
            </defs>
            <path d="M12,68 A38,38 0 0,1 88,68" stroke="currentColor" stroke-opacity="0.12" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M12,68 A38,38 0 0,1 88,68" stroke="url(#hg_${uid})" stroke-width="6" fill="none"
                  stroke-dasharray="${aLen.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" stroke-linecap="round"/>
            <text x="10" y="79" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.5">0</text>
            <text x="22" y="38" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.5">25</text>
            <text x="50" y="27" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.5">50</text>
            <text x="78" y="38" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.5">75</text>
            <text x="90" y="79" text-anchor="middle" font-size="6" fill="currentColor" fill-opacity="0.5">100</text>
            <text x="50" y="64" text-anchor="middle" font-size="17" font-weight="800" fill="currentColor">${val!=null?val+"%":"-"}</text>
        </svg>
    </div>`;
}

function mkTempSvg(temp, feelsLike){
    const tc=tempClass(temp);
    return `<div class="di-wrap">
        <div class="di-label">Температура</div>
        <svg viewBox="0 0 100 90" width="100" height="90">
            <text x="50" y="55" text-anchor="middle" font-size="24" font-weight="800" fill="currentColor" class="${tc}">${fmt1(temp,"°C")}</text>
            ${feelsLike!=null&&Math.abs((feelsLike-temp))>=0.5?`
            <text x="50" y="70" text-anchor="middle" font-size="8" fill="currentColor" fill-opacity="0.55">ощущ. ${fmt1(feelsLike,"°C")}</text>`:""}
        </svg>
    </div>`;
}

function indicatorsBlock(windSpeedMs, windGustMs, windDir, pressure, humidity, temp, feelsLike, uid){
    return `<div class="di-grid">
        ${mkWindSvg(windSpeedMs, windGustMs, windDir, uid+"w")}
        ${mkPressSvg(pressure, uid+"p")}
        ${mkHumSvg(humidity, uid+"h")}
        ${mkTempSvg(temp, feelsLike)}
    </div>`;
}

/* =========================================================
   6. РЕНДЕР ОДНОГО РАЙОНА
========================================================= */
function renderOneDistrict(cfg){
    const pws = cfg.pwsId ? _pwsData[cfg.pwsId] : null;
    const om  = _omData[cfg.name];
    const uid = cfg.name.replace(/\s/g,"_") + "_" + Date.now();

    let html = `<div class="district-block">
        <div class="district-header">
            <div class="districtName">${escapeHtml(cfg.name)}</div>
        </div>`;

    /* --- PWS карточка --- */
    if(pws && !pws.error){
        const timeStr = pws.obsTimeLocal
            ? (()=>{ const d=new Date(pws.obsTimeLocal.replace(" ","T")); return isNaN(d)?pws.obsTimeLocal:d.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); })()
            : "-";
        const pCorr   = correctedP(cfg.pwsId, pws.pressure, cfg.pressureOffset);
        const autoOff = cfg.autoCalib ? getCalib(cfg.pwsId) : 0;
        const hasCorr = Math.abs(autoOff)>0.01||Math.abs(cfg.pressureOffset||0)>0.01;
        const feelsLike = pws.temp!=null&&pws.temp>=27&&pws.heatIndex!=null?pws.heatIndex:
                          pws.temp!=null&&pws.temp<=10&&pws.windChill!=null?pws.windChill:pws.temp;

        html += `<div class="district-source">
            <div class="district-source-title">
                PWS · <span class="muted">${escapeHtml(cfg.pwsId)}</span>
                <span class="small" style="margin-left:6px;color:#888;">${escapeHtml(timeStr)}</span>
                ${hasCorr?`<span class="small" style="color:#72c8ff;margin-left:6px;">*калибр. ${autoOff>0?"+":""}${autoOff.toFixed(2)} гПа</span>`:""}
            </div>
            ${indicatorsBlock(pws.windSpeedMs, pws.windGustMs, pws.windDir, pCorr, pws.humidity, pws.temp, feelsLike, uid+"pws")}
            <div class="di-extra">
                ${pws.dewpt!=null?`<span>Точка росы: ${fmt1(pws.dewpt,"°C")}</span>`:""}
                ${pws.precipRate!=null&&pws.precipRate>0?`<span>Осадки: ${fmt1(pws.precipRate," мм/ч")}</span>`:""}
                ${pws.solarRad!=null?`<span>Радиация: ${fmt0(pws.solarRad," Вт/м²")}</span>`:""}
            </div>
        </div>`;
    } else if(pws?.error){
        html += `<div class="district-source">
            <div class="district-source-title">PWS · <span class="muted">${escapeHtml(cfg.pwsId)}</span></div>
            <div class="small" style="color:#ff8f43;padding:6px 0;">${escapeHtml(pws.error)}</div>
        </div>`;
    }

    /* --- Open-Meteo карточка --- */
    if(om && !om.error){
        const temp  = safeNum(om.temperature_2m);
        const app   = safeNum(om.apparent_temperature);
        const press = safeNum(om.pressure_msl);
        const wind  = safeNum(om.wind_speed_10m);
        const gust  = safeNum(om.wind_gusts_10m);
        const dir   = safeNum(om.wind_direction_10m);
        const hum   = safeNum(om.relative_humidity_2m);
        const wxC   = safeNum(om.weather_code);
        const isD   = safeNum(om.is_day);
        const t     = formatAutoTime(om.time);

        html += `<div class="district-source district-source-om">
            <div class="district-source-title">
                Open-Meteo <span class="small" style="color:#888;margin-left:6px;">${escapeHtml(t)}</span>
            </div>
            ${indicatorsBlock(wind, gust, dir, press, hum, temp, app, uid+"om")}
            <div class="di-extra">
                <span>${openMeteoWeatherIcon(wxC,isD)} ${escapeHtml(openMeteoWeatherText(wxC))}</span>
                ${safeNum(om.cloud_cover)!=null?`<span>Облачность: ${fmt0(safeNum(om.cloud_cover)," %")}</span>`:""}
                ${safeNum(om.precipitation)>0?`<span>Осадки: ${fmt1(safeNum(om.precipitation)," мм")}</span>`:""}
            </div>
        </div>`;
    } else if(om?.error){
        html += `<div class="district-source district-source-om">
            <div class="district-source-title">Open-Meteo</div>
            <div class="small" style="color:#ff8f43;padding:6px 0;">${escapeHtml(om.error)}</div>
        </div>`;
    }

    html += `</div>`; // district-block
    return html;
}

/* =========================================================
   7. РЕНДЕР ВСЕХ РАЙОНОВ
========================================================= */
function renderDistricts(){
    const box = document.getElementById("districts");
    if(!box) return;
    const now = new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
    let html = `<div class="cardTitle">Погода по районам</div>
    <div class="subTitle" style="margin-bottom:10px;">
        PWS обновлён: ${now} ·
        <button onclick="resetCalib()" style="width:auto;padding:2px 8px;font-size:11px;background:#2a2a2a;margin:0 4px;">Сброс калибровки</button>
        · Следующая калибровка: ${nextSynopStr()}
    </div>`;
    DISTRICTS.forEach(cfg => { html += renderOneDistrict(cfg); });
    box.innerHTML = html;
}

/* =========================================================
   8. UI И АВТООБНОВЛЕНИЕ
========================================================= */
async function loadDistrictsUI(){
    const btn = document.getElementById("btnDistricts");
    if(btn) btn.disabled = true;
    clearLog("districtsLog");
    showLogBox("districtsLogBox");
    try {
        logTo("districtsLog","🚀 Загрузка районов");
        await loadAllDistricts();
        const pwsOk = DISTRICTS.filter(d=>d.pwsId&&!_pwsData[d.pwsId]?.error).length;
        const omOk  = DISTRICTS.filter(d=>!_omData[d.name]?.error).length;
        logTo("districtsLog",`📥 PWS: ${pwsOk}/${DISTRICTS.filter(d=>d.pwsId).length} · OM: ${omOk}/${DISTRICTS.length}`);
        renderDistricts();
        logTo("districtsLog","✅ Готово");
        hideLogBoxLater("districtsLogBox", 2500);
        startDistrictsAutoRefresh();
    } catch(e){
        logTo("districtsLog","❌ " + (e?.message||e));
    } finally {
        if(btn) btn.disabled = false;
    }
}

function startDistrictsAutoRefresh(){
    if(_dTimer) clearInterval(_dTimer);
    _dTimer = setInterval(async ()=>{
        await Promise.allSettled(DISTRICTS.filter(d=>d.pwsId).map(async d=>{
            try{ const p=await fetchOnePWS(d.pwsId); _pwsData[d.pwsId]=p; if(p.pressure!=null)_pwsRaw[d.pwsId]=p.pressure; }
            catch(e){ _pwsData[d.pwsId]={error:e.message}; }
        }));
        renderDistricts();
    }, D_REFRESH_SEC*1000);

    if(_omTimer) clearInterval(_omTimer);
    _omTimer = setInterval(async ()=>{
        await Promise.allSettled(DISTRICTS.map(async d=>{
            try{ _omData[d.name]=await fetchOneOM(d.lat,d.lon); }
            catch(e){ _omData[d.name]={error:e.message}; }
        }));
        renderDistricts();
    }, OM_REFRESH_MIN*60*1000);
}
