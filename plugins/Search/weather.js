const axios = require("axios");
const {
  bmbtz
} = require("../../devbmb/bmbtz");
bmbtz({
  'nomCom': 'weather',
  'reaction': "🌡️",
  'categorie': 'Search'
}, async (_0x34a5bf, _0x5b25ba, _0x27b5ed) => {
  const {
    repondre: _0x8466ad,
    arg: _0x3dfdee,
    ms: _0x2b1148
  } = _0x27b5ed;
  const _0x146eda = _0x3dfdee.join(" ");
  if (!_0x146eda) {
    return _0x8466ad("Give me location...");
  }
  try {
    const _0x335bfd = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      'params': {
        'q': _0x146eda,
        'units': "metric",
        'appid': "060a6bcfa19809c2cd4d97a212b19273",
        'language': 'en'
      }
    });
    const _0x222c8f = _0x335bfd.data;
    const _0x2a4b2d = _0x222c8f.name;
    const _0x29b590 = _0x222c8f.main.temp;
    const _0x84bb24 = _0x222c8f.main.feels_like;
    const _0x4a81f2 = _0x222c8f.main.temp_min;
    const _0x3e4cba = _0x222c8f.main.temp_max;
    const _0x4825d2 = _0x222c8f.weather[0x0].description;
    const _0x5d9de8 = _0x222c8f.main.humidity;
    const _0x5d6085 = _0x222c8f.wind.speed;
    const _0x576d7b = _0x222c8f.rain ? _0x222c8f.rain['1h'] : 0x0;
    const _0x2b2fae = _0x222c8f.clouds.all;
    const _0x49cd4e = new Date(_0x222c8f.sys.sunrise * 0x3e8);
    const _0x2d52fe = new Date(_0x222c8f.sys.sunsettings * 0x3e8);
    await _0x8466ad("❄️ Weather in " + _0x2a4b2d + "\n\n🌡️ Temperature: " + _0x29b590 + "°C\n🌡️ Feels Like: " + _0x84bb24 + "°C\n🌡️ Min Temperature: " + _0x4a81f2 + "°C\n🌡️ Max Temperature: " + _0x3e4cba + "°C\n📝 Description: " + _0x4825d2 + "\n❄️ Humidity: " + _0x5d9de8 + "%\n🌀 Wind Speed: " + _0x5d6085 + " m/s\n🌧️ Rain Volume (last hour): " + _0x576d7b + " mm\n☁️ Cloudiness: " + _0x2b2fae + "%\n🌄 Sunrise: " + _0x49cd4e.toLocaleTimeString() + "\n🌅 Sunsettings: " + _0x2d52fe.toLocaleTimeString() + "\n🌫️ Latitude: " + _0x222c8f.coord.lat + "\n🌪️ Longitude: " + _0x222c8f.coord.lon + "\n\n🗺 Country: " + _0x222c8f.sys.country + "\n\n*°Powered by BMB-TECH*");
  } catch (_0x363b1d) {
    console.error("Error fetching weather data:", _0x363b1d);
    await _0x8466ad("An error occurred while fetching the weather data. Please try again.");
  }
});
