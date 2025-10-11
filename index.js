const API_ENDPOINT =
    "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
const API_KEY = "PYDGLHPLY6PVXQB3PMQ2M6EEK";
const locationInput = document.getElementById("location");
const activityInput = document.getElementById("activity");
const submitBtn = document.getElementById("weatherBtn");
const resultCard = document.getElementById("resultCard");
const TEMP_CUTOFF = 65;
const SATURATION_DIFFERENCE = 30;
const WARM_MAX_SATURATION = 0;
const WARM_SATURATION_START = 30;
const COLD_MAX_SATURATION = 170;
const COLD_SATURATION_START = 220;

// Validate the location input is the correct format.
function formValid() {
    return true;
}

// Make a query for the weather data, and return an object with the important weather conditions.
async function getWeatherData(locationArg) {
    if (formValid()) {
        console.log("Location arg:", locationArg);
        const response = await fetch(
            `${API_ENDPOINT}${locationArg}?key=${API_KEY}`
        );
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        console.log("Initial response:", response);

        const data = await response.json();
        return data;
    } else {
        throw new Error("Form inputs are invalid.");
    }
}

function rateRunning(weather) {
    let score = 0;

    if (weather.temp >= 50 && weather.temp <= 65) score += 4;
    else if (weather.temp >= 40 && weather.temp <= 75) score += 2;

    if (weather.precipcover < 10 && weather.precip === 0) score += 3;
    else if (weather.precipcover < 40) score += 1;

    if (weather.windspeed < 10) score += 2;
    else if (weather.windspeed < 20) score += 1;

    return score >= 7 ? "good" : score >= 4 ? "mid" : "cooked";
}

function ratePicnic(weather) {
    let score = 0;

    if (weather.temp >= 68 && weather.temp <= 80) score += 4;
    else if (weather.temp >= 60 && weather.temp <= 85) score += 2;

    if (weather.precipcover < 10 && weather.precip === 0) score += 3;
    else if (weather.precipcover < 30) score += 1;

    if (weather.windspeed < 12) score += 2;
    else if (weather.windspeed < 25) score += 1;

    return score >= 7 ? "good" : score >= 4 ? "mid" : "cooked";
}

function rateBasketball(weather) {
    let score = 0;

    if (weather.temp >= 55 && weather.temp <= 75) score += 4;
    else if (weather.temp >= 45 && weather.temp <= 85) score += 2;

    if (weather.precipcover < 10 && weather.precip === 0) score += 3;
    else if (weather.precipcover < 40) score += 1;

    if (weather.windspeed < 15) score += 2;
    else if (weather.windspeed < 25) score += 1;

    return score >= 7 ? "good" : score >= 4 ? "mid" : "cooked";
}

function getCookedStatus(activity, weatherData) {
    switch (activity.toLowerCase()) {
        case "run":
            return rateRunning(weatherData);
        case "picnic":
            return ratePicnic(weatherData);
        case "basketball":
            return rateBasketball(weatherData);
        default:
            return "unknown";
    }
}

// Iterate through the weather and return an object with the relevant data, and some properties
//  that will be used to determine how the card should be displayed.
function parseWeather(weatherData) {
    const resultIcons = ["good", "mid", "cooked"];
    const weatherCardInfo = {};
    // Store the relevant weather features from the data.
    weatherCardInfo.location = weatherData.location;
    weatherCardInfo.temp = Math.round(weatherData.temp);
    weatherCardInfo.precipcover = Math.round(weatherData.precipcover);
    weatherCardInfo.tempmax = Math.round(weatherData.tempmax);
    weatherCardInfo.tempmin = Math.round(weatherData.tempmin);
    weatherCardInfo.preciptype = weatherData.preciptype;
    weatherCardInfo.precip = weatherData.precip;
    weatherCardInfo.windspeed = Math.round(weatherData.windspeed);
    // Get the cooked status
    weatherCardInfo.result = getCookedStatus(activityInput.value, weatherData);
    weatherCardInfo.resultIcon = resultIcons.includes(weatherCardInfo.result)
        ? `./icons/${weatherCardInfo.result}.svg`
        : "unknown";
    weatherCardInfo.weatherIcon = `https://raw.githubusercontent.com/VisualCrossing/WeatherIcons/main/PNG/1st%20Set%20-%20Color/${weatherData.icon}.png`;

    return weatherCardInfo;
}

function displayWeatherCard(weatherCardInfo) {
    resultCard.dataset.result = weatherCardInfo.result;

    // Adjust the border gradients of the card based on the temperature.
    let topSaturation, bottomSaturation;
    let cutoffDifference = Math.abs(weatherCardInfo.temp - TEMP_CUTOFF);
    // Set top gradient saturation based on warm/cold condition cutoff.
    topSaturation =
        weatherCardInfo.temp > TEMP_CUTOFF
            ? Math.max(
                  WARM_SATURATION_START - cutoffDifference,
                  WARM_MAX_SATURATION
              )
            : (topSaturation = Math.max(
                  COLD_SATURATION_START - cutoffDifference,
                  COLD_MAX_SATURATION
              ));
    bottomSaturation = topSaturation - SATURATION_DIFFERENCE;

    // Now update the saturations in CSS for the result border.
    document.documentElement.style.setProperty(
        "--TEMP_GRADIENT_SATURATION_TOP",
        `${topSaturation}`
    );
    document.documentElement.style.setProperty(
        "--TEMP_GRADIENT_SATURATION_BOTTOM",
        `${bottomSaturation}`
    );

    // Dynamically set the card details
    resultCard.innerHTML = ` <div class="result__header" style="--order: 1">
                    <img
                        class="result__icon"
                        alt="Result icon"
                        src=${weatherCardInfo.resultIcon}
                        draggable="false"
                    />
                    <h2 class="result__title">You're <span>${
                        weatherCardInfo.result
                    }</span></h2>
                </div>
                <div class="result__body">
                    <div class="result__summary --center" style="--order: 2">
                        <h3 id="location">${weatherCardInfo.location}</h3>
                        <h4 id="tempCurrent">${weatherCardInfo.temp}°F</h4>
                        <div id="precip">
                            <img
                                src=${weatherCardInfo.weatherIcon}
                                alt=""
                                draggable="false"
                            />
                            <h5 id="precipCover">${
                                weatherCardInfo.precipcover
                            }%</h5>
                        </div>
                    </div>
                    <div id="tempHigh" style="--order: 3">High: ${
                        weatherCardInfo.tempmax
                    }°F</div>
                    <div id="tempLow" style="--order: 4">Low: ${
                        weatherCardInfo.tempmin
                    }°F</div>
                    <div id="precipMeasure" style="--order: 5">
                        Precipitation: ${
                            weatherCardInfo.preciptype === null
                                ? "None"
                                : weatherCardInfo.precip +
                                  '" ' +
                                  weatherCardInfo.preciptype
                        }
                    </div>
                    <div id="wind" style="--order: 6">Wind: ${
                        weatherCardInfo.windspeed
                    } mph</div>
                </div>`;
}

function updateWeather() {
    let locationArg = locationInput.value;

    resultCard.dataset.result = "loading";
    getWeatherData(locationArg)
        .then((weatherData) => {
            console.log("Data object returned:", weatherData);
            let todaysWeatherData = weatherData.days[0];
            // Append the discovered location to the weather data object.
            todaysWeatherData.location = weatherData.resolvedAddress;
            console.log("Today's weather data:", todaysWeatherData);
            let weatherCardInfo = parseWeather(todaysWeatherData);

            // Finally, update the weather visually on the site.
            displayWeatherCard(weatherCardInfo);
        })
        .catch((error) => {
            console.error("updateWeather error:", error);
            alert(
                "Please enter a valid location (address, partial address, or latitude/longitude pair)"
            );
        });
}

submitBtn.addEventListener("click", updateWeather);
