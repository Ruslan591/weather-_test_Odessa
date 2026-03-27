/* =========================================================
   MAIN.JS — инициализация и автообновление
   Зависит от: utils.js, synop.js, districts.js, indicators.js
========================================================= */

/* Координаты станции (для расчёта дня/ночи) */
const STATION_LAT = 46.482;
const STATION_LON = 30.723;
const STATION_CODE = "33837";

/* Глобальный флаг день/ночь — используется в synop.js */
const isDay = isDayNow(STATION_LAT, STATION_LON, new Date());

/* Автозапуск */
loadSynopUI();
loadDistrictsUI();

/* Автообновление */
setInterval(loadSynopUI,     30 * 60 * 1000); // каждые 30 мин
setInterval(loadDistrictsUI, 15 * 60 * 1000); // каждые 15 мин
