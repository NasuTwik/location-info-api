const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
    res.send(
        "Location Info API toimii. Kokeile /location-info?lat=63.096&lon=21.616"
    );
});

app.get("/location-info", async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) {
        return res.status(400).json({
            error: "Anna lat ja lon parametrit",
        });
    }

    try {
        //Nomina
        const nominatimUrl =
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

        const nominatimRes = await fetch(nominatimUrl, {
            headers: {
                "User-Agent": "LocationInfoApp/1.0 (school-project)",
                Accept: "application/json",
            },
        });

        if (!nominatimRes.ok) {
            throw new Error(`Nominatim virhe: ${nominatimRes.status}`);
        }

        const nominatimData = await nominatimRes.json();
        const address = nominatimData.address || {};

        const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.city_district ||
            "Unknown";

        const country = address.country || "Unknown";

        //Meteo
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;

        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
            throw new Error(`Open-Meteo virhe: ${weatherRes.status}`);
        }

        const weatherData = await weatherRes.json();
        const temperature = weatherData.current?.temperature_2m ?? null;
        const weatherCode = weatherData.current?.weather_code ?? null;

        //Wiki
        let description = "No description available";

        try {
            const wikiUrl =
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`;

            const wikiRes = await fetch(wikiUrl, {
                headers: { Accept: "application/json" },
            });

            if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                if (wikiData.extract) {
                    description = wikiData.extract;
                }
            }
        } catch (wikiError) {
            description = "No description available";
        }

        res.json({
            city: city,
            country: country,
            temperature: temperature,
            weather_code: weatherCode,
            description: description,
            coordinates: {
                lat: Number(lat),
                lon: Number(lon),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Virhe haettaessa dataa",
            details: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});