/* =========================================================
   MAIN.JS — инициализация и автообновление
========================================================= */
const STATION_LAT  = 46.482;
const STATION_LON  = 30.723;
const STATION_CODE = "33837";

const isDay = isDayNow(STATION_LAT, STATION_LON, new Date());

// Автозапуск
loadSynopUI();
loadPWSUI();
loadPWSDistrictsUI();
loadDistrictsUI();

// Автообновление (интервалы PWS управляются внутри pws.js и pws_districts.js)
setInterval(loadSynopUI,     30 * 60 * 1000);
setInterval(loadDistrictsUI, 15 * 60 * 1000);
