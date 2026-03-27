/* =========================================================
   DISTRICTS.JS — загрузка и рендер погоды по районам
   Зависит от: utils.js
========================================================= */

const locations = {
    "пос. Котовского": [46.560, 30.800],
    "Центр":           [46.482, 30.723],
    "Таирова":         [46.400, 30.650],
    "Аркадия":         [46.430, 30.760],
    "Застава":         [46.520, 30.650]
};

/* -------------------------
   Загрузка Open-Meteo
------------------------- */
async function loadCurrentWeather(lat, lon){
    const now     = new Date();
    const yyyy    = now.getFullYear();
    const mm      = String(now.getMonth() + 1).padStart(2,"0");
    const dd      = String(now.getDate()).padStart(2,"0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code,cloud_cover,pressure_msl,` +
        `wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,` +
        `is_day,relative_humidity_2m,rain,apparent_temperature,showers,snowfall,surface_pressure` +
        `&timezone=auto` +
        `&wind_speed_unit=ms` +
        `&start_date=${dateStr}&end_date=${dateStr}`;

    const r = await fetch(url);
    if(!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    if(!d || !d.current) throw new Error("Нет блока current");
    return d.current;
}

/* -------------------------
   Рендер карточек районов
------------------------- */
function renderDistricts(results){
    const box = document.getElementById("districts");
    let html  = `<div class="cardTitle">Погода по районам</div><div class="districtGrid">`;

    for(const {name, w} of results){
        const temp    = safeNum(w.temperature_2m);
        const app     = safeNum(w.apparent_temperature);
        const press   = safeNum(w.pressure_msl);
        const sfc     = safeNum(w.surface_pressure);
        const wind    = safeNum(w.wind_speed_10m);
        const gust    = safeNum(w.wind_gusts_10m);
        const dir     = safeNum(w.wind_direction_10m);
        const hum     = safeNum(w.relative_humidity_2m);
        const cloud   = safeNum(w.cloud_cover);
        const precip  = safeNum(w.precipitation);
        const rain    = safeNum(w.rain);
        const showers = safeNum(w.showers);
        const snow    = safeNum(w.snowfall);
        const wxCode  = safeNum(w.weather_code);
        const isDay   = safeNum(w.is_day);
        const timeStr = formatAutoTime(w.time);
        const wx      = openMeteoWeatherText(wxCode);
        const wxIco   = openMeteoWeatherIcon(wxCode, isDay);

        html += `
            <div class="districtCard">
                <div class="districtTop">
                    <div>
                        <div class="districtName">${escapeHtml(name)}</div>
                        <div class="small">${escapeHtml(timeStr)}</div>
                    </div>
                    <div class="districtTemp ${tempClass(temp)}">${fmt1(temp,"°C")}</div>
                </div>

                <div class="districtLine">
                    <span>Погода</span>
                    <span>${wxIco} ${escapeHtml(wx)}</span>
                </div>
                <div class="districtLine">
                    <span>Ощущается как</span>
                    <span>${fmt1(app,"°C")}</span>
                </div>
                <div class="districtLine">
                    <span>Ветер</span>
                    <span>${fmt1(wind," м/с")} ${escapeHtml(degToText(dir))} ${windArrow(dir)}</span>
                </div>
                <div class="districtLine">
                    <span>Порывы</span>
                    <span>${fmt1(gust," м/с")}</span>
                </div>
                <div class="districtLine">
                    <span>Давление</span>
                    <span>${fmt1(press," гПа")}</span>
                </div>
                <div class="districtLine">
                    <span>Поверхностное</span>
                    <span>${fmt1(sfc," гПа")}</span>
                </div>
                <div class="districtLine">
                    <span>Влажность</span>
                    <span>${fmt0(hum," %")}</span>
                </div>
                <div class="districtLine">
                    <span>Облачность</span>
                    <span>${fmt0(cloud," %")}</span>
                </div>
                ${(precip  && precip  > 0) ? `<div class="districtLine"><span>Осадки</span><span>${fmt1(precip," мм")}</span></div>` : ""}
                ${(rain    && rain    > 0) ? `<div class="districtLine"><span>Дождь</span><span>${fmt1(rain," мм")}</span></div>` : ""}
                ${(showers && showers > 0) ? `<div class="districtLine"><span>Ливни</span><span>${fmt1(showers," мм")}</span></div>` : ""}
                ${(snow    && snow    > 0) ? `<div class="districtLine"><span>Снег</span><span>${fmt1(snow," см")}</span></div>` : ""}
            </div>`;
    }

    html += `</div>`;
    box.innerHTML = html;
}

/* -------------------------
   UI-обёртка загрузки
------------------------- */
async function loadDistrictsUI(){
    const btn = document.getElementById("btnDistricts");
    btn.disabled = true;
    clearLog("districtsLog");
    showLogBox("districtsLogBox");

    try {
        logTo("districtsLog","🚀 Старт загрузки районов");
        logTo("districtsLog","📍 Подготовка координат");
        logTo("districtsLog","🌐 Отправка запросов к Open-Meteo");

        const entries = Object.entries(locations);
        const results = await Promise.all(
            entries.map(async ([name, coords]) => {
                const [lat, lon] = coords;
                logTo("districtsLog", `↳ ${name}: запрос отправлен`);
                const w = await loadCurrentWeather(lat, lon);
                return { name, w };
            })
        );

        logTo("districtsLog","📥 Ответы получены");
        logTo("districtsLog","🧩 Формирование карточек");
        renderDistricts(results);
        logTo("districtsLog","✅ Районы успешно обновлены");
        hideLogBoxLater("districtsLogBox", 3200);
    } catch(e){
        logTo("districtsLog","❌ Ошибка: " + (e?.message || e));
        document.getElementById("districts").innerHTML = `
            <div class="cardTitle">Погода по районам</div>
            <div class="small">Ошибка загрузки: ${escapeHtml(e?.message || e)}</div>`;
    } finally {
        btn.disabled = false;
    }
}
