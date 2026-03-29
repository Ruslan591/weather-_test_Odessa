/* =========================================================
   MAIN.JS — инициализация и автообновление
   Зависит от: utils.js, synop.js, districts.js, pws.js, indicators.js
========================================================= */

const STATION_LAT  = 46.482;
const STATION_LON  = 30.723;
const STATION_CODE = "33837";

// Глобальный флаг день/ночь
const isDay = isDayNow(STATION_LAT, STATION_LON, new Date());

// Автозапуск
loadSynopUI();
loadDistrictsUI();
loadPWSUI();

// Автообновление
setInterval(loadSynopUI,     30 * 60 * 1000); // каждые 30 мин
setInterval(loadDistrictsUI, 15 * 60 * 1000); // каждые 15 мин
setInterval(loadPWSUI,        5 * 60 * 1000); // каждые 5 мин (PWS обновляется чаще)
