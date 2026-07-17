function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeCoordinate(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  return Math.round(number * 1000) / 1000;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  let body = {};
  try {
    body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};
  } catch {
    sendJson(res, 400, { error: "Request body must be valid JSON." });
    return;
  }
  const latitude = normalizeCoordinate(body.latitude);
  const longitude = normalizeCoordinate(body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    sendJson(res, 400, { error: "Valid rounded coordinates are required." });
    return;
  }

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) {
      sendJson(res, 502, { error: "Reverse geocoder did not return a usable response." });
      return;
    }
    const data = await response.json();
    const zip = cleanText(data.postcode).match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";
    const city = cleanText(data.city || data.locality || data.principalSubdivision);
    const state = cleanText(data.principalSubdivisionCode || data.principalSubdivision).replace(/^US-/, "");
    const label = [city, state, zip].filter(Boolean).join(city && (state || zip) ? ", " : " ").replace(/,\s*(\d{5})$/, " $1").trim();
    if (!zip && !label) {
      sendJson(res, 422, { error: "Reverse geocoder response did not include a ZIP or general area." });
      return;
    }
    sendJson(res, 200, { zip, city, state, label: label || zip });
  } catch {
    sendJson(res, 502, { error: "Reverse geocoding failed." });
  }
}
