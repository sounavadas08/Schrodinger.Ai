export default async function handler(req: any, res: any) {
  const cityQuery = (req.query && req.query.city) || "San Francisco";

  const citiesData: Record<string, any> = {
    "london": { tempC: 18, tempF: 64, condition: "Partly Cloudy", humidity: 62, windSpeed: 14, uvIndex: 4 },
    "new york": { tempC: 24, tempF: 75, condition: "Sunny", humidity: 48, windSpeed: 9, uvIndex: 7 },
    "tokyo": { tempC: 22, tempF: 72, condition: "Clear Sky", humidity: 55, windSpeed: 11, uvIndex: 6 },
    "mumbai": { tempC: 31, tempF: 88, condition: "Humid & Clear", humidity: 78, windSpeed: 12, uvIndex: 8 },
    "berlin": { tempC: 19, tempF: 66, condition: "Light Breezy", humidity: 50, windSpeed: 15, uvIndex: 5 },
    "san francisco": { tempC: 20, tempF: 68, condition: "Sunny Coastal", humidity: 58, windSpeed: 10, uvIndex: 6 },
  };

  const key = cityQuery.toLowerCase().trim();
  const data = citiesData[key] || {
    tempC: 22 + Math.floor(Math.random() * 8),
    tempF: 72 + Math.floor(Math.random() * 12),
    condition: "Sunny Clear",
    humidity: 50 + Math.floor(Math.random() * 20),
    windSpeed: 8 + Math.floor(Math.random() * 10),
    uvIndex: 5,
  };

  res.status(200).json({
    success: true,
    city: cityQuery.charAt(0).toUpperCase() + cityQuery.slice(1),
    tempC: data.tempC,
    tempF: data.tempF,
    condition: data.condition,
    humidity: data.humidity,
    windSpeed: data.windSpeed,
    uvIndex: data.uvIndex,
    forecast: [
      { day: "Tomorrow", tempC: data.tempC + 1, tempF: data.tempF + 2, condition: "Sunny" },
      { day: "Day 2", tempC: data.tempC - 1, tempF: data.tempF - 2, condition: "Partly Cloudy" },
      { day: "Day 3", tempC: data.tempC + 2, tempF: data.tempF + 4, condition: "Clear Sky" },
    ],
  });
}
